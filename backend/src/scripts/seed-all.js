/**
 * PropAssist AI — Master Seed Script
 * Provisions everything needed for end-to-end multi-role testing:
 * - Ahmedabad Residential Projects & Units
 * - Fact Sheets
 * - Available Site Visit Slots
 * - Official Accounts across all 4 Roles + Sakib Attar's account
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const prisma = require('../db/prisma');
const supabaseService = require('../services/supabase.service');

async function seedAll() {
  console.log('================================================================');
  console.log('🚀 PropAssist AI — Master System Seeder');
  console.log('================================================================\n');

  // 1. Projects
  const p1 = await prisma.project.upsert({
    where: { id: 'proj-grand-orchid' },
    update: { isDemo: false, status: 'Active' },
    create: {
      id: 'proj-grand-orchid',
      name: 'The Grand Orchid',
      tagline: 'Ultra-Luxury 3 BHK Skyline Residences',
      description: 'Exclusive 22-storey twin architectural towers on SG Highway, Ahmedabad.',
      location: 'SG Highway, Bodakdev, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0338,
      longitude: 72.5074,
      bhkOptions: '3 BHK, 4 BHK Sky Villas',
      minPrice: 8500000,
      maxPrice: 12000000,
      minArea: 1650,
      maxArea: 2450,
      possession: 'December 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
      amenities: JSON.stringify(['Rooftop Infinity Pool', 'State-of-the-Art Gymnasium', 'Banquet Hall', '24/7 Security']),
      status: 'Active',
      isDemo: false
    }
  });

  const p2 = await prisma.project.upsert({
    where: { id: 'proj-serene-meadows' },
    update: { isDemo: false, status: 'Active' },
    create: {
      id: 'proj-serene-meadows',
      name: 'Serene Meadows',
      tagline: 'Modern 2 & 3 BHK Nature-Infused Living',
      description: 'Serene residential community nestled in South Bopal with expansive green parks.',
      location: 'South Bopal, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0185,
      longitude: 72.4632,
      bhkOptions: '2 BHK, 3 BHK Smart Living',
      minPrice: 6500000,
      maxPrice: 9200000,
      minArea: 1180,
      maxArea: 1720,
      possession: 'October 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA09918/2026',
      amenities: JSON.stringify(['Central Garden', 'Solar Lights', 'Clubhouse & Gym', 'Play Area']),
      status: 'Active',
      isDemo: false
    }
  });

  console.log('✅ Projects verified.');

  // 2. Units
  const units = [
    {
      id: 'unit-orchid-1402',
      projectId: 'proj-grand-orchid',
      tower: 'Tower A',
      floor: 14,
      unitNumber: 'Tower A - 1402',
      configuration: '3 BHK Skyline Residence',
      carpetArea: 1320,
      superBuiltUpArea: 1850,
      price: 8500000,
      facing: 'North-East (Vastu Compliant)'
    },
    {
      id: 'unit-orchid-1801',
      projectId: 'proj-grand-orchid',
      tower: 'Tower A',
      floor: 18,
      unitNumber: 'Tower A - 1801',
      configuration: '3 BHK Luxury Sky Deck',
      carpetArea: 1450,
      superBuiltUpArea: 2050,
      price: 9800000,
      facing: 'East Facing'
    },
    {
      id: 'unit-serene-0704',
      projectId: 'proj-serene-meadows',
      tower: 'Tower B',
      floor: 7,
      unitNumber: 'Tower B - 0704',
      configuration: '2 BHK Smart Living',
      carpetArea: 1180,
      superBuiltUpArea: 1420,
      price: 6500000,
      facing: 'Garden Facing'
    },
    {
      id: 'unit-serene-1102',
      projectId: 'proj-serene-meadows',
      tower: 'Tower B',
      floor: 11,
      unitNumber: 'Tower B - 1102',
      configuration: '3 BHK Nature Parkview',
      carpetArea: 1540,
      superBuiltUpArea: 1920,
      price: 8800000,
      facing: 'North Facing'
    }
  ];

  for (const u of units) {
    const existing = await prisma.unit.findUnique({ where: { id: u.id } });
    if (!existing) {
      await prisma.unit.create({
        data: { ...u, status: 'Available' }
      });
    }
  }
  console.log('✅ Inventory units verified.');

  // 3. Visit Slots
  const sampleSlots = [
    { projectId: 'proj-grand-orchid', date: '2026-11-15', startTime: '10:00 AM', endTime: '11:30 AM', capacity: 5 },
    { projectId: 'proj-grand-orchid', date: '2026-11-15', startTime: '02:00 PM', endTime: '03:30 PM', capacity: 5 },
    { projectId: 'proj-grand-orchid', date: '2026-11-16', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5 },
    { projectId: 'proj-serene-meadows', date: '2026-11-15', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5 },
    { projectId: 'proj-serene-meadows', date: '2026-11-16', startTime: '03:30 PM', endTime: '05:00 PM', capacity: 5 }
  ];

  for (const slot of sampleSlots) {
    const exists = await prisma.visitSlot.findFirst({
      where: { projectId: slot.projectId, date: slot.date, startTime: slot.startTime }
    });
    if (!exists) {
      await prisma.visitSlot.create({
        data: { ...slot, bookedCount: 0, isActive: true }
      });
    }
  }
  console.log('✅ Site visit VIP slots verified.');

  // 4. Role Accounts
  const ACCOUNTS = [
    {
      email: 'superadmin@propassist.ai',
      password: 'Admin@123',
      name: 'Principal Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+919876543210'
    },
    {
      email: 'saleshead@propassist.ai',
      password: 'Sales@123',
      name: 'Vikramaditya Mehta (Sales Head)',
      role: 'SALES_HEAD',
      phone: '+919825012345'
    },
    {
      email: 'executive1@propassist.ai',
      password: 'Exec@123',
      name: 'Pooja Sharma (Senior Executive)',
      role: 'SALES_EXECUTIVE',
      phone: '+919825054321'
    },
    {
      email: 'buyer@example.com',
      password: 'Buyer@123',
      name: 'Rahul Shah (Homebuyer)',
      role: 'BUYER',
      phone: '+919825099887'
    },
    {
      email: 'sakibattar91@gmail.com',
      password: 'Sakib@123456',
      name: 'Sakib Attar',
      role: 'BUYER',
      phone: '+918530493687'
    }
  ];

  let adminClient = null;
  if (supabaseService.isSupabaseConfigured()) {
    try {
      adminClient = supabaseService.getSupabaseAdmin();
    } catch (_) {}
  }

  const createdUsers = {};

  for (const acc of ACCOUNTS) {
    let supabaseId = null;

    if (adminClient) {
      try {
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const existingSupa = usersData?.users?.find(u => u.email === acc.email);
        if (existingSupa) {
          supabaseId = existingSupa.id;
          await adminClient.auth.admin.updateUserById(supabaseId, {
            password: acc.password,
            email_confirm: true,
            user_metadata: { name: acc.name, role: acc.role, phone: acc.phone }
          });
        } else {
          const reg = await supabaseService.registerInSupabase({
            email: acc.email,
            password: acc.password,
            name: acc.name,
            role: acc.role,
            phone: acc.phone
          });
          supabaseId = reg.user?.id;
        }
      } catch (e) {
        console.warn(`Supabase notice for ${acc.email}:`, e.message);
      }
    }

    const u = await prisma.user.upsert({
      where: { email: acc.email },
      update: { name: acc.name, phone: acc.phone, role: acc.role, supabaseId },
      create: {
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        role: acc.role,
        supabaseId
      }
    });
    createdUsers[acc.role] = u;
    console.log(`✅ User ready: ${acc.role} (${acc.email})`);
  }

  // 5. Ensure Buyer Lead exists & is linked to Executive
  const execUser = createdUsers['SALES_EXECUTIVE'];
  const sakibLead = await prisma.lead.findFirst({
    where: { OR: [{ email: 'sakibattar91@gmail.com' }, { phone: { contains: '8530493687' } }] }
  });

  if (!sakibLead) {
    await prisma.lead.create({
      data: {
        fullName: 'Sakib Attar',
        email: 'sakibattar91@gmail.com',
        phone: '+918530493687',
        preferredBhk: '3 BHK',
        timeline: 'Within 3 Months',
        source: 'Self-Registered Buyer',
        status: 'Qualified',
        isQualified: true,
        projectId: 'proj-grand-orchid',
        assignedExecutiveId: execUser?.id || null,
        notes: 'Interested in 3 BHK in The Grand Orchid'
      }
    });
  } else {
    await prisma.lead.update({
      where: { id: sakibLead.id },
      data: {
        assignedExecutiveId: execUser?.id || sakibLead.assignedExecutiveId,
        projectId: 'proj-grand-orchid'
      }
    });
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 4 ROLES & REAL INVENTORY READY FOR PRODUCTION TESTING!');
  console.log('================================================================');
}

seedAll().catch(console.error).finally(() => prisma.$disconnect());

