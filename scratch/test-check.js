const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });
const prisma = require(path.resolve(__dirname, 'backend/src/db/prisma'));

async function test() {
  try {
    const cleanPhone = '';
    const conditions = [{ email: 'test@example.com' }];
    if (cleanPhone) {
      conditions.push({ phone: { contains: cleanPhone } });
    }
    const res = await prisma.lead.findFirst({
      where: {
        OR: conditions
      }
    });
    console.log('Result with clean conditions:', res);

    console.log('Testing with empty object inside OR:');
    const res2 = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          {}
        ]
      }
    });
    console.log('Result with empty object:', res2);
  } catch (err) {
    console.error('Prisma Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
