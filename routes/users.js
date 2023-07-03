var express = require('express');
var router = express.Router();
var jwt=require('jsonwebtoken')
var bcrypt=require('bcrypt')
const { User, VerificationToken } = require('../model/usermodel');
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
  res.render('register', { errorMessage });
});

// Create new user
router.post('/signup', async (req, res) => {
  const {name, email, password } = req.body;
  let errors = [];

  // Validate required fields
  if (!name || !email || !password) {
    req.session.errorMessage = 'Please fill in all fields.';
    return res.redirect('/users/signup');
  }

  // Validate password length
  if (password.length < 6) {
    req.session.errorMessage = 'Password should be at least 6 characters long.';
    return res.redirect('/users/signup');
  }

  try {
    // Check if user already exists
    // User.collection.dropIndex({ username: 1 }, (err, result) => {
    //   if (err) {
    //     console.error('Failed to drop index:', err);
    //   } else {
    //     console.log('Index dropped successfully:', result);
    //   }
    // });
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      req.session.errorMessage = 'User already exists.';
      return res.redirect('/users/signup');
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
    });

    // Drop the index on the username field


    // Hash password and save user
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) {
          req.session.errorMessage = 'Failed to hash password.';
          return res.redirect('/users/signup');
        }
        newUser.password = hash;

        newUser.save().then((user) => {
          // Generate verification token
          const verificationToken = new VerificationToken({
            _userId: user._id,
            token: crypto.randomBytes(16).toString('hex'),
          });

          verificationToken.save().then(() => {
            // Send verification email
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

            const mailOptions = {
              from: user.email,
              to: user.email,
              subject: 'Account Verification Link',
              text:
                'Hello ' +
                user.name +
                ',\n\n' +
                'Please verify your account by clicking the link: \nhttp:\/\/' +
                req.headers.host +
                '\/users\/confirmation\/' +
                user.email +
                '\/' +
                verificationToken.token +
                '\n\nThank You!\n',
            };

            transporter.sendMail(mailOptions, (err) => {
              if (err) {
                req.session.errorMessage =
                  'Failed to send verification email.';
                return res.redirect('/users/signup');
              }
              req.session.successMessage =
                'A verification email has been sent to ' +
                user.email +
                '. It will expire after one day.';
              return res.redirect('/users/verification-notice');
            });
          });
        });
      });
    });
  } catch (err) {
    console.error(err);
    req.session.errorMessage = 'Failed to create user.';
    return res.redirect('/users/signup');
  }
});



// Account confirmation route
router.get('/confirmation/:email/:verificationToken', async (req, res) => {
  try {
    const verificationToken = await VerificationToken.findOne({ token: req.params.verificationToken });
    const userId = verificationToken._userId;
    
    // VerificationToken not found or expired
    if (!verificationToken) {
      req.session.errorMessage = 'Your verification link may have expired. Please click on resend to verify your email.';
      return res.redirect(`/users/resendtoken/${userId}`);
    }

    const user = await User.findOne({
      _id: verificationToken._userId,
      email: req.params.email,
    });

    // User not found
    if (!user) {
      req.session.errorMessage = 'We were unable to find a user for this verification. Please sign up again.';
      return res.redirect('/users/signupAgain/');
    }

    // User already verified
    if (user.isVerified) {
      req.session.successMessage = 'This account has already been verified. Please log in.';
      return res.redirect('/users/alreadyVerified');
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    req.session.successMessage = 'Your account has been successfully verified. Please log in.';
    return res.redirect('/users/isVerified');
  } catch (error) {
    req.session.errorMessage = 'Failed to verify user.';
    return res.redirect('/users/verification-error');
  }
});

    
        // Resend verification email
router.get('/resend/:userId', (req, res) => {
  const { userId } = req.params;

  const user = User.findOne({ _id: userId });
  if (!user) {
    req.session.errorMessage = 'No user found with that ID.';
    return res.redirect('/login');
  }

  if (user.isVerified) {
    req.session.successMessage = 'This account has already been verified. Please log in.';
    return res.redirect('/login');
  }

  // Generate new verification token
  const verificationToken = new VerificationToken({
    _userId: user._id,
    token: crypto.randomBytes(16).toString('hex'),
  });

  verificationToken.save().then(() => {
    // Send verification email
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

    const mailOptions = {
      from: user.email,
      to: user.email,
      subject: 'Account Verification Link',
      text:
        'Hello ' +
        user.name +
        ',\n\n' +
        'Please verify your account by clicking the link: \nhttp:\/\/' +
        req.headers.host +
        '\/users\/' +
        '\/confirmation\/' +
        user.email +
        '\/' +
        verificationToken.token +
        '\n\nThank You!\n',
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        req.session.errorMessage = 'Failed to send verification email.';
        return res.redirect('/login');
      }
      req.session.successMessage =
        'A new verification email has been sent to ' +
        user.email +
        '. It will expire after one day.';
      return res.redirect('/login');
    });
  });
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
      
router.get('/verification-notice', (req, res) => {
  res.render('success'); // Render the password reset success page
});
router.get('/isVerified', (req, res) => {
  res.render('isVerified'); // Render the password reset success page
});
router.get('/verification-error', (req, res) => {
  res.render('verification-error'); // Render the password reset success page
});

router.get('/alreadyVerified', (req, res) => {
  res.render('alreadyVerified');
});
router.get('/signupAgain/', (req, res) => {
  res.render('signupAgain');
});


router.get('/resendtoken', (req, res) => {
  const { userId } = req.params;
  const user=User.findOne({ _id: userId })
  if (user) {
    return res.render('/resendtoken');
  }
});

  

 


module.exports = router;
