require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function seedFollowUps() {
  console.log('🌱 Seeding realistic development follow-up records (relative dates)...');

  // 1. Fetch authenticated Pooja Sharma executive account
  const poojaExec = await prisma.user.findFirst({
    where: { email: 'executive1@propassist.ai' }
  });

  if (!poojaExec) {
    console.error('❌ Pooja Sharma account (executive1@propassist.ai) not found. Run seed-roles first.');
    return;
  }

  // 2. Fetch or ensure projects
  const p1 = await prisma.project.findFirst({ where: { id: 'proj-grand-orchid' } });
  const p2 = await prisma.project.findFirst({ where: { id: 'proj-serene-meadows' } });

  // 3. Ensure valid leads exist for the follow-ups and assign them to Pooja Sharma
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcoming3d = new Date(now);
  upcoming3d.setDate(upcoming3d.getDate() + 3);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 2);

  const past4d = new Date(now);
  past4d.setDate(past4d.getDate() - 4);

  const sampleLeadDefinitions = [
    {
      id: 'lead-rahul-shah',
      fullName: 'Rahul Shah',
      email: 'buyer@example.com',
      phone: '+919825099887',
      preferredBhk: '2 BHK',
      budgetMin: 6500000,
      budgetMax: 8000000,
      projectId: p2?.id || 'proj-serene-meadows',
      assignedExecutiveId: poojaExec.id,
      status: 'Contacted',
      source: 'AI Chatbot'
    },
    {
      id: 'lead-amit-patel',
      fullName: 'Amit Patel',
      email: 'amit.patel@gujaratfin.in',
      phone: '+919825033441',
      preferredBhk: '3 BHK',
      budgetMin: 8500000,
      budgetMax: 11000000,
      projectId: p1?.id || 'proj-grand-orchid',
      assignedExecutiveId: poojaExec.id,
      status: 'Qualified',
      source: 'Property portal'
    },
    {
      id: 'lead-neha-desai',
      fullName: 'Neha Desai',
      email: 'neha.desai@architects.in',
      phone: '+919825044552',
      preferredBhk: '3 BHK Luxury Sky Deck',
      budgetMin: 9500000,
      budgetMax: 12500000,
      projectId: p1?.id || 'proj-grand-orchid',
      assignedExecutiveId: poojaExec.id,
      status: 'Visit Scheduled',
      source: 'Social media ad'
    },
    {
      id: 'lead-mehul-shah',
      fullName: 'Mehul Shah',
      email: 'mehul.shah@textiles.in',
      phone: '+919825055663',
      preferredBhk: '2 BHK Smart Living',
      budgetMin: 6500000,
      budgetMax: 7800000,
      projectId: p2?.id || 'proj-serene-meadows',
      assignedExecutiveId: poojaExec.id,
      status: 'Contacted',
      source: 'Website Form'
    },
    {
      id: 'lead-priya-patel',
      fullName: 'Priya Patel',
      email: 'priya.patel@designhub.in',
      phone: '+919825066774',
      preferredBhk: '3 BHK',
      budgetMin: 8500000,
      budgetMax: 10500000,
      projectId: p1?.id || 'proj-grand-orchid',
      assignedExecutiveId: poojaExec.id,
      status: 'Visited',
      source: 'Hoarding call'
    }
  ];

  for (const ld of sampleLeadDefinitions) {
    await prisma.lead.upsert({
      where: { id: ld.id },
      update: {
        assignedExecutiveId: poojaExec.id,
        fullName: ld.fullName,
        email: ld.email,
        phone: ld.phone,
        preferredBhk: ld.preferredBhk,
        budgetMin: ld.budgetMin,
        budgetMax: ld.budgetMax,
        projectId: ld.projectId,
        status: ld.status
      },
      create: {
        id: ld.id,
        fullName: ld.fullName,
        email: ld.email,
        phone: ld.phone,
        preferredBhk: ld.preferredBhk,
        budgetMin: ld.budgetMin,
        budgetMax: ld.budgetMax,
        projectId: ld.projectId,
        assignedExecutiveId: poojaExec.id,
        status: ld.status,
        source: ld.source,
        isQualified: true
      }
    });
  }

  // 4. Five Core Development Business Follow-up Records (Relative dates)
  const followUpRecords = [
    {
      id: 'fu-rahul-today',
      leadId: 'lead-rahul-shah',
      buyerName: 'Rahul Shah',
      projectId: p2?.id || 'proj-serene-meadows',
      executiveId: poojaExec.id,
      title: 'First Contact & Requirement Discovery',
      description: 'Discuss floor plan layout preferences for Serene Meadows 2 BHK. Confirm if buyer requires east-facing park view.',
      type: 'First Contact',
      priority: 'HIGH',
      scheduledDate: new Date(todayStr + 'T11:30:00.000Z'),
      scheduledTime: '11:30 AM',
      status: 'TODAY'
    },
    {
      id: 'fu-amit-tomorrow',
      leadId: 'lead-amit-patel',
      buyerName: 'Amit Patel',
      projectId: p1?.id || 'proj-grand-orchid',
      executiveId: poojaExec.id,
      title: 'Budget & Payment Milestones Discussion',
      description: 'Review 10:80:10 builder subvention scheme options for The Grand Orchid 3 BHK Skyline residence. Share RERA loan approval letter.',
      type: 'Budget Discussion',
      priority: 'HIGH',
      scheduledDate: tomorrow,
      scheduledTime: '02:00 PM',
      status: 'UPCOMING'
    },
    {
      id: 'fu-neha-upcoming',
      leadId: 'lead-neha-desai',
      buyerName: 'Neha Desai',
      projectId: p1?.id || 'proj-grand-orchid',
      executiveId: poojaExec.id,
      title: 'Site Visit Confirmation & Gate Pass Dispatch',
      description: 'Confirm Sunday afternoon site walkthrough. Send digital VIP Gate Pass and Bodakdev entrance pin via WhatsApp.',
      type: 'Site Visit Confirmation',
      priority: 'MEDIUM',
      scheduledDate: upcoming3d,
      scheduledTime: '04:00 PM',
      status: 'UPCOMING'
    },
    {
      id: 'fu-mehul-overdue',
      leadId: 'lead-mehul-shah',
      buyerName: 'Mehul Shah',
      projectId: p2?.id || 'proj-serene-meadows',
      executiveId: poojaExec.id,
      title: 'Callback: Bank Pre-Approval Query',
      description: 'Client requested callback regarding SBI / HDFC tie-ups for South Bopal property. Urgent follow-up needed.',
      type: 'Callback',
      priority: 'HIGH',
      scheduledDate: yesterday,
      scheduledTime: '10:00 AM',
      status: 'OVERDUE'
    },
    {
      id: 'fu-priya-completed',
      leadId: 'lead-priya-patel',
      buyerName: 'Priya Patel',
      projectId: p1?.id || 'proj-grand-orchid',
      executiveId: poojaExec.id,
      title: 'Post Site Visit Follow-up & Feedback Review',
      description: 'Concluded physical site walkthrough of 14th-floor model apartment. Client expressed strong interest in Tower A - Unit 1402.',
      type: 'Post Site Visit Follow-up',
      priority: 'MEDIUM',
      scheduledDate: past4d,
      scheduledTime: '03:30 PM',
      status: 'COMPLETED',
      completedDate: past4d,
      completionNotes: 'Client loved the double-height atrium and views. Shared draft agreement structure and EOI token details.'
    }
  ];

  for (const fu of followUpRecords) {
    await prisma.followUp.upsert({
      where: { id: fu.id },
      update: {
        scheduledDate: fu.scheduledDate,
        scheduledTime: fu.scheduledTime,
        status: fu.status,
        completedDate: fu.completedDate || null,
        completionNotes: fu.completionNotes || null
      },
      create: fu
    });
  }

  console.log('✅ Successfully seeded 5 realistic relative follow-up records for Pooja Sharma:');
  console.log('   1. Rahul Shah — First Contact (TODAY)');
  console.log('   2. Amit Patel — Budget Discussion (TOMORROW / UPCOMING)');
  console.log('   3. Neha Desai — Site Visit Confirmation (UPCOMING)');
  console.log('   4. Mehul Shah — Callback (OVERDUE)');
  console.log('   5. Priya Patel — Post Site Visit Follow-up (COMPLETED)');
}

seedFollowUps().catch(console.error).finally(() => prisma.$disconnect());
