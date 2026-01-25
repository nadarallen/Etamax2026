'use client';
import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { getEventRegistrationsAction } from '@/server-actions/events';

export default function QuickExport({ eventId, eventName }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const downloadExport = async (format) => {
        setLoading(true);
        try {
            // Fetch ALL registrations
            const res = await getEventRegistrationsAction(eventId, 1, 0);
            if (!res.success) throw new Error(res.error);

            const allRegs = res.registrations;
            const headers = ['ID', 'Name', 'Roll Number', 'Email', 'Branch', 'Semester', 'Slot Time', 'Venue', 'Status', 'Payment'];
            const data = allRegs.map(reg => [
                reg.etamaxId || 'N/A',
                reg.fullName,
                reg.rollNumber,
                reg.email,
                reg.branch,
                reg.semester,
                reg.slotId ? `D${reg.slotId.dayNumber} ${reg.slotId.startTime}-${reg.slotId.endTime}` : 'Deleted',
                reg.slotId?.venue || 'N/A',
                reg.status,
                reg.paymentMethod || 'Online'
            ]);

            if (format === 'csv') {
                const csvContent = [
                    headers.join(','),
                    ...data.map(e => e.join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`;
                link.click();
            }
            else if (format === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text(`${eventName} - Registrations`, 14, 15);
                doc.setFontSize(10);
                doc.text(`Total: ${allRegs.length} | Generated: ${new Date().toLocaleString()}`, 14, 22);

                autoTable(doc, {
                    startY: 25,
                    head: [headers],
                    body: data,
                    styles: { fontSize: 7, cellPadding: 1 }, // Smaller font for dense table
                    headStyles: { fillColor: [41, 128, 185] },
                });
                doc.save(`${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.pdf`);
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
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors border border-indigo-500/20 flex items-center justify-center"
                title="Download Report"
                disabled={loading}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-2 w-40 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col">
                        <button
                            onClick={() => downloadExport('csv')}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-sm text-left text-gray-300 hover:text-white transition-colors border-b border-white/5"
                        >
                            <FileSpreadsheet size={14} className="text-green-400" /> Excel (CSV)
                        </button>
                        <button
                            onClick={() => downloadExport('pdf')}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-sm text-left text-gray-300 hover:text-white transition-colors"
                        >
                            <FileText size={14} className="text-red-400" /> PDF Report
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
