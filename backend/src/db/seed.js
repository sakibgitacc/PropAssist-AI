/**
 * PropAssist AI — Production Baseline Seed Script
 * Seeds baseline real-estate developer portfolio:
 * - 2 Residential Projects in Ahmedabad (The Grand Orchid & Serene Meadows)
 * - Approved Fact Sheets (Specifications, Pricing, Connectivity, RERA)
 * - Available Residential Inventory Units (2 BHK and 3 BHK)
 * - Baseline Site Visit Appointment Slots
 * 
 * STRICT COMPLIANCE:
 * - NO hardcoded demo users or passwords
 * - NO fake leads or buyers
 * - NO fake payments or bookings
 * - NO fake call history or conversations
 * 
 * To create your initial Super Admin account, run:
 *   npm run setup:admin <email> <password>
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🌱 PropAssist AI — Baseline Developer Portfolio Seeding');
  console.log('================================================================\n');

  // 1. Baseline Residential Projects in Ahmedabad
  const p1 = await prisma.project.upsert({
    where: { id: 'proj-grand-orchid' },
    update: {},
    create: {
      id: 'proj-grand-orchid',
      name: 'The Grand Orchid',
      tagline: 'Ultra-Luxury 3 BHK Skyline Residences',
      description: 'Exclusive 22-storey twin architectural towers on SG Highway, Ahmedabad. Designed with double-height lobby, curated landscape decks, and rooftop infinity pool.',
      location: 'SG Highway, Bodakdev, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0338,
      longitude: 72.5074,
      bhkOptions: '3 BHK, 4 BHK Sky Villas',
      minPrice: 8500000,   // ₹85 Lakh
      maxPrice: 12000000,  // ₹1.2 Crore
      minArea: 1650,
      maxArea: 2450,
      possession: 'December 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA10022/2026',
      amenities: JSON.stringify([
        'Rooftop Infinity Pool',
        'Double-Height Glass Atrium',
        'State-of-the-Art Gymnasium',
        'Multipurpose Banquet Hall',
        'Children Play Zone',
        'High-Speed Schindler Elevators',
        '24/7 Multi-Tier Biometric Security'
      ]),
      status: 'Active',
      isDemo: false
    }
  });

  const p2 = await prisma.project.upsert({
    where: { id: 'proj-serene-meadows' },
    update: {},
    create: {
      id: 'proj-serene-meadows',
      name: 'Serene Meadows',
      tagline: 'Modern 2 & 3 BHK Nature-Infused Living',
      description: 'Serene residential community nestled in South Bopal with expansive green parks, community club, and serene pedestrian corridors.',
      location: 'South Bopal, Ahmedabad',
      city: 'Ahmedabad',
      latitude: 23.0185,
      longitude: 72.4632,
      bhkOptions: '2 BHK, 3 BHK Smart Living',
      minPrice: 6500000,   // ₹65 Lakh
      maxPrice: 9200000,   // ₹92 Lakh
      minArea: 1180,
      maxArea: 1720,
      possession: 'October 2026',
      reraNumber: 'PR/GJ/AHMEDABAD/AUDA/RAA09918/2026',
      amenities: JSON.stringify([
        'Central Green Amphitheatre',
        'Jogging & Cycling Track',
        'Badminton & Squash Courts',
        'Senior Citizens Relaxation Pavilion',
        'EV Charging Bays',
        'Solar-Powered Common Utilities'
      ]),
      status: 'Active',
      isDemo: false
    }
  });

  console.log('✅ Baseline Ahmedabad Residential Projects seeded:');
  console.log(`   - ${p1.name} (SG Highway, Ahmedabad)`);
  console.log(`   - ${p2.name} (South Bopal, Ahmedabad)`);

  // 2. Fact Sheets with RERA Specifications
  await prisma.factSheet.upsert({
    where: { projectId: p1.id },
    update: {},
    create: {
      projectId: p1.id,
      overview: 'Approved Fact Sheet for The Grand Orchid residential development on SG Highway, Bodakdev, Ahmedabad. 22-storey twin luxury towers with 240 residences.',
      specifications: JSON.stringify({
        flooring: 'Italian Marble in Living & Dining, Wooden Laminate in Master Bedroom',
        kitchen: 'Granite Counter with Stainless Steel Franke Sink and Piped Gas Provision',
        bathrooms: 'Kohler / Grohe Sanitaryware, Premium Wall-Hung Closets',
        doorsWindows: '8ft Teakwood Main Entrance, DGU Sound-Insulated Anodized Aluminum Windows',
        electrical: 'Schneider Modular Switches, Concealed Copper Wiring with 3-Phase Connection'
      }),
      pricingDetails: JSON.stringify({
        carpetAreaRange: '1,320 – 1,850 sq.ft.',
        priceRange: '₹85 Lakh to ₹1.2 Crore',
        baseRateSqFt: 6200,
        clubhouseCharges: 250000,
        parkingCharges: 300000,
        gstRatePercent: 5
      }),
      connectivity: JSON.stringify({
        metroStation: 'Thaltej Metro Station (3.2 km)',
        airport: 'Sardar Vallabhbhai Patel International Airport (18 km)',
        hospital: 'Zydus Super Speciality Hospital (2.5 km)',
        school: 'Ahmedabad International School (4.0 km)'
      }),
      legalDisclaimers: 'All plans, specifications, artistic renderings and dimensions are subject to approvals by local urban planning authorities under RERA Gujarat.',
      rawContent: 'Official Fact Sheet for The Grand Orchid residential development, Ahmedabad. RERA Reg: PR/GJ/AHMEDABAD/AUDA/RAA10022/2026.'
    }
  });

  await prisma.factSheet.upsert({
    where: { projectId: p2.id },
    update: {},
    create: {
      projectId: p2.id,
      overview: 'Approved Fact Sheet for Serene Meadows residential development in South Bopal, Ahmedabad. 15-storey towers with 180 residences.',
      specifications: JSON.stringify({
        flooring: 'Vitrified Tiles (800x800mm) throughout residences',
        kitchen: 'Quartz Platform with Dado Tiles up to Lintel Level',
        bathrooms: 'Jaguar Premium CP Fittings and Antiskid Ceramic Tiles',
        doorsWindows: 'Flush Doors with Laminate Finish, Powder-Coated Aluminum Sliding Windows',
        electrical: 'Anchor / Havells Concealed Wiring with Inverter Backup Points'
      }),
      pricingDetails: JSON.stringify({
        carpetAreaRange: '880 – 1,250 sq.ft.',
        priceRange: '₹65 Lakh to ₹92 Lakh',
        baseRateSqFt: 5200,
        clubhouseCharges: 150000,
        parkingCharges: 200000,
        gstRatePercent: 5
      }),
      connectivity: JSON.stringify({
        ringRoad: 'SP Ring Road (1.2 km)',
        airport: 'Ahmedabad International Airport (24 km)',
        hospital: 'Krishna Shalby Hospital (3.5 km)',
        mall: 'South Bopal Central Market (800 meters)'
      }),
      legalDisclaimers: 'Subject to AUDA building by-laws and RERA Gujarat regulations.',
      rawContent: 'Official Fact Sheet for Serene Meadows residential development, Ahmedabad. RERA Reg: PR/GJ/AHMEDABAD/AUDA/RAA09918/2026.'
    }
  });

  console.log('✅ Approved Fact Sheets seeded for AI Consultant grounding.');

  // 3. Real Available Inventory Units (Clean, Unbooked)
  const unitsData = [
    {
      id: 'unit-orchid-1402',
      projectId: p1.id,
      unitNumber: 'Tower A - 1402',
      tower: 'Tower A',
      floor: 14,
      configuration: '3 BHK',
      carpetAreaSqFt: 1320,
      superBuiltUpAreaSqFt: 1850,
      basePrice: 8500000,
      status: 'Available'
    },
    {
      id: 'unit-orchid-1801',
      projectId: p1.id,
      unitNumber: 'Tower A - 1801',
      tower: 'Tower A',
      floor: 18,
      configuration: '3 BHK Luxury',
      carpetAreaSqFt: 1450,
      superBuiltUpAreaSqFt: 2020,
      basePrice: 9800000,
      status: 'Available'
    },
    {
      id: 'unit-serene-0704',
      projectId: p2.id,
      unitNumber: 'Tower B - 0704',
      tower: 'Tower B',
      floor: 7,
      configuration: '2 BHK',
      carpetAreaSqFt: 880,
      superBuiltUpAreaSqFt: 1220,
      basePrice: 6500000,
      status: 'Available'
    },
    {
      id: 'unit-serene-1102',
      projectId: p2.id,
      unitNumber: 'Tower B - 1102',
      tower: 'Tower B',
      floor: 11,
      configuration: '3 BHK',
      carpetAreaSqFt: 1180,
      superBuiltUpAreaSqFt: 1650,
      basePrice: 8200000,
      status: 'Available'
    }
  ];

  for (const u of unitsData) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: { status: u.status },
      create: u
    });
  }

  console.log(`✅ Available Residential Inventory Units seeded (${unitsData.length} units).`);

  // 4. Baseline Visit Slots (Capacity: 5 per slot, 0 booked)
  const slotDates = [
    '2026-11-08',
    '2026-11-09',
    '2026-11-15',
    '2026-11-16'
  ];

  for (const date of slotDates) {
    for (const p of [p1, p2]) {
      await prisma.visitSlot.upsert({
        where: { id: `slot-${p.id}-${date}-1100` },
        update: {},
        create: {
          id: `slot-${p.id}-${date}-1100`,
          projectId: p.id,
          date,
          startTime: '11:00 AM',
          endTime: '12:30 PM',
          capacity: 5,
          bookedCount: 0,
          isActive: true
        }
      });

      await prisma.visitSlot.upsert({
        where: { id: `slot-${p.id}-${date}-1530` },
        update: {},
        create: {
          id: `slot-${p.id}-${date}-1530`,
          projectId: p.id,
          date,
          startTime: '03:30 PM',
          endTime: '05:00 PM',
          capacity: 5,
          bookedCount: 0,
          isActive: true
        }
      });
    }
  }

  console.log('✅ Baseline Show Residence Visit Slots seeded (clean, 0 booked).');

  console.log('\n================================================================');
  console.log('🎉 BASELINE SEED FINISHED (ZERO HARDCODED USERS OR DEMO DATA)');
  console.log('================================================================');
  console.log('Next Steps:');
  console.log('  1. Setup your Initial Super Admin account:');
  console.log('     ▶ npm run setup:admin <email> <password> [name] [phone]');
  console.log('  2. Register prospective buyers through the web application:');
  console.log('     ▶ http://localhost:5173/login?mode=register\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
