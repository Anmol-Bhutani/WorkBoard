const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, projectId, assigneeId, dueDate, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const where = { AND: [] };
    console.log('--- SEARCH DEBUG ---');
    console.log('Query Params:', req.query);

    // Non-admin users can only see tasks in their projects or assigned to them
    if (!isAdmin) {
      const memberProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true }
      });
      const projectIds = memberProjects.map(p => p.projectId);
      where.AND.push({
        OR: [
          { projectId: { in: projectIds } },
          { assigneeId: userId }
        ]
      });
    }

    if (status) {
      if (status === 'OVERDUE') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        where.AND.push({
          dueDate: { lt: todayStart },
          status: { not: 'DONE' }
        });
      } else {
        where.AND.push({ status });
      }
    }
    if (priority) where.AND.push({ priority });
    if (projectId) where.AND.push({ projectId });
    
    if (dueDate) {
      const start = new Date(`${dueDate}T00:00:00.000Z`);
      const end = new Date(`${dueDate}T23:59:59.999Z`);
      where.AND.push({
        dueDate: {
          gte: start,
          lte: end
        }
      });
    }

    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      });
    }

    const tasks = await prisma.task.findMany({
      where: where.AND.length > 0 ? where : {},
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { [sortBy]: order }
    });

    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('Project is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, status, projectId, assigneeId, dueDate } = req.body;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });
    if (!isMember && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No access to this project' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        projectId,
        assigneeId: assigneeId || null,
        reporterId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json({ task, message: 'Task created!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        reporter: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, status, assigneeId, dueDate } = req.body;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(status && { status }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json({ task: updated, message: 'Task updated!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Only reporter, project owner, or admin can delete
    if (task.reporterId !== req.user.id && req.user.role !== 'ADMIN') {
      const project = await prisma.project.findUnique({ where: { id: task.projectId } });
      if (project.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this task' });
      }
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
