// API routes for course-related actions.

import {Router} from 'express';
const router = Router();
import {
  createCourse, getCourse, getCourseList, deleteCourse, startCourse, updateAnswers
} from '../controllers/course.js';

// For creating a course.
router.post("/create", createCourse);

// For getting data of all courses.
router.get("/", getCourseList);

// For getting data of a single course.
router.get("/:id", getCourse);

// For deleting a course
router.delete("/:id", deleteCourse);

// For starting a test
router.post("/start", startCourse);

// For submitting answers during a test.
router.post("/answer", updateAnswers);

export default router;
