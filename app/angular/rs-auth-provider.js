function $rsAuth() {

    this.config = config;
    this.userRoles = userRoles;

    this.setUserRoles = function(userRolesObj) {
        angular.extend(userRoles,userRolesObj);
    };
    /* @ngInject */
    this.$get = function rsAuthFactory(Local, $rootScope, AUTH_EVENTS) {
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
                return Local.isAuthorized(authorizedRoles);
            },

            isRemembered: function() {
                return Local.isRemembered();
            },

            getToken: function() {
                return Local.getToken();
            },

            currentUser: currentUser,

            userRoles: userRoles
        };

        function currentUser(callback) {
            if ($rootScope[config.user]) {
                callback($rootScope[config.user]);
            } else {
                $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
                    callback($rootScope[config.user]);
                });
            }
        }
    };
}
