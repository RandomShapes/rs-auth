function Local($http,$window,$rootScope,AUTH_EVENTS,$q,$timeout) {
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
            deferred.reject(error.status + " - " + error.data.message);
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
            deferred.reject(error.status + " - " + error.data.message);
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
            deferred.reject(error.status + " - " + error.data.message);
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
            deferred.reject(error.status + " - " + error.data.message);
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
        $timeout(function() {
            $window.localStorage.clear();
            $window.sessionStorage.clear();
            $rootScope[config.user] = null;
        });
    }
}