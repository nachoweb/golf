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
            palo: 'M3',
            entrenamiento: 'L',
            statistics:{
                total:0,
                goals : 0,
                rightBalls: 0,
                leftBalls:0,
                longBalls:0,
                shortBalls:0,
                less2:0,
                more2:0
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
       },
       // Update test Scores
       updateScore: function(test, fila, columna){
           var centro=test.data.length/ 2,
               difFilas = fila - centro,
               difColumnas = columna - centro;

           test.statistics.total++;

           // If goal
           if (difFilas==0 && difColumnas==0){
               test.statistics.goals++;
           }
           // If ball at the right part
           else if (difColumnas > 0){
               test.statistics.rightBalls++;
           // If ball at the left part
           }else if(difColumnas < 0){
               test.statistics.leftBalls++;
           }

           // Short ball
           if (difFilas > 0){
              test.statistics.shortBalls++;
           // Long ball
           }else if(difFilas < 0){
               test.statistics.longBalls++;
           }

           // Is more 2 units
           var absDifFilas = Math.abs(difFilas);
           var absDifColumnas = Math.abs(difColumnas);
           if (absDifFilas > 2 || absDifColumnas>2){
               test.statistics.more2++;
           }else if(absDifFilas <= 2 && absDifColumnas <=2){
               test.statistics.less2++;
           }
       },
       getUpdatedStatistics: function(test){
           var localStats = {
               total:0,
               goals:0,
               rightBallsPercent: 0,
               leftBallsPercent: 0,
               longBallsPercent: 0,
               shortBallsPercent: 0,
               less2Percent: 0,
               more2Percent: 0}

           // Calculate the total balls
           var total = 0;
           for(var i=0; i<test.data.length; i++){
               for( var j=0; j<test.data.length; j++){
                    total = total + test.data[i][j];
               }
           }

           if(total > 0){
               // Calculate the statistics
               localStats.total = total;
               localStats.goals = test.statistics.goals;
               localStats.rightBallsPercent = ((test.statistics.rightBalls/total)*100).toFixed(2);
               localStats.leftBallsPercent = ((test.statistics.leftBalls/total)*100).toFixed(2);
               localStats.longBallsPercent = ((test.statistics.longBalls/total)*100).toFixed(2);
               localStats.shortBallsPercent = ((test.statistics.shortBalls/total)*100).toFixed(2);
               localStats.less2Percent = ((test.statistics.less2/total)*100).toFixed(2);
               localStats.more2Percent = ((test.statistics.more2/total)*100).toFixed(2);
           }

           return localStats;
       }
   };

    return servicio;
});