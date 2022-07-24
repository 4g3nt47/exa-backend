const router = require('express').Router();
const {
  createCourse, getCourse, getCourseList, deleteCourse
} = require('../controllers/course');

router.post("/create", createCourse);

router.get("/", getCourseList);

router.get("/:id", getCourse);

router.delete("/:id", deleteCourse);

module.exports = router;