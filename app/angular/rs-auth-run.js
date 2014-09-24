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
