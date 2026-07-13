const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Apply auth middleware to all patient routes
router.use(protect);
router.use(authorize('patient'));

// @route   GET /api/patients/doctors
// @desc    Get all approved doctors
// @access  Private (Patient)
router.get('/doctors', async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({ isApproved: true }).populate('user', 'name email');
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   GET /api/patients/appointments
// @desc    Get patient appointments
// @access  Private (Patient)
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    // For each appointment, fetch the doctor profile (to get specialty etc.)
    const docDataPromises = appointments.map(async (apt) => {
      const profile = await DoctorProfile.findOne({ user: apt.doctor._id });
      return {
        ...apt._doc,
        doctorProfile: profile,
      };
    });

    const fullAppointments = await Promise.all(docDataPromises);

    res.json({ success: true, count: fullAppointments.length, data: fullAppointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/patients/appointments
// @desc    Book a new appointment
// @access  Private (Patient)
router.post('/appointments', async (req, res) => {
  const { doctorId, date, timeSlot } = req.body;

  try {
    // Check if slot is already booked and approved/pending
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked or a request is pending for this doctor.',
      });
    }

    const doctorUser = await User.findById(doctorId);
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });

    if (!doctorUser || doctorUser.role !== 'doctor' || !doctorProfile.isApproved) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not approved' });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      timeSlot,
      status: 'pending',
    });

    // Notify the doctor
    await Notification.create({
      recipient: doctorId,
      message: `New appointment booking request from ${req.user.name} for ${date} at ${timeSlot}.`,
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   POST /api/patients/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private (Patient)
router.post('/appointments/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.parameters ? req.parameters.id : req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized logic' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Notify doctor
    await Notification.create({
      recipient: appointment.doctor,
      message: `Appointment on ${appointment.date} at ${appointment.timeSlot} was cancelled by patient ${req.user.name}.`,
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/patients/documents
// @desc    Upload medical document
// @access  Private (Patient)
router.post('/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const doc = await Document.create({
      patient: req.user._id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      filepath: req.file.path,
      mimetype: req.file.mimetype,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/patients/documents
// @desc    Get patient uploaded documents
// @access  Private (Patient)
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({ patient: req.user._id }).sort({ uploadDate: -1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/patients/notifications
// @desc    Get patient notifications
// @access  Private (Patient)
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/patients/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private (Patient)
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    notif.isRead = true;
    await notif.save();
    res.json({ success: true, data: notif });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
