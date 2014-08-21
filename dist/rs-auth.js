var app = angular.module('rs-auth', []);
app.constant('AUTH_EVENTS', {
	  loginSuccess: 'auth-login-success',
	  loginFailed: 'auth-login-failed',
	  logoutSuccess: 'auth-logout-success',
	  sessionTimeout: 'auth-session-timeout',
	  notAuthenticated: 'auth-not-authenticated',
	  notAuthorized: 'auth-not-authorized'
	});
/**
* Session Service
* author: Jamie Spittal james@randomshapes.ca
* Methods for getting and setting current session variables. Also, used for recalling a remembered session.
*/
app.service('$rsSession', ['$window',function ($window) {
    this.set = function(key,value) {
      $window.sessionStorage.setItem(key,value);
    };
    this.get = function(key) {
      return $window.sessionStorage.getItem(key);
    };
    this.setUser = function(value) {
      $window.sessionStorage.setItem('user',JSON.stringify(value));
    };
    this.getUser = function() {
      return JSON.parse($window.sessionStorage.getItem('user'));
    };
    this.unset = function(key) {
      $window.sessionStorage.removeItem(key);
    };

    this.setLocalAuth = function(authToken) {
      $window.localStorage.setItem('authToken', authToken);
    };
    this.getLocalAuth = function() {
      return $window.localStorage.getItem('authToken');
    };

    //Clears everything in local and session storage.
    this.clear = function() {
      $window.sessionStorage.clear();
      $window.localStorage.clear();
    };
}]);
/**
* rsAuth
* author: Jamie Spittal james@randomshapes.ca
* Includes methods for authenticating the user.
*/
app.provider('$rsAuth', function $rsAuth() {

  var config = {
    apiPrefix: ''
  };
  
  var userRoles = {
    all: '*',
    member: 'user-member',
    visitor: 'user-visitor'
  };

  this.setConfig = function(configObj) {
    if (configObj.apiPrefix) {
      config.apiPrefix = configObj.apiPrefix;
    }
  };

  this.setUserRoles = function(userRolesObj) {
    userRoles = userRolesObj;
  };

  this.$get = function rsAuthFactory($http,$rsSession) {
    return {
      //Post method for Login Authorization.
      //Arguments: Object formatted as such: {username:"test@test.ca",password:"testpass"}
      //Returns: $http promise object.
      login: function (url,credentials) {
        return $http({
          url: config.apiPrefix + url, 
          method: "POST",
          data: credentials
        }).then(function (res) {
          if (credentials.remember) {
            $rsSession.setLocalAuth(res.data.token);
          }
          $rsSession.set('authToken',res.data.token);
          $rsSession.set('userRole',res.data.user.status);
          $rsSession.setUser(res.data.user);
          return res;
        });
      },

      logout: function(url) {
        return $http({
          url: config.apiPrefix + url, 
          method: "GET",
          headers: {'X-Auth-Token': $rsSession.get('authToken')}
        }).then(function (res) {
          $rsSession.clear();
        });
      },

      register: function(url,credentials) {
        return $http({
          url: config.apiPrefix + url, 
          method: "POST",
          data: credentials
        }).then(function (res) {
          $rsSession.set('authToken',res.data.token);
          $rsSession.set('userRole','user');
          $rsSession.setUser(res.data.user);
          return res;
        });
      },

      validateToken: function(url,authToken) {
        return $http({
          url: config.apiPrefix + url, 
          method: "GET",
          headers: {'X-Auth-Token': authToken}
        }).then(function (res) {
          $rsSession.set('authToken',authToken);
          $rsSession.set('userRole','user');
          $rsSession.setUser(res.data);
          return res;
        });
      },

      //Checking to see if they are logged in.
      isAuthenticated: function() {
        return !!$rsSession.get('authToken');
      },

      //Check their userRole and make sure it's correct.
      isAuthorized: function(authorizedRoles) {

        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }

        return (this.isAuthenticated() && authorizedRoles.indexOf($rsSession.get('userRole')) !== -1);
      },

      getUser: function() {
        return $rsSession.getUser();
      },

      userRoles: userRoles,

    };
  };
});
app.run(['$rsSession','AUTH_EVENTS','$timeout','$rootScope','$rsAuth', function($rsSession,AUTH_EVENTS,titleBannerService,flashService,$timeout,$rootScope,$rsAuth) {

	//Check to see if the session is remembered, and then check to see if the login should be remembered globally.
	if ($rsAuth.isAuthenticated()) {
		$timeout(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});
	} else if (!!$rsSession.getLocalAuth()) { //If the session is remembered globally, validate the token make sure it's clean.
		var authToken = $rsSession.getLocalAuth();
		$rsAuth.validateToken(authToken).then(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});
	}

	//Listen for when the state changes (basically a url change) then check the user-role and see if
	//the user is authorized to see the content
	$rootScope.$on('$stateChangeStart', function (event, args) {

	var authorizedRoles = {
		all: "*"
	};

	//Get the authorized roles from the $stateProvider, look below at config to see where they are declared
	if(args.data.authorizedRoles) {
		authorizedRoles = args.data.authorizedRoles;
	}
	//Do a check to make sure that's it's not ALL and that they are authorized.
	if (authorizedRoles[0] !== $rsAuth.userRoles.all && !$rsAuth.isAuthorized(authorizedRoles)) {
		//If they are not authorized, prevent the default event, which is go to it.
		event.preventDefault();
		if ($rsAuth.isAuthenticated()) {
			//If you're logged in but you're not authenticated to see the content.
			$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
		} else {
		//If they are not logged in at all, redirect them to home ($state.go('home')) and tell them they are stupid for trying.
		$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
		}
	}
	});

}]);