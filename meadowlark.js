const express = require('express');
var app = express();

//Setup the handlebars view engine
const handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.get('/', (req,res) => res.render('home') );

app.get('/about', (req,res) => res.render('about') );

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