var app = angular.module('rs-auth');
/**
* Session Service
* author: Jamie Spittal james@randomshapes.ca
* Methods for getting and setting current session variables. Also, used for recalling a remembered session.
*/
app.service('$rsSession', ['$window',function ($window) {
    this.set = function(key,value) {
      $window.sessionStorage.setItem(key,value);
    };
    this.get = function(key) {
      return $window.sessionStorage.getItem(key);
    };
    this.setUser = function(value) {
      $window.sessionStorage.setItem('user',JSON.stringify(value));
    };
    this.getUser = function() {
      return JSON.parse($window.sessionStorage.getItem('user'));
    };
    this.unset = function(key) {
      $window.sessionStorage.removeItem(key);
    };

    this.setLocalAuth = function(authToken) {
      $window.localStorage.setItem('authToken', authToken);
    };
    this.getLocalAuth = function() {
      return $window.localStorage.getItem('authToken');
    };

    //Clears everything in local and session storage.
    this.clear = function() {
      $window.sessionStorage.clear();
      $window.localStorage.clear();
    };
}]);