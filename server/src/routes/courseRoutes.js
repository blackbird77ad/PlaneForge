import { Router } from 'express';
import {
  createCourse,
  createLessonStreamUpload,
  deleteCourse,
  getCourse,
  getLessonPlayback,
  getLearningCourse,
  listCourses,
  updateCourse
} from '../controllers/courseController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const courseRoutes = Router();

courseRoutes.get('/', listCourses);
courseRoutes.get('/:slug', getCourse);
courseRoutes.get('/:slug/learn', protect, getLearningCourse);
courseRoutes.get('/:slug/lessons/:lessonId/playback', protect, getLessonPlayback);
courseRoutes.post('/', protect, allowRoles('admin'), createCourse);
courseRoutes.patch('/:id', protect, allowRoles('admin'), updateCourse);
courseRoutes.post(
  '/:id/modules/:moduleId/lessons/:lessonId/stream-upload',
  protect,
  allowRoles('admin'),
  createLessonStreamUpload
);
courseRoutes.delete('/:id', protect, allowRoles('admin'), deleteCourse);
