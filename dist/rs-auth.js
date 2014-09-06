(function(angular) { 

angular.module('rs-auth', [])
    .factory('Local', Local)
    .provider('$rsAuth', $rsAuth)
    .run(rsAuthRun)
    .constant('AUTH_EVENTS', AUTH_EVENTS);
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

var AUTH_EVENTS = {
    loginSuccess: '$authLoginSuccess',
    loginFailed: '$authLoginFailed',
    logoutSuccess: '$authLogoutSuccess',
    sessionTimeout: '$authSessionTimeout',
    notAuthenticated: '$authNotAuthenticated',
    notAuthorized: '$authNotAuthorized'
};

function Local($http,$window,$rootScope) {
    return {
        login: login,
        logout: logout,
        register: register,
        validateToken: validateToken,
        isAuthenticated: isAuthenticated,
        isAuthorized: isAuthorized,
        isRemembered: isAuthenticated,
        getToken: isAuthenticated
    };

    function login(credentials) {
        return $http({
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
            return res;
        }

        function loginFail(error) {
            console.error("rs-auth login failed",error);
        }
    }

    function logout() {
        return $http({
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
        }

        function logoutFail(error) {
            console.error("rs-auth logout failed",error);
        }
    }

    function register(credentials) {
        return $http({
            url: config.authUrl + config.registerEndPoint, 
            method: "POST",
            data: credentials
        })
        .then(registerSuccess)
        .catch(registerFail);

        function registerSuccess(res) {
            $window.sessionStorage.setItem('authToken',res.data.token);
            $rootScope[config.user] = res.data.user;
            return res;
        }

        function registerFail(error) {
            console.error("rs-auth register failed",error);
        }
    }

    function validateToken(authToken) {
        return $http({
            url: config.authUrl + config.validateEndPoint, 
            method: "GET",
            headers: {'X-Auth-Token': authToken}
        })
        .then(validateTokenSuccess)
        .catch(validateTokenFail);

        function validateTokenSuccess(res) {
            $window.sessionStorage.setItem('authToken',authToken);
            $rootScope[config.user] = res.data;
            return res;
        }

        function validateTokenFail(error) {
            console.error("rs-auth register failed",error);
        }
    }

    //Check the userRole and make sure it's correct.
    function isAuthorized(authorizedRoles) {

        if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }

        return (authorizedRoles.indexOf($rootScope[config.user].role) !== -1);
    }

    function isAuthenticated() {
        return $window.sessionStorage.getItem('authToken');
    }
}
Local.$inject = ["$http", "$window", "$rootScope"];

function $rsAuth() {

    this.config = config;
    this.userRoles = userRoles;

    this.setUserRoles = function(userRolesObj) {
        angular.extend(userRoles,userRolesObj);
    };
    /* @ngInject */
    this.$get = function rsAuthFactory(Local) {
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
    };
    this.$get.$inject = ["Local"];
}

function rsAuthRun(AUTH_EVENTS,$rootScope,$rsAuth) {
	$rootScope[config.user] = {};

	checkAuth();

	//Check to see if the session is remembered, and then check to see if the login should be remembered globally.
	function checkAuth() {
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

	//TODO: Native Angular support, not UI.Router
	$rootScope.$on('$stateChangeStart', function (event, args) {
		//This is the default is nothing was set in the config data object for $stateProvider
		var authorizedRoles = {
			all: "*"
		};

		//Get the authorized roles from the $stateProvider
		if(args.data && args.data.authorizedRoles) {
			authorizedRoles = args.data.authorizedRoles;
		}

		//Do a check to make sure that's it's not ALL and that they are authorized.
		if (!checkForAll(authorizedRoles) && !$rsAuth.isAuthorized(authorizedRoles) && $rsAuth.isAuthenticated) {
			//prevent the default event, which is go to state.
			event.preventDefault();
			//If you're logged in but you're not authenticated to see the content.
			$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
		} else if (!checkForAll(authorizedRoles) && !$rsAuth.isAuthorized(authorizedRoles) && !$rsAuth.isAuthenticated) {
			//prevent the default event, which is go to state.
			event.preventDefault();
			//If they are not logged in at all, tell them they are stupid for trying.
			$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
		}
	});
}
rsAuthRun.$inject = ["AUTH_EVENTS", "$rootScope", "$rsAuth"];
 

})(angular);