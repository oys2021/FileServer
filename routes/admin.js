var express = require('express');
var router = express.Router();
var jwt=require('jsonwebtoken')
const multer = require('multer');
var FileModel=require('../model/filemodel')

/* GET home page. */

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination folder for file uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname); // Generate unique filenames
  }
});

// Set up multer upload
const upload = multer({ storage: storage });


router.get('/main', async function(req, res, next) {
  try {
    const files = await FileModel.find(); // Retrieve all documents from the FileModel collection

    res.render('admin/fileReview', { files }); // Pass the files data to the template
  } catch (error) {
    next(error);
  }
});

router.get('/addfile',function(req, res, next) {
  res.render('admin/addFile');
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const { filename, mimetype } = req.file;

    const file = new FileModel({
      title,
      description,
      fileName: filename,
      fileType: mimetype,
    });

    await file.save();

    res.status(200).json({ fileId: file._id });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
