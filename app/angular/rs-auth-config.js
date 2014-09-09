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

//Needs to be hoisted, which is why it's a function.
function AUTH_EVENTS() {
    return {
        loginSuccess: '$authLoginSuccess',
        loginFailed: '$authLoginFailed',
        logoutSuccess: '$authLogoutSuccess',
        sessionTimeout: '$authSessionTimeout',
        notAuthenticated: '$authNotAuthenticated',
        notAuthorized: '$authNotAuthorized'
    }; 
}