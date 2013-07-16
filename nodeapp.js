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

app.set('views', __dirname + '/views');
app.set('view engine','jade');

// MIDDLEWARE
app.use(express.static(__dirname+'/public'));
app.use(express.bodyParser());
// pass a secret to cookieParser() for signed cookies
app.use(express.cookieParser('manny is cool'));
// add req.session cookie support
app.use(express.cookieSession());

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

app.error_msg = "";

app.checkAuth = function(req, res,next){
   if(!req.session.user_id){
       res.send(500, { error: 'Sesión no iniciada' });
   }
    else{
       next();
   }
}


// API Servidor RESTful
app.get('/rest', app.checkAuth, function(req,res){
    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);
    console.log("Sesion activa (usuario:%s)", req.session.user_id);

    var usuario=req.user;

    var query = app.Test.find();
    query.sort({fecha:'desc'});
    query.exec(function(err, tests){
        if(err){
            console.log("find error");
        }
        res.json(tests);
    });
});


app.post('/rest', app.checkAuth, function(req, res){
    var usuario=req.user;
    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);

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


app.delete('/rest', app.checkAuth, function(req, res){

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


app.put('/rest', app.checkAuth, function(req, res){
    var usuario=req.user;
    console.log('Petición %s del usuario %s, url: %s', req.method, usuario,  req.url);

    // Actualizar mongobd
    var test1 = new app.Test(req.body);
    console.log("Test recibido del cliente: " + test1.name);
    console.log(test1);

    app.actualizar(test1);
});


// Ruta principal
app.get('/', function(req, res){
    if(!req.session.user_id){
        res.redirect('/login');
    }
    else{
        res.render('index', {username:req.session.user_id});
    }
})


// Petición GET a /login para enviar la página de login
app.get('/login', function(req, res){
    res.render('login',{error_msg:app.error_msg})
})


// Petición POST a /login para autenticación
app.post('/login', function (req, res) {
    console.log("Entrando en login")
    console.log("Datos recibidos:")
    console.log(req.body)
    var post = req.body;

    if (post.username == 'user' && post.password == 'password'){
        req.session.user_id = post.username;
        req.session.username = post.username;
        console.log("Sesion creada. username: " + req.session.username);
        app.error_msg = "";
        res.redirect('/');
    } else {
        app.error_msg = "Usuario o contraseña no válido"
        res.redirect('/login');
    }
});

// Cerrar sesión
app.get('/logout', function(req, res){
    console.log("Sesión %s cerrada", req.session.username);
    req.session = null;
    app.error_msg = "";
    res.redirect('/login');
})

app.get('/cache.manifest', function(req, res){
    console.log('Petición %s , url: %s', req.method,  req.url);
    res.header("Content-Type", "text/cache-manifest");
//    res.end("CACHE MANIFEST");

    var manifest = 'CACHE MANIFEST\n'+
        '# rev 1\n' +
    'css/app.css\n' +
    'css/bootstrap.css\n'+
    'img/flag21x21.png\n'+
    'js/controllers.js\n' +
    'js/routes.js\n'   +
    'js/services.js\n' +
    'lib/angular/angular.js\n'  +
    'lib/angular/angular-resource.min.js\n' +
    'partials/board.html\n'+
    'partials/tests.html\n' +
    'partials/welcome.html\n' +
    'img/glyphicons-halflings.png\n' +
     'img/glyphicons-halflings-white.png\n';
    res.end(manifest);
});


/**
 * Actualizar un test
 * @param nuevo Nuevo test.
 * nuevo debe existir en mongodb, se utiliza su id para actualizar.
 */
app.actualizar = function(nuevo){

    console.log("Test a guardar: ");
    console.log(nuevo)
    // Actualizar el test
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
    nuevo.update({'statistics.goals':nuevo.statistics.goals}, {},
        function(){
            console.log("Actualizado goals")
        });

    nuevo.update({'statistics.between1and5metters':nuevo.statistics.between1and5metters}, {},
        function(){
            console.log("Actualizado between1and5metters")
        });

    nuevo.update({'statistics.more5metters':nuevo.statistics.more5metters}, {},
        function(){
            console.log("Actualizado more5metters")
        });

    nuevo.update({data:nuevo.data}, {},
        function(){
            console.log("Actualizado data")
        });





    /*app.Test.findByIdAndUpdate(nuevo._id, nuevo, function(){
        console.log("Test completo actualizado")
    });*/

    /*app.Test.update({ _id: nuevo._id }, {'statistics':nuevo.statistics}, function (err, numberAffected, raw) {
        if (err){
            console.log("error")
        }
        console.log('The number of updated documents was %d', numberAffected);
        console.log('The raw response from Mongo was ', raw);
    });*/
}

console.log("Servidor iniciado en puerto 2700")
app.listen(2700);