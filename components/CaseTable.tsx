import React, { useState, useMemo, useEffect } from 'react';
import { LogisticsCase } from '../types';
import { 
  AlertTriangle, Clock, X, Package, 
  Truck, Download, ChevronRight, Calendar,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
  ChevronLeft, Filter
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

// --- COMPONENT: CASE FEED (WIDGET) ---
interface CaseFeedProps {
  cases: LogisticsCase[];
  onCaseClick: (c: LogisticsCase) => void;
  onSeeAll: () => void;
}

export const CaseFeed: React.FC<CaseFeedProps> = ({ cases, onCaseClick, onSeeAll }) => {
  // Feed View: Always sort open cases by highest pendency (Priority)
  const feedCases = useMemo(() => {
    return cases
        .filter(c => c.isOpen)
        .sort((a, b) => b.calculatedPendency - a.calculatedPendency);
  }, [cases]);

  return (
    <div className="bg-transparent h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-lg font-bold text-slate-800">Recent Updates</h3>
            <button 
                onClick={onSeeAll}
                className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 group"
            >
                See All <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
            {feedCases.slice(0, 6).map((c) => (
                <div 
                    key={c.id}
                    onClick={() => onCaseClick(c)}
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
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Pending</p>
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
  );
};


// --- COMPONENT: FULL TABLE MODAL ---
interface FullTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LogisticsCase[];
  title: string;
  filterType: 'total' | 'open' | 'closed' | null;
  onCaseClick: (c: LogisticsCase) => void;
}

export const FullTableModal: React.FC<FullTableModalProps> = ({ isOpen, onClose, data, title, filterType, onCaseClick }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof LogisticsCase; direction: 'asc' | 'desc' } | null>(null);
  
  // Date Filtering State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isResolvedView = filterType === 'closed';

  // Reset pagination when data or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [data, sortConfig, title, startDate, endDate]);

  const tableCases = useMemo(() => {
    let filteredItems = [...data];

    // Apply Date Filter
    if (startDate || endDate) {
      const start = startDate ? startOfDay(parseISO(startDate)) : null;
      const end = endDate ? endOfDay(parseISO(endDate)) : null;

      filteredItems = filteredItems.filter(c => {
        if (!c.registrationDate) return false;
        if (start && c.registrationDate < start) return false;
        if (end && c.registrationDate > end) return false;
        return true;
      });
    }

    // Apply Sorting
    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
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
        // Default sort: highest pendency first for active, or recent registration
        filteredItems.sort((a, b) => b.calculatedPendency - a.calculatedPendency);
    }
    return filteredItems;
  }, [data, sortConfig, startDate, endDate]);

  // Pagination Logic
  const totalPages = Math.ceil(tableCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = tableCases.slice(startIndex, startIndex + itemsPerPage);

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
      "Status": c.isOpen ? 'Active' : 'Resolved',
      "Abnormal Type": c.abnormalType,
      "Description": c.description,
      "Order Status": c.orderStatus,
      "Handling DDL": c.handlingDdl,
      "Updated ETA": c.updatedEta,
      "Close Date": c.caseCloseDate ? format(c.caseCloseDate, 'yyyy-MM-dd') : '',
      "Emergency": c.isEmergency ? "Yes" : "No"
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cases");
    XLSX.writeFile(wb, `Logistics_${title.replace(' ', '_')}.csv`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white z-10 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                    <p className="text-slate-500 mt-1 font-medium">Viewing {tableCases.length} records</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      <div className="text-slate-400">
                        <Filter className="w-4 h-4" />
                      </div>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-600 outline-none focus:text-blue-600 cursor-pointer"
                        placeholder="Start Date"
                      />
                      <span className="text-slate-300">-</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-600 outline-none focus:text-blue-600 cursor-pointer"
                        placeholder="End Date"
                      />
                    </div>

                    <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>
            
            {/* Table Container */}
            <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50/50 p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                                <tr>
                                    <th className="p-5 bg-slate-50">Registration</th>
                                    <th className="p-5 bg-slate-50">Customer</th>
                                    <th className="p-5 bg-slate-50">Order #</th>
                                    <th className="p-5 bg-slate-50">Issue Type</th>
                                    <th className="p-5 bg-slate-50">Status</th>
                                    {/* Dynamic Column: Deadline OR Close Date */}
                                    <th className="p-5 bg-slate-50">
                                        {isResolvedView ? 'Close Date' : 'Deadline'}
                                    </th>
                                    {/* Dynamic Column: Pendency OR Time to Close */}
                                    <th 
                                        className="p-5 text-right cursor-pointer group hover:bg-slate-100 transition-colors select-none bg-slate-50"
                                        onClick={() => requestSort('calculatedPendency')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            {isResolvedView ? 'Time to Close' : 'Pendency'}
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
                                {currentItems.map(c => {
                                    const isLongPending = c.isOpen && c.calculatedPendency > 10;
                                    const isResolved = !c.isOpen;
                                    
                                    return (
                                    <tr 
                                        key={c.id} 
                                        onClick={() => onCaseClick(c)} 
                                        className={`group transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:z-10 relative
                                            ${isLongPending 
                                                ? 'bg-orange-50/50 hover:bg-orange-100/60 border-l-4 border-orange-400' 
                                                : isResolved
                                                    ? 'bg-slate-50/30 hover:bg-emerald-50/30 border-l-4 border-transparent hover:border-emerald-300'
                                                    : 'bg-white hover:bg-blue-50/30 border-l-4 border-transparent'
                                            }
                                        `}
                                    >
                                        <td className="p-5 font-medium">{c.registrationDate ? format(c.registrationDate, 'MMM dd, yyyy') : '-'}</td>
                                        <td className="p-5 font-medium text-slate-900">{c.customerName}</td>
                                        <td className="p-5 font-mono text-xs">{c.orderNumber}</td>
                                        <td className="p-5 max-w-xs truncate">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border transition-colors
                                                ${isResolved
                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                    : isLongPending 
                                                        ? 'bg-white border-orange-200 text-orange-700' 
                                                        : 'bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-white group-hover:border-blue-100'
                                                }`}>
                                                {c.abnormalType}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            {isResolved ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                    <CheckCircle2 className="w-3 h-3" /> Resolved
                                                </span>
                                            ) : c.isEmergency ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                                    <AlertTriangle className="w-3 h-3" /> Urgent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        {/* Dynamic Date Cell */}
                                        <td className="p-5 text-slate-500">
                                            {isResolved 
                                                ? (c.caseCloseDate ? format(c.caseCloseDate, 'MMM dd, yyyy') : '-') 
                                                : (c.handlingDdl || '-')
                                            }
                                        </td>
                                        {/* Dynamic Value Cell */}
                                        <td className="p-5 text-right">
                                            <span className={`inline-block px-3 py-1.5 rounded-lg font-bold transition-all duration-300 group-hover:bg-opacity-100
                                                ${isResolved
                                                    ? 'text-slate-600 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                                                    : isLongPending 
                                                        ? 'text-orange-600 bg-orange-100 group-hover:bg-white group-hover:shadow-sm' 
                                                        : 'text-slate-900 group-hover:bg-blue-100 group-hover:text-blue-700'
                                                }`}>
                                                {c.calculatedPendency} Days
                                            </span>
                                        </td>
                                    </tr>
                                )})}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400">No cases found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">
                                Page <span className="font-bold text-slate-800">{currentPage}</span> of <span className="font-bold text-slate-800">{Math.max(1, totalPages)}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};


// --- COMPONENT: CASE DETAIL MODAL ---
interface CaseDetailModalProps {
    caseItem: LogisticsCase | null;
    onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ caseItem, onClose }) => {
    if (!caseItem) return null;
    
    const isResolved = !caseItem.isOpen;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                
                {/* Header with Emergency Badge */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white relative">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl shadow-sm ${isResolved ? 'bg-emerald-50 text-emerald-600' : caseItem.isEmergency ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                            {isResolved ? <CheckCircle2 className="w-8 h-8" /> : caseItem.isEmergency ? <AlertTriangle className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-slate-900">Order #{caseItem.orderNumber}</h3>
                                {caseItem.isEmergency && !isResolved && (
                                    <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-red-200 shadow-lg">
                                        Emergency
                                    </span>
                                )}
                                {isResolved && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                        Resolved
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 font-medium mt-1">{caseItem.customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-white">
                     
                     {/* Highlighted Dates Section */}
                     <div className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        {isResolved ? (
                            <>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Closed Date</span>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">{caseItem.caseCloseDate ? format(caseItem.caseCloseDate, 'MMM dd, yyyy') : '-'}</span>
                                    </div>
                                </div>
                                <div className="w-px bg-slate-200 hidden sm:block"></div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time to Resolve</span>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">{caseItem.calculatedPendency} Days</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Handling Deadline</span>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">{caseItem.handlingDdl || '-'}</span>
                                    </div>
                                </div>
                                <div className="w-px bg-slate-200 hidden sm:block"></div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Updated ETA</span>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Truck className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">{caseItem.updatedEta || '-'}</span>
                                    </div>
                                </div>
                                <div className="w-px bg-slate-200 hidden sm:block"></div>
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Pendency</span>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">{caseItem.calculatedPendency} Days</span>
                                    </div>
                                </div>
                            </>
                        )}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Logistics Details</h4>
                            <div className="space-y-4">
                                <DetailRow label="Warehouse" value={caseItem.warehouse} />
                                <DetailRow label="Partner" value={caseItem.deliveryPartner} />
                                <DetailRow label="AWB Number" value={caseItem.awbNumber} />
                                <DetailRow label="Status" value={caseItem.orderStatus} />
                                <DetailRow label="Registration" value={caseItem.registrationDate ? format(caseItem.registrationDate, 'MMM dd, yyyy') : '-'} />
                                <DetailRow label="Contact" value={caseItem.contactNumber} />
                            </div>
                        </div>
                        
                        <div className="flex flex-col h-full">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Issue Description</h4>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col flex-1">
                                <p className="text-slate-600 leading-relaxed italic flex-1 font-medium">
                                    "{caseItem.description || 'No detailed description available.'}"
                                </p>
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <div className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-xs rounded-lg font-bold border border-slate-200 shadow-sm">
                                        Type: {caseItem.abnormalType}
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{label: string, value: any}> = ({label, value}) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
        <span className="text-slate-500 text-sm font-medium">{label}</span>
        <span className="font-bold text-slate-900 text-sm text-right">{value || '-'}</span>
    </div>
);