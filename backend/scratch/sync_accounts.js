const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function merger() {
  const users = await prisma.user.findMany();
  const anmols = users.filter(u => u.name.includes('Anmol'));
  
  console.log('Found Anmols:', anmols.map(u => u.email));

  const target = anmols.find(u => u.email === 'anmolbhutani07@gmail.com');
  
  if (!target) {
    console.log('Target account not found!');
    return;
  }

  for (const user of anmols) {
    if (user.id !== target.id) {
      console.log(`Moving tasks from ${user.email} to ${target.email}`);
      await prisma.task.updateMany({
        where: { assigneeId: user.id },
        data: { assigneeId: target.id }
      });
    }
  }

  console.log('Assigning unassigned tasks...');
  await prisma.task.updateMany({
    where: { assigneeId: null },
    data: { assigneeId: target.id }
  });

  console.log('MERGE COMPLETE!');
}

merger()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
