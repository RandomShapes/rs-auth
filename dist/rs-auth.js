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
    logoutFailed: '$authLogoutFailed',
    sessionTimeout: '$authSessionTimeout',
    notAuthenticated: '$authNotAuthenticated',
    notAuthorized: '$authNotAuthorized',
    authSuccess: '$authAuthSuccess',
    authFailed: '$authAuthFailed',
    validateSuccess: '$authValidateSuccess',
    validateFailed: '$authValidateFailed',
    clearLoader: '$authClearLoader'
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
            $rootScope.$broadcast(AUTH_EVENTS.logoutFailed);
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
            $rootScope.$broadcast(AUTH_EVENTS.validateSuccess);
            deferred.resolve(res);
        }

        function validateTokenFail(error) {
            console.error("rs-auth found the token to be invalid, deleting tokens",error);
            $rootScope.$broadcast(AUTH_EVENTS.validateFailure);
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

        var authorized = (authorizedRoles.indexOf(role) !== -1);

        return authorized;
    }

    function isAuthenticated() {
        var authenticated = $window.sessionStorage.getItem('authToken');

        return authenticated;
    }

    function isRemembered() {
        var remembered = $window.localStorage.getItem('authToken');

        return remembered;
    }

    function destroyTokens() {
        $window.localStorage.clear();
        $window.sessionStorage.clear();
        $rootScope[config.user] = null;
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

function rsAuthRun(AUTH_EVENTS,$rootScope,$rsAuth,$state,$timeout) {
    
    checkRemember();

    //TODO: Native Angular support, not UI.Router
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        checkAuthorization(event, toState, toParams, fromState, fromParams);
    });


    ////////////////////////


    //Check to see if the session is remembered, and then check to see if the login should be remembered globally.
    function checkRemember() {
        var authToken;
        if (!!$rsAuth.isAuthenticated()) {
            authToken = $rsAuth.isAuthenticated();
            $rsAuth.validateToken(authToken).then(function() {
                $rootScope.$broadcast(AUTH_EVENTS.authSuccess);
            });

        } else if (!!$rsAuth.isRemembered()) { //If the session is remembered globally, validate the token make sure it's clean.
            authToken = $rsAuth.isRemembered();
            $rsAuth.validateToken(authToken).then(function() {
                $rootScope.$broadcast(AUTH_EVENTS.authSuccess);
            });
        } else {
            //There's a timeout because there no ajax call so there no time to register listens for this
            $timeout(function() {            
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                $rootScope.$broadcast(AUTH_EVENTS.authFailed);
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

    function checkAuthorization(event, toState, toParams, fromState, fromParams) {

        //This is the default is nothing was set in the config data object for $stateProvider
        var authorizedRoles = {
            all: "*"
        };

        //Get the authorized roles from the $stateProvider
        if(toState.data && toState.data.authorizedRoles) {
            authorizedRoles = toState.data.authorizedRoles;
        }

        if(!checkForAll(authorizedRoles)) {

            if (!$rsAuth.isAuthenticated()) { //If they have no token
                
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, fromState, fromParams);

            } else if ($rsAuth.isAuthenticated && //Has token
                       !$rootScope[config.user]) { //has token but hasn't validated it yet, just try it again.
                
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, fromState, fromParams);

                //Happened eventually
                $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
                    $state.go(toState.name, toParams);
                });

                //Happened eventually
                $rootScope.$on(AUTH_EVENTS.validateFailure, function() {
                    $rootScope.$broadcast(AUTH_EVENTS.authFailed);
                });

            } else if ($rsAuth.isAuthenticated && //Has Token
               !!$rootScope[config.user] &&  //Token has been validated
               !$rsAuth.isAuthorized(authorizedRoles)) { //Check to see if they are allowed
                
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized, fromState);

            } else { //If they have the token, they are validated and they are authorized go through
                $rootScope.$broadcast(AUTH_EVENTS.authSuccess);
            } 
        }
    }
}
rsAuthRun.$inject = ["AUTH_EVENTS", "$rootScope", "$rsAuth", "$state", "$timeout"]; 

})(angular);