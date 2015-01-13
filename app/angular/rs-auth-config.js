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
    notAuthorized: '$authNotAuthorized',
    authSuccess: '$authAuthSuccess',
    validateSuccess: '$authValidateSuccess',
    validateFailed: '$authValidateFailed',
    noToken: '$authNoToken'
});