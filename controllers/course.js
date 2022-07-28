import model from '../models/course.js';

export const createCourse = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.createCourse(req.body).then(result => {
    return res.json({success: "Course created!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
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
