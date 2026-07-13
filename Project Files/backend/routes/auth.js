const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforbookadoctorapp', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a user (Patient or Doctor)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, specialization, experience, hourlyRate, description } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
    });

    if (user) {
      // If role is doctor, create doctor profile linked to user
      if (user.role === 'doctor') {
        if (!specialization || !experience || !hourlyRate) {
          // Clean up user if fields are missing
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({
            success: false,
            message: 'Specialization, experience, and hourly rate are required for doctor registration',
          });
        }

        await DoctorProfile.create({
          user: user._id,
          specialization,
          experience: Number(experience),
          hourlyRate: Number(hourlyRate),
          description: description || '',
          isApproved: false, // Must be approved by Admin
        });
      }

      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      let doctorProfile = null;
      if (user.role === 'doctor') {
        doctorProfile = await DoctorProfile.findOne({ user: user._id });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        doctorProfile: doctorProfile,
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile data
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let doctorProfile = null;
      if (user.role === 'doctor') {
        doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        doctorProfile: doctorProfile,
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
