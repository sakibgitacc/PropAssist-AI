const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDemoData() {
  console.log('--- Cleaning legacy demo users, leads, payments, bookings, visits, conversations ---');
  try {
    // Delete dependent tables first in correct order
    await prisma.auditLog.deleteMany({});
    await prisma.communicationLog.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.propertyBooking.deleteMany({});
    await prisma.callSession.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.internalNote.deleteMany({});
    await prisma.leadAssignment.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.consent.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Successfully removed all legacy demo users, leads, payments, bookings, visits and audit logs.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDemoData();
