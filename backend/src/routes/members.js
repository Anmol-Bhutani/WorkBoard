const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/members
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            ownedProjects: true,
            projectMembers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ members: users });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const bcrypt = require('bcryptjs');
const { sendInviteEmail } = require('../utils/emailService');

// ... (GET /api/members exists above)

// POST /api/members/invite — Admin only
router.post('/invite', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, role = 'MEMBER' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user with temp password
    const tempPassword = 'welcome123';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        status: 'PENDING',
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      },
      select: { id: true, name: true, email: true, role: true, status: true, avatar: true }
    });

    // Send the actual email (Removed as per user request to use Gmail redirect)
    // await sendInviteEmail(email, name, tempPassword, req.user.name, req.user.email);

    res.status(201).json({ user, message: 'Member invited successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/members/:id/role — Admin only
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, avatar: true }
    });

    res.json({ user, message: `Role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/members/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
