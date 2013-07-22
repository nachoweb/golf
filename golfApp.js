// Conectar a la base de datos
var mongoClient = require('mongodb').MongoClient,
    express = require('express'),
    _=require('underscore'),
    app = express();


function conectaDB(cb) {
    mongoClient.connect('mongodb://127.0.0.1:27017/golfTraining', function(err, db) {
       if(err){throw err;}
       cb(db);
    });
}


app.set("error_msg", "");
app.configure(function(){

    app.set('port',2700);
    app.set('views', __dirname + '/views');
    app.set('view engine','jade');
    // MIDDLEWARE
    app.use(express.static(__dirname+'/public'));
    app.use(express.bodyParser());
    app.use(express.cookieParser("3216545sec6eg65ds654"));
    app.use(express.cookieSession({secret:"sd2c1as65rg54rg6s5fd"}));

})



app.checkAuth = function(req, res,next){
   if(!req.session.username){
       res.send(500, { error: 'Sesión no iniciada' });
   }
    else{
       next();
   }
}

app.get('/', function(req, res){
    if(!req.session.username){
        res.redirect('/login');
    }
    else{
        res.render('index', {username:req.session.username});
    }
})


app.get('/login', function(req, res){
    res.render('login',{error_msg:app.get('error_msg')})
})


app.post('/login', function (req, res) {
    conectaDB(function (db) {
        db.collection('usuarios').findOne({user: req.body.username,password:req.body.password},function(err,result) {
            db.close()
            if(err){throw err;}
            if (result){
                req.session.username = req.body.username;
                console.log("Sesion creada. username: " + req.session.username);
                app.set("error_msg", "");
                res.redirect('/');
            } else {
                app.set("error_msg", "Usuario o contraseña no válido");
                res.redirect('/login');
            }
        });
    });
});

// Cerrar sesión
app.get('/logout', function(req, res){
    req.session = null;
    app.set('error_msg', "");
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
    'img/home.png\n'+
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



console.log("Servidor iniciado en puerto "+app.get("port"))
app.listen(app.get("port"));