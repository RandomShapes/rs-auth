(function(angular) {
var app = angular.module('rs-auth', []);
var config = {
  authUrl: '',
  loginEndPoint: '/auth',
  registerEndPoint: '/register',
  validateEndPoint: '/auth',
  logoutEndPoint: '/logout',
  user: 'currentUser'
};

var userRoles = {
  all: '*'
};

app.constant('AUTH_EVENTS', {
  loginSuccess: '$authLoginSuccess',
  loginFailed: '$authLoginFailed',
  logoutSuccess: '$authLogoutSuccess',
  sessionTimeout: '$authSessionTimeout',
  notAuthenticated: '$authNotAuthenticated',
  notAuthorized: '$authNotAuthorized'
});
app.factory('Local', ['$http','$window','$rootScope',function($http,$window,$rootScope) {
	var local = {};

	local.login = function (credentials) {
	  return $http({
	    url: config.authUrl + config.loginEndPoint, 
	    method: "POST",
	    data: credentials
	  }).then(function (res) {
	    if (credentials.remember) {
	      $window.localStorage.setItem('authToken',res.data.token);
	    }
	    $window.sessionStorage.setItem('authToken',res.data.token);
	    $rootScope[config.user] = res.data.user;
	    return res;
	  });
	};

	local.logout = function() {
	  return $http({
	    url: config.authUrl + config.logoutEndPoint, 
	    method: "GET",
	    headers: {'X-Auth-Token': $window.sessionStorage.getItem('authToken')}
	  }).then(function (res) {
	    $window.localStorage.clear();
	    $window.sessionStorage.clear();
	    $rootScope[config.user] = null;
	  });
	};

	local.register = function(credentials) {
	  return $http({
	    url: config.authUrl + config.registerEndPoint, 
	    method: "POST",
	    data: credentials
	  }).then(function (res) {
	    $window.sessionStorage.setItem('authToken',res.data.token);
	    $rootScope[config.user] = res.data.user;
	    return res;
	  });
	};

	local.validateToken = function(authToken) {
	  return $http({
	    url: config.authUrl + config.validateEndPoint, 
	    method: "GET",
	    headers: {'X-Auth-Token': authToken}
	  }).then(function (res) {
	  	$window.sessionStorage.setItem('authToken',authToken);
	  	$rootScope[config.user] = res.data;
	    return res;
	  });
	};

	local.isAuthenticated = function() { //Does the same thing as getToken, but for sake of clarity It's here.
	  return $window.sessionStorage.getItem('authToken');
	};

	//Check the userRole and make sure it's correct.
	local.isAuthorized = function(authorizedRoles) {

	  if (!angular.isArray(authorizedRoles)) {
	    authorizedRoles = [authorizedRoles];
	  }

	  return (this.isAuthenticated() && authorizedRoles.indexOf($rootScope[config.user].role) !== -1);
	};

	local.isRemembered = function() {
		return $window.localStorage.getItem('authToken');
	};

	local.getToken = function() {
		return $window.sessionStorage.getItem('authToken');
	};

	return local;
}]);
/**
* rsAuth
* author: Jamie Spittal james@randomshapes.ca
* Includes methods for authenticating the user.
**/
app.provider('$rsAuth', function $rsAuth() {

  this.config = config;
  this.userRoles = userRoles;

  this.setUserRoles = function(userRolesObj) {
    angular.extend(userRoles,userRolesObj);
  };

  this.$get = ['Local', function rsAuthFactory(Local) {
    return {
      login: function (credentials) {
        return Local.login(credentials);
      },

      logout: function() {
        return Local.logout();
      },

      register: function(credentials) {
        return Local.register(credentials);
      },

      validateToken: function(authToken) {
        return Local.validateToken(authToken);
      },

      isAuthenticated: function() {
        return Local.isAuthenticated();
      },

      isAuthorized: function(authorizedRoles) {
        return Local.isAuthenticated(authorizedRoles);
      },

      isRemembered: function() {
        return Local.isRemembered();
      },

      getToken: function() {
        return Local.getToken();
      },

      userRoles: userRoles
    };
  }];
});
app.run(['AUTH_EVENTS','$rootScope','$rsAuth', function(AUTH_EVENTS,$rootScope,$rsAuth) {
	var authToken;
	//Check to see if the session is remembered, and then check to see if the login should be remembered globally.
	if (!!$rsAuth.isAuthenticated()) {
		authToken = $rsAuth.isAuthenticated();
		$rsAuth.validateToken(authToken).then(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});

	} else if (!!$rsAuth.isRemembered()) { //If the session is remembered globally, validate the token make sure it's clean.
		authToken = $rsAuth.isRemembered();
		$rsAuth.validateToken(authToken).then(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});
	}

	//Listen for when the state changes then check the user-role and see if
	//the user is authorized to see the content

	//TODO: Check for more than just first entry for ALL.
	//TODO: Native Angular support, not UI.Router
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

})(window.angular) //This starts in the module.