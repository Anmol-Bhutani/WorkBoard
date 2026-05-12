const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTasks() {
  const tasks = await prisma.task.findMany({
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true, email: true } }
    }
  });
  console.log('--- ALL TASKS IN SYSTEM ---');
  console.table(tasks.map(t => ({
    title: t.title,
    project: t.project?.name || 'ORPHAN (NO PROJECT)',
    assignee: t.assignee?.name || 'UNASSIGNED',
    email: t.assignee?.email || 'N/A'
  })));
}

checkTasks()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
