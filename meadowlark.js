const express = require('express');
var app = express();
var fortune = require('./lib/fortune.js');
//Setup the handlebars view engine
const handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
let fortunes = 
app.get('/', (req,res) => res.render('home') );

app.get('/about', (req,res) => { res.render('about', { fortune: fortune.getFortune() }); } );

//Custom 404 function	
app.use(function(req,res){
	res.status('404').render('404');
});

//Custom 505 function	
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status('505').render('505');
});

app.listen(app.get('port'), function(){
	console.log('Express started on port' + app.get('port'));
});