'use strict';

/* 
App Module 
The module define the routes and the service
*/
var app=angular.module('golfModule', ['servMod','ctrlMod']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/test', {templateUrl: '../public/partials/welcome.html', controller: 'EstadisticasControl'}).
	  when('/test/:testId', {templateUrl: '../public/partials/board.html' , controller: 'BoardControl'}).
      otherwise({redirectTo: '/test'});
}]);


