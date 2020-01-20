const express = require('express');
const app   = express();
const server  = require('http').createServer(app);
const path    = require('path');
const session	 = require('express-session');
const ejs       = require('ejs');
const passport  = require('passport');
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, './public')))
app.use(
  session({
    secret: 'hghtyNN23h',
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: false,
    secure: true
  })
);

require('./config/passport_config');
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs')

app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/profile', require('./routes/profile'))
app.use('/movie', require('./routes/movie'))
app.use('/stream', require('./routes/stream'))


server.listen(PORT , () => {
  console.log('Server listening on Port ' + PORT);
})

