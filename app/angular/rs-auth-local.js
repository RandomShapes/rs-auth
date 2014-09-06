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
