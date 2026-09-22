import mongoose from 'mongoose';

const courseCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    lessonId: String,
    lessonTitle: String,
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'resolved'],
      default: 'open',
      index: true
    },
    source: {
      type: String,
      enum: ['lesson_comment', 'tutor_request'],
      default: 'lesson_comment'
    }
  },
  { timestamps: true }
);

courseCommentSchema.index({ course: 1, createdAt: -1 });

export const CourseComment = mongoose.model('CourseComment', courseCommentSchema);
