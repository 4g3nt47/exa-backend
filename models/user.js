import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import bcrypt from 'bcrypt';
import validator from 'validator';

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  creationDate: {
    type: Number,
    required: true
  },
  admin: {
    type: Boolean,
    required: true,
    default: false
  }
});

userSchema.methods.setPassword = async function(password){

  // if (!validator.isStrongPassword(password))
  //   throw new Error("Password too weak!");
  this.password = await bcrypt.hash(password, 10);
  return this.password;
};

userSchema.methods.validatePassword = async function(pwd){
  return await bcrypt.compare(pwd, this.password);
};

const User = mongoose.model('users', userSchema);
export default User;

export const createUser = async (username, password, name, gender, avatar) => {

  username = username.toString().trim();
  password = password.toString().trim();
  name = name.toString().trim();
  gender = gender.toString().trim();
  if (username.length < 3 || username.length > 32)
    throw new Error("Invalid username!");
  if (name.length < 3 || name.length > 32)
    throw new Error("Invalid name!");
  if (gender !== "male" && gender !== "female")
    throw new Error("Invalid gender!");
  const valid = await User.findOne({username});
  if (valid)
    throw new Error("User already exists!");
  const user = new User({
    username,
    name,
    gender,
    avatar,
    creationDate: Date.now()
  });
  await user.setPassword(password);
  await user.save();
  return user;
};

export const loginUser = async (username, password) => {

  const error = new Error("Authentication failed!");
  username = username.toString().trim();
  password = password.toString().trim();
  const user = await User.findOne({username});
  if (!(user && (await user.validatePassword(password) === true)))
    throw error;
  return user;
};

export const setupSession = (session, user) => {

  session.username = user.username;
  session.loggedIn = true;
  session.admin = user.admin;
  session.user = user;
};
