var express = require('express');
var router = express.Router();
var jwt=require('jsonwebtoken')
var bcrypt=require('bcrypt')
var User=require('../model/usermodel')
var mongoose=require('mongoose')
const nodemailer = require('nodemailer');
const crypto = require("crypto");
const passport = require('passport');
const flash = require('connect-flash');
router.use(flash());
// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user:'yawsarfo2019@gmail.com',
    pass:'etqxisaxfxkhxlte',
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60 * 1000, // 1 minute
  greetingTimeout: 60 * 1000, // 1 minute
  socketTimeout: 5 * 60 * 1000 // 5 minutes
});
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Render login page
router.get('/login', (req, res) => {
  const errorMessage = req.session.errorMessage; // Retrieve error message from session
  delete req.session.errorMessage; // Remove error message from session
  res.render('login', { errorMessage });
});



// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.session.errorMessage = 'Incorrect email or password'; // Store error message in session
      return res.redirect('/users/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/users/dashboard');
    });
  })(req, res, next);
});




// Signup route
router.get('/signup', (req, res) => {
  res.render('register');
});

// Create new user
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  let errors = [];

  // Validate required fields
  if (!name || !email || !password) {
    errors.push({ message: 'Please fill in all fields' });
  }

  // Validate password length
  if (password.length < 6) {
    errors.push({ message: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.send('Signup page with errors');
  } else {
    // Check if user already exists
    User.findOne({ email: email }).then((user) => {
      if (user) {
        res.send('User already exists');
      } else {
        // Create new user
        const newUser = new User({
          name,
          email,
          password,
        });

        // Hash password and save user
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                res.send('User registered successfully');
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.send('Logged out');
});

// Dashboard route (protected)
router.get('/dashboard',(req, res) => {
  if (req.isAuthenticated()) {
    res.send('Dashboard page');
  } else {
    return res.redirect('/users/login');
  }
});

// GET request to display the password reset form
router.get('/reset', (req, res) => {
  const errorMessage = req.session.errorMessage; // Retrieve error message from session
  const successMessage = req.session.successMessage; // Retrieve error message from session
  delete req.session.errorMessage; // Remove error message from session
  delete req.session.successMessage;
  res.render('reset',{errorMessage,successMessage});
});


// POST request to handle the password reset form submission
router.post('/reset', (req, res, next) => {
  async.waterfall([
    // Generate a unique token for password reset
    (done) => {
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    // Find the user with the provided email
    (token, done) => {
      const user = User.findOne({ email: req.body.email });
      if (!user) {
        req.session.errorMessage = 'No user with this email'; // Store error message in session
        return res.redirect('/users/reset');
      }

      // Save the reset token and expiry time to the user's document
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

      user.save((err) => {
        done(err, token, user);
      });
    },
    // Send the password reset email with the reset link
    (token, user, done) => {
      const mailOptions = {
        to: user.email,
        from: user.email,
        subject: 'Password Reset',
        text: `You are receiving this email because you (or someone else) have requested to reset the password for your account.\n\n
          Please click on the following link, or paste it into your browser to complete the process:\n\n
          ${req.protocol}://${req.headers.host}/users/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };

      // Replace the transport and send the email using a mailer of your choice (e.g., Nodemailer)
      // Example using Nodemailer:
      transporter.sendMail(mailOptions, (err) => {
        req.flash('info', 'An email has been sent with instructions to reset your password.');
        done(err);
      });
    }
  ], (err) => {
    if (err) return next(err);
    res.redirect('/users/reset');
  });
});


// GET request to display the password reset form with the token
router.get('/reset/:token', (req, res) => {
  const errorMessage = req.session.errorMessage; // Retrieve error message from session
  const successMessage = req.session.successMessage; // Retrieve error message from session
  delete req.session.errorMessage; // Remove error message from session
  delete req.session.successMessage;
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (!user) {
      req.session.errorMessage = 'No user with this email';
      return res.redirect('/users/reset');
    }
    res.render('resetToken', { token: req.params.token,successMessage,errorMessage });
  });
});

// POST request to handle the password reset form submission with the token
router.post('/reset/:token', (req, res) => {
  async.waterfall([
    // Find the user with the provided reset token
    (done) => {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
          req.session.errorMessage =  'Password reset token is invalid or has expired';
          return res.redirect('back');
        }

        // Set the new password and clear the reset token and expiry time
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save((err) => {
          req.logIn(user, (err) => {
            done(err, user);
          });
        });
      });
    },
    // Send the password reset confirmation email
    (user, done) => {
      const mailOptions = {
        to: user.email,
        from: user.email,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account has been changed.\n'
      };

      // Replace the transport and send the email using a mailer of your choice (e.g., Nodemailer)
      // Example using Nodemailer:
      transporter.sendMail(mailOptions, (err) => {
        req.session.successMessage = 'Password reset email sent successfully';
// Store error message in session
       
        done(err);
      });
    }
  ], (err) => {
    res.redirect('/users/dashboard');
  });
});


  
      
      
      


module.exports = router;
