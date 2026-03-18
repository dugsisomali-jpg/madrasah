'use client';

import { useRef, useState, useEffect } from 'react';
import { Printer, FileDown, Loader2, CheckCircle2, Receipt, Table as TableIcon } from 'lucide-react';
import Swal from 'sweetalert2';

type StudentSummary = {
  studentName: string;
  feePerMonth: number;
  totalDue: number;
  discount: number;
  amountPaid: number;
  periods: { month: number; year: number; amount: number }[];
};

type ParentSummary = {
  batchId: string;
  receiptNumber?: string;
  date: string;
  totalAmount: number;
  parentName: string;
  notes?: string;
  students: StudentSummary[];
  allMonths: { month: number; year: number }[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ParentReceiptPrintable({ batchId, onClose }: { batchId: string; onClose: () => void }) {
  const [summary, setSummary] = useState<ParentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    fetch(`/api/receipts/parent-summary?batchId=${batchId}`)
      .then(r => r.json())
      .then(data => setSummary(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
      body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; background: white; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
      .branding h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; }
      .branding p { margin: 4px 0 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
      .receipt-meta { text-align: right; }
      .receipt-meta p { margin: 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
      .receipt-meta .value { font-size: 16px; color: #0f172a; margin-bottom: 8px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px; }
      .info-card { background: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 16px; }
      .info-card h3 { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin: 0 0 8px; }
      .info-card p { font-size: 16px; font-weight: 600; margin: 0; color: #1e293b; }
      .notes { border-top: 1px solid #e2e8f0; margin-top: 12px; pt-12px; font-size: 12px; color: #64748b; font-style: italic; }
      
      table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
      th { background: #f1f5f9; padding: 12px 16px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; text-align: left; border-bottom: 2px solid #e2e8f0; }
      td { padding: 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
      .col-student { font-weight: 600; color: #0f172a; width: 200px; }
      .amount-cell { text-align: right; font-family: monospace; font-weight: 600; }
      .total-cell { font-weight: 800; color: #0f172a; background: #f8fafc; }
      .footer { margin-top: 60px; text-align: center; }
      .footer p { font-size: 12px; color: #94a3b8; font-weight: 600; }
      
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${summary?.receiptNumber || 'Bulk'}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      pdf.save(`receipt-${summary?.receiptNumber || 'parent'}-${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Generating Pivot Summary...</p>
      </div>
    );
  }

  if (!summary) return <div>Failed to load receipt details.</div>;

  return (
    <div className="flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar p-2">
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-1 shadow-2xl backdrop-blur-xl dark:bg-slate-900/50">
        <div 
          ref={printRef}
          className="bg-white p-10 text-slate-900 rounded-2xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="header flex justify-between items-end border-b-2 border-slate-100 pb-8 mb-10">
            <div className="branding">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Receipt className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">Official Receipt</h1>
              </div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Madrasah Academic Intelligence</p>
            </div>
            <div className="receipt-meta text-right">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Receipt ID</p>
                <p className="text-sm font-mono font-bold text-slate-900 mb-4">#{summary.receiptNumber || summary.batchId.slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Issue Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date(summary.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="info-card bg-slate-50 border border-slate-100 p-6 rounded-2xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing To</h3>
              <p className="text-lg font-bold text-slate-900 mb-3">{summary.parentName}</p>
              {summary.notes && (
                <div className="border-t border-slate-200 mt-4 pt-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase mb-1">Narration</h4>
                  <p className="text-xs text-slate-500 italic leading-relaxed">"{summary.notes}"</p>
                </div>
              )}
            </div>
            <div className="info-card bg-primary/5 border border-primary/10 p-6 rounded-2xl flex flex-col justify-center">
              <h3 className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 text-center sm:text-left">Settlement Amount</h3>
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-4xl font-black text-primary tracking-tighter">{summary.totalAmount.toLocaleString()}</span>
                <span className="text-sm font-bold text-primary/60 uppercase">KES</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                <CheckCircle2 className="h-3 w-3" /> Fully Credited & Synced
              </div>
            </div>
          </div>

          {/* Pivot Table */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6 px-1">
              <div className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center">
                <TableIcon className="h-3 w-3 text-slate-500" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cross-Tabulation Summary</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Student Name</th>
                    {summary.allMonths.map((m, i) => (
                      <th key={i} className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">
                        {MONTHS[m.month - 1]} {m.year % 100}
                      </th>
                    ))}
                    <th className="py-4 px-6 text-[10px] font-black text-primary uppercase tracking-widest border-b border-slate-100 text-right bg-primary/5">Student Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.students.map((student, sIdx) => (
                    <tr key={sIdx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-5 px-6 font-bold text-slate-900 border-r border-slate-50">{student.studentName}</td>
                      {summary.allMonths.map((m, mIdx) => {
                        const paid = student.periods.find(p => p.month === m.month && p.year === m.year);
                        return (
                          <td key={mIdx} className="py-5 px-4 text-right font-mono text-sm text-slate-500">
                            {paid ? paid.amount.toLocaleString() : '—'}
                          </td>
                        );
                      })}
                      <td className="py-5 px-6 text-right font-black text-primary bg-primary/5 italic">
                        {student.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white">
                    <td className="py-4 px-6 text-xs font-black uppercase tracking-widest">Grand Settlement</td>
                    {summary.allMonths.map((m, mIdx) => {
                      const monthTotal = summary.students.reduce((sum, s) => {
                        const p = s.periods.find(px => px.month === m.month && px.year === m.year);
                        return sum + (p ? p.amount : 0);
                      }, 0);
                      return (
                        <td key={mIdx} className="py-4 px-4 text-right font-mono text-xs font-bold text-white/70">
                          {monthTotal > 0 ? monthTotal.toLocaleString() : '—'}
                        </td>
                      );
                    })}
                    <td className="py-4 px-6 text-right font-black text-white text-lg tracking-tighter">
                      {summary.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="footer mt-12 pb-4 text-center">
            <div className="inline-block py-2 px-6 rounded-full border border-slate-100 bg-slate-50/50 mb-4">
              <p className="text-[11px] font-bold text-slate-400">Total Contribution: {summary.totalAmount.toLocaleString()} KES. Thank you!</p>
            </div>
            <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Integrated Academic Management Certificate</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-2">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition-all active:scale-95"
        >
          <Printer className="h-5 w-5" />
          Full Print
        </button>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          Export PDF
        </button>
        <button
          onClick={onClose}
          className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
