import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    description: String
  },
  { timestamps: true }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
