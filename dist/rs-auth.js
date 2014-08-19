var app = angular.module('rs-auth', []);
var app = angular.module('rs-auth');

/**
* rsAuth
* author: Jamie Spittal james@randomshapes.ca
* Includes methods for authenticating the user.
*/
app.provider('$rsAuth', function () {

  var config = {
    apiPrefix: ''
  };
  
  var userRoles = {
    visitor: 'user-visitor',
    member: 'user-member'
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

      userRoles: userRoles
    };
  };
});
var app = angular.module('rs-auth');

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
    this.remembered = function() {
      return !!$window.sessionStorage.getItem('authToken');
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