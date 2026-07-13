const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
  console.log('Starting programmatic backend connection integrity test...');
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/book_a_doctor';
    console.log(`Connecting to: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connection successful.');

    // Cleanup previous test users if any
    await User.deleteMany({ email: { $in: ['test_patient@doctor.com', 'test_doctor@doctor.com'] } });

    // Test Patient Registration & saving
    console.log('Testing User Model saving...');
    const patientObj = new User({
      name: 'Test Patient',
      email: 'test_patient@doctor.com',
      password: 'password123',
      role: 'patient',
    });
    await patientObj.save();
    console.log('Patient saved successfully.');

    // Test JWT login / compare password
    const isMatch = await patientObj.matchPassword('password123');
    console.log(`Password verification matches: ${isMatch}`);
    if (!isMatch) throw new Error('Password mismatch.');

    // Test Doctor Registration
    const doctorUser = new User({
      name: 'Test Doctor',
      email: 'test_doctor@doctor.com',
      password: 'password123',
      role: 'doctor',
    });
    await doctorUser.save();
    const doctorProfile = new DoctorProfile({
      user: doctorUser._id,
      specialization: 'Cardiology',
      experience: 10,
      hourlyRate: 150,
      description: 'Specialist cardiologist test.',
    });
    await doctorProfile.save();
    console.log('Doctor User and Profile saved successfully.');

    // DB seed search
    const foundDoc = await DoctorProfile.findOne({ user: doctorUser._id }).populate('user', 'name');
    console.log(`Retrieved linked doctor name: ${foundDoc.user.name}, Specialty: ${foundDoc.specialization}`);

    // Cleanup
    console.log('Cleaning up database test accounts...');
    await DoctorProfile.deleteOne({ _id: doctorProfile._id });
    await User.deleteMany({ _id: { $in: [patientObj._id, doctorUser._id] } });
    console.log('Database cleanup completed.');

    console.log('Backend Integration Code Verification: SUCCESS!');
    process.exit(0);
  } catch (error) {
    console.error('Backend Verification FAILED:', error);
    process.exit(1);
  }
};

runTest();
