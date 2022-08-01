// Controllers for the user endpoints.

import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import {fileTypeFromFile} from 'file-type';
import * as model from '../models/user.js';

// Configure multer for user avatar upload

const MAX_AVATAR_SIZE = parseInt(process.env.MAX_AVATAR_SIZE) || 500000;

const storage = multer.diskStorage({
  destination: "static/avatars/",
  filename: (req, file, callback) => {
    let ext = path.extname(file.originalname) || '.png';
    callback(null, crypto.randomBytes(20).toString('hex') + ext);
  }
});

const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_AVATAR_SIZE
  },
  fileFilter: (req, file, callback) => {
    // Some basic mime type validation. Content-based validation is later applied.
    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg")
      return callback(new Error("Only PNG and JPEG files are allowed!"));
    return callback(null, true);
  }
}).single('file');

export const registerUser = (req, res) => {
  
  uploader(req, res, async (err) => {
    if (err){
      if (err.code === 'LIMIT_FILE_SIZE') // File too large
        return res.status(403).json({error: `Profile pic must be < ${(MAX_AVATAR_SIZE / 1024).toFixed(2)} KB`})
      else
        return res.status(403).json({error: err.message});
    }
    // Delete the avatar file in case of an error.
    const deleteAvatar = () => {
      fs.unlink(req.file.path, () => {});
    };
    // Validate file contents.
    let fileType = await fileTypeFromFile(req.file.path);
    if ((!fileType) || (fileType.mime !== 'image/png' && fileType.mime !== 'image/jpeg')){
      deleteAvatar();
      return res.status(403).json({error: "Only PNG and JPEG files are allowed!"});
    }
    // Create the user.
    let {username, password, name} = req.body;
    if (!(username && password && name)){
      deleteAvatar();
      return res.status(404).json({error: "Required params not defined!"});
    }
    model.createUser(username, password, name, req.file.path).then(user => {
      return res.json({success: "Account created!"});
    }).catch(error => {
      deleteAvatar();
      return res.status(403).json({error: error.message});
    });
  });
};

// Handles user authentication.
export const loginUser = (req, res) => {

  let {username, password} = req.body;
  if (!(username && password))
    return res.status(404).json({error: "Required params not defined!"});
  model.loginUser(username, password).then(user => {
    user.password = undefined;
    model.setupSession(req.session, user);
    return res.json(user);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Returns the profile data of the logged in user.
export const userProfile = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  req.session.user.password = undefined; // Remove the password
  req.session.user.activeTest = undefined; // Remove active test data if any.
  return res.json(req.session.user);
};
