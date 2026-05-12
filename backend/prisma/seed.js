const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Anmol Bhutani',
      email: 'anmol@ethara.ai',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anmol'
    }
  });

  const member = await prisma.user.create({
    data: {
      name: 'John Member',
      email: 'member@ethara.ai',
      password: hashedPassword,
      role: 'MEMBER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
    }
  });

  // Create Projects
  const p1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Revamp the corporate website with a modern look and feel.',
      color: '#7c3aed',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: member.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const p2 = await prisma.project.create({
    data: {
      name: 'Mobile App API',
      description: 'Backend services for the new iOS/Android application.',
      color: '#2563eb',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' }
        ]
      }
    }
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Hero Section',
        description: 'Create high-fidelity mockups for the landing page hero.',
        status: 'DONE',
        priority: 'HIGH',
        projectId: p1.id,
        assigneeId: member.id,
        reporterId: admin.id,
        dueDate: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        title: 'Implement Auth API',
        description: 'Build JWT login and signup endpoints.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        projectId: p2.id,
        assigneeId: admin.id,
        reporterId: admin.id,
        dueDate: new Date(Date.now() + 172800000) // 2 days from now
      },
      {
        title: 'Database Schema Migration',
        description: 'Update PostgreSQL schema for new requirements.',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: p2.id,
        assigneeId: null,
        reporterId: admin.id,
        dueDate: new Date(Date.now() + 432000000) // 5 days from now
      },
      {
        title: 'Fix Navigation Bug',
        description: 'Mobile menu is not closing properly on click.',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        projectId: p1.id,
        assigneeId: member.id,
        reporterId: admin.id,
        dueDate: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ]
  });

  console.log('✅ Seed data created successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
