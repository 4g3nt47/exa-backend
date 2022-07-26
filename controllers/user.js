require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer')
const model = require('../models/user');

const MAX_AVATAR_SIZE = parseInt(process.env.MAX_AVATAR_SIZE) || 100000;

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
    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg")
      return callback(new Error("Only PNG and JPEG files are allowed!"));
    return callback(null, true);
  }
}).single('file');

exports.registerUser = (req, res) => {
  
  uploader(req, res, (err) => {
    if (err){
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(403).json({error: `Profile pic must be < ${(MAX_AVATAR_SIZE / 1024).toFixed(2)} KB`})
      else
        return res.status(403).json({error: err.message});
    }
    const deleteAvatar = () => {
      fs.unlink(req.file.path, () => {});
    };
    let {username, password, name, gender} = req.body;
    if (!(username && password && name && gender)){
      deleteAvatar();
      return res.status(404).json({error: "Required params not defined!"});
    }
    model.createUser(username, password, name, gender, req.file.path).then(user => {
      return res.json({success: "Account created!"});
    }).catch(error => {
      deleteAvatar();
      return res.status(403).json({error: error.message});
    });
  });
};

exports.loginUser = (req, res) => {

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

exports.userProfile = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  req.session.user.password = undefined; // Remove the password
  return res.json(req.session.user);
};
