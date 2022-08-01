// The user model.

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import validator from 'validator';

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
  return user;
};

// Setup session for a logged in user.
export const setupSession = (session, user) => {

  session.username = user.username;
  session.loggedIn = true;
  session.admin = user.admin;
  session.user = user;
};
