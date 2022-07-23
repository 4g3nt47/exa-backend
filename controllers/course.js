const model = require('../models/course');

exports.createCourse = (req, res) => {

  if (req.session.admin !== true)
    return res.status(403).json({error: "Permission denied!"});
  model.createCourse(req.body).then(result => {
    return res.json({success: "Course created!"});
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};

exports.getCourse = (req, res) => {

  model.getCourse(req.params.id).then(course => {
    return res.json(course);
  }).catch(error => {
    return res.status(403).json({error: error.message});
  });
};
