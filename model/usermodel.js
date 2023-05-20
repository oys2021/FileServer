var mongoose = require('mongoose')
var Schema= mongoose.Schema
var bcrypt=require('bcrypt')
const jwt = require("jsonwebtoken");
var UserSchema= new Schema({

email:{
    type:String,
    unique:true
},
password:{
    type:String
},
resetToken :{
	type:String,
}

})

var User=mongoose.model('user',UserSchema)
module.exports=User


