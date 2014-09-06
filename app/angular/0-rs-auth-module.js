angular.module('rs-auth', [])
    .factory('Local', Local)
    .provider('$rsAuth', $rsAuth)
    .run(rsAuthRun)
    .constant('AUTH_EVENTS', AUTH_EVENTS);