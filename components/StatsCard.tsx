import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface OverviewWidgetProps {
  stats: {
    total: number;
    open: number;
    closed: number;
  };
  onFilterClick: (filter: 'total' | 'open' | 'closed') => void;
}

export const OverviewWidget: React.FC<OverviewWidgetProps> = ({ stats, onFilterClick }) => {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-slate-800">Case Overview</h3>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(), 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        {/* Total */}
        <div 
            onClick={() => onFilterClick('total')}
            className="flex flex-col gap-2 cursor-pointer group select-none transition-transform active:scale-95"
        >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Total</span>
            <span className="text-4xl font-extrabold text-slate-900 group-hover:text-slate-700 transition-colors">{stats.total}</span>
            <div className="flex gap-1 h-1.5 w-14 mt-1">
                <div className="h-full w-full bg-slate-800 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="h-full w-full bg-slate-800 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="h-full w-full bg-slate-800 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-100 mx-4"></div>

        {/* Open */}
        <div 
            onClick={() => onFilterClick('open')}
            className="flex flex-col gap-2 cursor-pointer group select-none transition-transform active:scale-95"
        >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Active</span>
            <span className="text-4xl font-extrabold text-blue-600 group-hover:text-blue-700 transition-colors">{stats.open}</span>
            <div className="flex gap-1 h-1.5 w-14 mt-1">
                <div className="h-full w-full bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                <div className="h-full w-full bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                <div className="h-full w-full bg-blue-500 rounded-full opacity-30 group-hover:opacity-60 transition-opacity"></div>
            </div>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-100 mx-4"></div>

        {/* Closed */}
        <div 
            onClick={() => onFilterClick('closed')}
            className="flex flex-col gap-2 cursor-pointer group select-none transition-transform active:scale-95"
        >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Resolved</span>
            <span className="text-4xl font-extrabold text-emerald-500 group-hover:text-emerald-600 transition-colors">{stats.closed}</span>
            <div className="flex gap-1 h-1.5 w-14 mt-1">
                <div className="h-full w-full bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors"></div>
                <div className="h-full w-full bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors"></div>
                <div className="h-full w-full bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors"></div>
            </div>
        </div>
      </div>
    </div>
  );
};