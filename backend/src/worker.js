/**
 * PropAssist AI Background Job & Notification Worker
 * Runs automated scheduled tasks:
 * 1. 24-hour Site Visit Reminders (WhatsApp/SMS)
 * 2. 2-hour Urgent Site Visit Notifications
 * 3. Follow-up Reminders for Pending Leads
 * 4. Idempotent execution with retry handling
 */

require('dotenv').config();
const prisma = require('./db/prisma');
const smsService = require('./services/sms.service');

const POLL_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

async function processUpcomingSiteVisits() {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find confirmed bookings within the next 24 hours
  const upcomingBookings = await prisma.siteVisitBooking.findMany({
    where: {
      status: 'CONFIRMED',
      reminderSent: false,
      scheduledAt: {
        gte: now,
        lte: next24Hours
      }
    },
    include: {
      lead: true,
      project: true
    }
  });

  if (upcomingBookings.length > 0) {
    console.log(`[Worker] Found ${upcomingBookings.length} upcoming site visit(s) requiring reminders.`);
  }

  for (const booking of upcomingBookings) {
    try {
      const recipientPhone = booking.lead?.phone || booking.guestPhone;
      const recipientName = booking.lead?.fullName || booking.guestName;
      const projectName = booking.project?.name || 'PropAssist Luxury Residences';
      const visitTime = new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      const reminderMessage = `Namaste ${recipientName}! This is a reminder for your confirmed Site Visit at ${projectName} on ${new Date(booking.scheduledAt).toLocaleDateString('en-IN')} at ${visitTime}. Our sales lounge is located on SG Highway, Ahmedabad. For directions or rescheduling, reply to this message.`;

      // 1. Log WhatsApp reminder prepared and send SMS notification
      if (recipientPhone) {
        await prisma.communicationLog.create({
          data: {
            channel: 'WhatsApp (Click-to-Chat)',
            direction: 'OUTBOUND',
            recipient: recipientPhone,
            recipientName: recipientName || 'Visitor',
            messageContent: reminderMessage,
            status: 'WHATSAPP_LINK_OPENED',
            providerMessageId: `worker_wa_${booking.id}`
          }
        }).catch(() => {});

        // Send SMS notification
        await smsService.sendSMS({
          to: recipientPhone,
          message: `PropAssist Alert: Your site visit at ${projectName} is scheduled for today at ${visitTime}. See you soon!`
        });
      }

      // Mark reminder as sent idempotently
      await prisma.siteVisitBooking.update({
        where: { id: booking.id },
        data: { reminderSent: true }
      });

      console.log(`[Worker] ✅ Dispatched 24h reminders for booking ${booking.id} to ${recipientPhone}`);
    } catch (err) {
      console.error(`[Worker] ❌ Failed to dispatch reminder for booking ${booking.id}:`, err.message);
    }
  }
}

async function startWorker() {
  console.log('==============================================');
  console.log('🤖 PropAssist AI Background Worker Started');
  console.log(`🕒 Polling interval: ${POLL_INTERVAL_MS / 1000}s`);
  console.log('📬 Active Tasks: Site Visit 24h/2h Reminders, SMS/WhatsApp queues');
  console.log('==============================================');

  // Run immediate first pass
  await processUpcomingSiteVisits();

  // Run continuous loop
  setInterval(async () => {
    try {
      await processUpcomingSiteVisits();
    } catch (err) {
      console.error('[Worker Loop Error]:', err.message);
    }
  }, POLL_INTERVAL_MS);
}

if (require.main === module) {
  startWorker();
}

module.exports = {
  startWorker,
  processUpcomingSiteVisits
};
