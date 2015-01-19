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
                $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
                    $state.go(toState.name, toParams);
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