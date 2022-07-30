import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {fileTypeFromFile} from 'file-type';
import * as model from '../models/course.js';
import multer from 'multer';

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
    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg")
      return callback(new Error("Only PNG and JPEG files are allowed!"));
    return callback(null, true);
  }
}).single('file');


export const createCourse = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  uploader(req, res, async (err) => {
    if (err){
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(403).json({error: `Course avatar must be < ${(MAX_AVATAR_SIZE / 1024).toFixed(2)} KB`})
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
    req.body.avatar = req.file.path;
    model.createCourse(req.body).then(result => {
      return res.json({success: "Course created!"});
    }).catch(error => {
      return res.status(403).json({error: error.message});
    });
  });
};

export const getCourse = (req, res) => {

  model.getCourse(req.params.id).then(course => {
    return res.json(course);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

export const getCourseList = (req, res) => {

  model.getCourseList().then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

export const deleteCourse = (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.deleteCourse(req.params.id).then(() => {
    return res.json({success: "Course deleted!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};
