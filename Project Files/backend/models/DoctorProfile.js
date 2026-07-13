const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  availableSlots: {
    type: [String],
    default: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  rating: {
    type: Number,
    default: 5.0,
  },
});

module.exports = mongoose.model('DoctorProfile', DoctorProfileSchema);
