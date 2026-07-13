const express = require('express');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all doctor routes
router.use(protect);
router.use(authorize('doctor'));

// @route   GET /api/doctors/appointments
// @desc    Get doctor appointments
// @access  Private (Doctor)
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/doctors/appointments/:id
// @desc    Update appointment status (approve, complete, cancel, add prescription)
// @access  Private (Doctor)
router.put('/appointments/:id', async (req, res) => {
  const { status, prescription, notes } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized for this action' });
    }

    if (status) appointment.status = status;
    if (prescription !== undefined) appointment.prescription = prescription;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    // Notify patient
    let msg = `Your appointment on ${appointment.date} at ${appointment.timeSlot} status has been updated to: ${status}.`;
    if (status === 'completed' && prescription) {
      msg = `Your appointment on ${appointment.date} at ${appointment.timeSlot} is completed. Dr. ${req.user.name} has added a prescription: "${prescription}"`;
    }

    await Notification.create({
      recipient: appointment.patient,
      message: msg,
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   GET /api/doctors/patients/:patientId/documents
// @desc    View a patient's uploaded documents (Verify if patient booked with this doctor)
// @access  Private (Doctor)
router.get('/patients/:patientId/documents', async (req, res) => {
  try {
    // Audit check: Check if patient has any appointment history with this doctor
    const hasAppointment = await Appointment.findOne({
      doctor: req.user._id,
      patient: req.params.patientId,
    });

    if (!hasAppointment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view documents of patients you have appointments with.',
      });
    }

    const docs = await Document.find({ patient: req.params.patientId }).sort({ uploadDate: -1 });
    res.json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   GET /api/doctors/profile
// @desc    Get doctor own profile
// @access  Private (Doctor)
router.get('/profile', async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile (Slots, Specialization, description, rates)
// @access  Private (Doctor)
router.put('/profile', async (req, res) => {
  const { specialization, experience, hourlyRate, description, availableSlots } = req.body;

  try {
    let profile = await DoctorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    if (specialization) profile.specialization = specialization;
    if (experience) profile.experience = Number(experience);
    if (hourlyRate) profile.hourlyRate = Number(hourlyRate);
    if (description !== undefined) profile.description = description;
    if (availableSlots) profile.availableSlots = availableSlots;

    await profile.save();

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   GET /api/doctors/notifications
// @desc    Get notifications for doctor
// @access  Private (Doctor)
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/doctors/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private (Doctor)
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
