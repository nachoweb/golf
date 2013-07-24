'use strict';
var ctrlMod = angular.module('ctrlMod', []);

/* Utilities */
function imp(something){
	document.write('<p>' + something + '</p>');
}
/**
 * Módulo que contiene a los controladores
 * @type {module}
 */

ctrlMod.controller('MainControl', ['$scope', 'storage', '$location','calculosBoard', function MainControl($scope, storage, $location,calculosBoard){

        $scope.isCenter=calculosBoard.isCenter;
        $scope.data=[];
        $scope.dataServer=[];
        $scope.pantallaCompleta = false;

        $scope.palos = {
            'H1': 'Hierro 1',
            'H2': 'Hierro 2',
            'H3': 'Hierro 3',
            "M1": "Madera 1"
        }

        $scope.tipoJuego={
           "C":"Corto",
           "M": "Medio",
           "L": "Largo"
        };

        $scope.dateFormat=function (fecha,isDateTime) {
            var date=new Date(fecha);
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();

            var time=date.getHours()+":"+date.getMinutes();
            var res=d+"-"+m+"-"+y;
            if(isDateTime){
                res=res+" "+time;
            }
            return res;
        }

        storage.query(function (data) {
            $scope.data=data; //$scope.data será una referencia a storage.data
            $scope.dataServer=angular.copy(data);
            console.log('Tests cargados: ', $scope.data);

        });


        console.log("Nombre de usuario: ", window.GolfApp.username);

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

        $scope.username = window.GolfApp.username;

        // Comprobar si la máquina tiene una sesión activa con el servidor
        console.log("Comprobar si tengo sesión activa en el servidor ...")

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
    }
]);

ctrlMod.controller('BoardControl', ['$scope', '$routeParams', '$location', 'storage', 'calculosBoard', function ($scope, $routeParams, $location, storage, calculosBoard) {

    $scope.numTest = calculosBoard.findTestById($scope.data, $routeParams.testId);



    var numTest = $scope.numTest;
    if (numTest == -1) {
        $scope.setIsError(true);
    } else {
        calculosBoard.idActivo = $routeParams.testId;
    }

    $scope.saluda = function(){
        console.log("hola");
    }
    $scope.statistics = calculosBoard.getUpdatedStatistics($scope.data[numTest]);


    /* Function to handle a cell click */
    $scope.boardClick = function (fil, col) {

        if ($scope.data[numTest].estado === 'no terminado') {
            $scope.data[numTest].data[fil][col]++;

            calculosBoard.updateScore($scope.data[numTest], fil, col);

            //???? Para que esto?
            $scope.statistics = {
                total:0,
                goals: 0,
                rightBallsPercent: 0,
                leftBallsPercent: 0,
                longBallsPercent: 0,
                shortBallsPercent: 0,
                less2Percent: 0,
                more2Percent: 0
            }

            $scope.statistics = calculosBoard.getUpdatedStatistics($scope.data[numTest]);
        }
    }

    /* Function to detect a cell containing zero */
    $scope.isZero = function (r, c) {
        if ($scope.data[numTest].data[r][c] == 0) {
            return true;
        }
        else {
            return false;
        }
    }

    $scope.aDistancia5 = calculosBoard.aDistancia5;
    $scope.checkBorder = calculosBoard.checkBorder;

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
                console.log('Test actualizado en el servidor');
            }
        });

    }

    /**
     * Eliminar el test actual
     */
    $scope.borrar = function (numTest) {
        if (confirm("¿Está seguro de que desea borrar el test?")) {

            console.log("Test a eliminar: " + $scope.data[numTest])

            // Eliminar del servidor
            storage.remove($scope.data[numTest], function (data) {
                if (!data.err) {
                    $scope.dataServer.splice(data.index, 1);
                    // No consigo que se ejecute
                    console.log('Test eliminado del servidor');
                    $location.path('/test');
                } else {
                    console.log("Error al eliminar test");
                }
            });
        }
    }

    $scope.terminarTestActual = function (numTest) {

        if (confirm("¿Está seguro de que desea terminar el test? Después no podrá ser modificado.")) {

            $scope.data[numTest].estado = 'terminado';
            storage.update($scope.data[numTest], function (data) {
                if (!data.err) {
                    console.log('Test actualizado en el servidor:');
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
