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
      return res.redirect('../home');
    });
  })(req, res, next);
});




// Signup route
router.get('/signup', (req, res) => {
  const errorMessage = req.session.errorMessage; // Retrieve error message from session
  delete req.session.errorMessage;
  res.render('register',{errorMessage});
});

// Create new user
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  let errors = [];

  // Validate required fields
  if (!name || !email || !password) {
    req.session.errorMessage = 'please fill in all parts';
  }

  // Validate password length
  if (password.length < 6) {
    req.session.errorMessage = 'password should be at least 6';
  }

  if (errors.length > 0) {
    res.send('Signup page with errors');
  } else {
    // Check if user already exists
    User.findOne({ email: email }).then((user) => {
      if (user) {
        req.session.errorMessage = 'user already exist';
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
                return res.redirect('../home');
              })
              .catch((err) => req.session.errorMessage = 'internal server error');
          });
        });
      }
    });
  }
});

router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error(err);
      // Handle any error that occurred during logout
      res.send('Error logging out');
    } else {
      // User has been logged out successfully
      return res.redirect('/users/logout-success');
    }
  });
});

// Dashboard route (protected)
router.get('/dashboard',(req, res) => {
  if (req.isAuthenticated()) {
    res.send('Dashboard page');
  } else {
    return res.redirect('/users/login');
  }
});


// Route to initiate password reset
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password'); // Render the password reset form
});


router.post('/forgot-password', async (req, res, next) => {
  try {
    // Generate a unique reset token
    const token = crypto.randomBytes(20).toString('hex');

    // Find the user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      console.error('User not found');
      return res.redirect('/users/forgot-password');
    }

    // Set the reset token and expiration time
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour

    // Save the user
    await user.save();

    // Create the email transport configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'yawsarfo2019@gmail.com',
        pass: 'etqxisaxfxkhxlte',
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 60 * 1000, // 1 minute
      greetingTimeout: 60 * 1000, // 1 minute
      socketTimeout: 5 * 60 * 1000, // 5 minutes
    });

    // Create the email message
    const mailOptions = {
      from: user.email,
      to: user.email,
      subject: 'Password Reset',
      text: `To reset your password, please click on the following link: http://${req.headers.host}/users/reset-password/${token}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
    // res.redirect('/users/forgot-password');
  }
});


// Route to render the password reset page
router.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  
    if (!user) {
      console.error('User not found');
      return res.redirect('/users/forgot-password');
    }
  
    // Render the password reset form with the token
    res.render('reset-password', { token: req.params.token });
  } catch (err) {
    console.log(err);
  }
});

// Route to process the password reset
router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  
    if (!user) {
      console.error('User not found');
      return res.redirect('/users/forgot-password');
    }
  
    // Set the new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
  
    // Hash the updated password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  
    await user.updateOne({
      $set: {
        password: user.password,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      }
    });
  
    // Redirect the user to a success page
    res.redirect('/users/password-reset-success');
  } catch (err) {
    console.error(err);
    res.redirect(`/users/reset-password/${req.params.token}`);
  }
});

      
// Route for password reset success
router.get('/password-reset-success', (req, res) => {
  res.render('password-reset-success'); // Render the password reset success page
});
// Route for password reset success
router.get('/logout-success', (req, res) => {
  res.render('logout'); // Render the password reset success page
});
      


module.exports = router;
