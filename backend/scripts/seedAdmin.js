/**
 * Seed script — Crée le premier compte admin Ibag Couture
 *
 * Usage : node scripts/seedAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const ADMIN_EMAIL = 'admin@ibagcouture.com';
const ADMIN_PASSWORD = 'IbagAdmin2025!';
const ADMIN_NAME = 'Admin Ibag Couture';

async function seedAdmin() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      console.log(`Role: ${existing.role}`);
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('Role updated to admin');
      }
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      fullName: ADMIN_NAME,
      role: 'admin',
    });

    console.log('Admin created successfully!');
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Name:     ${admin.fullName}`);
    console.log(`  Role:     ${admin.role}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
