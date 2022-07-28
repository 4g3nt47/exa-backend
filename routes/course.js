import {Router} from 'express';
const router = Router();
import {
  createCourse, getCourse, getCourseList, deleteCourse
} from '../controllers/course.js';

router.post("/create", createCourse);

router.get("/", getCourseList);

router.get("/:id", getCourse);

router.delete("/:id", deleteCourse);

export default router;
