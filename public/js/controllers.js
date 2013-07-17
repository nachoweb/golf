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

ctrlMod.controller('MainControl', ['$scope', 'Storage', '$location', '$http', 'LoginService',

    function MainControl($scope, Storage, $location, $http, LoginService){
        console.log("Creando controlador MainControl");
        console.log("Nombre de usuario: ", LoginService.getUsername());
        /* Datos sobre los test que serán heredados por los demás controladores de la app */
        $scope.data=[];
        $scope.dataServer=[];

        $scope.isError=false;
        $scope.setIsError=function(isError){
            $scope.isError=isError;
        }

        $scope.numTest = 0; /* Número actual de test que será utilizado por todos los controladores de la app */

        $scope.idSesion = "";
        $scope.username = window.GolfApp.username;

        // Comprobar si la máquina tiene una sesión activa con el servidor
        console.log("Comprobar si tengo sesión activa en el servidor ...")

        $scope.noTerminado = function(id){
            var index = $scope.indexById(id);
            if(index < $scope.data.length){
                if($scope.data[index].estado === 'terminado'){
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


        /**
         * Eliminar el test actual
         */
        $scope.borrar = function(){
            if (confirm("¿Está seguro de que desea borrar el test?")) {

                console.log("Test a eliminar: " + $scope.data[$scope.numTest])

                // Eliminar del servidor
                Storage.remove($scope.data[$scope.numTest], function(data){

                    // No consigo que se ejecute
                    console.log('Test eliminado del servidor:', data);
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

                    Storage.update($scope.data[$scope.numTest], function(data){
                        console.log("Test actualizado")
                        console.log(data)
                    });

                }else{
                    var aux = $scope.numTest;
                    $scope.numTest = 0;
                    $location.path('/test/0');
                    // Eliminar de la aplicación
                    $scope.data.splice(aux,1);
                }

                $scope.dataServer = angular.copy($scope.data);

                alert("Test eliminado");
            }
        }

        /*
         Indica el si test index se está viendo en la pantalla
         */
        $scope.activo = function(id){
            return $scope.numTest==$scope.indexById(id);
        }

        $scope.cambiarNumTest = function(index){
            $scope.numTest = index;
        }

        /*
         Variable que indica si se muestra o no el campo
         */
        $scope.mostrar_campo = false;



        $scope.campoVisible = function(){
            if($scope.data[$scope.numTest].estado === 'no terminado'){
                $scope.mostrar_campo = true;
            }

            return $scope.mostrar_campo;
        }

        /**
         * Terminar y enviar al servidor el test actual
         */
        $scope.terminarTestActual = function(){

            if (confirm("¿Está seguro de que desea terminar el test? Después no podrá ser modificado.")) {

                $scope.data[$scope.numTest].estado = 'terminado';
                Storage.update($scope.data[$scope.numTest], function(data){

                    // No consigo que se ejecute esta función de callback
                    console.log('Test actualizado en el servidor:');
                    console.log(data)
                    $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
                });

                console.log('Test actualizado en el servidor:',  $scope.data[$scope.numTest]);
                $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
            }
        }


        $scope.setNumTest = function(numTest){
            $scope.numTest = numTest;
        }


        /**
         * Crear un nuevo test
         */
        $scope.nuevoTest = function () {

            // Guardar en el servidor
            Storage.create(function (test_created) {
                console.log("Test creado:")
                console.log(test_created)

                // Añadirlo al comienzo del array de tests
                $scope.data.unshift(test_created);

                // Fijar el test actual
                $scope.numTest = 0;
                $scope.setNumTest(0);

                // Copia local
                $scope.dataServer = angular.copy($scope.data);
                console.log("dataSever modificado");

                $location.path('/test/' + test_created._id);
            });
        }

        $scope.setData = function(newData){
            $scope.data = angular.copy(newData);
            $scope.dataServer = angular.copy(newData);
        }

        $scope.setIdSesion = function(newId){
            $scope.idSesion = newId;
        }


        $scope.indexById = function(id){
            var index = 0;
            angular.forEach($scope.data ,function(v,k){
                if(id===v._id){
                    index = k;
                }
            });
            return index;
        }
    }
]);

ctrlMod.controller('BoardControl', ['$scope', '$routeParams', '$http', 'Storage', 'LoginService',
    /*
     Board Controller
     data es un objeto heredado del scope de MainControl (padre)
     */
    function BoardControl($scope, $routeParams, $http, Storage, LoginService){

        /*
        Si no hay test, descargarlos.
        Esta situación se da cuando accedemos mediante la ruta /test/id directamente, ya que no se carga el
        controlador EstadisticasControl y, por tanto, no se descargan los tests.
         */
        if($scope.data.length == 0){

            Storage.query(function (data){
                $scope.setData(data);
                console.log('Tests descargados del servidor: ', $scope.data);
                console.log('Data Server:', $scope.dataServer);

                $scope.numTest=$scope.indexById($routeParams.testId); /* Cambiar de tablero */
                console.log($routeParams.testId, '->', $scope.numTest);
                var numTest=$scope.numTest;

                $scope.setIsError(false);
                if(!$scope.data[numTest]){
                    $scope.setIsError(true);
                }

                // Comprobar que se ha indicado un id de test válido
                if (numTest > $scope.data.length) {
                    console.log("No hay datos para este test")
                    $scope.setNumTest(-1);
                }
                else {
                    $scope.setNumTest($scope.numTest);
                }
            });
        }else{
            $scope.numTest=$scope.indexById($routeParams.testId); /* Cambiar de tablero */
            console.log($routeParams.testId, '->', $scope.numTest);
            var numTest=$scope.numTest;

            $scope.setIsError(false);
            if(!$scope.data[numTest]){
                $scope.setIsError(true);
            }

            // Comprobar que se ha indicado un id de test válido
            if (numTest > $scope.data.length) {
                console.log("No hay datos para este test")
                $scope.setNumTest(-1);
            }
            else {
                $scope.setNumTest($scope.numTest);
            }
        }



        /* Function to handle a cell click */
        $scope.boardClick = function(fil, col){

            if($scope.data[$scope.numTest].estado === 'no terminado'){
                $scope.data[$scope.numTest].data[fil][col]++;

                if($scope.isCenter(fil,col)){
                    $scope.data[$scope.numTest].statistics.goals++;
                }
                else if($scope.isBetw15(fil,col)){
                    $scope.data[$scope.numTest].statistics.between1and5metters++;
                }
                else if($scope.isMor5(fil,col)){
                    $scope.data[$scope.numTest].statistics.more5metters++;
                }
            }
        }

        $scope.isMor5 = function(fil, col){
            var centro = $scope.data[0].data.length/2;
            var diff_x = Math.abs(fil-centro);
            var diff_y = Math.abs(col-centro);

            if((diff_x>5) || (diff_y>5)){
                return true;
            }
            else{
                return false;
            }
        }

        $scope.isBetw15 = function(fil, col){
            var centro = $scope.data[0].data.length/2;
            var diff_x = Math.abs(fil-centro);
            var diff_y = Math.abs(col-centro);

            var max = Math.max(diff_x,diff_y);
            if(max>=1 && max<=5){
                return true;
            }
            else{
                return false;
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
            // Enviar petición PUT
            Storage.update($scope.data[$scope.numTest], function(data){

                // No consigo que se ejecute
                console.log('Test actualizado en el servidor:',  data);
                $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
            }, {});

            console.log('Test enviado al servidor:',  $scope.data[$scope.numTest]);
            $scope.dataServer[$scope.numTest] = angular.copy($scope.data[$scope.numTest]);
        }
    }
]);


ctrlMod.controller('EstadisticasControl', ['$scope', 'LoginService', 'Storage',
/**
 * Controlador para la ventana de estadísticas globales
 * @constructor
 */
function EstadisticasControl($scope, LoginService, Storage){
    $scope.setNumTest(-1); // Eliminar el ojo

    console.log("Username: ", $scope.username);

    // Descargar tests
    Storage.query(function (data){
        $scope.setData(data);
        console.log('Tests descargados del servidor: ', $scope.data);
        console.log('Data Server:', $scope.dataServer);
    });
}
]);


ctrlMod.controller('LoginControl', ['$http','$scope', '$location', 'LoginService',
/**
 * Controlador para la página de login
 */
function LoginControl($http, $scope, $location, LoginService){
    console.log("Entrando en LoginControl")
    $scope.username = "";
    $scope.password = "";
    $scope.idError = "exito"; // Indica qué mensaje de error se mostrará
    $scope.errores = {
        exito: "",
        general: "Usuario o contraseña son incorrectos",
        cont_invalida: "Contraseña inválida",
        no_existe: "Usuario no existe",
        ya_existe: "Ya existe"
    }

    /**
     * Manejador de click
     */
    $scope.enviar = function(){
        console.log("LOGIN. Username: " , $scope.username, " Password: ", $scope.password);

        var login_data = {
            user: $scope.username,
            password: $scope.password
        };

        // Enviar usuario y contraseña al servidor
        $http.post('/login', login_data).
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                console.log("status: " + status)
                $location.path('/test');
            }).
            error(function(data, status, headers, config) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log("status: " + status)
                console.log("mensaje: " + data.error)
                $scope.idError = "general";
            });

        LoginService.setLogin($scope.username, $scope.password);
        console.log("Login: ", LoginService.getUsername())
//        window.location ="tests.html";
//        $location.path('/test');
    }
}
]);


