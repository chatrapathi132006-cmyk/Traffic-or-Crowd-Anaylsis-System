
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { AnalysisResult, DensityLevel, TrafficFlow } from '../types';

interface DashboardProps {
  history: AnalysisResult[];
}

const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  const current = history[history.length - 1];

  const chartData = history.map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    people: h.peopleCount,
    vehicles: h.vehicleCount,
    risk: h.riskScore
  }));

  const StatCard = ({ title, value, sub, color }: { title: string, value: string | number, sub: string, color: string }) => (
    <div className={`bg-slate-800 border-l-4 ${color} p-4 rounded-lg shadow-lg transition-all hover:scale-[1.02]`}>
      <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="flex items-baseline space-x-2 mt-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-xs text-slate-500">{sub}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Vehicle Flow" 
          value={current?.vehicleCount || 0} 
          sub="units detected" 
          color="border-blue-500" 
        />
        <StatCard 
          title="Pedestrian Density" 
          value={current?.peopleCount || 0} 
          sub="individuals" 
          color="border-emerald-500" 
        />
        <StatCard 
          title="Safety Risk" 
          value={`${current?.riskScore || 0}%`} 
          sub="index" 
          color={current?.riskScore > 70 ? 'border-red-500' : 'border-amber-500'} 
        />
        <StatCard 
          title="Status" 
          value={current?.flow || 'Scanning...'} 
          sub="traffic state" 
          color="border-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[350px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Traffic & Crowd Trends
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" fontSize={12} tick={{ fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="vehicles" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVehicles)" name="Vehicles" />
              <Area type="monotone" dataKey="people" stroke="#10b981" fillOpacity={1} fill="url(#colorPeople)" name="People" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[350px]">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Risk Analysis Index
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="risk" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#f59e0b' }} 
                activeDot={{ r: 8 }} 
                name="Risk %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
