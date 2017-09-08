//Modules
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sendmail = require('sendmail')();
const fortune = require('./lib/fortune.js');
const credentials = require('./credentials.js');

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

//Middelware
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());

//QA Tests
app.use( (req,res,next) => {
	res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
	next();
});


//Send an email (direct email)
// sendmail({
//     from: 'info@meadowlark.com',
//     to: 'nadavr@spotoption.com',
//     subject: 'Test sendmail',
//     html: '<p>Another Test</p><p><b>Now</b> with <u>HTML tags</u>.</p>',
//   }, function(err, reply) {
//     if (err) console.log('An eror has occured: ' + err);
// });

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
	};
}

app.use((req,res, next) => {
	if (!res.locals.partials) res.locals.partials = {};
	res.locals.partials.weather = getWeatherData();
	next();
});

app.use((req,res, next) => {
	//if there's a flash message transfer it to the context and delete it.
	res.locals.flash = req.session.flash;
	delete req.session.flash;
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
	if ( !req.signedCookies.monster )
	{
		res.cookie('monster', 'nom nom', {
			maxAge: 1000*60*60*24*30, //One month 
			signed: true
		});
	}

	res.render('about', { 
		fortune: fortune.getFortune(), 
		pageTestScript: '/qa/tests-about.js' 
	}); 
});
app.get('/tours/:page', (req,res) => {
	res.render('tours/' + req.params.page, { }); 
});

app.get('/jquery-test', (req,res) => res.render('jquery-test', {}) );

app.get('/newsletter', (req,res) => res.render('newsletter', {csrf: 'csrf token goes here'}));
app.post('/newsletter', (req,res) => {
	let name = req.body.name || '', email = req.body.email || '';
	//input validation
	if ( !email.match(VALID_EMAIL_REGEX) )
	{
		if (req.xhr) return res.json({error: 'Invalid email address'});
		req.session.flash = {
			type:    'danger',
			intro:   'validation error!',
			message: 'The email address you entered was not valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}
	
});

app.post('/process', (req,res) => {
	console.log('Form (from querystring): ' + req.query.form);
	console.log('CSRF token (from hidden form field: ' + req.body.csrf);
	console.log('Name (from visible form field): ' + req.body.name);
	console.log('Email (from visible form field): ' + req.body.email);
	res.redirect(303, '/thank-you');
});

app.post('/cart/checkout', (req,res) => {
	let cart = req.session.cart;
	if (!cart) next(new Error('Cart does not exist.'));
	let name = req.body.name || '', 
		email = req.body.email || '';
	
	//input validation
	if ( !email.match(VALID_EMAIL_REGEX) ) return res.next(new Error('Invalid email address.'));

	//Assign a random cart ID. Normally we would be using a database here.
	cart.number = Math.random().toString().replace(/^0\.0*/, '');
	cart.billing = {
		name: name,
		email: email
	};

	res.render('email/cart-thank-you', {layout: null, cart:cart}, (err,html) => {
		if (err) console.log('error in email template');
		sendmail({
		    from: 'info@meadowlark.com',
		    to: cart.billing.email,
		    subject: 'Thank you for booking your trip with Meadowlark',
		    html: html,
		  }, function(err, reply) {
		    if (err) console.log('Unable to send confirmation: ' + err.stack);
		});
	});

	res.render('cart-thak-you', {cart: cart});
}); //End of /cart/checkout post


//Custom 404 function	
app.use(function(req,res){
	res.status('404').render('404');
});

//Custom 505 function	
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status('505').render('505');
});

switch(app.get('env')){
	case 'production':
		//For prod. Support daily log rotation.
		app.use(require('express-logger')({
			path: __dirname + '/log/requests.log'
		}));
		break;
	
	default:
		//Compact, colorful dev logging
		app.use(require('morgan')('dev'));
}

app.listen(app.get('port'), function(){
	console.log('Express started on port ' + app.get('port') + ' in ' + app.get('env') + ' mode.');
});