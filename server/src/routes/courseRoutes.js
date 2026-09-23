import { Router } from 'express';
import {
  createCourse,
  createCourseComment,
  createLessonStreamUpload,
  deleteCourse,
  getCourse,
  getLessonPlayback,
  getLearningCourse,
  listCourseComments,
  listCourses,
  refreshLessonStream,
  updateCourse
} from '../controllers/courseController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const courseRoutes = Router();

courseRoutes.get('/', listCourses);
courseRoutes.get('/:slug/comments', protect, listCourseComments);
courseRoutes.post('/:slug/comments', protect, createCourseComment);
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
courseRoutes.post(
  '/:id/modules/:moduleId/lessons/:lessonId/stream-refresh',
  protect,
  allowRoles('admin'),
  refreshLessonStream
);
courseRoutes.delete('/:id', protect, allowRoles('admin'), deleteCourse);
