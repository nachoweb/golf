'use strict';
var directivesMod = angular.module('directivesMod', []);

directivesMod.directive('alertas',function () {
      var template=function (tipo,mensaje) {
          var str="<div class='alert alert-"+tipo+"'><button type='button' class='close' data-dismiss='alert'>&times;</button>" +
              mensaje+"</div>";
          return str;
      }


      return function (scope,element,attr) {
        scope.$watch(attr.alertas,function (n,o) {
            if(n && n.type && n!=o){
                scope.setAlertas(0);
                element.append(template(n.type, n.mess));

            }
        },true);
      }
});
