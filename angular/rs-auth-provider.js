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

  this.$get = function rsAuthFactory($http,Local) {
    return {
      login: function (credentials) {
        return Local.login(credentials);
      },

      logout: function() {
        return Local.logout();
      },

      register: function(credentials) {
        return Local.register();
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
  };
});