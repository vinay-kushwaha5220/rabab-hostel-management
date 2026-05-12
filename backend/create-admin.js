import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin);
      
      // Update to admin role if not already
      if (existingAdmin.role !== 'admin') {
        const updated = await prisma.user.update({
          where: { email },
          data: { role: 'admin' }
        });
        console.log('Updated user to admin:', updated);
      }
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: email,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('Admin created successfully:', {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
    console.log('\nLogin credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
