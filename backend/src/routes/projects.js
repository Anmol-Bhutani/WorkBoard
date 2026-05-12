const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add task stats
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true
      });

      const stats = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
      taskStats.forEach(s => { stats[s.status] = s._count; });
      const total = Object.values(stats).reduce((a, b) => a + b, 0);
      
      // Calculate weighted progress (Work Velocity Engine)
      let progress = total > 0 
        ? Math.round(((stats.DONE * 1.0) + (stats.IN_REVIEW * 0.7) + (stats.IN_PROGRESS * 0.3)) / total * 100) 
        : 0;
      
      // Manual Override: If project is marked COMPLETED, it is 100% progress
      if (project.status === 'COMPLETED') progress = 100;

      return { ...project, taskStats: stats, progress };
    }));

    // Calculate global stats for the summary cards
    const totalProjects = projectsWithStats.length;
    const avgProgress = totalProjects > 0 
      ? Math.round(projectsWithStats.reduce((acc, p) => acc + p.progress, 0) / totalProjects) 
      : 0;
    
    const tasksInProgress = projectsWithStats.reduce((acc, p) => acc + (p.taskStats.IN_PROGRESS || 0), 0);
    
    // Count tasks due this week
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeek = await prisma.task.count({
      where: {
        projectId: { in: projectsWithStats.map(p => p.id) },
        dueDate: {
          gte: now,
          lte: nextWeek
        }
      }
    });

    res.json({ 
      projects: projectsWithStats, 
      summary: {
        activeInitiatives: totalProjects,
        averageProgress: avgProgress,
        tasksInProgress: tasksInProgress,
        dueThisWeek: dueThisWeek
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects
router.post('/', authenticate, [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('color').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;
    const colors = ['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#db2777', '#0891b2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || randomColor,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'OWNER' }
        }
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        _count: { select: { tasks: true } }
      }
    });

    res.status(201).json({ project, message: 'Project created!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            reporter: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some(m => m.userId === req.user.id);
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only project owner can edit' });
    }

    const { name, description, color, status } = req.body;
    const updated = await prisma.project.update({
      where: { id },
      data: { name, description, color, status },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
      }
    });

    res.json({ project: updated, message: 'Project updated!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only project owner can delete' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });
    if (existing) return res.status(400).json({ error: 'Already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId: id, userId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    res.status(201).json({ member, message: 'Member added!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } }
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
