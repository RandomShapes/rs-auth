app.factory('Local', ['$http','$window','$rootScope',function($http,$window,$rootScope) {
	var local = {};

	local.login = function (credentials) {
	  return $http({
	    url: config.authUrl + config.loginEndPoint, 
	    method: "POST",
	    data: credentials
	  }).then(function (res) {
	    if (credentials.remember) {
	      $window.localStorage.setItem('authToken',res.data.token);
	    }
	    $window.sessionStorage.setItem('authToken',res.data.token);
	    $rootScope[config.user] = res.data.user;
	    return res;
	  });
	};

	local.logout = function() {
	  return $http({
	    url: config.authUrl + config.logoutEndPoint, 
	    method: "GET",
	    headers: {'X-Auth-Token': $window.sessionStorage.getItem('authToken')}
	  }).then(function (res) {
	    $window.localStorage.clear();
	    $window.sessionStorage.clear();
	  });
	};

	local.register = function(credentials) {
	  return $http({
	    url: config.authUrl + config.registerEndPoint, 
	    method: "POST",
	    data: credentials
	  }).then(function (res) {
	    $window.sessionStorage.setItem('authToken',res.data.token);
	    $rootScope[config.user] = res.data.user;
	    return res;
	  });
	};

	local.validateToken = function(authToken) {
	  return $http({
	    url: config.authUrl + config.validateEndPoint, 
	    method: "GET",
	    headers: {'X-Auth-Token': authToken}
	  }).then(function (res) {
	  	$window.sessionStorage.setItem('authToken',res.data.token);
	  	$rootScope[config.user] = res.data.user;
	    return res;
	  });
	};

	local.isAuthenticated = function() {
	  return !!$window.sessionStorage.getItem('authToken');
	};

	//Check the userRole and make sure it's correct.
	local.isAuthorized = function(authorizedRoles) {

	  if (!angular.isArray(authorizedRoles)) {
	    authorizedRoles = [authorizedRoles];
	  }

	  return (this.isAuthenticated() && authorizedRoles.indexOf($rootScope[config.user].role) !== -1);
	};

	local.isRemembered = function() {
		return $window.localStorage.getItem('authToken');
	};

	return local;
}]);