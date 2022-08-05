// Controllers for the user endpoints.

import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import {fileTypeFromFile} from 'file-type';
import User, * as model from '../models/user.js';


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
    try{      
      // Validate file contents.
      let fileType = await fileTypeFromFile(req.file.path);
      if ((!fileType) || (fileType.mime !== 'image/png' && fileType.mime !== 'image/jpeg'))
        throw new Error("Only PNG and JPEG files are allowed!");
      // Create the user.
      let {username, password, name} = req.body;
      if (!(username && password && name))
        return new Error("Required params not defined!");
      await model.createUser(username, password, name, req.file.path);
      return res.json({success: "Account created successfully!"});
    }catch(error){
      fs.unlink(req.file.path, () => {}); // Delete the uploaded avatar
      return res.status(403).json({error: error.message});
    }
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

// Returns the profile data of the logged in user, or a specified user when request is by an admin.
export const getProfile = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  if (req.params.username){ // Profile request for a different user.
    if (req.session.admin !== true)
      return res.status(403).json({error: "Permission denied!"});
    User.findOne({username: req.params.username.toString()}, (err, user) => {
      if (err)
        return res.status(403).json({error: err.message});
      if (!user)
        return res.status(404).json({error: "Invalid user!"});
      model.getProfile(user).then(profile => {
        return res.json(profile);
      }).catch(error => {
        return res.status(403).json({error: error.message});
      });
    });
  }else{
    model.getProfile(req.session.user).then(profile => {
      return res.json(profile);
    }).catch(error => {
      return res.status(403).json({error: error.message});
    });    
  }
};

// Grant admin perms to a user
export const grantAdmin = (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.toggleAdmin(req.params.username, true).then(() => {
    return res.json({success: "Privileges granted!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Revoke admin perms to a user
export const revokeAdmin = (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.toggleAdmin(req.params.username, false).then(() => {
    return res.json({success: "Privileges revoked!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Wipe results of a user
export const wipeResults = (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.wipeResults(req.params.username).then(() => {
    return res.json({success: "Results wiped!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Delete user account
export const deleteUser = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.deleteUser(req.params.username).then(() => {
    return res.json({success: "User deleted!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  })
}