const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer Memory Storage (Vercel Compatible)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply auth middleware to all patient routes
router.use(protect);
router.use(authorize('patient'));

// @route GET /api/patients/doctors
router.get('/doctors', async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({ isApproved: true }).populate('user', 'name email');
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route GET /api/patients/appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    const fullAppointments = await Promise.all(
      appointments.map(async (apt) => {
        const profile = await DoctorProfile.findOne({ user: apt.doctor._id });

        return {
          ...apt._doc,
          doctorProfile: profile,
        };
      })
    );

    res.json({
      success: true,
      count: fullAppointments.length,
      data: fullAppointments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route POST /api/patients/appointments
router.post('/appointments', async (req, res) => {
  const { doctorId, date, timeSlot } = req.body;

  try {
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked.',
      });
    }

    const doctorUser = await User.findById(doctorId);
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });

    if (!doctorUser || doctorUser.role !== 'doctor' || !doctorProfile.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not approved',
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      timeSlot,
      status: 'pending',
    });

    await Notification.create({
      recipient: doctorId,
      message: `New appointment booking request from ${req.user.name} for ${date} at ${timeSlot}.`,
    });

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route POST /api/patients/appointments/:id/cancel
router.post('/appointments/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    await Notification.create({
      recipient: appointment.doctor,
      message: `Appointment on ${appointment.date} at ${appointment.timeSlot} was cancelled by patient ${req.user.name}.`,
    });

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route POST /api/patients/documents
router.post('/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    const doc = await Document.create({
      patient: req.user._id,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json({
      success: true,
      data: doc,
      message: 'Document received successfully.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route GET /api/patients/documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await Document.find({
      patient: req.user._id,
    }).sort({
      uploadDate: -1,
    });

    res.json({
      success: true,
      data: docs,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route GET /api/patients/notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: notifications,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route PUT /api/patients/notifications/:id/read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notif.isRead = true;
    await notif.save();

    res.json({
      success: true,
      data: notif,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
