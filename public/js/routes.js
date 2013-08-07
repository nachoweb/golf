'use strict';

/* 
App Module 
The module define the routes and the service
*/
var app=angular.module('golfModule', ['servMod','ctrlMod','directivesMod']);

app.config(['$routeProvider', function($routeProvider){
  $routeProvider.
      when('/test', {templateUrl: 'partials/welcome.html',controller: 'EstadisticasGlobalesControl'}).
	  when('/test/:testId', {templateUrl: 'partials/board.html' , controller: 'BoardControl'}).
      otherwise({redirectTo: '/test'});
}]);


