'use strict';

/* 
App Module 
The module define the routes and the service
*/
var app=angular.module('golfModule', []);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/test', {templateUrl: 'partials/welcome.html', controller: EstadisticasControl}).
	  when('/test/:testId', {templateUrl: 'partials/board.html' , controller: BoardControl}).
      when('/login', {templateUrl: 'partials/login.html', controller: LoginControl}).
      otherwise({redirectTo: '/login'});
}]);


