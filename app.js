var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose=require('mongoose')
const flash = require('connect-flash');
const session = require('express-session');
const nodemailer = require('nodemailer');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
require('dotenv').config();

var app = express();
// Mongoose setup

// Fix mongoose error
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://OYS2023:yawsarfo2023@cluster0.us2y66e.mongodb.net/fileServer?retryWrites=true&w=majority',{useNewUrlParser:true,useUnifiedTopology:true})
.then((results)=>{
console.log("Database connected")
})
.catch((err)=>{
console.log(err)
})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

//Express Session
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}));

// connect to flash
//Connect Flash
app.use(flash())
//Global Variable
app.use((req, res, next)=>{
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  next()
});
// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
  
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;