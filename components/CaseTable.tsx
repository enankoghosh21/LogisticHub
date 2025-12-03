import React, { useState, useMemo } from 'react';
import { LogisticsCase } from '../types';
import { 
  AlertTriangle, Clock, X, Package, 
  Truck, Download, ChevronRight, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface CaseTableProps {
  cases: LogisticsCase[];
}

export const CaseTable: React.FC<CaseTableProps> = ({ cases }) => {
  const [selectedCase, setSelectedCase] = useState<LogisticsCase | null>(null);
  const [isFullTableOpen, setIsFullTableOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof LogisticsCase; direction: 'asc' | 'desc' } | null>(null);

  // Filter for open cases
  const baseOpenCases = useMemo(() => cases.filter(c => c.isOpen), [cases]);

  // Feed View: Always sort by highest pendency (Priority)
  const feedCases = useMemo(() => {
    return [...baseOpenCases].sort((a, b) => b.calculatedPendency - a.calculatedPendency);
  }, [baseOpenCases]);

  // Full Table View: Allow sorting
  const tableCases = useMemo(() => {
    let sortableItems = [...baseOpenCases];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortConfig.key];
        // @ts-ignore
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
        // Default sort for table: highest pendency first
        sortableItems.sort((a, b) => b.calculatedPendency - a.calculatedPendency);
    }
    return sortableItems;
  }, [baseOpenCases, sortConfig]);

  const requestSort = (key: keyof LogisticsCase) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (tableCases.length === 0) return;
    const exportData = tableCases.map(c => ({
      "Registration Date": c.registrationDate ? format(c.registrationDate, 'yyyy-MM-dd') : '',
      "Customer Name": c.customerName,
      "Order Number": c.orderNumber,
      "Pendency Days": c.calculatedPendency,
      "Abnormal Type": c.abnormalType,
      "Description": c.description,
      "Order Status": c.orderStatus,
      "Handling DDL": c.handlingDdl,
      "Updated ETA": c.updatedEta,
      "Emergency": c.isEmergency ? "Yes" : "No"
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Open Cases");
    XLSX.writeFile(wb, `Logistics_Open_Cases.csv`);
  };

  // Widget View (Feed)
  return (
    <>
      <div className="bg-transparent h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-lg font-bold text-slate-800">Recent Updates</h3>
            <button 
                onClick={() => setIsFullTableOpen(true)}
                className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
            >
                See All <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
            {feedCases.slice(0, 6).map((c) => (
                <div 
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between relative overflow-hidden"
                >
                    <div className="flex items-center gap-4 relative z-10">
                        {/* Icon Box */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${c.isEmergency ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                            {c.isEmergency ? <AlertTriangle className="w-5 h-5" strokeWidth={2.5} /> : <Package className="w-5 h-5" strokeWidth={2.5} />}
                        </div>
                        
                        {/* Text Info */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">Order #{c.orderNumber}</h4>
                                {c.isEmergency && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{c.abnormalType}</p>
                        </div>
                    </div>

                    <div className="text-right relative z-10">
                        <p className={`text-sm font-extrabold ${c.calculatedPendency > 10 ? 'text-orange-500' : 'text-slate-700'}`}>{c.calculatedPendency} days</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Pending</p>
                    </div>
                </div>
            ))}
            {feedCases.length === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 border-dashed">
                    <p className="text-slate-400 text-sm font-medium">No active cases found.</p>
                </div>
            )}
        </div>
      </div>

      {/* Full Table Modal */}
      {isFullTableOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={() => setIsFullTableOpen(false)}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Active Cases</h2>
                        <p className="text-slate-500 mt-1 font-medium">Viewing {tableCases.length} pending orders</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={() => setIsFullTableOpen(false)} className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
                
                <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50/50 p-8">
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                         <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100">
                                <tr>
                                    <th className="p-5">Registration</th>
                                    <th className="p-5">Customer</th>
                                    <th className="p-5">Order #</th>
                                    <th className="p-5">Issue Type</th>
                                    <th className="p-5">Priority</th>
                                    <th className="p-5">Deadline</th>
                                    <th 
                                        className="p-5 text-right cursor-pointer group hover:bg-slate-100 transition-colors select-none"
                                        onClick={() => requestSort('calculatedPendency')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Pendency
                                            {sortConfig?.key === 'calculatedPendency' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-600" /> : <ArrowDown className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <ArrowUpDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {tableCases.map(c => {
                                    // Visual highlight logic for high pendency
                                    const isLongPending = c.calculatedPendency > 10;
                                    
                                    return (
                                    <tr 
                                        key={c.id} 
                                        onClick={() => setSelectedCase(c)} 
                                        className={`group transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:z-10 relative
                                            ${isLongPending 
                                                ? 'bg-orange-50/50 hover:bg-orange-100/60 border-l-4 border-orange-400' 
                                                : 'bg-white hover:bg-blue-50/30 border-l-4 border-transparent'
                                            }
                                        `}
                                    >
                                        <td className="p-5 font-medium">{c.registrationDate ? format(c.registrationDate, 'MMM dd, yyyy') : '-'}</td>
                                        <td className="p-5 font-medium text-slate-900">{c.customerName}</td>
                                        <td className="p-5 font-mono text-xs">{c.orderNumber}</td>
                                        <td className="p-5 max-w-xs truncate">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border transition-colors
                                                ${isLongPending 
                                                    ? 'bg-white border-orange-200 text-orange-700' 
                                                    : 'bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-white group-hover:border-blue-100'
                                                }`}>
                                                {c.abnormalType}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            {c.isEmergency ? 
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                                    <AlertTriangle className="w-3 h-3" /> Urgent
                                                </span> : 
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                    Active
                                                </span>
                                            }
                                        </td>
                                        <td className="p-5 text-slate-500">{c.handlingDdl || '-'}</td>
                                        <td className="p-5 text-right">
                                            <span className={`inline-block px-3 py-1.5 rounded-lg font-bold transition-all duration-300 group-hover:bg-opacity-100
                                                ${isLongPending 
                                                    ? 'text-orange-600 bg-orange-100 group-hover:bg-white group-hover:shadow-sm' 
                                                    : 'text-slate-900 group-hover:bg-blue-100 group-hover:text-blue-700'
                                                }`}>
                                                {c.calculatedPendency} Days
                                            </span>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                         </table>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedCase(null)}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                
                {/* Header with Emergency Badge */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white relative">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl shadow-sm ${selectedCase.isEmergency ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                            {selectedCase.isEmergency ? <AlertTriangle className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-slate-900">Order #{selectedCase.orderNumber}</h3>
                                {selectedCase.isEmergency && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-red-200 shadow-lg">
                                        Emergency
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium mt-1">{selectedCase.customerName}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-white">
                     
                     {/* Highlighted Dates Section */}
                     <div className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Handling Deadline</span>
                            <div className="flex items-center gap-3 mt-2">
                                 <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                 </div>
                                 <span className="text-lg font-bold text-slate-900">{selectedCase.handlingDdl || '-'}</span>
                            </div>
                        </div>
                        <div className="w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Updated ETA</span>
                            <div className="flex items-center gap-3 mt-2">
                                 <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <Truck className="w-4 h-4 text-blue-500" />
                                 </div>
                                 <span className="text-lg font-bold text-slate-900">{selectedCase.updatedEta || '-'}</span>
                            </div>
                        </div>
                        <div className="w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Pendency</span>
                             <div className="flex items-center gap-3 mt-2">
                                 <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                 </div>
                                 <span className="text-lg font-bold text-slate-900">{selectedCase.calculatedPendency} Days</span>
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Logistics Details</h4>
                            <div className="space-y-4">
                                <DetailRow label="Warehouse" value={selectedCase.warehouse} />
                                <DetailRow label="Partner" value={selectedCase.deliveryPartner} />
                                <DetailRow label="AWB Number" value={selectedCase.awbNumber} />
                                <DetailRow label="Status" value={selectedCase.orderStatus} />
                                <DetailRow label="Registration" value={selectedCase.registrationDate ? format(selectedCase.registrationDate, 'MMM dd, yyyy') : '-'} />
                                <DetailRow label="Contact" value={selectedCase.contactNumber} />
                            </div>
                        </div>
                        
                        <div className="flex flex-col h-full">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Issue Description</h4>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col flex-1">
                                <p className="text-slate-600 leading-relaxed italic flex-1 font-medium">
                                    "{selectedCase.description || 'No detailed description available.'}"
                                </p>
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <div className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs rounded-lg font-bold border border-slate-200 shadow-sm">
                                        Type: {selectedCase.abnormalType}
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

const DetailRow: React.FC<{label: string, value: any}> = ({label, value}) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <span className="font-bold text-slate-900 text-sm text-right">{value || '-'}</span>
    </div>
);
