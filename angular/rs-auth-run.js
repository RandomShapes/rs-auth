app.run(['$rsSession','AUTH_EVENTS','$timeout','$rootScope','$rsAuth', function($rsSession,AUTH_EVENTS,$timeout,$rootScope,$rsAuth) {

	//Check to see if the session is remembered, and then check to see if the login should be remembered globally.
	if ($rsAuth.isAuthenticated()) {
		$timeout(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});
	} else if (!!$rsAuth.isRemembered()) { //If the session is remembered globally, validate the token make sure it's clean.
		var authToken = $rsAuth.isRemembered();
		$rsAuth.validateToken(authToken).then(function() {
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
		});
	}

	//Listen for when the state changes then check the user-role and see if
	//the user is authorized to see the content

	//TODO: Check for more than just first entry for ALL.
	//TODO: Native Angular support, not UI.Router
	$rootScope.$on('$stateChangeStart', function (event, args) {
		var authorizedRoles = {
			all: "*"
		};

		//Get the authorized roles from the $stateProvider, look below at config to see where they are declared
		if(args.data.authorizedRoles) {
			authorizedRoles = args.data.authorizedRoles;
		}
		//Do a check to make sure that's it's not ALL and that they are authorized.
		if (authorizedRoles[0] !== $rsAuth.userRoles.all && !$rsAuth.isAuthorized(authorizedRoles)) {
			//If they are not authorized, prevent the default event, which is go to it.
			event.preventDefault();
			if ($rsAuth.isAuthenticated()) {
				//If you're logged in but you're not authenticated to see the content.
				$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
			} else {
			//If they are not logged in at all, redirect them to home ($state.go('home')) and tell them they are stupid for trying.
			$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			}
		}
	});

}]);

})(window.angular) //This starts in the module.