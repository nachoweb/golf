// Conectar a la base de datos
var mongoose = require('mongoose'),
    db_name = 'test',
    express = require('express');
    app = express();

mongoose.connect('mongodb://localhost:27017/' + db_name);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("Conexión correcta a la BD " + db_name)
});

app.use(express.static(__dirname+'/'));
app.use(express.bodyParser());

// Esquema para los tests
app.testSchema = mongoose.Schema({
    data : [],
    name : String,
    date : String,
    fecha : Date,
    estado : String,
    statistics:{
        goals : Number,
        between1and5metters: Number,
        less1metter : Number,
        more5metters : Number
    }
});

// Modelo
app.Test = mongoose.model('Test', app.testSchema);

// Basic Autenticación
/*app.use(express.basicAuth(function(user, pass) {
    return user === 'javi' && pass === 'javi';
}));*/


// Petición GET
app.get('/rest',function(req,res){

    var usuario=req.user;

    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);

    app.Test.find(function(err, tests){
        if(err){
            console.log("find error");
        }
        res.json(tests);
    });

//    res.json(app.locals[0]);
});


// Petición POST
app.post('/rest', function(req, res){
    var usuario=req.user;
    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);

//    res.json(req.data);
    res.send(req.body);

    // Almacenar datos en la BD
    var test1 = new app.Test(req.body);
    console.log("Test recibido del cliente: " + test1.name);
    console.log(test1);
    test1.save(function(err, test1){
        if(err){
            console.log("Error al guardar el test")
        }
        console.log("Test guardado en mongodb: " + test1.name);
    });
});


// Petición DELETE
app.delete('/rest', function(req, res){

    var usuario=req.user;
    var id = req.param('id');

    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);
    console.log("Test a borrar: " + id);

    app.Test.remove({ _id: id }, function(err){
        if(err){
            console.log("El test " + id + " no se pudo borrar por: " + err);
        }else{
            console.log("Test " + id + ' borrado')
        }
    });
});

// Petición UPDATE
app.put('/rest', function(req, res){
    var usuario=req.user;
    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);

    // Actualizar mongobd
    var test1 = new app.Test(req.body);
    console.log("Test recibido del cliente: " + test1.name);
    console.log(test1);

    app.actualizar(test1);
});


/**
 * Actualizar un test
 * @param nuevo Nuevo test.
 * nuevo debe existir en mongodb, se utiliza su id para actualizar.
 */
app.actualizar = function(nuevo){
    /* Actualizar el test */
    nuevo.update({name: nuevo.name}, {},
        function(){
            console.log("Actualizado nombre")
        });
    nuevo.update({date:nuevo.date}, {},
        function(){
            console.log("Actualizado date")
        });
    nuevo.update({estado:nuevo.estado}, {},
        function(){
            console.log("Actualizado estado")
        });
    nuevo.update({fecha:nuevo.fecha}, {},
        function(){
            console.log("Actualizado fecha")
        });
    nuevo.update({statistics:nuevo.statistics}, {},
        function(){
            console.log("Actualizado estadisticas")
        });
    nuevo.update({data:nuevo.data}, {},
        function(){
            console.log("Actualizado data")
        });
}

console.log("Servidor iniciado en puerto 2700")
app.listen(2700);