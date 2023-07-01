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

async function getFilePathFromDatabase(fileId) {
  try {
    const file = await FileModel.findById(fileId);
    if (!file) {
      return null; // File not found
    }
    return file.filePath;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Route to download a file by ID
router.get('/download/:fileId', async(req, res) => {
  const fileId = req.params.fileId;

  // Retrieve file metadata from the database based on the fileId
  FileModel.findById(fileId)
    .then((file) => {
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Assuming `file.fileName` contains the name of the uploaded file
const fileName = file.fileName;
const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);


      // Increment the download count in your database
      file.downloadCount += 1;
      file.save();

      // Set the appropriate content-disposition header to trigger a download
      res.setHeader('Content-Disposition', `attachment; filename=${file.fileName}`);

      // Read the file using fs.createReadStream
      const fileStream = fs.createReadStream(filePath);

      // Pipe the file stream to the response
      fileStream.pipe(res);
    })
    .catch((error) => {
      console.error('Error retrieving file:', error);
      res.status(500).json({ error: 'Failed to retrieve file' });
    });
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

      const fileName = file.fileName;
      const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);


      console.log('File path:', filePath); // Debugging statement

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath); // Debugging statement
        return res.status(404).json({ error: 'File does not exist' });
      }

      // Read the file using fs.createReadStream
      const fileStream = fs.createReadStream(filePath);

      // Set the appropriate content type header based on file type
      res.setHeader('Content-Type', file.fileType);

      // Handle file stream errors
      fileStream.on('error', (error) => {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
      });

      // Pipe the file stream to the response
      fileStream.pipe(res);
    })
    .catch((error) => {
      console.error('Error retrieving file:', error);
      res.status(500).json({ error: 'Failed to retrieve file' });
    });
});







router.post('/send-email/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { send, receive } = req.body;
    console.log(send);
    console.log(receive);
    const file = await FileModel.findById(fileId);
const fileName = file.fileName;
const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

  
    if (file) {
      console.log("File recognized");

      // Send a password reset email to the user
      transporter.sendMail({
        from: `${send}`,
        to: `${receive}`, // Updated variable name
        subject: 'Subject of Email',
        html: `
          <h1>Your attached file</h1>
          <p>filepath</p>
        `,
        attachments: [
          {
            filename: file.fileName, // Provide the file name
            path:filePath
          }
        ]
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

    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error.");
  }
});



module.exports = router;
