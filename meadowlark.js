const express = require('express');
var app = express();
var fortune = require('./lib/fortune.js');

//Setup the handlebars view engine
const handlebars = require('express3-handlebars').create({
	defaultLayout: 'main',
	helpers: {
		section: function(name, options){ //This function defines a "section" helper function that will create a section of any code within a #section block.
			if (!this._sections) this._sections = {};
			this._sections[name] = options.fn(this);
			return null;
		}
	}

});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));

//QA Tests
app.use( (req,res,next) => {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});

//Weather App
function getWeatherData(){
	return {
		locations: [
			{
				name: 'Portland',
				forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
				iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
				weather: 'Overcast',
				temp: '54.1 F (12.3C)'
			},
			{
				name: 'Bend',
				forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
				iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
				weather: 'Partly Cloudy',
				temp: '55.0 F (12.8C)'
			},
			{
				name: 'Manzanita',
				forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
				iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
				weather: 'Light Rain',
				temp: '55.0 F (12.8C)'
			}
		]
	}
}

app.use((req,res, next) => {
	if (!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weather = getWeatherData();
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

app.get('/jquery-test', (req,res) => res.render('jquery-test', {}) );

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