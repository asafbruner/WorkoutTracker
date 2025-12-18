import React from 'react';
import { TrendingUp, Award, Flame, BarChart3, Target, Calendar } from 'lucide-react';
import { 
  calculateStreak, 
  findPersonalRecords, 
  getWorkoutTypeDistribution,
  calculateWeeklyProgress 
} from '../utils/analytics';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function ProgressDashboard({ workoutLogs, workoutProgram, onClose }) {
  const streak = calculateStreak(workoutLogs);
  const prs = findPersonalRecords(workoutLogs);
  const distribution = getWorkoutTypeDistribution(workoutLogs, workoutProgram);
  const weeklyProgress = calculateWeeklyProgress(workoutLogs, 8);

  const totalWorkouts = Object.values(workoutLogs).filter(log => log.completed === true).length;
  const prCount = Object.keys(prs).length;

  // Prepare data for charts
  const weeklyChartData = weeklyProgress.map(week => ({
    week: new Date(week.weekStart).toLocaleDateString('en-IL', { month: 'short', day: 'numeric' }),
    completed: week.completed,
    completionRate: week.completionRate
  }));

  const distributionChartData = Object.entries(distribution)
    .filter(([type, count]) => count > 0 && type !== 'Rest')
    .map(([type, count]) => ({
      name: type,
      value: count
    }));

  const prChartData = Object.entries(prs)
    .slice(0, 8)
    .map(([exercise, pr]) => ({
      exercise: exercise.length > 15 ? exercise.substring(0, 15) + '...' : exercise,
      weight: parseFloat(pr.weight) || 0
    }));

  const COLORS = {
    'Strength': '#3b82f6',
    'CrossFit': '#f97316',
    'Sprints': '#22c55e',
    'Long Run': '#10b981'
  };

  const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#10b981'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-700 my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Progress & Analytics</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-gray-300">Current Streak</span>
              </div>
              <div className="text-3xl font-bold text-white">{streak}</div>
              <div className="text-xs text-gray-400">days in a row</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-300">Total Workouts</span>
              </div>
              <div className="text-3xl font-bold text-white">{totalWorkouts}</div>
              <div className="text-xs text-gray-400">completed</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300">Personal Records</span>
              </div>
              <div className="text-3xl font-bold text-white">{prCount}</div>
              <div className="text-xs text-gray-400">exercises</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-300">This Month</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {weeklyProgress.slice(-4).reduce((sum, week) => sum + week.completed, 0)}
              </div>
              <div className="text-xs text-gray-400">workouts</div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          {weeklyChartData.length > 0 && (
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Weekly Progress Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Workouts', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value, name) => {
                      if (name === 'completed') return [value, 'Completed'];
                      if (name === 'completionRate') return [`${value}%`, 'Rate'];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9ca3af' }}
                    formatter={(value) => {
                      if (value === 'completed') return 'Workouts Completed';
                      if (value === 'completionRate') return 'Completion Rate (%)';
                      return value;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Two-column layout for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Records Bar Chart */}
            {prChartData.length > 0 && (
              <div className="bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Top Personal Records
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Weight (kg)', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af' } }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="exercise" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '11px' }}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value) => [`${value}kg`, 'Weight']}
                    />
                    <Bar 
                      dataKey="weight" 
                      fill="#fbbf24"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Workout Type Distribution Pie Chart */}
            {distributionChartData.length > 0 && (
              <div className="bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Workout Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value, name) => [`${value} workouts`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {distributionChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-300">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Personal Records List */}
          {prCount > 0 && (
            <div className="bg-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                All Personal Records
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(prs).map(([exercise, pr]) => (
                  <div key={exercise} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
                    <div className="font-semibold text-white mb-1 truncate" title={exercise}>{exercise}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-yellow-400">{pr.weight}kg</span>
                      {pr.reps && (
                        <span className="text-sm text-gray-400">× {pr.reps}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(pr.date).toLocaleDateString('en-IL', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational Message */}
          {streak > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6 text-center">
              <Flame className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">
                {streak >= 7 ? '🔥 You\'re on fire!' : '💪 Keep going!'}
              </h3>
              <p className="text-gray-300">
                {streak >= 30 
                  ? 'Incredible! A full month streak! You\'re unstoppable!' 
                  : streak >= 14
                  ? 'Two weeks strong! Your consistency is paying off!'
                  : streak >= 7
                  ? 'One week streak! Momentum is building!'
                  : 'Every workout counts. Keep pushing!'}
              </p>
            </div>
          )}

          {/* Empty State */}
          {totalWorkouts === 0 && (
            <div className="bg-gray-700/50 rounded-xl p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Workout Data Yet</h3>
              <p className="text-gray-400 mb-4">
                Start logging your workouts to see progress analytics and track your personal records!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Start Tracking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
