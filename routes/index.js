var express = require('express');
var router = express.Router();
var FileModel=require('../model/filemodel')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/home', async(req, res, next)=> {

  res.render('home', { title: 'Express' });
});

router.post('/getFiles', async(req, res, next)=>{
  let payload=req.body.payload.trim();
  let search=await FileModel.find({title:{$regex: new RegExp('^'+ payload+'.*','i')}}).exec();
  res.send({payload:search});
});

// preview PART IAM HERE
// router.get('/preview/:filename', async (req, res) => {
//   const filename = req.params.filename;

//   console.log('Filename:', filename); // Log the filename to check if it's correct

//   try {
//     const file = await FileModel.findOne({ title:filename });

//     if (file) {
//       console.log('File found:', file); // Log the file object to check its contents

//       res.set('Content-Type', file.fileType);

//       console.log('Content-Type:', file.fileType); // Log the content type to check if it's correct

//       res.send(file.data);
//     } else {
//       console.log('File not found'); // Log a message if the file is not found
//       res.status(404).json({ error: 'File not found' });
//     }
//   } catch (error) {
//     console.log('Error:', error); // Log any errors that occur during the database query
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

module.exports = router;
