import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from 'recharts';
import { LogisticsCase } from '../types';

interface ChartsProps {
  data: LogisticsCase[];
  avgPendency?: number;
}

// Helper to truncate text for cleaner chart axes
const truncate = (str: string, length: number) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '..';
}

export const PendencyChart: React.FC<ChartsProps> = ({ data, avgPendency = 0 }) => {
  // Bucket pendency
  const buckets = {
    '0-3': 0,
    '4-7': 0,
    '8-15': 0,
    '15+': 0,
  };

  data.filter(c => c.isOpen).forEach(c => {
    if (c.calculatedPendency <= 3) buckets['0-3']++;
    else if (c.calculatedPendency <= 7) buckets['4-7']++;
    else if (c.calculatedPendency <= 15) buckets['8-15']++;
    else buckets['15+']++;
  });

  const chartData = Object.keys(buckets).map(key => ({
    name: key,
    count: buckets[key as keyof typeof buckets]
  }));

  const maxCount = Math.max(...chartData.map(d => d.count));

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 h-full flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012-2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Pendency Tracker</h3>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            Distribution of open cases by days pending.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
             <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Live
             </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-8 z-10 relative">
        <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{avgPendency}</span>
            <span className="text-lg text-slate-500 font-medium">days</span>
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">Average Pendency</p>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={48}>
            <defs>
              <linearGradient id="activeBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" stopOpacity={1}/>
                <stop offset="100%" stopColor="#334155" stopOpacity={1}/>
              </linearGradient>
              <linearGradient id="inactiveBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e2e8f0" stopOpacity={1}/>
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity={1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                dy={15}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-800 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-xl border border-slate-700">
                      <span className="block text-slate-400 text-[10px] uppercase mb-1">{payload[0].payload.name} days</span>
                      <span className="text-lg font-bold">{payload[0].value}</span> Cases
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[12, 12, 12, 12]}>
              {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.count === maxCount ? 'url(#activeBar)' : 'url(#inactiveBar)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const BottleneckChart: React.FC<ChartsProps> = ({ data }) => {
  const openCases = data.filter(c => c.isOpen);

  // Aggregation: Get Counts and Total Days for calculation
  const issueStats: Record<string, { count: number; totalDays: number }> = {};
  
  openCases.forEach(c => {
    const type = c.abnormalType || 'Unknown';
    if (!issueStats[type]) {
        issueStats[type] = { count: 0, totalDays: 0 };
    }
    issueStats[type].count += 1;
    issueStats[type].totalDays += c.calculatedPendency;
  });

  // Top 5 by Volume (Count)
  const topIssues = Object.entries(issueStats)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  // Data for Left Chart: Volume
  const volumeData = topIssues.map(([name, stats]) => ({
    name,
    value: stats.count
  }));

  // Data for Right Chart: Latency (Avg Days) for the same top volume issues
  const latencyData = topIssues.map(([name, stats]) => ({
    name,
    value: Math.round(stats.totalDays / stats.count)
  }));

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-8 group hover:shadow-md transition-all duration-300">
       <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-50 rounded-xl">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Bottleneck Analysis</h3>
            </div>
            <p className="text-sm text-slate-500">Top operational hurdles and resolution latency by Issue Type.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* Chart 1: Top Issues (Volume) */}
            <div className="h-[250px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top 5 Issue Types (Volume)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={volumeData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                            width={90}
                            interval={0}
                            tickFormatter={(val) => truncate(val, 15)}
                        />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-800 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-xl border border-slate-700">
                                      <span className="block mb-1 opacity-75">{payload[0].payload.name}</span>
                                      <span className="font-bold">{payload[0].value}</span> Cases
                                    </div>
                                  );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {volumeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Chart 2: Avg Pendency (Latency) */}
            <div className="h-[250px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Avg. Pendency (Days)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                            interval={0}
                            dy={10}
                            tickFormatter={(val) => truncate(val, 10)}
                        />
                        <Tooltip 
                             cursor={{fill: '#e2e8f0', opacity: 0.4}}
                             content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-800 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-xl border border-slate-700">
                                      <span className="block mb-1 opacity-75">{payload[0].payload.name}</span>
                                      <span className="font-bold">{payload[0].value}</span> Days Avg
                                    </div>
                                  );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {latencyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#f59e0b" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
       </div>
    </div>
  );
};
