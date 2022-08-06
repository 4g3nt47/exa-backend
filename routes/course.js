/**
 * @file The routes for the course API endpoints.
 * @author Umar Abdul (https://github.com/4g3nt47)
 */

import {Router} from 'express';
const router = Router();
import {
  createCourse, getCourse, getCourseList, deleteCourse, deleteCourseResults,
  startCourse, updateAnswers, exportResults, exportQuestions
} from '../controllers/course.js';

// For creating a course.
router.post("/create", createCourse);

// For getting data of all courses.
router.get("/", getCourseList);

// For getting data of a single course.
router.get("/:id", getCourse);

// For deleting a course
router.delete("/:id", deleteCourse);

// For deleting course results
router.delete("/:id/results", deleteCourseResults);

// For starting a test
router.post("/start", startCourse);

// For submitting answers during a test.
router.post("/answer", updateAnswers);

// For exporting test results.
router.get("/:id/export/results", exportResults);

// For exporting test questions.
router.get("/:id/export/questions", exportQuestions);

export default router;
