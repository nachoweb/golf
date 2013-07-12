var serv=angular.module('servMod',['ngResource']);

serv.factory('ResourceTests', function($resource) {
//    var Res=$resource('http://localhost:2700/res', { salvarVarios:{ method:'POST',isArray:true }});
    var Res=$resource('http://localhost\\:2700/rest',{"id": "@_id"}, { update: {method: 'PUT'}});
    return Res;
});

/**
 * Servicio para mantener un objeto que contiene el usuario y contraseña
 */
serv.factory('LoginService',function(){
    console.log("Creando servicio LoginService")
    var Service = {};
    Service.username = "";
    Service.password = "";

    Service.setLogin = function(u,p){
        this.username = u;
        this.password = p;
    }

    Service.setUsername = function(newName){
        this.username = newName;
    }

    Service.getUsername = function(){
        return this.username;
    }

    return Service;
});

