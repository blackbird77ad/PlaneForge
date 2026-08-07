import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedLessons: [
      {
        moduleId: String,
        lessonId: String,
        watchedSeconds: {
          type: Number,
          default: 0
        },
        durationSeconds: {
          type: Number,
          default: 0
        },
        completedAt: Date
      }
    ],
    lessonProgress: [
      {
        moduleId: String,
        lessonId: String,
        positionSeconds: {
          type: Number,
          default: 0
        },
        durationSeconds: {
          type: Number,
          default: 0
        },
        watchedSeconds: {
          type: Number,
          default: 0
        },
        completedAt: Date,
        lastWatchedAt: Date
      }
    ],
    currentLesson: {
      moduleId: String,
      lessonId: String
    },
    totalTimeSeconds: {
      type: Number,
      default: 0
    },
    percentComplete: {
      type: Number,
      default: 0
    },
    lastAccessedAt: Date,
    certificateIssued: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, course: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
