const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Get projects the user has access to
    let projectFilter = {};
    if (!isAdmin) {
      const memberProjects = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true }
      });
      const projectIds = memberProjects.map(p => p.projectId);
      projectFilter = { projectId: { in: projectIds } };
    }

    // Task counts by status
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: projectFilter,
      _count: true
    });

    const stats = {
      total: 0,
      todo: 0,
      inProgress: 0,
      inReview: 0,
      done: 0,
      overdue: 0
    };

    statusCounts.forEach(sc => {
      stats.total += sc._count;
      switch (sc.status) {
        case 'TODO': stats.todo = sc._count; break;
        case 'IN_PROGRESS': stats.inProgress = sc._count; break;
        case 'IN_REVIEW': stats.inReview = sc._count; break;
        case 'DONE': stats.done = sc._count; break;
      }
    });

    // Overdue tasks (due strictly before today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const overdueCount = await prisma.task.count({
      where: {
        ...projectFilter,
        dueDate: { lt: todayStart },
        status: { not: 'DONE' }
      }
    });
    stats.overdue = overdueCount;

    // My tasks (assigned to me)
    const myTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' }
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        reporter: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Recent tasks with project progress
    const recentTasksRaw = await prisma.task.findMany({
      where: projectFilter,
      include: {
        project: { 
          include: {
            tasks: { select: { status: true } }
          }
        },
        assignee: { select: { id: true, name: true, avatar: true } },
        reporter: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 8
    });

    const recentTasks = recentTasksRaw.map(task => {
      const pTasks = task.project.tasks;
      const total = pTasks.length;
      const stats = { DONE: 0, IN_REVIEW: 0, IN_PROGRESS: 0 };
      pTasks.forEach(pt => { if (stats[pt.status] !== undefined) stats[pt.status]++; });
      
      const progress = total > 0 
        ? Math.round(((stats.DONE * 1.0) + (stats.IN_REVIEW * 0.7) + (stats.IN_PROGRESS * 0.3)) / total * 100)
        : 0;
        
      const { tasks, ...projectData } = task.project;
      return { ...task, project: { ...projectData, progress } };
    });

    // Overdue tasks list
    const overdueTasks = await prisma.task.findMany({
      where: {
        ...projectFilter,
        dueDate: { lt: todayStart },
        status: { not: 'DONE' }
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Projects count
    const projectsCount = isAdmin
      ? await prisma.project.count()
      : await prisma.projectMember.count({ where: { userId } });

    // Team members count
    const membersCount = isAdmin
      ? await prisma.user.count()
      : await prisma.user.count(); // Everyone can see member count

    // Priority distribution
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        ...projectFilter,
        status: { not: 'DONE' }
      },
      _count: true
    });

    const priorityStats = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    priorityCounts.forEach(pc => {
      priorityStats[pc.priority] = pc._count;
    });

    res.json({
      stats,
      myTasks,
      recentTasks,
      overdueTasks,
      projectsCount,
      membersCount,
      priorityStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
