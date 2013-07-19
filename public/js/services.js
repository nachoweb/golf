var serv=angular.module('servMod',[]);

function creaMatriz(m,n,initial){
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

function getIndexById(datos,id){
    var index=-1;
    angular.forEach(datos, function (v, k) {
        if(v._id==id){ index = k; }
    });
    return index;
}

/**
 * Servicio de almacenamiento local
 */
serv.factory('storage', function() {
    var storage={};

    function getData() { return JSON.parse(localStorage.getItem("datosGolf")); }
    function setData(data) {return localStorage.setItem('datosGolf',JSON.stringify(data)); }

    storage.data = []; //Conjunto de tests

    /**
     * Extraer todos los test del local storage
     * @param cb Callback
     */
    storage.query = function(cb){
        storage.data=getData();
        if(!storage.data){
            storage.data=[];
            setData([]);
        }
       cb(storage.data);
    }


    /**
     * Crear un nuevo test y guardarlo en el local storage
     * @param newData Nuevo test a guardar
     * @param cb Callback
     */
    var indiceNuevoTest=0;
    storage.createTest = function(cb){
        indiceNuevoTest++;
        /* Crear un tablero relleno con ceros */
        var dim = 10;
        var m = creaMatriz(dim,dim,0);

        /* Obtener fecha */
        var date = new Date();
        var day=date.getDate();
        var year=date.getFullYear();
        var month=date.getMonth();
        var realMonth=month+1;

        var test={
            _id: date.getTime(), // ID unívoco
            name : 'Nuevo test '+indiceNuevoTest,
            data : m,
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

        storage.data.unshift(test);
        var arr=getData();
        arr.unshift(test);
        setData(arr);
        cb({err:false,datos:test});
    }


    /**
     * Actualizar un test en el local storage
     * @param newData Test a actualizar
     * @param cb Callback
     */
    storage.update = function(newData, cb){
        var arrLocalStorage=getData();
        var index=getIndexById(arrLocalStorage,newData._id);
        if(index!=-1){
            arrLocalStorage[index]=newData;
            setData(arrLocalStorage);
            cb({err:false,index:index});
        }else{
            console.log("No se se encuentra el test en localStorage para actualizar")
            cb({err:true})
        }
    }


    /**
     * Borrar un test del local storage.
     * Pone marcas para la correcta sincronización con el servidor posteriormente.
     * @param newData Test a borrar
     * @param cb Callback
     */
    storage.remove = function(testToRemove, cb){
        console.log("update")
        var arrayTest=getData();
        var index=getIndexById(arrayTest,testToRemove._id);
        if(index!=-1){
           arrayTest.splice(index,1);
           storage.data.splice(index,1);
           setData(arrayTest);
           cb({err:false,index:index});
        }else{
            console.log("No se encuentra el test para borrar");
            cb({err:true});
        }
    }

    return storage;
});


serv.factory('estadisticasGlobales',function () {
       var servicioEstadGlob={

           calculaEstadisticasGlobales: function (datos) {
                var obj={
                    mediaGoals: 5,
                    goalUltimo: 15
                }
              return obj;
           }
       };

        return servicioEstadGlob;
})


serv.factory('calculosBoard',function () {
   var servicio={
       idActivo:0,
       isCenter:function (data,fil,col) {
           var centro=Math.floor(data.length/2);
           return fil==centro && col==centro;
       },
       findTestById: function (datos,id) {
           var index = -1;
           angular.forEach(datos ,function(v,k){
               if(id ==v._id){
                   index = k;
               }
           });
           return index;
       },
       isMor5:function (data,fila,columna) {
           var centro = data.length/2;
           var diff_x = Math.abs(fila-centro);
           var diff_y = Math.abs(columna-centro);

           if((diff_x>5) || (diff_y>5)){
               return true;
           }
           else{
               return false;
           }
       },
       isBetw15:function (data,fila,columna) {
           var centro = data.length/2;
           var diff_x = Math.abs(fila-centro);
           var diff_y = Math.abs(columna-centro);

           var max = Math.max(diff_x,diff_y);
           if(max>=1 && max<=5){
               return true;
           }
           else{
               return false;
           }
       },
       aDistancia5:function (data,fila,columna) {
           var centro=data.length/ 2,
               dif_filas = Math.abs(fila - centro),
               dif_columnas = Math.abs(columna - centro);

           if((dif_filas == 5 && dif_columnas <= 5) || (dif_filas <= 5 && dif_columnas == 5) ||
               (dif_filas == 9 && dif_columnas <= 9) || (dif_filas <= 9 && dif_columnas == 9)){
               return true;
           }

           else{
               return false;
           }
       }
   };

    return servicio;
});