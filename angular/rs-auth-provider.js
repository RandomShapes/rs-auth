/**
* rsAuth
* author: Jamie Spittal james@randomshapes.ca
* Includes methods for authenticating the user.
*/
app.provider('$rsAuth', function $rsAuth() {

  var config = {
    authUrl: '',
    loginEndPoint: '/auth',
    registerEndPoint: '/register',
    validateEndPoint: '/auth',
    logoutEndPoint: '/logout',
  };
  
  var userRoles = {
    all: '*',
    member: 'user-member',
    visitor: 'user-visitor'
  };

  this.setConfig = function(configObj) {
    for (prop in configObj) {
      config[prop] = configObj[prop];
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
      login: function (credentials) {
        return $http({
          url: config.authUrl + config.loginEndPoint, 
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

      logout: function() {
        return $http({
          url: config.authUrl + config.logoutEndPoint, 
          method: "GET",
          headers: {'X-Auth-Token': $rsSession.get('authToken')}
        }).then(function (res) {
          $rsSession.clear();
        });
      },

      register: function(credentials) {
        return $http({
          url: config.authUrl + config.registerEndPoint, 
          method: "POST",
          data: credentials
        }).then(function (res) {
          $rsSession.set('authToken',res.data.token);
          $rsSession.set('userRole','user');
          $rsSession.setUser(res.data.user);
          return res;
        });
      },

      validateToken: function(authToken) {
        return $http({
          url: config.authUrl + config.validateEndPoint, 
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