'use client';
import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { getEventRegistrationsAction } from '@/server-actions/events';

export default function SlotExport({ eventId, slotId, eventName, slotTime, dayNumber }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const downloadExport = async (format) => {
        setLoading(true);
        try {
            // Fetch registrations for this specific SLOT
            // Passing limit=0 to get ALL records for this slot
            const res = await getEventRegistrationsAction(eventId, 1, 0, 'ALL', slotId);
            if (!res.success) throw new Error(res.error);

            const allRegs = res.registrations;

            // Updated Headers to include Phone and Signature
            const headers = ['ID', 'Name', 'Phone', 'Roll Number', 'Branch', 'Semester', 'Venue', 'Payment', 'Signature'];

            const data = allRegs.map(reg => [
                reg.etamaxId || 'N/A',
                reg.fullName,
                reg.userId?.phone || 'N/A', // Phone Number
                reg.rollNumber,
                reg.branch,
                reg.semester,
                reg.slotId?.venue || 'N/A',
                reg.status === 'CONFIRMED' || reg.status === 'PAID' ? 'PAID' : reg.status,
                '' // Empty for Signature
            ]);

            const filename = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_D${dayNumber}_${slotTime.replace(/[^a-z0-9]/gi, '')}`;

            if (format === 'csv') {
                const csvContent = [
                    headers.join(','),
                    ...data.map(e => e.map(cell => `"${cell}"`).join(',')) // Quote cells to handle commas
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${filename}.csv`;
                link.click();
            }
            else if (format === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();

                // Header Info
                doc.setFontSize(14);
                doc.text(`${eventName}`, 14, 15);
                doc.setFontSize(10);
                doc.text(`Slot: Day ${dayNumber} | ${slotTime}`, 14, 22);
                doc.text(`Total Students: ${allRegs.length}`, 14, 27);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 27);

                autoTable(doc, {
                    startY: 32,
                    head: [headers],
                    body: data,
                    styles: {
                        fontSize: 8,
                        cellPadding: 3,
                        valign: 'middle'
                    },
                    headStyles: { fillColor: [41, 128, 185] },
                    columnStyles: {
                        8: { cellWidth: 40 } // Make Signature column wider
                    },
                    didParseCell: (data) => {
                        // Make signature cells taller
                        if (data.section === 'body' && data.column.index === 8) {
                            data.cell.styles.minCellHeight = 15;
                        }
                    }
                });
                doc.save(`${filename}.pdf`);
            }
        } catch (error) {
            console.error(error);
            alert('Export failed: ' + error.message);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20 flex items-center justify-center"
                title="Download Slot Report"
                disabled={loading}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col">
                        <button
                            onClick={() => downloadExport('csv')}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-sm text-left text-gray-300 hover:text-white transition-colors border-b border-white/5 bg-black"
                        >
                            <FileSpreadsheet size={14} className="text-green-400" /> Excel (CSV)
                        </button>
                        <button
                            onClick={() => downloadExport('pdf')}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-sm text-left text-gray-300 hover:text-white transition-colors bg-black"
                        >
                            <FileText size={14} className="text-red-400" /> PDF Report (Sign)
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
