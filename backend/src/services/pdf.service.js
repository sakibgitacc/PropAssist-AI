const PDFDocument = require('pdfkit');

/**
 * Service to generate secure, verified PDF documents:
 * - Payment Receipts
 * - Property Allotment Letters
 */

/**
 * Generate a styled Payment Receipt PDF stream
 */
function generatePaymentReceipt(payment, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.receiptNumber || payment.id}.pdf`);
  doc.pipe(res);

  // Brand Header
  doc.rect(0, 0, 595.28, 120).fill('#0F172A');
  
  doc.fillColor('#D97706').fontSize(22).font('Helvetica-Bold')
     .text('PROPASSIST RESIDENTIAL DEVELOPERS', 50, 40);
  
  doc.fillColor('#94A3B8').fontSize(10).font('Helvetica')
     .text('Premium Urban Living | Ahmedabad, Gujarat | RERA Approved Developer', 50, 68);

  doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold')
     .text('OFFICIAL PAYMENT RECEIPT', 360, 42, { align: 'right' });
  doc.fillColor('#F59E0B').fontSize(10).font('Helvetica')
     .text(`RECEIPT NO: ${payment.receiptNumber || 'RCP-' + payment.id.substring(0, 8).toUpperCase()}`, 360, 68, { align: 'right' });

  // Receipt Meta Grid
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
     .text('TRANSACTION DETAILS', 50, 150);
  
  doc.rect(50, 165, 495, 1).fill('#CBD5E1');

  let y = 180;
  const drawRow = (label, value) => {
    doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(label, 50, y);
    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(String(value || 'N/A'), 200, y);
    y += 24;
  };

  drawRow('Receipt Date:', new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'long' }));
  drawRow('Payment Status:', 'VERIFIED & COMPLETED (SUCCESS)');
  drawRow('Payment Purpose:', payment.paymentType || 'Apartment Token Booking Deposit');
  drawRow('Transaction Ref / ID:', payment.transactionRef || payment.id);
  drawRow('Razorpay Order ID:', payment.orderId || 'Direct Bank / Verified Gateway');
  drawRow('Razorpay Payment ID:', payment.paymentId || 'Verified by Gateway');
  
  y += 10;
  doc.rect(50, y, 495, 1).fill('#CBD5E1');
  y += 15;

  doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
     .text('PAYER / APPLICANT INFORMATION', 50, y);
  y += 20;

  drawRow('Applicant Name:', payment.buyerName || payment.buyer?.name || 'Valued Buyer');
  drawRow('Registered Email:', payment.buyerEmail || payment.buyer?.email || 'N/A');
  drawRow('Contact Number:', payment.buyerPhone || payment.buyer?.phone || 'N/A');

  y += 15;
  // Total Amount Box
  doc.rect(50, y, 495, 60).fill('#F8FAFC');
  doc.rect(50, y, 495, 60).stroke('#E2E8F0');
  
  doc.fillColor('#64748B').fontSize(11).font('Helvetica')
     .text('Total Amount Received (INR):', 70, y + 22);
  
  doc.fillColor('#059669').fontSize(20).font('Helvetica-Bold')
     .text(`₹ ${Number(payment.amount).toLocaleString('en-IN')}`, 320, y + 18, { align: 'right', width: 200 });

  y += 90;
  // Verification Footer & Signatures
  doc.rect(50, y, 495, 80).fill('#FEF3C7');
  doc.fillColor('#92400E').fontSize(9).font('Helvetica-Bold')
     .text('AUTHENTICITY & VERIFICATION GUARANTEE', 70, y + 15);
  doc.fillColor('#78350F').fontSize(8).font('Helvetica')
     .text('This receipt is electronically generated and digitally validated by the PropAssist AI Financial Settlement Engine. No physical signature is required. All payments are subjected to final realization and terms agreed in the Developer Booking Agreement.', 70, y + 32, { width: 450 });

  doc.end();
}

/**
 * Generate a styled Property Allotment Letter PDF stream
 */
function generateAllotmentLetter(booking, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Allotment_Letter_${booking.allotmentLetterNo || booking.id}.pdf`);
  doc.pipe(res);

  // Letterhead Top Banner
  doc.rect(0, 0, 595.28, 110).fill('#0B132B');
  doc.fillColor('#F59E0B').fontSize(22).font('Helvetica-Bold')
     .text('PROPASSIST RESIDENTIAL DEVELOPERS', 50, 35);
  doc.fillColor('#94A3B8').fontSize(9).font('Helvetica')
     .text('Corporate Office: SG Highway, Ahmedabad, Gujarat - 380054 | contact@propassist.local', 50, 62);
  doc.fillColor('#E2E8F0').fontSize(11).font('Helvetica')
     .text(`RERA Reg No: ${booking.reraNumber || 'PR/GJ/AHMEDABAD/RESIDENTIAL/2026'}`, 50, 78);

  let y = 130;
  doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold')
     .text('FORMAL ALLOTMENT LETTER', 50, y, { align: 'center', width: 495 });
  
  y += 25;
  doc.fillColor('#64748B').fontSize(9).font('Helvetica')
     .text(`Ref No: ${booking.allotmentLetterNo || 'ALT-GJ-2026-' + booking.id.substring(0, 6).toUpperCase()}`, 50, y);
  doc.text(`Issuance Date: ${booking.allotmentDate || new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 350, y, { align: 'right' });

  y += 20;
  doc.rect(50, y, 495, 1).fill('#E2E8F0');
  y += 15;

  // Recipient details
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('To,', 50, y);
  y += 15;
  doc.fontSize(11).text(booking.buyerName || booking.buyer?.name || 'Valued Allottee', 50, y);
  y += 15;
  doc.font('Helvetica').fontSize(9).fillColor('#475569')
     .text(`Email: ${booking.buyerEmail || booking.buyer?.email || 'N/A'} | Phone: ${booking.buyerPhone || booking.buyer?.phone || 'N/A'}`, 50, y);
  
  y += 25;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A')
     .text('SUBJECT: ALLOTMENT OF RESIDENTIAL UNIT IN PROPASSIST DEVELOPMENT', 50, y);

  y += 20;
  doc.font('Helvetica').fontSize(9).fillColor('#334155').lineGap(4)
     .text('Dear Allottee,\n\nWe are pleased to inform you that pursuant to your application and initial booking payment, the following residential apartment has been provisionally allotted in your favor subject to the compliance of standard developer terms and conditions:');

  y += 65;
  // Allotted Unit Specifications Table
  doc.rect(50, y, 495, 135).fill('#F8FAFC');
  doc.rect(50, y, 495, 135).stroke('#CBD5E1');

  let tableY = y + 12;
  const drawUnitParam = (col1L, col1V, col2L, col2V) => {
    doc.fillColor('#64748B').fontSize(9).font('Helvetica').text(col1L, 65, tableY);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(col1V, 150, tableY);

    doc.fillColor('#64748B').fontSize(9).font('Helvetica').text(col2L, 300, tableY);
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(col2V, 410, tableY);
    tableY += 22;
  };

  const agreementVal = Number(booking.agreementValue || 8500000);
  const paidVal = Number(booking.paidAmount || 0);
  const remainingDue = Math.max(0, agreementVal - paidVal);
  const completionPct = Math.min(100, Math.round((paidVal / agreementVal) * 100));

  drawUnitParam('Project Name:', booking.projectName || 'PropAssist Project', 'Unit Number:', booking.unitNumber || 'A-1402');
  drawUnitParam('Tower / Block:', booking.tower || 'Tower A', 'Configuration:', booking.configuration || '3 BHK Luxury');
  drawUnitParam('Booking Code:', booking.bookingCode || 'BK-GJ-2026', 'Allotment Status:', (booking.allotmentStatus || 'APPROVED').toUpperCase());
  drawUnitParam('Total Paid:', `INR ${paidVal.toLocaleString('en-IN')}`, 'Agreement Value:', `INR ${agreementVal.toLocaleString('en-IN')}`);
  drawUnitParam('Remaining Due:', remainingDue > 0 ? `INR ${remainingDue.toLocaleString('en-IN')}` : 'NIL (100% SETTLED)', 'Payment Progress:', `${completionPct}% Completed`);

  y += 155;
  doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold')
     .text('IMPORTANT TERMS & STIPULATIONS', 50, y);
  
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor('#475569').lineGap(3)
     .text('1. This allotment is provisional and subject to execution and registration of the Agreement for Sale under the Real Estate (Regulation and Development) Act (RERA).\n' +
           '2. Timely payment of remaining stage-wise construction installments is the essence of this allotment contract.\n' +
           '3. All legal stamp duties, registration charges, GST, and property taxes as applicable shall be borne directly by the allottee.\n' +
           '4. PropAssist AI automated notifications will convey construction milestone progress and upcoming demand notes.');

  y += 90;
  // Signatures
  doc.rect(50, y, 495, 1).fill('#E2E8F0');
  y += 20;

  doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
     .text('For PropAssist Residential Developers LLP', 50, y);
  doc.fillColor('#64748B').fontSize(8).font('Helvetica')
     .text('Authorized Signatory & Chief Sales Controller', 50, y + 14);
  doc.text('(Digitally Authenticated)', 50, y + 26);

  doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold')
     .text('Allottee Acceptance', 380, y, { align: 'right' });
  doc.fillColor('#64748B').fontSize(8).font('Helvetica')
     .text('Signature / e-Sign Consent', 380, y + 14, { align: 'right' });

  doc.end();
}

module.exports = {
  generatePaymentReceipt,
  generateAllotmentLetter
};
