var express = require('express');
var router = express.Router();
var jwt=require('jsonwebtoken')
var bcrypt=require('bcrypt')
var User=require('../model/usermodel')
var mongoose=require('mongoose')
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
 
const newuser= await new User({ ...req.body, password:hashPassword}).save();


  // Send the JWT as a cookie

  if (!newuser) {
    return res.status(500).send({ message: 'newuser not created' });
  }

  
  res.cookie('token', token, { httpOnly: true });
  
 // Render the registration success page
 return res.status(200).json({ message: 'User successfully created' });
});

router.post("/login", async (req, res) => {
  // Validate the submitted data
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please enter all required fields");
  }

  // Find the user by email
  const user = await User.findOne({ email });

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

  // Create a JWT and set it as a cookie
  const token = jwt.sign({ email: user.email }, process.env.TokenSecret);
  res.cookie("token", token, { httpOnly: true });

  if (token){
    return res.status(200).json({ message: 'successive login'});
  }

 
});

module.exports = router;
