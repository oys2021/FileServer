var mongoose = require('mongoose')
var Schema= mongoose.Schema
var bcrypt=require('bcrypt')
const jwt = require("jsonwebtoken");

var FileSchema=new Schema({
  title: {type:String},
  description: {type:String},
  fileName: {type:String},
  fileType: {type:String},
  uploadDate: { type: Date, default: Date.now },
  downloadCount: { type: Number, default:0},
  emailCount: { type: Number, default:0},
});

const FileModel = mongoose.model('File', FileSchema);
module.exports=FileModel