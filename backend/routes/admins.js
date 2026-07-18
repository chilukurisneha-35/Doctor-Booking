const express = require('express');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admins/stats
// @desc    Get dashboard counts/stats
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const approvedDoctors = await DoctorProfile.countDocuments({ isApproved: true });
    const pendingDoctors = await DoctorProfile.countDocuments({ isApproved: false });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalAppointments = await Appointment.countDocuments();
    const totalDocuments = await Document.countDocuments();

    // Latest appointments
    const latestAppointments = await Appointment.find()
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalDoctors,
        approvedDoctors,
        pendingDoctors,
        totalPatients,
        totalAppointments,
        totalDocuments,
        latestAppointments,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admins/doctors/all
// @desc    Get all doctors and profiles
// @access  Private (Admin)
router.get('/doctors/all', async (req, res) => {
  try {
    const doctors = await DoctorProfile.find().populate('user', 'name email');
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/admins/doctors/:id/approve
// @desc    Approve doctor registration profile
// @access  Private (Admin)
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findById(req.params.id);

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    doctorProfile.isApproved = true;
    await doctorProfile.save();

    // Create custom notification for the doctor user
    await Notification.create({
      recipient: doctorProfile.user,
      message: 'Congratulations! Your doctor profile has been approved by the Administration. Patients can now schedule appointments with you.',
    });

    res.json({ success: true, data: doctorProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   DELETE /api/admins/doctors/:id
// @desc    Reject/Delete doctor user and profile
// @access  Private (Admin)
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findById(req.params.id);

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const userId = doctorProfile.user;

    // Delete both profile and corresponding main user account
    await DoctorProfile.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(userId);

    // Also clean up any associated appointments
    await Appointment.deleteMany({ doctor: userId });

    res.json({ success: true, message: 'Doctor profile and associated User accounts deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
