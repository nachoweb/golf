var serv=angular.module('servMod',[]);

/**
 * Servicio de almacenamiento local
 */
serv.factory('Storage', function() {
    var Res={};

    // Conjunto de tests
    Res.data = [];

    /**
     * Extraer todos los test del local storage
     * @param cb Callback
     */
    Res.query = function(cb){
       console.log("query")
       var data = {};
       cb(data);
    }


    /**
     * Crear un nuevo test y guardarlo en el local storage
     * @param newData Nuevo test a guardar
     * @param cb Callback
     */
    Res.create = function(cb){
        console.log("Creando un nuevo test ...")

        /* Crear un tablero relleno con ceros */
        var dim = 10;
        var m = Array.matrix(dim,dim,0);

        /* Obtener fecha */
        var date = new Date();
        var day=date.getDate();
        var year=date.getFullYear();
        var month=date.getMonth();
        var realMonth=month+1;

        var test={
            _id: new Date().getTime(), // ID unívoco
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

        // Almacenar el test
        localStorage.setItem("datosGolf", JSON.stringify(test));
        cb(test);
    }
    return Res;


    /**
     * Actualizar un test en el local storage
     * @param newData Test a actualizar
     * @param cb Callback
     */
    Res.update = function(newData, cb){
        console.log("update")
        var data = {};
        cd(data);
    }


    /**
     * Borrar un test del local storage.
     * Pone marcas para la correcta sincronización con el servidor posteriormente.
     * @param newData Test a borrar
     * @param cb Callback
     */
    Res.remove = function(newData, cb){
        console.log("update")
        var data = {};
        cd(data);
    }
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

