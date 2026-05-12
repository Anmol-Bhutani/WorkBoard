const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/workspace — Fetch current settings
router.get('/', authenticate, async (req, res) => {
  try {
    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      // Initialize if doesn't exist
      workspace = await prisma.workspace.create({
        data: { name: 'WorkBoard', restrictInvite: false, weeklyReports: true }
      });
    }
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workspace — Update settings (Admin Only)
router.put('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, restrictInvite, weeklyReports } = req.body;
    let workspace = await prisma.workspace.findFirst();
    
    if (workspace) {
      workspace = await prisma.workspace.update({
        where: { id: workspace.id },
        data: { name, restrictInvite, weeklyReports }
      });
    } else {
      workspace = await prisma.workspace.create({
        data: { name, restrictInvite, weeklyReports }
      });
    }
    
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
