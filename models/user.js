/**
 * @file The user model.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';
import Result from './result.js';

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

/**
 * Set user password.
 * @param {string} password - The new password in plaintext format.
 */
userSchema.methods.setPassword = async function(password){

  if (!validator.isStrongPassword(password))
    throw new Error("Password too weak!");
  this.password = await bcrypt.hash(password, 10);
  return this.password;
};

/**
 * Handles password validation.
 * @param {string} pwd - The password to test against.
 * @return {boolean} true if it's a match.
 */
userSchema.methods.validatePassword = async function(pwd){
  return await bcrypt.compare(pwd, this.password);
};

// Apply the schema and export the model.
const User = mongoose.model('users', userSchema);
export default User;

/**
 * Create a user account.
 * @param {string} username - The account username.
 * @param {string} password - The account password.
 * @param {string} name - The name of the user.
 * @param {string} avatar - The path of the user avatar / profile pic.
 * @return {object} The created user profile.
 */
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

/**
 * Handles user authentication.
 * @param {string} username - Account username.
 * @param {string} password - Account password.
 * @return The user profile.
 */
export const loginUser = async (username, password) => {

  const error = new Error("Authentication failed!");
  username = username.toString().trim();
  password = password.toString().trim();
  const user = await User.findOne({username});
  if (!(user && (await user.validatePassword(password) === true)))
    throw error;
  return user;
};

/**
 * Setups session variables for a logged in user.
 * @param {object} session - The session object (req.session).
 * @param {object} user - The user's profile.
 */
export const setupSession = (session, user) => {

  session.username = user.username;
  session.loggedIn = true;
  session.admin = user.admin;
  session.user = user;
};

/**
 * Builds the profile of a given user.
 * @param {object} user - The user's profile.
 * @return {object} The complete user profile. 
 */
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

/**
 * Grant / revoke admin privileges for a user.
 * @param {string} username - The target user.
 * @param {boolean} grant - The action type. true == grant, while false == revoke.
 * @return {boolean} true on success.
 */
export const toggleAdmin = async (username, grant) => {

  const data = await User.updateOne({username: username.toString()}, {admin: grant});
  if (data.modifiedCount > 0)
    return true;
  else
    throw new Error("Invalid user!");
};

/**
 * Wipe the results of a given user.
 * @param {string} username - The target user.
 * @return {boolean} true on success.
 */
export const wipeResults = async (username) => {

  const data = await Result.deleteMany({username: username.toString()});
  if (data.deletedCount > 0)
    return true;
  else
    throw new Error("No results available!");
};

/**
 * Delete the account of a user.
 * @param {string} username - The target user.
 * @return {boolean} true on success.
 */
export const deleteUser = async (username) => {
  
  const data = await User.deleteOne({username: username.toString()});
  if (data.deletedCount > 0)
    return true;
  else
    throw new Error("Invalid user!");
};
