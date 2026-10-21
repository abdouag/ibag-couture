/**
 * Seed script — Crée le premier compte admin Ibag Couture
 *
 * Usage : node scripts/seedAdmin.js
 */

require('dotenv').config();
const { prisma, disconnectPrisma } = require('../config/prisma');
const { hashPassword } = require('../utils/password');

const ADMIN_EMAIL = 'admin@ibagcouture.com';
const ADMIN_PASSWORD = 'IbagAdmin2025!';
const ADMIN_NAME = 'Admin Ibag Couture';

async function seedAdmin() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      console.log(`Role: ${existing.role}`);

      if (existing.role !== 'admin') {
        await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
        console.log('Role updated to admin');
      }

      await disconnectPrisma();
      return;
    }

    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: await hashPassword(ADMIN_PASSWORD),
        fullName: ADMIN_NAME,
        role: 'admin',
      },
    });

    console.log('Admin created successfully!');
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Name:     ${admin.fullName}`);
    console.log(`  Role:     ${admin.role}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\nChangez ce mot de passe des la premiere connexion.');

    await disconnectPrisma();
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error.message);
    await disconnectPrisma().catch(() => {});
    process.exit(1);
  }
}

seedAdmin();
