var express = require('express');
var router = express.Router();
var jwt=require('jsonwebtoken')
var bcrypt=require('bcrypt')
var User=require('../model/usermodel')
var mongoose=require('mongoose')
const nodemailer = require('nodemailer');
const crypto = require("crypto");

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


router.get('/signup', function(req, res, next) {
  res.render('register');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});


router.post('/signup',async (req,res,next)=>{
  const { email ,password, password1 } = req.body;

  
  if (password !== password1) {
    res
      .status(409)
      .send({ message: 'Password dont match' });
    
    return;
  }
   // Check if the email already exists
   const existingUser = await User.findOne({ email });

   if (existingUser) {
     return res.status(400).send("Email already exists");
   }

  // check if user already exists
  const user = await User.findOne({ email: email });
  
  if (user) {
    res.status(409)
      .send({ message: 'User with given email already exists!' });
    
    return;
  }

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  
  //Generate a token

  const token = jwt.sign({ email: email }, process.env.TokenSecret, {
  });
 
const newuser= await new User({ ...req.body, password:hashPassword, resetToken:token}).save();


  // Send the JWT as a cookie

  if (!newuser) {
    return res.status(500).send({ message: 'newuser not created' });
  }

  
  res.cookie('token', token, { httpOnly: true });
  
 // Render the registration success page
 return res.status(200).json({ message: 'User successfully created' });
});

router.post("/login", async (req, res) => {
  try {
    // Validate the submitted data
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Please enter all required fields");
    }

    // Find the user by email
    const user = await User.findOne({ email });
    console.log("User:", user);

    // Check if the user exists
    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    // Compare the submitted password to the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If the passwords don't match, return an error
    if (!isPasswordValid) {
      return res.status(401).send("Invalid email or password");
    }

    // Retrieve the authentication token from the database
    const token = user.resetToken;
    console.log("User Token:", token);

    // Set the token as a cookie
    res.cookie("token", token, { httpOnly: true });

    return res.status(200).json({ message: 'Successful login' });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
});

router.get('/forgot', async (req, res) =>{
  res.render("forgot")
})

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Email:", email); // Check the value of the email variable

    const user = await User.findOne({ email });
    console.log("User:", user); // Check if user is found

    if (!user) {
      console.log("User not found for email:", email); // Debug user retrieval
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate a random reset token
    var Token = crypto.randomBytes(32).toString("hex");
    console.log("Token:", Token); // Check the generated token

    res.cookie('Token', Token, { httpOnly: true });

    if (!Token) {
      console.log("Token is empty or undefined"); // Debug token generation
      return res.status(401).json({ message: 'ResetToken failed to be formed' });
    }

    // Send a password reset email to the user
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password reset request',
      html: `
        <h1>Reset Your Password</h1>
        <p>You recently requested to reset your password for your account. Use the link below to reset it:</p>
        <p>${process.env.Client_URL}/users/${Token}/reset-password"</p>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset link is valid for one hour.</p>
      `,
    })
      .then((results) => {
        console.log("Email sent successfully");
      })
      .catch((err) => {
        console.log("Email sending failed:", err);
      });
    // Update one document
    const result = await User.findByIdAndUpdate(
      user._id,
      { $set: { resetToken: Token } },
      { new: true }
    );

    console.log("Update result:", result); // Log the update result

    if (result.nModified === 1) {
      console.log("Document updated successfully");
    } else {
      console.log("Document not updated");
    }

    // Debugging the user document
    console.log("User document after update:", user);

  } catch (error) {
    console.log("Error:", error);
  }

});


  
router.get('/:restlink/reset-password', async (req, res) => {
  try {
    const resetToken = req.params.restlink;
    console.log("Reset Token:", resetToken); // Check the value of the resetToken parameter

    const user = await User.findOne({ resetToken });
    console.log("User:", user); // Check if user is found

    if (!user) {
      console.log("User not found");
      return res.status(404).send('User not found');
    }

    res.render("recover_password", { user });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).send('Internal Server Error');
  }
});


      router.get('/forgot', async (req, res) =>{
        res.render("forgot")
      })

      router.post('/:resetlink/reset-password', async function(req, res, next) {
        try {
          const { password } = req.body;
          console.log("New Password:", password); // Check the value of the new password
      
          const resetToken = req.params.resetlink;
          console.log("Reset Token:", resetToken); // Check the value of the resetToken parameter
      
          const user = await User.findOne({ resetToken });
          console.log("User:", user); // Check if user is found
      
          if (!user) {
            console.log("Invalid reset token");
            return res.status(401).send("Invalid reset token");
          }
      
          const hashedPassword = await bcrypt.hash(password, 10);
          console.log("Hashed Password:", hashedPassword); // Check the hashed password
      
          // Update the user's password and resetToken
          user.password = hashedPassword;
          await user.save();
      
          return res.status(200).send("Password updated");
        } catch (error) {
          console.log("Error:", error);
          return res.status(500).send("Internal server error");
        }
      });
      
      
      


module.exports = router;
