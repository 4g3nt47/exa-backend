const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  admin: {
    type: Boolean,
    required: true,
    default: false
  },
  courses: {
    type: Object,
    required: true,
    default: []
  }
});

userSchema.methods.setPassword = async function(password){

  if (!validator.isStrongPassword(password))
    throw new Error("Password too weak!");
  this.password = await bcrypt.hash(password, 10);
  return this.password;
};

userSchema.methods.validatePassword = async function(pwd){
  return await bcrypt.compare(pwd, this.password);
};

const User = mongoose.model('users', userSchema);
exports.User = User;

exports.createUser = async (username, password) => {

  username = username.toString().trim();
  password = password.toString().trim();
  if (username.length < 3 || username.length > 32)
    throw new Error("Invalid username!");
  const valid = await User.findOne({username});
  if (valid)
    throw new Error("User already exists!");
  const user = new User({
    username
  });
  await user.setPassword(password);
  await user.save();
  return user;
};

exports.loginUser = async (username, password) => {

  const error = new Error("Authentication failed!");
  username = username.toString().trim();
  password = password.toString().trim();
  const user = await User.findOne({username});
  if (!(user && (await user.validatePassword(password) === true)))
    throw error;
  return user;
};

exports.setupSession = (session, user) => {

  session.username = user.username;
  session.loggedIn = true;
  session.admin = user.admin;
  session.user = user;
};
