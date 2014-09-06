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
