// Controllers for the course endpoints.

import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import {fileTypeFromFile} from 'file-type';
import * as model from '../models/course.js';
import {logStatus, logWarning, logError} from '../models/event-log.js';

const MAX_AVATAR_SIZE = parseInt(process.env.MAX_AVATAR_SIZE) || 500000;

// Setup multer for course avatar upload.

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


// Create course.
export const createCourse = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  uploader(req, res, async (err) => {
    if (err){
      // Handle upload error.
      if (err.code === 'LIMIT_FILE_SIZE') // File too large
        return res.status(403).json({error: `Course avatar must be < ${(MAX_AVATAR_SIZE / 1024).toFixed(2)} KB`})
      else
        return res.status(403).json({error: err.message});
    }
    // Validate file by contents.
    try{      
      let fileType = await fileTypeFromFile(req.file.path);
      if ((!fileType) || (fileType.mime !== 'image/png' && fileType.mime !== 'image/jpeg')){ // File type not allowed
        logWarning(`Possible course image type spoofing by '${req.session.username}'`);
        throw new Error("Only PNG and JPEG files are allowed!");
      }
      // All good. Attempt to create the course.
      req.body.avatar = req.file.path;
      await model.createCourse(req.body);
      logStatus(`Course '${req.body.name.toString()}' created by '${req.session.username}'`);
      return res.json({success: "Course created successfully!"});
    }catch(error){
      fs.unlink(req.file.path, () => {}); // Delete the avatar
      return res.status(403).json({error: error.message});
    }
  });
};

// For getting data of a single course.
export const getCourse = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.getCourse(req.session.user, req.params.id).then(course => {
    return res.json(course);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Get some data on all available courses.
export const getCourseList = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.getCourseList(req.session.user).then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Delete a course.
export const deleteCourse = (req, res) => {
  
  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.deleteCourse(req.params.id).then(() => {
    logWarning(`Course '${req.params.id}' deleted by '${req.session.username}'`);
    return res.json({success: "Course deleted!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Delete all the results for a course.
export const deleteCourseResults = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.deleteCourseResults(req.params.id).then(() => {
    logWarning(`Results for course '${req.params.id}' deleted by '${req.session.username}'`);
    return res.json({success: "Results deleted!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Start a course test
export const startCourse = (req, res) => {
  
  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  if (!(req.body.id))
    return res.status(403).json({error: "Required parameters not defined!"});
  model.startCourse(req.session.user, req.body.id, req.body.password).then(course => {
    logStatus(`Course '${course.id}' started by user '${req.session.username}'`);
    return res.json(course);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// Update answers for an active test.
export const updateAnswers = (req, res) => {

  if (req.session.loggedIn !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.updateAnswers(req.session.user, req.body).then(data => {
    return res.json(data);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// For exporting results.
export const exportResults = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.exportResults(req.params.id).then(outfile => {
    logStatus(`Results for course '${req.params.id}' exported by '${req.session.username}'`);
    return res.json({
      success: "Results exported!",
      location: outfile
    });
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

// For exporting questions.
export const exportQuestions = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.exportQuestions(req.params.id).then(outfile => {
    logStatus(`Questions for course '${req.params.id}' exported by '${req.session.username}'`);
    return res.json({
      success: "Questions exported!",
      location: outfile
    });
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};
