/**
 * PropAssist AI — Complete Rich Enterprise Data Seeder
 * Populates authentic, fully-interconnected real-world data across ALL 4 roles:
 * - SUPER_ADMIN (Platform metrics, global users, projects, audit logs, integrations)
 * - SALES_HEAD (Organization lead funnel, unassigned leads, team distribution, workload, allotment approvals)
 * - SALES_EXECUTIVE (Assigned leads, calling workspace, Jitsi consults, WhatsApp logs, AI handoffs)
 * - BUYER (Personal inquiries, site visits, token payments, official receipts, RERA allotment letters)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');

async function seedRichEnterpriseData() {
  console.log('================================================================');
  console.log('💎 SEEDING COMPLETE ENTERPRISE MASTER DATA ACROSS ALL ROLES');
  console.log('================================================================\n');

  // ─── 1. ORGANIZATIONS ──────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: 'org-ahmedabad-prime' },
    update: {},
    create: {
      id: 'org-ahmedabad-prime',
      name: 'Ahmedabad Prime Developers Ltd.',
      legalEntity: 'Ahmedabad Prime Infrastructure & Realty LLP',
      reraLicense: 'PR/GJ/DEV/2026/00192',
      contactEmail: 'corporate@propassist.ai',
      contactPhone: '+917926871200',
      activeProjectsCount: 3,
      totalUnits: 580,
      status: 'Active'
    }
  });

  const org2 = await prisma.organization.upsert({
    where: { id: 'org-heritage-gujarat' },
    update: {},
    create: {
      id: 'org-heritage-gujarat',
      name: 'Gujarat Heritage Real Estate LLP',
      legalEntity: 'Gujarat Heritage Infrastructure Private Limited',
      reraLicense: 'PR/GJ/DEV/2026/00341',
      contactEmail: 'heritage@propassist.ai',
      contactPhone: '+917926879800',
      activeProjectsCount: 1,
      totalUnits: 120,
      status: 'Active'
    }
  });
  console.log('✅ 1. Organizations created:', org1.name, '&', org2.name);

  // ─── 2. VERIFIED USERS ACROSS ALL 4 ROLES ───────────────────
  const allUsers = [
    // Super Admins
    {
      email: 'superadmin@propassist.ai',
      password: 'Admin@123',
      name: 'Principal Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+919876543210'
    },
    {
      email: 'compliance@propassist.ai',
      password: 'Admin@123',
      name: 'Kavita Iyer (Chief Regulatory Officer)',
      role: 'SUPER_ADMIN',
      phone: '+919876543211'
    },
    // Sales Heads
    {
      email: 'saleshead@propassist.ai',
      password: 'Sales@123',
      name: 'Vikramaditya Mehta (Sales Head)',
      role: 'SALES_HEAD',
      phone: '+919825012345'
    },
    {
      email: 'rituja.parikh@propassist.ai',
      password: 'Sales@123',
      name: 'Rituja Parikh (VP Commercial Sales)',
      role: 'SALES_HEAD',
      phone: '+919825012346'
    },
    // Sales Executives
    {
      email: 'executive1@propassist.ai',
      password: 'Exec@123',
      name: 'Pooja Sharma (Senior Executive)',
      role: 'SALES_EXECUTIVE',
      phone: '+919825054321'
    },
    {
      email: 'executive2@propassist.ai',
      password: 'Exec@123',
      name: 'Rahul Sharma (Property Consultant)',
      role: 'SALES_EXECUTIVE',
      phone: '+919825033445'
    },
    {
      email: 'amit.verma@propassist.ai',
      password: 'Exec@123',
      name: 'Amit Verma (Residential Sales Advisor)',
      role: 'SALES_EXECUTIVE',
      phone: '+919825077889'
    },
    {
      email: 'neha.shah@propassist.ai',
      password: 'Exec@123',
      name: 'Neha Shah (VIP Client Relationship Exec)',
      role: 'SALES_EXECUTIVE',
      phone: '+919825066778'
    },
    // Buyers
    {
      email: 'sakibattar91@gmail.com',
      password: 'Password@123',
      name: 'Sakib Attar',
      role: 'BUYER',
      phone: '+918530493687'
    },
    {
      email: 'buyer@example.com',
      password: 'Buyer@123',
      name: 'Rahul Shah (Homebuyer)',
      role: 'BUYER',
      phone: '+919825099887'
    },
    {
      email: 'dr.rajesh@apolloclinic.com',
      password: 'Buyer@123',
      name: 'Dr. Rajesh Shah',
      role: 'BUYER',
      phone: '+919825233445'
    },
    {
      email: 'sneha.trivedi@corp.in',
      password: 'Buyer@123',
      name: 'Sneha Trivedi',
      role: 'BUYER',
      phone: '+919825122334'
    },
    {
      email: 'deepak.jhaveri@diamonds.in',
      password: 'Buyer@123',
      name: 'Deepak Jhaveri',
      role: 'BUYER',
      phone: '+919825344556'
    },
    {
      email: 'aarav.patel@gujaratmail.com',
      password: 'Buyer@123',
      name: 'Aarav Patel',
      role: 'BUYER',
      phone: '+919824011223'
    },
    {
      email: 'ananya.desai@techventures.in',
      password: 'Buyer@123',
      name: 'Ananya Desai',
      role: 'BUYER',
      phone: '+919825677889'
    }
  ];

  const userMap = {};
  for (const acc of allUsers) {
    const passwordHash = await bcrypt.hash(acc.password, 10);
    const existing = await prisma.user.findFirst({
      where: { email: { equals: acc.email, mode: 'insensitive' } }
    });

    let u;
    if (existing) {
      u = await prisma.user.update({
        where: { id: existing.id },
        data: { name: acc.name, role: acc.role, phone: acc.phone, passwordHash }
      });
    } else {
      u = await prisma.user.create({
        data: {
          name: acc.name,
          email: acc.email.toLowerCase(),
          role: acc.role,
          phone: acc.phone,
          passwordHash
        }
      });
    }
    userMap[acc.email] = u;
    console.log(`✅ 2. User Ready: [${acc.role}] ${acc.name} (${acc.email})`);
  }

  const exec1 = userMap['executive1@propassist.ai'];
  const exec2 = userMap['executive2@propassist.ai'];
  const exec3 = userMap['amit.verma@propassist.ai'];
  const exec4 = userMap['neha.shah@propassist.ai'];
  const salesHead = userMap['saleshead@propassist.ai'];
  const superAdmin = userMap['superadmin@propassist.ai'];
  const sakibUser = userMap['sakibattar91@gmail.com'];
  const rahulBuyer = userMap['buyer@example.com'];
  const rajeshBuyer = userMap['dr.rajesh@apolloclinic.com'];
  const snehaBuyer = userMap['sneha.trivedi@corp.in'];
  const deepakBuyer = userMap['deepak.jhaveri@diamonds.in'];

  // ─── 3. REAL AHMEDABAD PROJECTS ────────────────────────────
  const p1 = await prisma.project.upsert({
    where: { id: 'proj-grand-orchid' },
    update: { status: 'Active', isDemo: false },
    create: {
      id: 'proj-grand-orchid',
      name: 'The Grand Orchid',
      tagline: 'Ultra-Luxury 3 BHK Skyline Residences',
      description: 'Exclusive 22-storey twin architectural towers on SG Highway, Bodakdev, Ahmedabad. Designed for high-net-worth families with unhindered skyline vistas.',
      location: 'SG Highway, Bodakdev, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0338,
      longitude: 72.5074,
      bhkOptions: '3 BHK, 4 BHK Sky Villas',
      minPrice: 8500000,
      maxPrice: 16500000,
      minArea: 1650,
      maxArea: 2950,
      possession: 'December 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
      amenities: JSON.stringify(['Rooftop Infinity Pool', 'State-of-the-Art Gymnasium', 'Banquet Hall', '24/7 Smart Security', 'EV Charging Bay', 'Vastu Compliant Layouts']),
      status: 'Active',
      isDemo: false
    }
  });

  const p2 = await prisma.project.upsert({
    where: { id: 'proj-serene-meadows' },
    update: { status: 'Active', isDemo: false },
    create: {
      id: 'proj-serene-meadows',
      name: 'Serene Meadows',
      tagline: 'Modern 2 & 3 BHK Nature-Infused Living',
      description: 'Eco-friendly residential enclave nestled in South Bopal with 2-acre landscaped green parks, solar grid power and direct SG Highway connectivity.',
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
      amenities: JSON.stringify(['2-Acre Central Garden', 'Solar Grid Lights', 'Clubhouse & Gym', 'Badminton Court', 'Kids Safe Play Area', 'Rainwater Harvesting']),
      status: 'Active',
      isDemo: false
    }
  });

  const p3 = await prisma.project.upsert({
    where: { id: 'proj-skyline-villas' },
    update: { status: 'Active', isDemo: false },
    create: {
      id: 'proj-skyline-villas',
      name: 'Skyline Villas & Mansions',
      tagline: 'Exclusive Low-Density 4 & 5 BHK Sky Mansions',
      description: 'Ultra-exclusive private sanctuary on Ambli-Bopal Road, featuring private plunge pools, Italian marble lobbies, and concierge services.',
      location: 'Ambli Road, Thaltej, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0456,
      longitude: 72.4891,
      bhkOptions: '4 BHK, 5 BHK Sky Mansions',
      minPrice: 18000000,
      maxPrice: 32000000,
      minArea: 3200,
      maxArea: 5400,
      possession: 'March 2027',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10145/2026',
      amenities: JSON.stringify(['Private Plunge Pools', 'Valet & Concierge', 'Temperature-Controlled Squash Court', 'Private Elevator Lobbies', 'Cigar Lounge']),
      status: 'Active',
      isDemo: false
    }
  });
  console.log('✅ 3. Verified Projects: The Grand Orchid, Serene Meadows, Skyline Villas');

  // ─── 4. FACT SHEETS FOR AI GROUNDING ──────────────────────
  await prisma.factSheet.upsert({
    where: { projectId: p1.id },
    update: {},
    create: {
      projectId: p1.id,
      overview: 'The Grand Orchid is a premier residential enclave located on SG Highway, Bodakdev. Twin towers of 22 storeys with 3 BHK (1320-1450 sq ft carpet) and 4 BHK Sky Villas (2200 sq ft carpet).',
      specifications: 'Earthquake-resistant RCC structure (Zone 3 compliance), imported vitrified tiles, Kohler sanitary fittings, UPVC soundproof double-glazed windows, 100% DG power backup.',
      pricingDetails: '3 BHK starting at ₹85 Lakhs plus statutory charges. 4 BHK Sky Villas starting at ₹1.45 Cr. Subvention scheme available (10% token deposit, 80% bank loan, 10% on possession). Approved by SBI, HDFC, and ICICI.',
      connectivity: '2 mins from Iscon Cross Roads, 5 mins from Zydus Hospital, 25 mins from Sardar Vallabhbhai Patel International Airport, 1 km from upcoming Metro Phase 2 station.',
      legalDisclaimers: 'RERA Reg No: PR/GJ/AHMEDABAD/AUDA/RAA10022/2026. Handover statutory guarantee: December 2026.',
      rawContent: 'The Grand Orchid SG Highway Bodakdev: Starting price 85 Lakhs for 3 BHK (carpet 1320 sqft). 4 BHK Sky Villa is 1.45 Cr (carpet 2200 sqft). Handover December 2026. Escrow ICICI Bank. Amenities: Infinity pool, EV charging.'
    }
  });

  await prisma.factSheet.upsert({
    where: { projectId: p2.id },
    update: {},
    create: {
      projectId: p2.id,
      overview: 'Serene Meadows in South Bopal is a family-centric green community spanning 4 towers of 14 storeys, overlooking a 2-acre central park.',
      specifications: 'Branded vitrified tile flooring, granite kitchen platforms, anti-skid balcony tiles, solar water heaters, high-speed Otis elevators.',
      pricingDetails: '2 BHK starting at ₹65 Lakhs (880-1180 sq ft carpet). 3 BHK starting at ₹82 Lakhs (1180-1540 sq ft carpet). Flexi payment plans: 10:80:10. RERA Escrow account with ICICI Bank.',
      connectivity: 'Direct access to SP Ring Road and SG Highway. 10 mins from DPS Bopal and Shanti Asiatic School, 15 mins from Shalby Hospital.',
      legalDisclaimers: 'RERA Reg No: PR/GJ/AHMEDABAD/AUDA/RAA09918/2026. Handover statutory guarantee: October 2026.',
      rawContent: 'Serene Meadows South Bopal: 2 BHK price 65 Lakhs, 3 BHK price 82 Lakhs. 2 acre garden, clubhouse, badminton court. RERA approved October 2026.'
    }
  });
  console.log('✅ 4. RERA Approved Project Fact Sheets Seeded');

  // ─── 5. INVENTORY RESIDENTIAL UNITS ────────────────────────
  const unitsData = [
    { id: 'unit-orchid-1402', projectId: p1.id, unitNumber: 'Tower A - 1402', tower: 'Tower A', floor: 14, configuration: '3 BHK Skyline Residence', carpetAreaSqFt: 1320, superBuiltUpAreaSqFt: 1850, basePrice: 8500000, status: 'Allotted' },
    { id: 'unit-orchid-1801', projectId: p1.id, unitNumber: 'Tower A - 1801', tower: 'Tower A', floor: 18, configuration: '3 BHK Luxury Sky Deck', carpetAreaSqFt: 1450, superBuiltUpAreaSqFt: 2050, basePrice: 9800000, status: 'Booked' },
    { id: 'unit-orchid-2101', projectId: p1.id, unitNumber: 'Tower B - 2101', tower: 'Tower B', floor: 21, configuration: '4 BHK Sky Villa', carpetAreaSqFt: 2200, superBuiltUpAreaSqFt: 2950, basePrice: 14500000, status: 'Allotted' },
    { id: 'unit-orchid-0902', projectId: p1.id, unitNumber: 'Tower B - 0902', tower: 'Tower B', floor: 9, configuration: '3 BHK Panorama', carpetAreaSqFt: 1320, superBuiltUpAreaSqFt: 1850, basePrice: 8700000, status: 'Available' },
    { id: 'unit-serene-0704', projectId: p2.id, unitNumber: 'Tower B - 0704', tower: 'Tower B', floor: 7, configuration: '2 BHK Garden View', carpetAreaSqFt: 880, superBuiltUpAreaSqFt: 1220, basePrice: 6500000, status: 'Booked' },
    { id: 'unit-serene-1102', projectId: p2.id, unitNumber: 'Tower B - 1102', tower: 'Tower B', floor: 11, configuration: '3 BHK Park Panorama', carpetAreaSqFt: 1180, superBuiltUpAreaSqFt: 1650, basePrice: 8200000, status: 'Available' },
    { id: 'unit-serene-0401', projectId: p2.id, unitNumber: 'Tower A - 0401', tower: 'Tower A', floor: 4, configuration: '2 BHK Smart Living', carpetAreaSqFt: 880, superBuiltUpAreaSqFt: 1220, basePrice: 6500000, status: 'Available' },
    { id: 'unit-serene-1203', projectId: p2.id, unitNumber: 'Tower A - 1203', tower: 'Tower A', floor: 12, configuration: '3 BHK Sunrise Terrace', carpetAreaSqFt: 1240, superBuiltUpAreaSqFt: 1720, basePrice: 8500000, status: 'Available' },
    { id: 'unit-skyline-0301', projectId: p3.id, unitNumber: 'Mansion Villa 03', tower: 'Villa Block', floor: 3, configuration: '4 BHK Sky Mansion', carpetAreaSqFt: 3400, superBuiltUpAreaSqFt: 4600, basePrice: 21000000, status: 'Available' }
  ];

  for (const u of unitsData) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: { status: u.status, basePrice: u.basePrice },
      create: u
    });
  }
  console.log('✅ 5. Residential Inventory Units configured');

  // ─── 6. SITE VISIT SLOTS ───────────────────────────────────
  const visitSlots = [
    { id: 'slot-orchid-sat-11am', projectId: p1.id, date: '2026-11-14', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5, bookedCount: 2, assignedExecutiveId: exec1.id, isActive: true },
    { id: 'slot-orchid-sat-3pm', projectId: p1.id, date: '2026-11-14', startTime: '03:30 PM', endTime: '05:00 PM', capacity: 5, bookedCount: 1, assignedExecutiveId: exec1.id, isActive: true },
    { id: 'slot-orchid-sun-11am', projectId: p1.id, date: '2026-11-15', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5, bookedCount: 1, assignedExecutiveId: exec3.id, isActive: true },
    { id: 'slot-serene-sat-11am', projectId: p2.id, date: '2026-11-14', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5, bookedCount: 1, assignedExecutiveId: exec2.id, isActive: true },
    { id: 'slot-serene-sun-11am', projectId: p2.id, date: '2026-11-15', startTime: '11:00 AM', endTime: '12:30 PM', capacity: 5, bookedCount: 2, assignedExecutiveId: exec2.id, isActive: true },
    { id: 'slot-serene-sun-3pm', projectId: p2.id, date: '2026-11-15', startTime: '03:30 PM', endTime: '05:00 PM', capacity: 5, bookedCount: 0, assignedExecutiveId: exec4.id, isActive: true }
  ];

  for (const s of visitSlots) {
    await prisma.visitSlot.upsert({
      where: { id: s.id },
      update: { bookedCount: s.bookedCount, assignedExecutiveId: s.assignedExecutiveId },
      create: s
    });
  }
  console.log('✅ 6. VIP Site Visit Slots ready');

  // ─── 7. MASTER LEADS (7 Funnel Stages + Unassigned for Sales Head) ─────
  const leadsData = [
    {
      id: 'lead-sakib-attar',
      fullName: 'Sakib Attar',
      email: 'sakibattar91@gmail.com',
      phone: '+918530493687',
      budgetMin: 8000000,
      budgetMax: 10000000,
      preferredBhk: '3 BHK',
      preferredLocation: 'SG Highway, Bodakdev',
      timeline: 'Within 3 Months',
      source: 'Self-Registered Buyer',
      status: 'Converted',
      isQualified: true,
      projectId: p1.id,
      assignedExecutiveId: exec1.id,
      notes: 'Reserved Tower A - 1402 (3 BHK Skyline Residence). Initial token deposit of ₹8,50,000 paid via Razorpay. Allotment letter issued.'
    },
    {
      id: 'lead-rahul-shah',
      fullName: 'Rahul Shah',
      email: 'buyer@example.com',
      phone: '+919825099887',
      budgetMin: 6000000,
      budgetMax: 7000000,
      preferredBhk: '2 BHK',
      preferredLocation: 'South Bopal',
      timeline: 'Immediate',
      source: 'AI Chatbot',
      status: 'Visit Scheduled',
      isQualified: true,
      projectId: p2.id,
      assignedExecutiveId: exec2.id,
      notes: 'Interested in Serene Meadows 2 BHK garden-facing unit. Site visit confirmed for Sunday 11 AM.'
    },
    {
      id: 'lead-rajesh-shah',
      fullName: 'Dr. Rajesh Shah',
      email: 'dr.rajesh@apolloclinic.com',
      phone: '+919825233445',
      budgetMin: 14000000,
      budgetMax: 16500000,
      preferredBhk: '4 BHK Sky Villa',
      preferredLocation: 'Bodakdev, SG Highway',
      timeline: 'Immediate',
      source: 'Direct Referral',
      status: 'Converted',
      isQualified: true,
      projectId: p1.id,
      assignedExecutiveId: exec1.id,
      notes: 'High net worth client. Selected Tower B - 2101 Sky Villa. Token payment ₹14,50,000 verified in Escrow.'
    },
    {
      id: 'lead-sneha-trivedi',
      fullName: 'Sneha Trivedi',
      email: 'sneha.trivedi@corp.in',
      phone: '+919825122334',
      budgetMin: 6500000,
      budgetMax: 7500000,
      preferredBhk: '2 BHK',
      preferredLocation: 'South Bopal',
      timeline: '3-6 months',
      source: 'Website',
      status: 'Contacted',
      isQualified: true,
      projectId: p2.id,
      assignedExecutiveId: exec2.id,
      notes: 'Discovery call completed. Sent brochure and floor plans over WhatsApp Click-to-Chat.'
    },
    {
      id: 'lead-deepak-jhaveri',
      fullName: 'Deepak Jhaveri',
      email: 'deepak.jhaveri@diamonds.in',
      phone: '+919825344556',
      budgetMin: 9500000,
      budgetMax: 11000000,
      preferredBhk: '3 BHK Luxury Sky Deck',
      preferredLocation: 'SG Highway',
      timeline: '1-3 months',
      source: 'Campaign',
      status: 'Negotiation',
      isQualified: true,
      projectId: p1.id,
      assignedExecutiveId: exec1.id,
      notes: 'Negotiating subvention payment scheme (10:80:10). EOI token ₹1,00,000 received for Tower A - 1801.'
    },
    {
      id: 'lead-ananya-desai',
      fullName: 'Ananya Desai',
      email: 'ananya.desai@techventures.in',
      phone: '+919825677889',
      budgetMin: 8000000,
      budgetMax: 9500000,
      preferredBhk: '3 BHK',
      preferredLocation: 'South Bopal',
      timeline: '1-3 months',
      source: 'AI Chatbot',
      status: 'Qualified',
      isQualified: true,
      projectId: p2.id,
      assignedExecutiveId: exec3.id,
      notes: 'Pre-approved loan from HDFC Bank for ₹75 Lakhs. Scheduled site visit for Saturday 11 AM.'
    },
    {
      id: 'lead-aarav-patel',
      fullName: 'Aarav Patel',
      email: 'aarav.patel@gujaratmail.com',
      phone: '+919824011223',
      budgetMin: 12000000,
      budgetMax: 15000000,
      preferredBhk: '3 BHK, 4 BHK',
      preferredLocation: 'SG Highway',
      timeline: '1-3 months',
      source: 'AI Chatbot (Gujarati)',
      status: 'New',
      isQualified: true,
      projectId: p1.id,
      assignedExecutiveId: null, // UNASSIGNED -> Sales Head distribution
      notes: 'Buyer inquired in Gujarati about super built-up carpet area and RERA handover guarantee. Awaiting assignment.'
    },
    {
      id: 'lead-manish-mehta',
      fullName: 'Manish Mehta',
      email: 'manish.mehta@textiles.gujarat',
      phone: '+919824055667',
      budgetMin: 6500000,
      budgetMax: 8000000,
      preferredBhk: '2 BHK, 3 BHK',
      preferredLocation: 'South Bopal',
      timeline: 'Exploring',
      source: 'Organic Search',
      status: 'New',
      isQualified: true,
      projectId: p2.id,
      assignedExecutiveId: null, // UNASSIGNED -> Sales Head distribution
      notes: 'Downloaded brochure from public landing page. Looking for immediate site visit slot.'
    },
    {
      id: 'lead-karan-malhotra',
      fullName: 'Karan Malhotra',
      email: 'karan.m@startups.in',
      phone: '+919825455667',
      budgetMin: 3500000,
      budgetMax: 4500000,
      preferredBhk: '2 BHK',
      preferredLocation: 'Bodakdev',
      timeline: 'Exploring',
      source: 'Website Form',
      status: 'Lost',
      isQualified: false,
      projectId: p1.id,
      assignedExecutiveId: exec2.id,
      notes: 'Budget mismatch. Bodakdev units start at ₹85L. Lead archived politely.'
    }
  ];

  for (const l of leadsData) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: { status: l.status, assignedExecutiveId: l.assignedExecutiveId, notes: l.notes },
      create: l
    });
  }
  console.log('✅ 7. Master Leads pipeline populated (10 Leads, including Unassigned for Sales Head)');

  // ─── 8. LEAD ASSIGNMENT HISTORY (Sales Head Tracking) ────────
  const assignments = [
    { leadId: 'lead-sakib-attar', executiveId: exec1.id, assignedById: salesHead.id, reason: 'VIP Buyer Direct Allocation' },
    { leadId: 'lead-rahul-shah', executiveId: exec2.id, assignedById: salesHead.id, reason: 'South Bopal Specialist Rotation' },
    { leadId: 'lead-rajesh-shah', executiveId: exec1.id, assignedById: salesHead.id, reason: 'High-Value Penthouse Lead Assigned to Senior Exec' },
    { leadId: 'lead-sneha-trivedi', executiveId: exec2.id, assignedById: salesHead.id, reason: 'Fair Round-Robin Distribution' },
    { leadId: 'lead-deepak-jhaveri', executiveId: exec1.id, assignedById: salesHead.id, reason: 'Subvention Scheme Negotiation Assignment' },
    { leadId: 'lead-ananya-desai', executiveId: exec3.id, assignedById: salesHead.id, reason: 'Workload Balancing to Executive 3' }
  ];

  for (const a of assignments) {
    const existing = await prisma.leadAssignment.findFirst({
      where: { leadId: a.leadId, executiveId: a.executiveId }
    });
    if (!existing) {
      await prisma.leadAssignment.create({ data: a });
    }
  }
  console.log('✅ 8. Lead Assignment history recorded');

  // ─── 9. INTERNAL NOTES (Executive CRM) ──────────────────────
  const internalNotes = [
    { leadId: 'lead-sakib-attar', authorId: exec1.id, content: 'Spoke with Sakib Attar. Customer confirmed token advance payment and reviewed RERA Escrow account verification certificate. High satisfaction rating.' },
    { leadId: 'lead-rajesh-shah', authorId: exec1.id, content: 'Dr. Shah verified Vastu compliance of Tower B - 2101 (North-East master bedroom). Handover scheduled for Dec 2026. Approved full subvention scheme.' },
    { leadId: 'lead-deepak-jhaveri', authorId: exec1.id, content: 'Discussed milestone construction schedule. Agreement value fixed at ₹98 Lakhs. Cheque clearance in progress.' },
    { leadId: 'lead-rahul-shah', authorId: exec2.id, content: 'Followed up via WhatsApp. Buyer requested confirmation of clubhouse gym facilities and children play area.' }
  ];

  for (const n of internalNotes) {
    const existing = await prisma.internalNote.findFirst({
      where: { leadId: n.leadId, authorId: n.authorId, content: n.content }
    });
    if (!existing) {
      await prisma.internalNote.create({ data: n });
    }
  }
  console.log('✅ 9. Internal Executive CRM Notes logged');

  // ─── 10. SITE VISIT BOOKINGS & REMINDERS ────────────────────
  const bookingsData = [
    {
      id: 'book-sakib-visit',
      leadId: 'lead-sakib-attar',
      slotId: 'slot-orchid-sat-11am',
      buyerName: 'Sakib Attar',
      buyerPhone: '+918530493687',
      buyerEmail: 'sakibattar91@gmail.com',
      bookingDate: '2026-11-14',
      timeSlot: '11:00 AM - 12:30 PM',
      status: 'Confirmed',
      specialRequests: 'Review 14th floor panoramic balcony view and car parking allotment.',
      confirmationCode: 'PA-VIS-981204'
    },
    {
      id: 'book-rahul-visit',
      leadId: 'lead-rahul-shah',
      slotId: 'slot-serene-sun-11am',
      buyerName: 'Rahul Shah',
      buyerPhone: '+919825099887',
      buyerEmail: 'buyer@example.com',
      bookingDate: '2026-11-15',
      timeSlot: '11:00 AM - 12:30 PM',
      status: 'Confirmed',
      specialRequests: 'Check 2-acre central garden and EV charging bays.',
      confirmationCode: 'PA-VIS-449120'
    },
    {
      id: 'book-ananya-visit',
      leadId: 'lead-ananya-desai',
      slotId: 'slot-serene-sat-11am',
      buyerName: 'Ananya Desai',
      buyerPhone: '+919825677889',
      buyerEmail: 'ananya.desai@techventures.in',
      bookingDate: '2026-11-14',
      timeSlot: '11:00 AM - 12:30 PM',
      status: 'Confirmed',
      specialRequests: 'Inspect sunrise terrace and solar water heating specs.',
      confirmationCode: 'PA-VIS-771239'
    }
  ];

  for (const b of bookingsData) {
    await prisma.booking.upsert({
      where: { confirmationCode: b.confirmationCode },
      update: { status: b.status },
      create: b
    });
  }
  console.log('✅ 10. VIP Site Visit Passes & Bookings recorded');

  // ─── 11. AI CONVERSATIONS & HANDOFFS ───────────────────────
  const conv1 = await prisma.conversation.upsert({
    where: { id: 'conv-sakib-ai' },
    update: {},
    create: {
      id: 'conv-sakib-ai',
      leadId: 'lead-sakib-attar',
      channel: 'Web Chat',
      language: 'en',
      summary: 'Buyer inquired about starting price and carpet area for 3 BHK in The Grand Orchid. AI captured budget of ₹85L and timeline within 3 months.',
      handedOff: false
    }
  });

  const conv2 = await prisma.conversation.upsert({
    where: { id: 'conv-aarav-handoff' },
    update: { handedOff: true, handedOffToId: exec1.id },
    create: {
      id: 'conv-aarav-handoff',
      leadId: 'lead-aarav-patel',
      channel: 'Web Chat',
      language: 'gu',
      summary: 'Buyer requested human advisor consultation in Gujarati regarding Tower A carpet areas and bank subvention plans.',
      handedOff: true,
      handedOffToId: exec1.id,
      handedOffAt: new Date()
    }
  });

  const conv3 = await prisma.conversation.upsert({
    where: { id: 'conv-deepak-handoff' },
    update: { handedOff: true, handedOffToId: exec2.id },
    create: {
      id: 'conv-deepak-handoff',
      leadId: 'lead-deepak-jhaveri',
      channel: 'Web Chat',
      language: 'hi',
      summary: 'Customer wanted negotiation details on subvention payment scheme for Tower A - 1801.',
      handedOff: true,
      handedOffToId: exec2.id,
      handedOffAt: new Date()
    }
  });

  // Seed sample messages inside conversation
  const messages = [
    { conversationId: conv1.id, senderType: 'buyer', senderName: 'Sakib Attar', content: 'What is the starting price for 3 BHK in The Grand Orchid?', language: 'en' },
    { conversationId: conv1.id, senderType: 'ai', senderName: 'PropAssist AI', content: 'Namaste Sakib! The Grand Orchid on SG Highway offers 3 BHK residences starting at ₹85 Lakhs with 1,320 sq.ft carpet area. Possession is guaranteed by December 2026 under RERA guidelines.', language: 'en' },
    { conversationId: conv2.id, senderType: 'buyer', senderName: 'Aarav Patel', content: 'શું મને સેલ્સ એડવાઈઝર સાથે વાત કરાવી શકશો?', language: 'gu' },
    { conversationId: conv2.id, senderType: 'ai', senderName: 'PropAssist AI', content: 'ચોક્કસ! મેં તમારી વિનંતી અમારા વરિષ્ઠ રિલેશનશિપ એડવાઈઝર પૂજા શર્માને મોકલી આપી છે. તેઓ ટૂંક સમયમાં વોટ્સએપ પર તમારો સંપર્ક કરશે.', language: 'gu' }
  ];

  for (const m of messages) {
    const existing = await prisma.message.findFirst({
      where: { conversationId: m.conversationId, content: m.content }
    });
    if (!existing) {
      await prisma.message.create({ data: m });
    }
  }
  console.log('✅ 11. Multilingual AI Conversations & Executive Handoffs configured');

  // ─── 12. JITSI VIDEO CONSULTATION SESSIONS ─────────────────
  const callSessions = [
    {
      id: 'call-sakib-walkthrough',
      leadId: 'lead-sakib-attar',
      executiveId: exec1.id,
      buyerId: sakibUser.id,
      roomName: 'propassist_grandorchid_skyline_1402',
      invitationToken: 'inv_sakib_virtual_tour_7718',
      callType: 'video',
      status: 'Completed',
      scheduledAt: new Date(Date.now() - 86400000),
      durationSeconds: 1140,
      notes: 'Completed 19-minute virtual walkthrough of Tower A 3 BHK sample flat. Buyer satisfied with carpet area layout.'
    },
    {
      id: 'call-rajesh-consultation',
      leadId: 'lead-rajesh-shah',
      executiveId: exec1.id,
      buyerId: rajeshBuyer.id,
      roomName: 'propassist_skyvilla_penthouse_tour',
      invitationToken: 'inv_rajesh_villa_9912',
      callType: 'video',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 86400000),
      notes: 'Scheduled 3D architectural floor plan review for 4 BHK Sky Villa with Dr. Rajesh Shah.'
    },
    {
      id: 'call-deepak-subvention',
      leadId: 'lead-deepak-jhaveri',
      executiveId: exec1.id,
      buyerId: deepakBuyer.id,
      roomName: 'propassist_grandorchid_subvention_desk',
      invitationToken: 'inv_deepak_subvention_4411',
      callType: 'video',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 172800000),
      notes: 'Discussion on 10:80:10 subvention payment schedule and GST calculations.'
    }
  ];

  for (const c of callSessions) {
    const existing = await prisma.callSession.findUnique({ where: { roomName: c.roomName } });
    if (!existing) {
      await prisma.callSession.create({
        data: {
          ...c,
          expiresAt: new Date(Date.now() + 7 * 86400000)
        }
      });
    }
  }
  console.log('✅ 12. Secure Jitsi Meet video consultation sessions registered');

  // ─── 13. VERIFIED ESCROW PAYMENTS (Razorpay) ───────────────
  const paymentsData = [
    {
      transactionRef: 'TXN-RZP-99210041',
      orderId: 'order_Ty10022_sakib',
      paymentId: 'pay_live_99210041',
      signature: 'sig_verified_escrow_sakib',
      buyerId: sakibUser.id,
      buyerName: 'Sakib Attar',
      buyerEmail: 'sakibattar91@gmail.com',
      buyerPhone: '+918530493687',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitNumber: 'Tower A - 1402',
      paymentType: 'Token Booking Deposit (10%)',
      amount: 850000,
      currency: 'INR',
      status: 'Verified',
      paymentMethod: 'Razorpay UPI / NetBanking',
      receiptNumber: 'RCP-2026-0921'
    },
    {
      transactionRef: 'TXN-RZP-77192088',
      orderId: 'order_Ty10044_rajesh',
      paymentId: 'pay_live_77192088',
      signature: 'sig_verified_escrow_rajesh',
      buyerId: rajeshBuyer.id,
      buyerName: 'Dr. Rajesh Shah',
      buyerEmail: 'dr.rajesh@apolloclinic.com',
      buyerPhone: '+919825233445',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitNumber: 'Tower B - 2101',
      paymentType: 'Token Booking Deposit (10%)',
      amount: 1450000,
      currency: 'INR',
      status: 'Verified',
      paymentMethod: 'Razorpay RTGS / Corporate Escrow',
      receiptNumber: 'RCP-2026-0771'
    },
    {
      transactionRef: 'TXN-RZP-88192033',
      orderId: 'order_Ty10033_token',
      paymentId: 'pay_live_88192033',
      signature: 'sig_verified_escrow_token',
      buyerId: rahulBuyer.id,
      buyerName: 'Rahul Shah',
      buyerEmail: 'buyer@example.com',
      buyerPhone: '+919825099887',
      projectId: p2.id,
      projectName: 'Serene Meadows',
      unitNumber: 'Tower B - 0704',
      paymentType: 'Expression of Interest (EOI Token)',
      amount: 50000,
      currency: 'INR',
      status: 'Verified',
      paymentMethod: 'Razorpay UPI',
      receiptNumber: 'RCP-2026-0881'
    },
    {
      transactionRef: 'TXN-RZP-66192055',
      orderId: 'order_Ty10055_deepak',
      paymentId: 'pay_live_66192055',
      signature: 'sig_verified_escrow_deepak',
      buyerId: deepakBuyer.id,
      buyerName: 'Deepak Jhaveri',
      buyerEmail: 'deepak.jhaveri@diamonds.in',
      buyerPhone: '+919825344556',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitNumber: 'Tower A - 1801',
      paymentType: 'EOI Priority Deposit',
      amount: 100000,
      currency: 'INR',
      status: 'Verified',
      paymentMethod: 'Razorpay NetBanking',
      receiptNumber: 'RCP-2026-0661'
    }
  ];

  for (const pay of paymentsData) {
    const exists = await prisma.payment.findUnique({ where: { transactionRef: pay.transactionRef } });
    if (!exists) {
      await prisma.payment.create({ data: pay });
    }
  }
  console.log('✅ 13. Verified Escrow payments & PDF Receipts recorded (Total: ₹24.50 Lakhs)');

  // ─── 14. PROPERTY BOOKINGS & RERA ALLOTMENTS ───────────────
  const propBookings = [
    {
      bookingCode: 'BK-GJ-1402-SAKIB',
      buyerId: sakibUser.id,
      buyerName: 'Sakib Attar',
      buyerEmail: 'sakibattar91@gmail.com',
      buyerPhone: '+918530493687',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitId: 'unit-orchid-1402',
      unitNumber: 'Tower A - 1402',
      tower: 'Tower A',
      configuration: '3 BHK Skyline Residence',
      agreementValue: 8500000,
      paidAmount: 850000,
      paymentPercentage: 10,
      bookingStatus: 'Confirmed & Allotted',
      allotmentStatus: 'Letter Issued',
      allotmentLetterNo: 'ALT-GJ-2026-1402',
      allotmentDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
      assignedExecutiveId: exec1.id,
      bankApproval: 'HDFC & ICICI Approved',
      reraNumber: p1.reraNumber
    },
    {
      bookingCode: 'BK-GJ-2101-RAJESH',
      buyerId: rajeshBuyer.id,
      buyerName: 'Dr. Rajesh Shah',
      buyerEmail: 'dr.rajesh@apolloclinic.com',
      buyerPhone: '+919825233445',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitId: 'unit-orchid-2101',
      unitNumber: 'Tower B - 2101',
      tower: 'Tower B',
      configuration: '4 BHK Sky Villa',
      agreementValue: 14500000,
      paidAmount: 1450000,
      paymentPercentage: 10,
      bookingStatus: 'Confirmed & Allotted',
      allotmentStatus: 'Letter Issued',
      allotmentLetterNo: 'ALT-GJ-2026-2101',
      allotmentDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
      assignedExecutiveId: exec1.id,
      bankApproval: 'SBI Approved',
      reraNumber: p1.reraNumber
    },
    {
      bookingCode: 'BK-GJ-0704-RAHUL',
      buyerId: rahulBuyer.id,
      buyerName: 'Rahul Shah',
      buyerEmail: 'buyer@example.com',
      buyerPhone: '+919825099887',
      projectId: p2.id,
      projectName: 'Serene Meadows',
      unitId: 'unit-serene-0704',
      unitNumber: 'Tower B - 0704',
      tower: 'Tower B',
      configuration: '2 BHK Smart Living',
      agreementValue: 6500000,
      paidAmount: 50000,
      paymentPercentage: 0.77,
      bookingStatus: 'Pending Final KYC',
      allotmentStatus: 'Under Approval',
      allotmentLetterNo: 'ALT-GJ-2026-0704',
      allotmentDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
      assignedExecutiveId: exec2.id,
      bankApproval: 'SBI & Axis Bank Approved',
      reraNumber: p2.reraNumber
    },
    {
      bookingCode: 'BK-GJ-1801-DEEPAK',
      buyerId: deepakBuyer.id,
      buyerName: 'Deepak Jhaveri',
      buyerEmail: 'deepak.jhaveri@diamonds.in',
      buyerPhone: '+919825344556',
      projectId: p1.id,
      projectName: 'The Grand Orchid',
      unitId: 'unit-orchid-1801',
      unitNumber: 'Tower A - 1801',
      tower: 'Tower A',
      configuration: '3 BHK Luxury Sky Deck',
      agreementValue: 9800000,
      paidAmount: 100000,
      paymentPercentage: 1.02,
      bookingStatus: 'Under Subvention Review',
      allotmentStatus: 'Under Approval',
      allotmentLetterNo: 'ALT-GJ-2026-1801',
      allotmentDate: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }),
      assignedExecutiveId: exec1.id,
      bankApproval: 'ICICI Bank Approved',
      reraNumber: p1.reraNumber
    }
  ];

  for (const pb of propBookings) {
    const exists = await prisma.propertyBooking.findFirst({
      where: {
        OR: [
          { bookingCode: pb.bookingCode },
          ...(pb.unitId ? [{ unitId: pb.unitId }] : [])
        ]
      }
    });
    if (!exists) {
      await prisma.propertyBooking.create({ data: pb });
    }
  }
  console.log('✅ 14. Property Bookings & RERA Allotments recorded (Approved & Pending Approval)');

  // ─── 15. REGULATORY DPDP AUDIT LOGS (Super Admin Governance) ─
  const auditEntries = [
    { action: 'SUPER_ADMIN_LOGIN', performedBy: 'superadmin@propassist.ai', role: 'SUPER_ADMIN', details: 'Principal Super Admin logged into Platform Governance Console.' },
    { action: 'ALLOTMENT_APPROVED', performedBy: 'saleshead@propassist.ai', role: 'SALES_HEAD', details: 'Sales Head Vikramaditya Mehta approved provisional allotment ALT-GJ-2026-1402 for Unit Tower A - 1402 (Sakib Attar).' },
    { action: 'ALLOTMENT_APPROVED', performedBy: 'saleshead@propassist.ai', role: 'SALES_HEAD', details: 'Approved provisional allotment certificate ALT-GJ-2026-2101 for 4 BHK Sky Villa (Dr. Rajesh Shah).' },
    { action: 'ESCROW_PAYMENT_VERIFIED', performedBy: 'system@propassist.ai', role: 'SYSTEM', details: 'Cryptographic signature verified for Razorpay payment TXN-RZP-99210041 (₹8,50,000).' },
    { action: 'ESCROW_PAYMENT_VERIFIED', performedBy: 'system@propassist.ai', role: 'SYSTEM', details: 'Verified RTGS Token Payment TXN-RZP-77192088 (₹14,50,000) deposited into RERA Escrow ICICI Bank.' },
    { action: 'LEAD_REASSIGNMENT', performedBy: 'saleshead@propassist.ai', role: 'SALES_HEAD', details: 'Reassigned high-intent prospect to Pooja Sharma (Senior Executive) for VIP Bodakdev walkthrough.' },
    { action: 'SECURITY_RLS_CHECK', performedBy: 'compliance@propassist.ai', role: 'SUPER_ADMIN', details: 'Automated Supabase Row-Level Security verification executed across all 20 public tables. Status: SECURE.' },
    { action: 'FACT_SHEET_UPDATED', performedBy: 'saleshead@propassist.ai', role: 'SALES_HEAD', details: 'Updated Handover Guarantee and subvention policy in The Grand Orchid RERA fact sheet.' }
  ];

  for (const aud of auditEntries) {
    await prisma.auditLog.create({ data: aud }).catch(() => {});
  }
  console.log('✅ 15. Immutable Statutory Audit Logs generated');

  // ─── 16. WHATSAPP CLICK-TO-CHAT ACTIVITY LOGS ──────────────
  const waLogs = [
    {
      channel: 'WhatsApp (Click-to-Chat)',
      direction: 'OUTBOUND',
      recipient: '918530493687',
      recipientName: 'Sakib Attar',
      messageContent: 'Namaste Sakib Attar! Your site visit for The Grand Orchid is confirmed for 2026-11-14 at 11:00 AM. Host: Pooja Sharma.',
      status: 'WHATSAPP_LINK_OPENED',
      providerMessageId: `wa_open_${Date.now()}_1`,
      leadId: 'lead-sakib-attar',
      userId: exec1.id
    },
    {
      channel: 'WhatsApp (Click-to-Chat)',
      direction: 'OUTBOUND',
      recipient: '919825233445',
      recipientName: 'Dr. Rajesh Shah',
      messageContent: 'Namaste Dr. Rajesh Shah, sharing the certified RERA Allotment Certificate ALT-GJ-2026-2101 for Tower B - 2101 Sky Villa.',
      status: 'WHATSAPP_LINK_OPENED',
      providerMessageId: `wa_open_${Date.now()}_2`,
      leadId: 'lead-rajesh-shah',
      userId: exec1.id
    },
    {
      channel: 'WhatsApp (Click-to-Chat)',
      direction: 'OUTBOUND',
      recipient: '919825122334',
      recipientName: 'Sneha Trivedi',
      messageContent: 'Hello Sneha, sharing floor plans and verified carpet area pricing for Serene Meadows 2 BHK in South Bopal.',
      status: 'WHATSAPP_LINK_OPENED',
      providerMessageId: `wa_open_${Date.now()}_3`,
      leadId: 'lead-sneha-trivedi',
      userId: exec2.id
    },
    {
      channel: 'WhatsApp (Click-to-Chat)',
      direction: 'OUTBOUND',
      recipient: '919824011223',
      recipientName: 'Aarav Patel',
      messageContent: 'નમસ્તે આરવભાઈ, ધ ગ્રાન્ડ ઓર્કિડ 3 BHK અને 4 BHK સ્કાય વિલા વિશે સંપૂર્ણ વિગતો અને કાર્પેટ એરિયા માહિતી શેર કરી છે.',
      status: 'WHATSAPP_LINK_OPENED',
      providerMessageId: `wa_open_${Date.now()}_4`,
      leadId: 'lead-aarav-patel',
      userId: exec1.id
    }
  ];

  for (const w of waLogs) {
    await prisma.communicationLog.create({ data: w }).catch(() => {});
  }
  console.log('✅ 16. WhatsApp Click-to-Chat activity logs recorded');

  console.log('\n================================================================');
  console.log('🎉 RICH ENTERPRISE PRODUCTION DATABASE SEEDING COMPLETED!');
  console.log('================================================================');
}

seedRichEnterpriseData()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

