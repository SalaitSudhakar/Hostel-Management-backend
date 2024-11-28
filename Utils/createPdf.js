// utils/createPdf.js
import pdfkit from 'pdfkit';

// A function to create PDF based on report type and data
const createPdf = async (type, data) => {
  return new Promise((resolve, reject) => {
    const doc = new pdfkit();
    let buffers = [];

    // Collect PDF buffers
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(12);

    if (type === 'expense') {
      // Format expense data in PDF
      doc.text('Expense Report');
      data.forEach(expense => {
        doc.text(`Date: ${expense.date}, Amount: ${expense.amount}`);
      });
    }

    if (type === 'revenue') {
      // Format revenue data in PDF
      doc.text('Revenue Report');
      doc.text(`Total Revenue: $${data[0].revenue}`);
    }

    if (type === 'roomOccupancy') {
      // Format room occupancy data in PDF
      doc.text('Room Occupancy Report');
      doc.text(`Occupancy Rate: ${data[0].occupancyRate}%`);
    }

    doc.end();
  });
};

export default createPdf;
