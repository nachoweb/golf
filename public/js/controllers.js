'use strict';
var ctrlMod = angular.module('ctrlMod', []);

/**
 * Módulo que contiene a los controladores
 * @type {module}
 */

ctrlMod.controller('MainControl', ['$scope', 'storage', '$location','calculosBoard', function MainControl($scope, storage, $location,calculosBoard){

        $scope.isCenter=calculosBoard.isCenter;
        $scope.data=[];
        $scope.dataServer=[];
        $scope.pantallaCompleta = false;

        $scope.setAlertas=function (type,mess) {
          $scope.alertas={type:type,mess:mess};
        }

        $scope.palos = {
            'M1': 'Driver',
            'M3': 'Madera 3',
            'M5': 'Madera 5',
            'Hyb 1': 'Hibrido 1',
            'Hyb 2': 'Hibrido 2',
            'H2': 'Hierro 2',
            'H3': 'Hierro 3',
            'H4': 'Hierro 4',
            'H5': 'Hierro 5',
            'H6': 'Hierro 6',
            'H7': 'Hierro 7',
            'H8': 'Hierro 8',
            'H9': 'Hierro 9',
            'PW': 'PitchingWedge',
            '50º': '50º',
            '52º': '52º',
            '54º': '54º',
            '56º': '56º',
            '58º': '58º',
            '60º': '60º',
            'Putt':'Putt'
        };

        $scope.dateFormat=function (fecha,isDateTime) {
            var date=new Date(fecha);
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();

            var time=date.getHours()+":"+("0"+ date.getMinutes()).slice(-2);
            var res=d+"-"+m+"-"+y;
            if(isDateTime){
                res=res+" "+time;
            }
            return res;
        }

        storage.query(function (data) {
//            console.log(data);
            $scope.data=data; //$scope.data será una referencia a storage.data
            $scope.dataServer=angular.copy(data);

        });

//        console.log("Nombre de usuario: ", window.GolfApp.user);

        $scope.isError=false;
        $scope.setIsError=function(isError){
            $scope.isError=isError;
        }

        $scope.getIdActivo=function () {
            return calculosBoard.idActivo;
        }

        $scope.resetIdActivo=function(){
            calculosBoard.idActivo = 0;
        }

        $scope.username = window.golfApp.user;

        // Comprobar si la máquina tiene una sesión activa con el servidor
//        console.log("Comprobar si tengo sesión activa en el servidor ...")

        $scope.noTerminado = function(id){
            var index = calculosBoard.findTestById($scope.data,id);
            if(index != -1){
                if($scope.data[index].estado === 'terminado'){
                    return false;
                }
                else{
                    return true;
                }
            }else {
                return false;
            }
        }

        $scope.nuevoTest = function () {

            storage.createTest(function (createdData) {
                if(!createdData.err){
                    $scope.dataServer.unshift(angular.copy(createdData.datos))
                    $location.path("/test/"+createdData.datos._id);
                }
            });
        }

        $scope.cambiarPantallaCompleta = function(){
            if($scope.pantallaCompleta){
                $scope.pantallaCompleta = false;
            }else{
                $scope.pantallaCompleta = true;
            }
        }
    
        $scope.sincServer=function () {
            storage.sinc(function (data) {
                if(!data){
                    $scope.setAlertas("danger","error al sincronizar con el servidor");
                }else{
                    $scope.setAlertas("success","datos sincronizados")
                    $scope.data=data;
                    $scope.dataServer=angular.copy(data);
                    storage.setData(data);
                    $location.path("/");
                }
            });

        }
    }
]);

ctrlMod.controller('BoardControl', ['$scope', '$routeParams', '$location', 'storage', 'calculosBoard', function ($scope, $routeParams, $location, storage, calculosBoard) {

    $scope.numTest = calculosBoard.findTestById($scope.data, $routeParams.testId);



    var numTest = $scope.numTest;
    if (numTest == -1) {
        $scope.setIsError(true);
    } else {
        calculosBoard.idActivo = $routeParams.testId;
        $scope.statistics = calculosBoard.getUpdatedStatistics($scope.data[numTest]);
    }

    $scope.dblClick=function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

    }

    /* Function to handle a cell click */
    $scope.boardClick = function ($event,fil, col) {
        $event.preventDefault();
        $event.stopPropagation();
        if ($scope.data[numTest].estado === 'no terminado') {
            $scope.data[numTest].data[fil][col]++;
            $scope.statistics = calculosBoard.getUpdatedStatistics($scope.data[numTest]);
        }
    }

    $scope.cellFunc=calculosBoard.cellFunc;

    $scope.volver = function () {
        $scope.setIsError(false);
        $location.path("/");
    }

    /**
     * Función para detectar cambios en los datos y habilitar así el botón Guardar Cambios
     * @returns {boolean} Si hay o no cambios en un determinado test
     */
    $scope.hayCambios = function (t) {
        return !angular.equals($scope.data[t], $scope.dataServer[t]);
    }

    $scope.guardarCambios = function (numTest) {

        storage.update($scope.data[numTest], function (data) {
            if (data.err) {
                console.log("Error actualizando test");
            } else {
                $scope.dataServer[numTest] = angular.copy($scope.data[numTest]);
//                console.log('Test actualizado en el servidor');
            }
        });

    }

    /**
     * Eliminar el test actual
     */
    $scope.borrar = function (numTest) {
        if (confirm("¿Está seguro de que desea borrar el test?")) {

//            console.log("Test a eliminar: " + $scope.data[numTest])
            $scope.data[numTest].borrar=true;
            storage.update($scope.data[numTest],function (data) {
                if(!data.err){
                    $scope.data.splice(numTest,1);
                    $scope.dataServer.splice(numTest,1);
                   $location.path('/test');
                }else{
                    console.log("Error borrando el test");
                }
              
            });
        }
    }

    $scope.terminarTestActual = function (numTest) {

        if (confirm("¿Está seguro de que desea terminar el test? Después no podrá ser modificado.")) {

            $scope.data[numTest].estado = 'terminado';
            storage.update($scope.data[numTest], function (data) {
                if (!data.err) {
//                    console.log('Test actualizado en el servidor:');
                    $scope.dataServer[data.index] = angular.copy($scope.data[data.index]);
                } else {
                    console.log("Error al terminar test");
                }
            });

        }
    }
}
]);

ctrlMod.controller('EstadisticasGlobalesControl',['$scope','calculosBoard',function (scope,calculosBoard) {
    calculosBoard.resetIdActivo();
    scope.statistics = calculosBoard.computeGlobalStatistics(scope.data);
}]);
