import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { OverviewWidget } from './components/StatsCard';
import { PendencyChart } from './components/Charts';
import { CaseTable } from './components/CaseTable';
import { processRawData } from './utils/dataProcessor';
import { LogisticsCase } from './types';
import { 
  Truck, 
  RefreshCcw,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<LogisticsCase[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Computed Statistics
  const stats = useMemo(() => {
    const total = data.length;
    const open = data.filter(c => c.isOpen);
    const emergency = open.filter(c => c.isEmergency);
    const totalPendency = open.reduce((acc, curr) => acc + curr.calculatedPendency, 0);
    const avgPendency = open.length ? Math.round(totalPendency / open.length) : 0;
    
    return {
      totalCases: total,
      openCases: open.length,
      closedCases: total - open.length,
      emergencyCases: emergency,
      avgPendency
    };
  }, [data]);

  const handleDataLoaded = (rawData: any[]) => {
    const processed = processRawData(rawData);
    setData(processed);
    setLastUpdated(new Date());
  };

  const resetData = () => {
    setData([]);
    setLastUpdated(null);
  };

  const emergencyCount = stats.emergencyCases.length;

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-slate-50/50">
      
      {/* 1. Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-slate-200/60 shadow-sm">
         <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-2.5 rounded-xl shadow-lg shadow-slate-200">
                 <Truck className="text-white w-5 h-5" strokeWidth={2.5} />
             </div>
             <span className="text-xl font-bold tracking-tight text-slate-900">LOGISTIC<span className="text-blue-600">HUB</span></span>
         </div>

         {data.length > 0 && (
            <button 
                onClick={resetData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors"
            >
                <RefreshCcw className="w-4 h-4" />
                <span>Upload New File</span>
            </button>
         )}
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8 animate-fade-in">
        {data.length === 0 ? (
           <div className="mt-20 flex flex-col items-center justify-center animate-slide-up">
               <div className="text-center mb-12 max-w-2xl">
                   <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Logistics Dashboard</h1>
                   <p className="text-lg text-slate-500 leading-relaxed">
                       Streamline your operations. Upload your daily excel sheet to generate real-time insights on case pendency, bottlenecks, and emergency actions.
                   </p>
               </div>
               <FileUpload onDataLoaded={handleDataLoaded} />
           </div>
        ) : (
          <div className="grid grid-cols-12 gap-6 lg:gap-8 animate-slide-up">
             
             {/* LEFT COLUMN (Main Visuals) - Span 8 */}
             <div className="col-span-12 xl:col-span-8 flex flex-col gap-6 lg:gap-8">
                
                {/* 1. Pendency Chart */}
                <div className="h-[420px]">
                    <PendencyChart data={data} avgPendency={stats.avgPendency} />
                </div>

                {/* 2. Emergency Card */}
                <div className="w-full">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 p-8 rounded-[2rem] shadow-xl shadow-red-200 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
                        
                        {/* Decorative background shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                        <div className="relative z-10 text-white flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <AlertOctagon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-red-100 font-bold tracking-wider text-xs uppercase">Action Required</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-2">Emergency Attention</h3>
                            <p className="text-red-100 max-w-md text-sm font-medium leading-relaxed">
                                You have <strong className="text-white text-lg">{emergencyCount} urgent cases</strong> requiring immediate follow-up. 
                                High priority orders may impact SLA if not resolved today.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 md:mt-0 md:ml-8 flex flex-col items-end gap-4">
                             <div className="flex -space-x-4">
                                {stats.emergencyCases.slice(0, 4).map((_, i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-rose-500 bg-white shadow-md flex items-center justify-center text-sm font-bold text-rose-600 relative z-0 hover:z-10 hover:scale-110 transition-transform">
                                        !
                                    </div>
                                ))}
                                {emergencyCount > 4 && (
                                    <div className="w-12 h-12 rounded-full border-4 border-rose-500 bg-rose-800 flex items-center justify-center text-xs font-bold text-white relative z-0">
                                        +{emergencyCount - 4}
                                    </div>
                                )}
                             </div>
                             
                             {/* Placeholder for action, since scrolling to list handles it */}
                             <div className="flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                                 <span>Check Case Feed</span>
                                 <ArrowRight className="w-3 h-3" />
                             </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* RIGHT COLUMN (Sidebar Stats) - Span 4 */}
             <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 lg:gap-8 h-full">
                 
                 {/* 1. Overview Widget */}
                 <OverviewWidget 
                    stats={{ 
                        total: stats.totalCases, 
                        open: stats.openCases, 
                        closed: stats.closedCases 
                    }} 
                 />

                 {/* 2. Recent Cases Feed */}
                 <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-h-[400px]">
                    <CaseTable cases={data} />
                 </div>

             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;