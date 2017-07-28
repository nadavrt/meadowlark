const express = require('express');
var app = express();
var fortune = require('./lib/fortune.js');
//Setup the handlebars view engine
const handlebars = require('express3-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));
app.use( (req,res,next) => {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

app.get('/headers', (req,res) => {
	res.set('Content-Type', 'text/plain');
	var s = '';
	for (var name in req.headers) s+= name + ': ' + req.headers[name] + '\n';
	res.send(s);
});
app.get('/', (req,res) => res.render('home') );
app.get('/about', (req,res) => {
	res.render('about', { 
		fortune: fortune.getFortune(), 
		pageTestScript: '/qa/tests-about.js' 
	}); 
});
app.get('/tours/:page', (req,res) => {
	res.render('tours/' + req.params.page, { }); 
});
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