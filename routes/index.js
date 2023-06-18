var express = require('express');
var router = express.Router();
var FileModel=require('../model/filemodel')
const path = require('path');
const pdf2pic = require('pdf2pic');
const fs = require('fs');
const nodemailer = require('nodemailer');

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
    rejectUnauthorized: false
  },
  connectionTimeout: 60 * 1000, // 1 minute
  greetingTimeout: 60 * 1000, // 1 minute
  socketTimeout: 5 * 60 * 1000, // 5 minutes
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/home', async (req, res) => {
  try {
    const files = await FileModel.find()
    res.render('home', { files }); // Render the 'files' view and pass the files data
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});


router.post('/getFiles', async(req, res, next)=>{
  let payload=req.body.payload.trim();
  let search=await FileModel.find({title:{$regex: new RegExp('^'+ payload+'.*','i')}}).exec();
  res.send({payload:search});
});

router.post('/submit', async (req, res) => {
  const title = req.body.search_box;
  
  // Redirect to the dynamic route
  res.redirect(`/searchResults/${title}`);
});

router.get('/searchResults/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const file = await FileModel.findOne({ title });

    if (file) {
      console.log('File recognized:', file);
    } else {
      console.log('File not found');
    }

    res.render('searchResults', { file });
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).send('An error occurred');
  }
});





// Route to retrieve and preview a file by ID
router.get('/preview/:fileId', (req, res) => {
  const fileId = req.params.fileId;

  // Retrieve file metadata from the database based on the fileId
  FileModel.findById(fileId)
    .then((file) => {
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      const filePath = `uploads/${file.fileName}`;

      // Read the file using fs.createReadStream
      const fileStream = fs.createReadStream(filePath);

      // Set the appropriate content type header based on file type
      res.setHeader('Content-Type', file.fileType);

      // Pipe the file stream to the response
      fileStream.pipe(res);
    })
    .catch((error) => {
      console.error('Error retrieving file:', error);
      res.status(500).json({ error: 'Failed to retrieve file' });
    });
});

router.get('/send-email/:fileId',async(req, res, next)=>{
  const { fileId } = req.params;
  const file = await FileModel.findById(fileId);

  if (file) {
    console.log("File recognized");
  } else {
    console.log("File is not recognized found");
  }

  res.render('sendEmail',{ file: file });
});


router.post('/send-email/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { senderEmail,receiverEmail } = req.body;
    const file = await FileModel.findById(fileId);
  
    if (file) {
      console.log("File recognized");
      
      const mailOptions = {
        from: 'yawsarfo2019@gmail.com',
        to: 'opokuyawsarfo3@gmail.com',
        subject: 'Subject of the email',
        text: 'Body of the email',
        attachments: [
          {
            filename: file.fileName,
            path: `uploads/${file.fileName}`,
          },
        ],
      };

      // Send a password reset email to the user
    transporter.sendMail({
      from: senderEmail,
      to: receiverEmail,
      subject: 'Subject of Email',
      html: `
        <h1>Your attached file</h1>
        <p>uploads/${file.fileName}</p>
      `,
    })
      .then((results) => {
        console.log("Email sent successfully");
      })
      .catch((err) => {
        console.log("Email sending failed:", err);
      });
      
      
   // Increment the emailCount for the file
   file.emailCount += 1;
   await file.save();

  }} catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});



module.exports = router;
