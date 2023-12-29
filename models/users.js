const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/wechat',console.log("database connected"));

const userSchema = new mongoose.Schema({
  fullname: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  friendRequestsSent :[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  friendRequestsReceived :[{type:mongoose.Schema.Types.ObjectId , ref:'User'}],
  friends:[{type:mongoose.Schema.Types.ObjectId, ref:'User'}]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);


