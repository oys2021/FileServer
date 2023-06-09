var express = require('express');
var router = express.Router();
var FileModel=require('../model/filemodel')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/home', function(req, res, next) {
  res.render('home', { title: 'Express' });
});

router.post('/searchFruits', async(req, res)=>{
  var regex= new RegExp('noodles', 'i');
  return FileModel.find({title: regex}, function(err,q){
    return res.send(q);
});
});



module.exports = router;
