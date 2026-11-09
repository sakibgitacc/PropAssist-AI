require('dotenv').config();
const prisma = require('../db/prisma');

async function seedBriefSample() {
  console.log('Seeding official sample data from client brief...');

  const p1 = await prisma.project.findFirst({ where: { id: 'proj-grand-orchid' } });
  const p2 = await prisma.project.findFirst({ where: { id: 'proj-serene-meadows' } });
  const exec = await prisma.user.findFirst({ where: { role: 'SALES_EXECUTIVE' } });

  // 1. LD-58210 - Hardik Patel
  const l1 = await prisma.lead.upsert({
    where: { id: 'LD-58210' },
    update: {
      fullName: 'Hardik Patel',
      source: 'Property portal',
      projectId: p1?.id || 'proj-grand-orchid',
      preferredBhk: '3 BHK',
      status: 'Visit Scheduled',
      isQualified: true
    },
    create: {
      id: 'LD-58210',
      fullName: 'Hardik Patel',
      email: 'hardik.patel@samplemail.com',
      phone: '+919825158210',
      source: 'Property portal',
      projectId: p1?.id || 'proj-grand-orchid',
      preferredBhk: '3 BHK',
      budgetMin: 8500000,
      budgetMax: 12000000,
      status: 'Visit Scheduled',
      assignedExecutiveId: exec?.id || null,
      isQualified: true,
      notes: 'Requested site visit for 3 BHK Skyline residence. Booked for 2026-11-01 11:00.'
    }
  });

  // Slot and Booking for LD-58210
  const visitDate = '2026-11-01';
  let slot = await prisma.visitSlot.findFirst({
    where: {
      projectId: p1?.id || 'proj-grand-orchid',
      date: visitDate,
      startTime: '11:00'
    }
  });

  if (!slot) {
    slot = await prisma.visitSlot.create({
      data: {
        projectId: p1?.id || 'proj-grand-orchid',
        date: visitDate,
        startTime: '11:00',
        endTime: '12:00',
        capacity: 3,
        bookedCount: 1,
        assignedExecutiveId: exec?.id || null,
        isActive: true
      }
    });
  }

  await prisma.booking.upsert({
    where: { id: 'booking-LD-58210' },
    update: {},
    create: {
      id: 'booking-LD-58210',
      slotId: slot.id,
      leadId: l1.id,
      buyerName: 'Hardik Patel',
      buyerPhone: '+919825158210',
      buyerEmail: 'hardik.patel@samplemail.com',
      status: 'Confirmed',
      confirmationCode: 'PASS-58210',
      specialRequests: 'VIP Pass for The Grand Orchid show residence.',
      bookingDate: '2026-11-01',
      timeSlot: '11:00 AM - 12:00 PM'
    }
  });

  // 2. LD-58211 - Nidhi Shah
  await prisma.lead.upsert({
    where: { id: 'LD-58211' },
    update: {
      fullName: 'Nidhi Shah',
      source: 'Social media ad',
      projectId: p2?.id || 'proj-serene-meadows',
      preferredBhk: '2 BHK',
      status: 'New'
    },
    create: {
      id: 'LD-58211',
      fullName: 'Nidhi Shah',
      email: 'nidhi.shah@samplemail.com',
      phone: '+919825158211',
      source: 'Social media ad',
      projectId: p2?.id || 'proj-serene-meadows',
      preferredBhk: '2 BHK',
      budgetMin: 6500000,
      budgetMax: 8000000,
      status: 'New',
      assignedExecutiveId: exec?.id || null,
      isQualified: true,
      notes: 'Came via Meta Instagram campaign. Interested in Serene Meadows 2 BHK. Visit status: Not booked.'
    }
  });

  // 3. LD-58224 - Kavita Joshi
  await prisma.lead.upsert({
    where: { id: 'LD-58224' },
    update: {
      fullName: 'Kavita Joshi',
      source: 'Hoarding call',
      projectId: p2?.id || 'proj-serene-meadows',
      preferredBhk: '2 BHK',
      status: 'Visited'
    },
    create: {
      id: 'LD-58224',
      fullName: 'Kavita Joshi',
      email: 'kavita.joshi@samplemail.com',
      phone: '+919825158224',
      source: 'Hoarding call',
      projectId: p2?.id || 'proj-serene-meadows',
      preferredBhk: '2 BHK',
      budgetMin: 6500000,
      budgetMax: 7800000,
      status: 'Visited',
      assignedExecutiveId: exec?.id || null,
      isQualified: true,
      notes: 'Inquiry from SP Ring Road hoarding banner. Attended physical site tour on 2026-11-03. Follow-up scheduled.'
    }
  });

  console.log('✅ Successfully seeded official brief sample records: LD-58210, LD-58211, LD-58224');
}

seedBriefSample().catch(console.error).finally(() => prisma.$disconnect());
