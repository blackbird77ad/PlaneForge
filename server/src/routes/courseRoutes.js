import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getLearningCourse,
  listCourses,
  updateCourse
} from '../controllers/courseController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const courseRoutes = Router();

courseRoutes.get('/', listCourses);
courseRoutes.get('/:slug', getCourse);
courseRoutes.get('/:slug/learn', protect, getLearningCourse);
courseRoutes.post('/', protect, allowRoles('admin'), createCourse);
courseRoutes.patch('/:id', protect, allowRoles('admin'), updateCourse);
courseRoutes.delete('/:id', protect, allowRoles('admin'), deleteCourse);
