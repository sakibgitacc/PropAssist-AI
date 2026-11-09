const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../db/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

// GET /api/projects (Public or authenticated)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        images: true,
        factSheet: true,
        units: { orderBy: { unitNumber: 'asc' } },
        _count: {
          select: {
            visitSlots: { where: { isActive: true } },
            leads: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const parsed = projects.map(p => ({
      ...p,
      amenitiesList: (() => {
        if (!p.amenities) return [];
        try {
          return JSON.parse(p.amenities);
        } catch {
          return typeof p.amenities === 'string' ? p.amenities.split(',').map(s => s.trim()) : [];
        }
      })()
    }));

    return res.json({
      success: true,
      projects: parsed
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        factSheet: true,
        visitSlots: {
          where: { isActive: true },
          take: 10,
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    let amenitiesList = [];
    try {
      amenitiesList = JSON.parse(project.amenities);
    } catch {
      amenitiesList = project.amenities.split(',').map(s => s.trim());
    }

    let parsedSpecs = {};
    if (project.factSheet && project.factSheet.specifications) {
      try {
        parsedSpecs = JSON.parse(project.factSheet.specifications);
      } catch {
        parsedSpecs = { details: project.factSheet.specifications };
      }
    }

    return res.json({
      success: true,
      project: {
        ...project,
        amenitiesList,
        factSheet: project.factSheet ? {
          ...project.factSheet,
          parsedSpecs
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching project by id:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve project details' });
  }
});

const factSheetSchema = z.object({
  overview: z.string().min(10, 'Overview must be at least 10 characters'),
  pricingDetails: z.string().min(5, 'Pricing details are required'),
  connectivity: z.string().min(5, 'Connectivity details are required'),
  specifications: z.union([z.string(), z.record(z.any())]),
  legalDisclaimers: z.string().optional(),
  rawContent: z.string().min(20, 'Fact sheet knowledge content for AI is required')
});

// PUT /api/projects/:id/factsheet (Admin/Sales Head)
router.put('/:id/factsheet', authenticateToken, requireRole(['ADMIN', 'SALES_HEAD']), validateBody(factSheetSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { overview, pricingDetails, connectivity, specifications, legalDisclaimers, rawContent } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const specsString = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;

    const updatedFactSheet = await prisma.factSheet.upsert({
      where: { projectId: id },
      update: {
        overview,
        pricingDetails,
        connectivity,
        specifications: specsString,
        legalDisclaimers: legalDisclaimers || 'DISCLAIMER (DEMO): For demonstration purposes only.',
        rawContent,
        lastUpdatedBy: req.user.name
      },
      create: {
        projectId: id,
        overview,
        pricingDetails,
        connectivity,
        specifications: specsString,
        legalDisclaimers: legalDisclaimers || 'DISCLAIMER (DEMO): For demonstration purposes only.',
        rawContent,
        lastUpdatedBy: req.user.name
      }
    });

    return res.json({
      success: true,
      message: 'Fact Sheet updated successfully',
      factSheet: updatedFactSheet
    });
  } catch (error) {
    console.error('Error updating fact sheet:', error);
    return res.status(500).json({ success: false, error: 'Failed to update fact sheet' });
  }
});

module.exports = router;
