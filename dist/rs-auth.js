(function(angular) { 

angular.module('rs-auth', [])
    .factory('Local', Local)
    .provider('$rsAuth', $rsAuth)
    .run(rsAuthRun);
    //constant set in config.
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

angular.module('rs-auth').constant('AUTH_EVENTS', {
    loginSuccess: '$authLoginSuccess',
    loginFailed: '$authLoginFailed',
    logoutSuccess: '$authLogoutSuccess',
    sessionTimeout: '$authSessionTimeout',
    notAuthenticated: '$authNotAuthenticated',
    notAuthorized: '$authNotAuthorized'
});
function Local($http,$window,$rootScope,AUTH_EVENTS,$q) {
    return {
        login: login,
        logout: logout,
        register: register,
        validateToken: validateToken,
        isAuthenticated: isAuthenticated,
        isAuthorized: isAuthorized,
        isRemembered: isRemembered,
        getToken: isAuthenticated,
        destroyTokens: destroyTokens
    };

    function login(credentials) {
        var deferred = $q.defer();
        $http({
            url: config.authUrl + config.loginEndPoint, 
            method: "POST",
            data: credentials
        })
        .then(loginSuccess)
        .catch(loginFail);

        function loginSuccess(res) {
            if (credentials.remember) {
                $window.localStorage.setItem('authToken',res.data.token);
            }
            $window.sessionStorage.setItem('authToken',res.data.token);
            $rootScope[config.user] = res.data.user;
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            deferred.resolve(res);
        }

        function loginFail(error) {
            console.error("rs-auth login failed",error);
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    function logout() {
        var deferred = $q.defer();
        $http({
            url: config.authUrl + config.logoutEndPoint, 
            method: "GET",
            headers: {'X-Auth-Token': $window.sessionStorage.getItem('authToken')}
        })
        .then(logoutSuccess)
        .catch(logoutFail);

        function logoutSuccess(res) {
            $window.localStorage.clear();
            $window.sessionStorage.clear();
            $rootScope[config.user] = null;
            $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            deferred.resolve(res);
        }

        function logoutFail(error) {
            console.error("rs-auth logout failed",error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    function register(credentials) {
        var deferred = $q.defer();
        $http({
            url: config.authUrl + config.registerEndPoint, 
            method: "POST",
            data: credentials
        })
        .then(registerSuccess)
        .catch(registerFail);

        function registerSuccess(res) {
            $window.sessionStorage.setItem('authToken',res.data.token);
            $rootScope[config.user] = res.data.user;
            $rootScope.$broadcast(AUTH_EVENTS.registerSuccess);
            deferred.resolve(res);
        }

        function registerFail(error) {
            console.error("rs-auth register failed",error);
            deferred.reject(error);
        }
        return deferred.promise;
    }

    function validateToken(authToken) {
        var deferred = $q.defer();
        $http({
            url: config.authUrl + config.validateEndPoint, 
            method: "GET",
            headers: {'X-Auth-Token': authToken}
        })
        .then(validateTokenSuccess)
        .catch(validateTokenFail);

        function validateTokenSuccess(res) {
            $window.sessionStorage.setItem('authToken',authToken);
            $rootScope[config.user] = res.data;
            deferred.resolve(res);
        }

        function validateTokenFail(error) {
            console.error("rs-auth found the token to be invalid, deleting tokens",error);
            destroyTokens();
            deferred.reject(error);
        }
        return deferred.promise;
    }

    //Check the userRole and make sure it's correct.
    function isAuthorized(authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }

        //Dog And Pony fix, MATT
        var role = $rootScope[config.user].role || $rootScope[config.user].status;

        return (authorizedRoles.indexOf(role) !== -1);
    }

    function isAuthenticated() {
        return $window.sessionStorage.getItem('authToken');
    }

    function isRemembered() {
        return $window.localStorage.getItem('authToken');
    }

    function destroyTokens() {
        $window.localStorage.clear();
        $window.sessionStorage.clear();
    }
}
Local.$inject = ["$http", "$window", "$rootScope", "AUTH_EVENTS", "$q"];
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
            

            destroyTokens: function() {
                return Local.destroyTokens();
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
    this.$get.$inject = ["Local", "$rootScope", "AUTH_EVENTS"];
}

function rsAuthRun(AUTH_EVENTS,$rootScope,$rsAuth) {
    
    checkRemember();


    //TODO: Native Angular support, not UI.Router
    $rootScope.$on('$stateChangeStart', function(event, args) {
        checkAuthorization(event, args);
    });


    ////////////////////////


    //Check to see if the session is remembered, and then check to see if the login should be remembered globally.
    function checkRemember() {
        var authToken;
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
    }

    //Listen for when the state changes then check the user-role and see if
    //the user is authorized to see the content
    function checkForAll(authorizedRoles) {
        for (var prop in authorizedRoles) {
            if (authorizedRoles[prop] === "*") {
                return true;
            }
        }
        return false;
    }

    function checkAuthorization(event, argus) {
        var args = argus;

        //This is the default is nothing was set in the config data object for $stateProvider
        var authorizedRoles = {
            all: "*"
        };

        //Get the authorized roles from the $stateProvider
        if(args.data && args.data.authorizedRoles) {
            authorizedRoles = args.data.authorizedRoles;
        }

        if(!checkForAll(authorizedRoles)) {
            if (!$rsAuth.isAuthenticated()) {
                //If they are not logged in at all.
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            } else if (!!$rsAuth.isAuthenticated() && !$rsAuth.isAuthorized) {
                //If you're logged in but you're not authenticated to see the content.
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
            }
        }
    }
}
rsAuthRun.$inject = ["AUTH_EVENTS", "$rootScope", "$rsAuth"];
 

})(angular);