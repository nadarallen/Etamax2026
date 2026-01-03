import jsPDF from 'jspdf';

export const generateReceipt = (data) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5'
    });

    // Background color (light for printability usually, but we can do simple white)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 148, 'F');

    // Border
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 138);

    // Header - Institute Name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AGNEL CHARITIES", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.text("FR. C. RODRIGUES INSTITUTE OF TECHNOLOGY", 105, 28, { align: "center" });

    doc.setFontSize(12);
    doc.text("ETAMAX 2026 - OFFICIAL RECEIPT", 105, 40, { align: "center" });

    // Event Details (Right Side)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 50);
    doc.text(`Receipt No: ${data.transactionId || 'OFFLINE-' + Date.now()}`, 160, 55);

    // Student Details (Left Side)
    let y = 60;
    const lineHeight = 8;

    doc.text(`Name: ${data.name}`, 20, y); y += lineHeight;
    doc.text(`Roll No: ${data.rollNo}`, 20, y); y += lineHeight;
    doc.text(`Branch: ${data.branch}`, 20, y); y += lineHeight;
    doc.text(`Email: ${data.email}`, 20, y); y += lineHeight * 2;

    // Payment Details
    doc.setFont("helvetica", "bold");
    doc.text(`Event: ${data.eventName} (${data.eventType})`, 20, y); y += lineHeight;

    // Slot Details
    if (data.slot) {
        doc.text(`Slot Day: Day ${data.slot.dayNumber}`, 20, y); y += lineHeight;
        doc.text(`Time: ${data.slot.startTime} - ${data.slot.endTime}`, 20, y); y += lineHeight;
        doc.text(`Venue: ${data.slot.venue || 'TBA'}`, 20, y); y += lineHeight;
    }

    doc.text(`Amount Paid: Rs. ${data.amount}`, 20, y); y += lineHeight * 2;

    // Footer / Stamp
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signature", 160, 120);

    // Placeholder stamp
    doc.setDrawColor(100, 100, 255);
    doc.setLineWidth(0.5);
    doc.circle(175, 110, 10);
    doc.text("PAID", 170, 111);

    doc.save(`Receipt_ETAMAX_${data.rollNo}.pdf`);
};
