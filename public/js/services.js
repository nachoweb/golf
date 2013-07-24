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
        var dim = 9;
        var m = creaMatriz(dim,dim,0);

        /* Obtener fecha */
        var date = new Date();

        var test={
            _id: date.getTime(), // ID unívoco
            name : 'Nuevo test '+indiceNuevoTest,
            data : m,
            fecha : new Date(),
            estado : 'no terminado',
            palo: "M1",
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
           var centro = Math.floor(data.length/2);
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
           var centro = Math.floor(data.length/2);
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
           var centro=Math.floor(data.length/ 2),
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
           var centro=Math.floor(test.data.length/ 2),
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
               localStats.rightBallsPercent = ((test.statistics.rightBalls/total)*100).toFixed();
               localStats.leftBallsPercent = ((test.statistics.leftBalls/total)*100).toFixed();
               localStats.longBallsPercent = ((test.statistics.longBalls/total)*100).toFixed();
               localStats.shortBallsPercent = ((test.statistics.shortBalls/total)*100).toFixed();
               localStats.less2Percent = ((test.statistics.less2/total)*100).toFixed();
               localStats.more2Percent = ((test.statistics.more2/total)*100).toFixed();
           }

           return localStats;
       },
       checkBorder: function(data, fila, columna){
           var valor = 0;
           var centro=Math.floor(data.length/ 2),
               difFilas = fila - centro,
               difColumnas = columna - centro;

           if (difFilas==-2 && difColumnas==-2) {
               valor = 1;
           }else if (difFilas==-2 && difColumnas>-2 && difColumnas<2){
               valor = 2;
           }else if (difFilas==-2 && difColumnas==2) {
               valor = 3;
           }else if (difColumnas==2 && difFilas>-2 && difFilas<2){
               valor = 4;
           }else if (difFilas==2 && difColumnas==2) {
               valor = 5;
           }else if (difFilas==2 && difColumnas>-2 && difColumnas<2){
               valor = 6;
           }else if (difFilas==2 && difColumnas==-2) {
               valor = 7;
           }else if (difColumnas==-2 && difFilas>-2 && difFilas<2){
               valor = 8;
           }

           return valor;
       },
       computeGlobalStatistics: function(tests){

           var stats={
               totales:{
                   total:0,
                   goals:0,
                   rightBalls:0,
                   leftBalls:0,
                   longBalls:0,
                   shortBalls:0,
                   less2:0,
                   more2:0,
                   rightBallsPercent:0,
                   leftBallsPercent:0,
                   longBallsPercent:0,
                   shortBallsPercent:0,
                   more2Percent:0,
                   less2Percent:0
               },
               hayParciales:0,
               parciales:{}}
           angular.forEach(tests, function (value, key) {
               stats.totales={
                   total: (stats.totales["total"] | 0)+value["statistics"]["total"],
                   goals: (stats.totales["goals"] | 0)+value["statistics"]["goals"],
                   rightBalls: (stats.totales["rightBalls"] | 0) + value["statistics"]["rightBalls"],
                   leftBalls: (stats.totales["leftBalls"] | 0)+value["statistics"]["leftBalls"],
                   longBalls: (stats.totales["longBalls"] | 0)+value["statistics"]["longBalls"],
                   shortBalls: (stats.totales["shortBalls"] | 0)+value["statistics"]["shortBalls"],
                   less2: (stats.totales["less2"] | 0)+value["statistics"]["less2"],
                   more2: (stats.totales["more2"] | 0)+value["statistics"]["more2"]
               };
               stats.parciales[value.palo]= stats.parciales[value.palo] || {};
               stats.parciales[value.palo]={
                   palo: value.palo["nombre"],
                   total: (stats.parciales[value.palo]["total"] | 0)+value["statistics"]["total"],
                   goals: (stats.parciales[value.palo]["goals"] | 0)+value["statistics"]["goals"],
                   rightBalls: (stats.parciales[value.palo]["rightBalls"] | 0)+value["statistics"]["rightBalls"],
                   leftBalls: (stats.parciales[value.palo]["leftBalls"] | 0)+value["statistics"]["leftBalls"],
                   longBalls: (stats.parciales[value.palo]["longBalls"] | 0)+value["statistics"]["longBalls"],
                   shortBalls: (stats.parciales[value.palo]["shortBalls"] | 0)+value["statistics"]["shortBalls"],
                   less2: (stats.parciales[value.palo]["less2"] | 0)+value["statistics"]["less2"],
                   more2: (stats.parciales[value.palo]["more2"] | 0)+value["statistics"]["more2"]
               };
           });

           stats.totales["rightBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["rightBalls"]*100/stats.totales["total"]).toFixed();
           stats.totales["leftBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["leftBalls"]*100/stats.totales["total"]).toFixed();
           stats.totales["longBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["longBalls"]*100/stats.totales["total"]).toFixed();
           stats.totales["shortBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["shortBalls"]*100/stats.totales["total"]).toFixed();
           stats.totales["more2Percent"]=(stats.totales["total"]==0 ? 0 : stats.totales["more2"]*100/stats.totales["total"]).toFixed();
           stats.totales["less2Percent"]=(stats.totales["total"]==0 ? 0 : stats.totales["less2"]*100/stats.totales["total"]).toFixed();

           angular.forEach(stats.parciales, function (value, key) {
               stats.parciales[key]["rightBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["rightBalls"]*100/stats.parciales[key]["total"]).toFixed();;
               stats.parciales[key]["leftBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["leftBalls"]*100/stats.parciales[key]["total"]).toFixed();;
               stats.parciales[key]["longBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["longBalls"]*100/stats.parciales[key]["total"]).toFixed();;
               stats.parciales[key]["shortBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["shortBalls"]*100/stats.parciales[key]["total"]).toFixed();;
               stats.parciales[key]["more2Percent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["more2"]*100/stats.parciales[key]["total"]).toFixed();;
               stats.parciales[key]["less2Percent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["less2"]*100/stats.parciales[key]["total"]).toFixed();;
           });

           if (!angular.equals(stats.parciales,{})){
               stats.hayParciales = 1;
           }
           return stats;
       },
       resetIdActivo: function(){
           servicio.idActivo = 0;
       }
   };

    return servicio;
});