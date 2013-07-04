'use strict';
var ctrlMod = angular.module('ctrlMod', []);
/* Utilities */
function imp(something){
	document.write('<p>' + something + '</p>');
}

/*
Create a matrix with integers elements.
*/
Array.matrix = function(m,n,initial){
	var a,i,j,mat=[];
	for(i=0; i<m; i++){
		a=[];
		for(j=0; j<n; j++){
			a[j]=initial;
		}
		mat[i]=a;
	}
	return mat;
}

function printMatrix(matrix){
	document.write('<table BORDER="1">');
				
	var nFilas = matrix.length;
	for (var f=0; f<nFilas; f++){
		document.write('<tr>');
					
		var nColumnas = matrix[f].length;
		for(var c=0; c<nColumnas; c++){
			document.write('<td>'+ matrix[f][c] + '</td>');
		}
		document.write('</tr>');
	}
	document.write('</table>');
}


/**
 * Módulo que contiene a los controladores
 * @type {module}
 */


ctrlMod.controller('MainControl', ['$scope', 'ResourceTests', '$location', '$http', 'LoginService',
    /* Main Controller
     Utiliza el objeto ResourceTests que es un recurso para comunicarnos con el servidor sin hacer
     del servicio $http de Angular
     */
    function MainControl($scope, ResourceTests, $location, $http, LoginService){
        console.log("Creando controlador MainControl");
        console.log("Nombre de usuario: ", LoginService.getUsername());
        /* Datos sobre los test que serán heredados por los demás controladores de la app */
        $scope.data=[];
        $scope.dataServer=[];

        $scope.isError=false;
        $scope.setIsError=function(isError){
            $scope.isError=isError;
        }

        /* Pedir lo datos al servidor
         * Los datos se obtienen de forma ordenada por fecha
         */
        ResourceTests.all({ sort: {fecha: -1} }, function (data){
            $scope.data=data;
            console.log('Tests descargados del servidor: ', $scope.data);

            // Copia auxiliar de los datos para detectar cambios
            $scope.dataServer = angular.copy($scope.data);
            console.log('Data Server:', $scope.dataServer);
        });



        $scope.numTest = 0; /* Número actual de test que será utilizado por todos los controladores de la app */

        $scope.noTerminado = function(i){
            if(i < $scope.data.length){
                if($scope.data[i].estado === 'terminado'){
                    return false;
                }
                else{
                    return true;
                }
            }
            else{
                return false;
            }
        }

        $scope.borrado = function(i){
            if($scope.data[i].estado === 'borrado'){
                return true;
            }
            else{
                return false;
            }
        }
        /*
         Función para comprobar si todos los test están terminados
         */
        $scope.todosTerminados = function(){
            for(var i=0; i<$scope.data.length; i++){
                if($scope.data[i].estado !== 'terminado'){
                    return false;
                }
            }
            return true;
        }

        /*
         Función para eliminar el test actual de la aplicación
         */
        $scope.borrar = function(){
            if (confirm("¿Está seguro de que desea borrar el test?")) {

                // Eliminar del servidor
                $scope.data[$scope.numTest].$remove(function(){
                    console.log('Test eliminado del servidor:', $scope.data[$scope.numTest]);
                });


                // Si solo queda un test
                if($scope.data.length - 1 == 0){
                    $scope.numTest = 0;
                    $location.path('/test/0');

                    /* Crear un tablero relleno con ceros */
                    var dim = 20;
                    var m = Array.matrix(dim,dim,0);

                    /* Obtener fecha */
                    var date = new Date();
                    var day=date.getDate();
                    var year=date.getFullYear();
                    var month=date.getMonth();
                    var realMonth=month+1;

                    // Crear nuevo test
                    var testData={
                        data : m,
                        name : 'Nuevo test',
                        date : day + '-' + realMonth + '-' + year,
                        fecha : new Date(),
                        estado : 'no terminado',
                        statistics:{
                            goals : 0,
                            between1and5metters: 0,
                            less1metter : 0,
                            more5metters : 0
                        }
                    };
                    angular.extend($scope.data[$scope.numTest],testData);

                    // Actualizar en el servidor
                    $scope.data[$scope.numTest].$update(function(){
                        console.log("Test actualizado en el servidor: ", $scope.data[$scope.numTest]);
                    });

                }else{
                    var aux = $scope.numTest;
                    $scope.numTest = 0;
                    $location.path('/test/0');
                    // Eliminar de la aplicación
                    $scope.data.splice(aux,1);
                }

                // Copia local
                $scope.dataServer = angular.copy($scope.data);
                console.log("dataSever modificado");

                alert("Test eliminado");
            }
        }

        /*
         Indica el si test index se está viendo en la pantalla
         */
        $scope.activo = function(index){
            return index==$scope.numTest;
        }

        $scope.cambiarNumTest = function(index){
            $scope.numTest = index;
        }

        /*
         Variable que indica si se muestra o no el campo
         */
        $scope.mostrar_campo = false;


        /*
         Función para habilitar/deshabilitar que se vea el campo
         */
        /*$scope.verCampo = function(){
         if($scope.mostrar_campo){
         $scope.mostrar_campo = false;
         }
         else{
         $scope.mostrar_campo = true;
         }
         }*/

        $scope.campoVisible = function(){
            if($scope.data[$scope.numTest].estado === 'no terminado'){
                $scope.mostrar_campo = true;
            }

            return $scope.mostrar_campo;
        }

        $scope.terminarTestActual = function(){
            if (confirm("¿Está seguro de que desea terminar el test? Después no podrá ser modificado.")) {
                $scope.data[$scope.numTest].estado = 'terminado';

                $scope.data[$scope.numTest].$update(function(){
                    console.log('Test actualizado en el servidor:',  $scope.data[$scope.numTest]);

                    // Actualizar copia local
                    $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
                });
            }
        }

        $scope.setNumTest = function(numTest){
            $scope.numTest = numTest;
        }

        /**
         * Crear un nuevo test
         */
        $scope.nuevoTest = function(){
            /* Crear un tablero relleno con ceros */
            var dim = 20;
            var m = Array.matrix(dim,dim,0);

            /* Obtener fecha */
            var date = new Date();
            var day=date.getDate();
            var year=date.getFullYear();
            var month=date.getMonth();
            var realMonth=month+1;

            // Crear test auxiliar
            var test_aux = new ResourceTests();
            var testData={
                data : m,
                name : 'Nuevo test',
                date : day + '-' + realMonth + '-' + year,
                fecha : new Date(),
                estado : 'no terminado',
                statistics:{
                    goals : 0,
                    between1and5metters: 0,
                    less1metter : 0,
                    more5metters : 0
                }
            };
            angular.extend(test_aux,testData);

            // Añadirlo al comienzo del array de tests
            $scope.data.unshift(test_aux);

            // Fijar el test actual
            $scope.numTest = 0;
            $scope.setNumTest(0);

            // Guardar en el servidor
            $scope.data[$scope.numTest].$save(function(data){
                $scope.data[$scope.numTest]["_id"]=angular.copy(data["_id"])
//            console.log("data ",data);
//            console.log("local ",$scope.data[$scope.numTest])
                // Copia local
                $scope.dataServer = angular.copy($scope.data);
                console.log("dataSever modificado");
                $location.path('/test/0');
            });
        }
    }
]);

ctrlMod.controller('BoardControl', ['$scope', '$routeParams', '$http', 'ResourceTests', 'LoginService',
    /*
     Board Controller
     data es un objeto heredado del scope de MainControl (padre)
     */
    function BoardControl($scope, $routeParams, $http, ResourceTests, LoginService){

        $scope.username = LoginService.getUsername();
        $scope.numTest=$routeParams.testId; /* Cambiar de tablero */
        var numTest=$routeParams.testId;

        $scope.setIsError(false);
        if(numTest != 'nuevo' && !$scope.data[numTest]){
            $scope.setIsError(true);
        }

        if(numTest === 'nuevo'){
            /* Crear un tablero relleno con ceros */
            var dim = 20;
            var m = Array.matrix(dim,dim,0);

            /* Obtener fecha */
            var date = new Date();
            var day=date.getDate();
            var year=date.getFullYear();
            var month=date.getMonth();
            var realMonth=month+1;

            /* Incrementar el índice de test y crear un nuevo test */
            /*$scope.numTest = $scope.data.length;
             $scope.data[$scope.numTest] = new ResourceTests();
             $scope.data[$scope.numTest].data = m;
             $scope.data[$scope.numTest].name = 'Nuevo test';
             $scope.data[$scope.numTest].date =  day + '-' + realMonth + '-' + year;
             $scope.data[$scope.numTest].fecha = new Date();
             $scope.data[$scope.numTest].estado = 'no terminado';
             $scope.data[$scope.numTest].statistics = {};
             $scope.data[$scope.numTest].statistics.goals = 0;
             $scope.data[$scope.numTest].statistics.between1and5metters = 0;
             $scope.data[$scope.numTest].statistics.less1metter = 0;
             $scope.data[$scope.numTest].statistics.more5metters = 0;

             $scope.setNumTest($scope.numTest);*/

            // Crear test auxiliar
            var test_aux = new ResourceTests();
            var testData={
                data : m,
                name : 'Nuevo test',
                date : day + '-' + realMonth + '-' + year,
                fecha : new Date(),
                estado : 'no terminado',
                statistics:{
                    goals : 0,
                    between1and5metters: 0,
                    less1metter : 0,
                    more5metters : 0
                }
            };
            angular.extend(test_aux,testData);

//            test_aux.data = m;
//            test_aux.name = 'Nuevo test';
//            test_aux.date =  day + '-' + realMonth + '-' + year;
//            test_aux.fecha = new Date();
//            test_aux.estado = 'no terminado';
//            test_aux.statistics = {};
//            test_aux.statistics.goals = 0;
//            test_aux.statistics.between1and5metters = 0;
//            test_aux.statistics.less1metter = 0;
//            test_aux.statistics.more5metters = 0;

            // Añadirlo al comienzo del array de tests
            $scope.data.unshift(test_aux);

            // Fijar el test actual
            $scope.numTest = 0;
            $scope.setNumTest(0);

            // Guardar en el servidor
            $scope.data[$scope.numTest].$save(function(data){
                $scope.data[$scope.numTest]["_id"]=angular.copy(data["_id"])
                console.log("data ",data);
                console.log("local ",$scope.data[$scope.numTest])
                // Copia local
                $scope.dataServer = angular.copy($scope.data);
                console.log("dataSever modificado");
            });


        }
        else{
            // Comprobar que se ha indicado un id de test válido
            if(numTest > $scope.data.length){
                console.log("No hay datos para este test")
                $scope.setNumTest(-1);
            }
            else{
                $scope.setNumTest($scope.numTest);
            }

        }

        /* Function to handle a cell click */
        $scope.boardClick = function(fil, col){

            if($scope.data[$scope.numTest].estado === 'no terminado'){
                $scope.data[$scope.numTest].data[fil][col]++;

                // Aumentar número de aciertos
                if($scope.isCenter(fil,col)){
                    $scope.data[$scope.numTest].statistics.goals++;
                }
            }


        }

        /* Function to detect the center cell */
        $scope.isCenter = function(r,c){
            if($scope.data[$scope.numTest].data.length/2==r && $scope.data[$scope.numTest].data[0].length/2==c){
                return true;
            }
            return false;
        }

        /* Function to detect a cell containing zero */
        $scope.isZero = function(r,c){
            if($scope.data[$scope.numTest].data[r][c] == 0){
                return true;
            }
            else{
                return false;
            }
        }

        $scope.aDistancia5 = function(f,c){
            var dif_filas = Math.abs(f - $scope.data[$scope.numTest].data.length/2);
            var dif_columnas = Math.abs(c - $scope.data[$scope.numTest].data.length/2);

            if((dif_filas == 5 && dif_columnas <= 5) || (dif_filas <= 5 && dif_columnas == 5) ||
                (dif_filas == 9 && dif_columnas <= 9) || (dif_filas <= 9 && dif_columnas == 9)){
                return true;
            }

            else{
                return false;
            }
        }

        $scope.volver = function(){
            $scope.setIsError(false);
        }

        /**
         * Función para detectar cambios en los datos y habilitar así el botón Guardar Cambios
         * @returns {boolean} Si hay o no cambios en un determinado test
         */
        $scope.hayCambios = function (t) {
            return !angular.equals($scope.data[t], $scope.dataServer[t]);
        }

        $scope.guardarCambios = function(){
            $scope.data[$scope.numTest].$update(
                function(){
                    console.log('Test actualizado', $scope.data[$scope.numTest])

                    // Actualizar copia del servidor
                    $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
                }

            );
        }
    }
]);


ctrlMod.controller('EstadisticasControl', ['$scope', 'LoginService',
/**
 * Controlador para la ventana de estadísticas globales
 * @constructor
 */
function EstadisticasControl($scope, LoginService){
    $scope.setNumTest(-1); // Eliminar el ojo

    $scope.username = LoginService.getUsername();
    console.log("Username: ", $scope.username);
}
]);


ctrlMod.controller('LoginControl', ['$scope', '$location', 'LoginService',
/**
 * Controlador para la página de login
 */
function LoginControl($scope, $location, LoginService){
    console.log("Entrando en LoginControl")
    $scope.username = "";
    $scope.password = "";
    $scope.idError = 0; // Indica qué mensaje de error se mostrará
    $scope.errores = ["", "Contraseña inválida", "Usuario no existe", "Usuario ya existe"];

    /**
     * Manejador de click
     */
    $scope.enviar = function(){
        console.log("LOGIN. Username: " , $scope.username, " Password: ", $scope.password);

        /*
        // Comunicarse con el servidor para validar datos ...
         */

        /*
        Redirigir a la página principal
         */
//
        LoginService.setLogin($scope.username, $scope.password);
        console.log("Login: ", LoginService.getUsername())
//        window.location ="tests.html";
        $location.path('/test');
    }
}
]);


