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