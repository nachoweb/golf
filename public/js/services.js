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
        var dim = 11;
        var m = creaMatriz(dim,dim,0);

        /* Obtener fecha */
        var date = new Date();

        var test={
            _id: date.getTime(), // ID unívoco
            name : 'Nuevo test '+indiceNuevoTest,
            data : m,
            fecha : new Date(),
            estado : 'no terminado',
            palo: null,
            metros:null,
            metrosUnidad:0.5,
            statistics:null
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
        findTestById: function (datos,id) {
            var index = -1;
            angular.forEach(datos ,function(v,k){
                if(id ==v._id){
                    index = k;
                }
            });
            return index;
        },
        resetIdActivo: function(){
            servicio.idActivo = 0;
        }
    };

   function calculaEstadisticasTest(cuadroDatos,metrosUnidad) {
       var len=cuadroDatos.length,centro=Math.floor(len/ 2),mt=metrosUnidad;
       var stats={
           total:0,
           leftBalls:0,rightBalls:0,mtLeftBalls:0,mtRightBalls:0,
           shortBalls:0,longBalls:0,mtShortBalls:0,mtLongBalls:0,
           mtError:0,
           goals:0,
           fuera:0
       }
       for(var fil=0;fil < len;fil++){
           for(var col=0;col < len; col++){
              var valor=cuadroDatos[fil][col],
                  difFilas = fil - centro,
                  difColumnas = col - centro,mtVert= 0,mtHoriz=0;


              // Si fuera
              if(Math.abs(difFilas)==centro || Math.abs(difColumnas)==centro ){
                   stats.fuera+=valor;
              }else{
                   stats.total+=valor;

                    //Si goal
                   if (difFilas==0 && difColumnas==0){
                        stats.goals+=valor;
                   }else{
                       mtHoriz = valor * metrosUnidad * Math.abs(difColumnas);
                       mtVert = valor * metrosUnidad * Math.abs(difFilas);
                       stats.mtError+=Math.sqrt(mtHoriz*mtHoriz + mtVert*mtVert);
                       if(difColumnas!=0){
                           if(difColumnas > 0){
                               stats.rightBalls+=valor;stats.mtRightBalls+=valor*metrosUnidad*Math.abs(difColumnas);
                           }else{
                               stats.leftBalls+=valor ;stats.mtLeftBalls+=valor*metrosUnidad*Math.abs(difColumnas);
                           }
                       }
                       if(difFilas!=0){
                           if(difFilas > 0){
                               stats.shortBalls+=valor;stats.mtShortBalls+=valor*metrosUnidad*Math.abs(difFilas);
                           }else{
                               stats.longBalls+=valor ;stats.mtLongBalls+=valor*metrosUnidad*Math.abs(difFilas);
                           }
                       }
                   }
              }

           } //end for columnas
       } //end for filas


       return stats;


   }



   servicio.getUpdatedStatistics= function(test){
       test.statistics=calculaEstadisticasTest(test.data,test.metrosUnidad);
       var localStats = { };

        // Calcula porcentaje
        var total=test.statistics.total
        angular.extend(localStats,test.statistics);
        localStats.rightBallsPercent =total==0 ? 0 : ((localStats.rightBalls/total)*100).toFixed();
        localStats.leftBallsPercent =total==0 ? 0 : ((localStats.leftBalls/total)*100).toFixed();
        localStats.longBallsPercent =total==0 ? 0 : ((localStats.longBalls/total)*100).toFixed();
        localStats.shortBallsPercent =total==0 ? 0 : ((localStats.shortBalls/total)*100).toFixed();
        localStats.fueraPercent = total==0 ? 0 : ((localStats.fuera/(total+localStats.fuera))*100).toFixed();

       localStats.avgMtRightBalls =localStats.rightBalls==0 ? 0 : localStats.mtRightBalls/localStats.rightBalls;
       localStats.avgMtLeftBalls =localStats.leftBalls==0 ? 0 : localStats.mtLeftBalls/localStats.leftBalls;
       localStats.avgMtLongBalls =localStats.longBalls==0 ? 0 : localStats.mtLongBalls/localStats.longBalls;
       localStats.avgMtShortBalls =localStats.shortBalls==0 ? 0 : localStats.mtShortBalls/localStats.shortBalls;

       localStats.avgError= total==0 ? 0 : localStats.mtError/total;
       if(test.metros==null || total==0 ){
           localStats.avgDistancia=0;
       }else{
           localStats.avgDistancia=parseInt(test.metros) + (localStats.mtLongBalls-localStats.mtShortBalls)/total;
       }



        return localStats;
    };



   servicio.computeGlobalStatistics=function(tests){

       var stats={
           totales:{
               total:0,
               leftBalls:0,rightBalls:0,mtLeftBalls:0,mtRightBalls:0,
               shortBalls:0,longBalls:0,mtShortBalls:0,mtLongBalls:0,
               mtError:0,
               goals:0,
               fuera:0
           },
           hayParciales:0,
           parciales:{}
           };

       angular.forEach(tests, function (value, key) {
           var statTest=value["statistics"];
           stats.totales={
               total: (stats.totales["total"] | 0)+statTest["total"],
               fuera: (stats.totales["fuera"] | 0)+statTest["fuera"],
               goals: (stats.totales["goals"] | 0)+statTest["goals"],
               mtError: (stats.totales["mtError"] | 0)+statTest["mtError"],
               rightBalls: (stats.totales["rightBalls"] | 0) + statTest["rightBalls"],
               leftBalls: (stats.totales["leftBalls"] | 0)+statTest["leftBalls"],
               longBalls: (stats.totales["longBalls"] | 0)+statTest["longBalls"],
               shortBalls: (stats.totales["shortBalls"] | 0)+statTest["shortBalls"],
               mtRightBalls: (stats.totales["mtRightBalls"] | 0)+statTest["mtRightBalls"],
               mtLeftBalls: (stats.totales["mtLeftBalls"] | 0)+statTest["mtLeftBalls"],
               mtShortBalls: (stats.totales["mtShortBalls"] | 0)+statTest["mtShortBalls"],
               mtLongBalls: (stats.totales["mtLongBalls"] | 0)+statTest["mtLongBalls"]
           };
           stats.parciales[value.palo]= stats.parciales[value.palo] || {};
           stats.parciales[value.palo]={
               total: (stats.parciales[value.palo]["total"] | 0)+statTest["total"],
               fuera: (stats.parciales[value.palo]["fuera"] | 0)+statTest["fuera"],
               goals: (stats.parciales[value.palo]["goals"] | 0)+statTest["goals"],
               mtError: (stats.parciales[value.palo]["mtError"] | 0)+statTest["mtError"],
               rightBalls: (stats.parciales[value.palo]["rightBalls"] | 0) + statTest["rightBalls"],
               leftBalls: (stats.parciales[value.palo]["leftBalls"] | 0)+statTest["leftBalls"],
               longBalls: (stats.parciales[value.palo]["longBalls"] | 0)+statTest["longBalls"],
               shortBalls: (stats.parciales[value.palo]["shortBalls"] | 0)+statTest["shortBalls"],
               mtRightBalls: (stats.parciales[value.palo]["mtRightBalls"] | 0)+statTest["mtRightBalls"],
               mtLeftBalls: (stats.parciales[value.palo]["mtLeftBalls"] | 0)+statTest["mtLeftBalls"],
               mtShortBalls: (stats.parciales[value.palo]["mtShortBalls"] | 0)+statTest["mtShortBalls"],
               mtLongBalls: (stats.parciales[value.palo]["mtLongBalls"] | 0)+statTest["mtLongBalls"],
               metrosBanderaSuma: (stats.parciales[value.palo]["metrosBanderaSuma"] | 0)+parseInt(value.metros),
               numTestConEstePalo: (stats.parciales[value.palo]["numTestConEstePalo"] | 0)+1
           };
       });

       stats.totales["rightBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["rightBalls"]*100/stats.totales["total"]).toFixed();
       stats.totales["leftBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["leftBalls"]*100/stats.totales["total"]).toFixed();
       stats.totales["longBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["longBalls"]*100/stats.totales["total"]).toFixed();
       stats.totales["shortBallsPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["shortBalls"]*100/stats.totales["total"]).toFixed();
       stats.totales["fueraPercent"]=(stats.totales["total"]==0 ? 0 : stats.totales["fuera"]*100/(stats.totales["total"]+stats.totales["fuera"])).toFixed();

       stats.totales.avgMtRightBalls =stats.totales.rightBalls==0 ? 0 : stats.totales.mtRightBalls/stats.totales.rightBalls;
       stats.totales.avgMtLeftBalls =stats.totales.leftBalls==0 ? 0 : stats.totales.mtLeftBalls/stats.totales.leftBalls;
       stats.totales.avgMtLongBalls =stats.totales.longBalls==0 ? 0 : stats.totales.mtLongBalls/stats.totales.longBalls;
       stats.totales.avgMtShortBalls =stats.totales.shortBalls==0 ? 0 : stats.totales.mtShortBalls/stats.totales.shortBalls;

       stats.totales["avgError"] = stats.totales["total"] == 0 ? 0 : stats.totales["mtError"] / stats.totales["total"]

       angular.forEach(stats.parciales, function (value, key) {
           stats.parciales[key]["rightBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["rightBalls"]*100/stats.parciales[key]["total"]).toFixed();
           stats.parciales[key]["leftBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["leftBalls"]*100/stats.parciales[key]["total"]).toFixed();
           stats.parciales[key]["longBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["longBalls"]*100/stats.parciales[key]["total"]).toFixed();
           stats.parciales[key]["shortBallsPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["shortBalls"]*100/stats.parciales[key]["total"]).toFixed();
           stats.parciales[key]["fueraPercent"]=(stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["fuera"]*100/(stats.parciales[key]["total"]+stats.parciales[key]["fuera"])).toFixed();

           stats.parciales[key].avgMtRightBalls =stats.parciales[key].rightBalls==0 ? 0 : stats.parciales[key].mtRightBalls/stats.parciales[key].rightBalls;
           stats.parciales[key].avgMtLeftBalls =stats.parciales[key].leftBalls==0 ? 0 : stats.parciales[key].mtLeftBalls/stats.parciales[key].leftBalls;
           stats.parciales[key].avgMtLongBalls =stats.parciales[key].longBalls==0 ? 0 : stats.parciales[key].mtLongBalls/stats.parciales[key].longBalls;
           stats.parciales[key].avgMtShortBalls =stats.parciales[key].shortBalls==0 ? 0 : stats.parciales[key].mtShortBalls/stats.parciales[key].shortBalls;

           stats.parciales[key]["avgError"]= stats.parciales[key]["total"]==0 ? 0 : stats.parciales[key]["mtError"] / stats.parciales[key]["total"];

           //PAra calcular distancia hay que calcular metros medios
           var metrosMedia= stats.parciales[key]["numTestConEstePalo"]==0 ? 0 : stats.parciales[key]["metrosBanderaSuma"] / stats.parciales[key]["numTestConEstePalo"];
           if(metrosMedia==0 || stats.parciales[key]["total"]==0 ){
               stats.parciales[key].avgDistancia=0;
           }else{
               stats.parciales[key].avgDistancia=parseInt(metrosMedia) + (stats.parciales[key].mtLongBalls-stats.parciales[key].mtShortBalls)/stats.parciales[key]["total"];
           }
       });

       if (!angular.equals(stats.parciales,{})){
           stats.hayParciales = 1;
       }
       return stats;
   }



    servicio.cellFunc={

        isCenter:function (data,fil,col) {
            var centro=Math.floor(data.length/2);
            return fil==centro && col==centro ?  true :  false;
        },
        isOut:function (data,fil,col) {
            var lim=data.length -1;
           return  fil == 0 || fil == lim || col == 0 || col == lim;
        },
        isZero:function (data,r, c) {
            if (data[r][c] == 0) {
                return true;
            }
            else {
                return false;
            }
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
        }
    }

    return servicio;
});