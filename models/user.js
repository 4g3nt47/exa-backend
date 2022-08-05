// The user model.

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import Result from './result.js';
import {logStatus, logWarning, logError} from './event-log.js';

// Define the schema for users.
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
  },
  activeTests: [
    {
      id: {
        type: String,
        required: true
      },
      startTime: {
        type: Number,
        required: true
      },
      finishTime: {
        type: Number,
        required: true
      },
      questions: [
        {
          id: {
            type: String,
            required: true
          },
          question: {
            type: String,
            required: true
          },
          options: {
            type: Object,
            required: true
          },
          answer: {
            type: Number,
            required: true
          }
        }
      ]
    }
  ]
});

// Sets user password using bcrypt
userSchema.methods.setPassword = async function(password){

  // if (!validator.isStrongPassword(password))
  //   throw new Error("Password too weak!");
  this.password = await bcrypt.hash(password, 10);
  return this.password;
};

// Matches given password with hashed user password.
userSchema.methods.validatePassword = async function(pwd){
  return await bcrypt.compare(pwd, this.password);
};

// Apply the schema and export the model.
const User = mongoose.model('users', userSchema);
export default User;

// Creates user accounts.
export const createUser = async (username, password, name, avatar) => {

  username = username.toString().trim();
  password = password.toString().trim();
  name = name.toString().trim();
  if (username.length < 3 || username.length > 32)
    throw new Error("Invalid username!");
  if (name.length < 3 || name.length > 32)
    throw new Error("Invalid name!");
  const valid = await User.findOne({username});
  if (valid)
    throw new Error("User already exists!");
  const user = new User({
    username,
    name,
    avatar,
    creationDate: Date.now()
  });
  await user.setPassword(password);
  user.activeTest = [];
  await user.save();
  return user;
};

// Handles login
export const loginUser = async (username, password) => {

  const error = new Error("Authentication failed!");
  username = username.toString().trim();
  password = password.toString().trim();
  const user = await User.findOne({username});
  if (!(user && (await user.validatePassword(password) === true)))
    throw error;
  logStatus(`'${username}' logged in`);
  return user;
};

// Setup session for a logged in user.
export const setupSession = (session, user) => {

  session.username = user.username;
  session.loggedIn = true;
  session.admin = user.admin;
  session.user = user;
};

// Build and return profile for the given user data
export const getProfile = async (user) => {

  // Generate course results
  const results = [];
  const data = await Result.find({userID: user._id.toString()});
  let testsPassed = 0;
  for (let result of data){
    result.passedQuestions = result.passedQuestions.length;
    result.failedQuestions = result.failedQuestions.length;
    testsPassed += (result.passed === true ? 1 : 0);
    results.push(result);
  }
  results.reverse(); // Newer results should come first
  // Build the profile
  return ({
    _id: user._id.toString(),
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    creationDate: user.creationDate,
    admin: user.admin,
    activeTests: user.activeTests.length,
    results,
    testsTaken: results.length,
    testsPassed
  });
};

// Grant or remove admin perms to a user.
export const toggleAdmin = async (username, grant) => {

  const data = await User.updateOne({username: username.toString()}, {admin: grant});
  if (data.modifiedCount > 0){
    if (grant)
      logWarning(`Admin privs granted to '${username}'`);
    else
      logWarning(`Admin privs revoked from '${username}'`);
    return true;
  }else{
    throw new Error("Invalid user!");
  }
};

// Wipe results for a user
export const wipeResults = async (username) => {

  const data = await Result.deleteMany({username: username.toString()});
  if (data.deletedCount > 0){
    logWarning(`Results for '${username}' wiped`);
    return true;
  }else{
    throw new Error("No results available!");
  }
};

// Delete user account
export const deleteUser = async (username) => {
  
  const data = await User.deleteOne({username: username.toString()});
  if (data.deletedCount > 0){
    logWarning(`Account of '${username}' deleted`);
    return true;
  }else{
    throw new Error("Invalid user!");
  }
};
