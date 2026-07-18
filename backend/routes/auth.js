const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretkeyforbookadoctorapp',
    {
      expiresIn: '30d',
    }
  );
};

// ==========================================================
// @route   POST /api/auth/register
// @desc    Register Patient or Doctor
// @access  Public
// ==========================================================
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    specialization,
    experience,
    hourlyRate,
    description,
  } = req.body;

  try {
    // Check existing user
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
    });

    // If doctor, create doctor profile
    if (user.role === 'doctor') {
      if (!specialization || !experience || !hourlyRate) {
        await User.findByIdAndDelete(user._id);

        return res.status(400).json({
          success: false,
          message:
            'Specialization, experience and hourly rate are required.',
        });
      }

      await DoctorProfile.create({
        user: user._id,
        specialization,
        experience: Number(experience),
        hourlyRate: Number(hourlyRate),
        description: description || '',
        isApproved: true, // ✅ Automatically Approved
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration Successful',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('========== REGISTER ERROR ==========');
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================================
// @route   POST /api/auth/login
// @desc    Login User
// @access  Public
// ==========================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      let doctorProfile = null;

      if (user.role === 'doctor') {
        doctorProfile = await DoctorProfile.findOne({
          user: user._id,
        });
      }

      return res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        doctorProfile,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================================
// @route   GET /api/auth/me
// @desc    Get Logged-in User
// @access  Private
// ==========================================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let doctorProfile = null;

    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({
        user: user._id,
      });
    }

    return res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      doctorProfile,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
