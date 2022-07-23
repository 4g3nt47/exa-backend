const router = require('express').Router();
const {
  createCourse, getCourse
} = require('../controllers/course');

router.post("/create", createCourse);

router.get("/:id", getCourse);

module.exports = router;