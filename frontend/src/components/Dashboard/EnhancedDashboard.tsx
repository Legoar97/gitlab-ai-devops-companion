// frontend/src/components/Dashboard/EnhancedDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';

interface DashboardProps {
  projectPath: string;
}

const EnhancedDashboard: React.FC<DashboardProps> = ({ projectPath }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({});
  const [trends, setTrends] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [deploymentWindows, setDeploymentWindows] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>({});

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [projectPath]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all dashboard data in parallel
      const [
        metricsRes,
        trendsRes,
        costRes,
        windowsRes,
        anomaliesRes,
        predictionsRes
      ] = await Promise.all([
        api.getPipelineMetrics(projectPath),
        api.getPipelineTrends(projectPath),
        api.getCostAnalysis(projectPath),
        api.getOptimalDeploymentWindows(projectPath),
        api.getAnomalies(projectPath),
        api.getCurrentPredictions(projectPath)
      ]);

      setMetrics(metricsRes);
      setTrends(trendsRes);
      setCostData(costRes);
      setDeploymentWindows(windowsRes);
      setAnomalies(anomaliesRes);
      setPredictions(predictionsRes);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: { [key: string]: string } = {
    success: '#10b981',
    failed: '#ef4444',
    running: '#f59e0b',
    pending: '#3b82f6',
    canceled: '#6b7280',
  };

  const riskColors = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header with Real-time Status */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Pipeline Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-400">{metrics.successRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.successRateTrend > 0 ? '↑' : '↓'} {Math.abs(metrics.successRateTrend)}% from last week
              </p>
            </div>
            <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Duration</p>
              <p className="text-3xl font-bold text-blue-400">{metrics.avgDuration}m</p>
              <p className="text-xs text-gray-500 mt-1">Target: {metrics.targetDuration}m</p>
            </div>
            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monthly Cost</p>
              <p className="text-3xl font-bold text-purple-400">${metrics.monthlyCost}</p>
              <p className="text-xs text-gray-500 mt-1">Projected: ${metrics.projectedCost}</p>
            </div>
            <div className="w-12 h-12 bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Pipelines</p>
              <p className="text-3xl font-bold text-yellow-400">{metrics.activePipelines}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.queuedPipelines} queued</p>
            </div>
            <div className="w-12 h-12 bg-yellow-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Trends Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tickFormatter={(date: string) => format(parseISO(date), 'MMM d')}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="successRate" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Success Rate %"
              />
              <Area 
                type="monotone" 
                dataKey="avgDuration" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                name="Avg Duration (min)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tickFormatter={(date: string) => format(parseISO(date), 'MMM d')}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Bar dataKey="totalCost" fill="#8b5cf6" name="Total Cost ($)" />
              <Bar dataKey="wastedCost" fill="#ef4444" name="Failed Pipeline Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.statusDistribution?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Deployment Windows Heatmap */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Optimal Deployment Times</h3>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
              <div key={day} className="text-center">
                <p className="text-xs text-gray-400 mb-2">{day}</p>
                <div className="space-y-1">
                  {[0, 6, 12, 18].map((hour) => {
                    const window = deploymentWindows.find(
                      w => w.dayOfWeek === dayIndex && w.hourOfDay === hour
                    );
                    const successRate = window?.successRate || 0;
                    const color = successRate > 90 ? 'bg-green-600' : 
                                 successRate > 80 ? 'bg-yellow-600' : 
                                 successRate > 0 ? 'bg-red-600' : 'bg-gray-700';
                    
                    return (
                      <div
                        key={hour}
                        className={`h-4 rounded ${color} cursor-pointer transition-all hover:scale-110`}
                        title={`${hour}:00 - Success: ${successRate}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded mr-1"></div>
              <span className="text-gray-400">{'> 90% success'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-600 rounded mr-1"></div>
              <span className="text-gray-400">80-90%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
              <span className="text-gray-400">{'< 80%'}</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment Radar */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Current Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={predictions.riskFactors}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="factor" stroke="#9ca3af" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
              <Radar name="Risk Level" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies & Alerts */}
      {anomalies.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Anomaly Detection</h3>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  anomaly.severity === 'high' ? 'border-red-600 bg-red-950' : 'border-yellow-600 bg-yellow-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      anomaly.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    } animate-pulse`}></div>
                    <p className="text-white">{anomaly.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(parseISO(anomaly.week), 'MMM d')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminal Command Interface */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Commands</h3>
        <div className="bg-black rounded p-4 font-mono text-sm">
          <div className="flex items-center space-x-2 text-green-400">
            <span>$</span>
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-white"
              placeholder="Type a command... (e.g., 'analyze costs', 'predict next deployment')"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Handle command
                  console.log('Command:', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;