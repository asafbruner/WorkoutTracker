import React, { useState } from 'react';
import { Calendar, Save, X, ArrowRight } from 'lucide-react';

const workoutTypes = [
  { value: 'Strength', label: 'Strength Training', color: 'bg-blue-500', icon: '💪' },
  { value: 'CrossFit', label: 'CrossFit WOD', color: 'bg-orange-500', icon: '🏋️' },
  { value: 'Sprints', label: 'Sprint Training', color: 'bg-green-500', icon: '⚡' },
  { value: 'Long Run', label: 'Long Distance Run', color: 'bg-emerald-500', icon: '🏃' },
  { value: 'Rest', label: 'Rest Day', color: 'bg-gray-400', icon: '😴' }
];

const days = [
  { index: 0, name: 'Sunday', nameHe: 'א', short: 'Sun' },
  { index: 1, name: 'Monday', nameHe: 'ב', short: 'Mon' },
  { index: 2, name: 'Tuesday', nameHe: 'ג', short: 'Tue' },
  { index: 3, name: 'Wednesday', nameHe: 'ד', short: 'Wed' },
  { index: 4, name: 'Thursday', nameHe: 'ה', short: 'Thu' },
  { index: 5, name: 'Friday', nameHe: 'ו', short: 'Fri' },
  { index: 6, name: 'Saturday', nameHe: 'ש', short: 'Sat' }
];

export default function ScheduleConfig({ currentSchedule, onSave, onClose }) {
  const [schedule, setSchedule] = useState(() => {
    // Initialize schedule from current workout program
    return days.map(day => ({
      day: day.index,
      dayName: day.name,
      workoutType: currentSchedule[day.index]?.typeEn || 'Rest'
    }));
  });

  const handleWorkoutChange = (dayIndex, workoutType) => {
    setSchedule(prev => prev.map(day => 
      day.day === dayIndex ? { ...day, workoutType } : day
    ));
  };

  const handleSave = () => {
    onSave(schedule);
    onClose();
  };

  const getWorkoutTypeInfo = (type) => {
    return workoutTypes.find(w => w.value === type) || workoutTypes[4]; // Default to Rest
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Workout Schedule</h2>
                <p className="text-white/80 text-sm">Customize your weekly workout plan</p>
              </div>
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
          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              <strong>💡 Tip:</strong> Drag and drop or click to assign workout types to each day. 
              Create a schedule that fits your training goals and availability!
            </p>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="space-y-3">
            {days.map(day => {
              const daySchedule = schedule.find(s => s.day === day.index);
              const workoutInfo = getWorkoutTypeInfo(daySchedule?.workoutType);
              
              return (
                <div 
                  key={day.index}
                  className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 hover:border-gray-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Day Info */}
                    <div className="flex-shrink-0 w-32">
                      <div className="font-bold text-white text-lg">{day.name}</div>
                      <div className="text-gray-400 text-sm">{day.nameHe} • Day {day.index + 1}</div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-gray-500 flex-shrink-0" />

                    {/* Workout Type Selector */}
                    <div className="flex-1">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {workoutTypes.map(workout => (
                          <button
                            key={workout.value}
                            onClick={() => handleWorkoutChange(day.index, workout.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              daySchedule?.workoutType === workout.value
                                ? `${workout.color} text-white shadow-lg scale-105`
                                : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>{workout.icon}</span>
                              <span className="hidden sm:inline">{workout.label}</span>
                              <span className="sm:hidden">{workout.value}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              📊 Weekly Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {workoutTypes.map(workout => {
                const count = schedule.filter(s => s.workoutType === workout.value).length;
                return (
                  <div key={workout.value} className="text-center">
                    <div className={`${workout.color} rounded-lg p-2 mb-1`}>
                      <div className="text-2xl">{workout.icon}</div>
                    </div>
                    <div className="text-sm font-medium text-white">{count}×</div>
                    <div className="text-xs text-gray-400">{workout.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Templates */}
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <h3 className="font-semibold text-white mb-3">🎯 Quick Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  // Original template
                  setSchedule([
                    { day: 0, dayName: 'Sunday', workoutType: 'Strength' },
                    { day: 1, dayName: 'Monday', workoutType: 'CrossFit' },
                    { day: 2, dayName: 'Tuesday', workoutType: 'CrossFit' },
                    { day: 3, dayName: 'Wednesday', workoutType: 'Sprints' },
                    { day: 4, dayName: 'Thursday', workoutType: 'Strength' },
                    { day: 5, dayName: 'Friday', workoutType: 'Long Run' },
                    { day: 6, dayName: 'Saturday', workoutType: 'Rest' }
                  ]);
                }}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-all"
              >
                <div className="font-medium text-white mb-1">Original Plan</div>
                <div className="text-xs text-gray-300">2× Strength, 2× CrossFit, 2× Running</div>
              </button>
              
              <button
                onClick={() => {
                  // Strength focused
                  setSchedule([
                    { day: 0, dayName: 'Sunday', workoutType: 'Strength' },
                    { day: 1, dayName: 'Monday', workoutType: 'Rest' },
                    { day: 2, dayName: 'Tuesday', workoutType: 'Strength' },
                    { day: 3, dayName: 'Wednesday', workoutType: 'Long Run' },
                    { day: 4, dayName: 'Thursday', workoutType: 'Strength' },
                    { day: 5, dayName: 'Friday', workoutType: 'Rest' },
                    { day: 6, dayName: 'Saturday', workoutType: 'CrossFit' }
                  ]);
                }}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-all"
              >
                <div className="font-medium text-white mb-1">Strength Focus</div>
                <div className="text-xs text-gray-300">3× Strength, 1× CrossFit, 1× Running</div>
              </button>
              
              <button
                onClick={() => {
                  // CrossFit focused
                  setSchedule([
                    { day: 0, dayName: 'Sunday', workoutType: 'CrossFit' },
                    { day: 1, dayName: 'Monday', workoutType: 'Strength' },
                    { day: 2, dayName: 'Tuesday', workoutType: 'CrossFit' },
                    { day: 3, dayName: 'Wednesday', workoutType: 'Rest' },
                    { day: 4, dayName: 'Thursday', workoutType: 'CrossFit' },
                    { day: 5, dayName: 'Friday', workoutType: 'Long Run' },
                    { day: 6, dayName: 'Saturday', workoutType: 'Rest' }
                  ]);
                }}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-all"
              >
                <div className="font-medium text-white mb-1">CrossFit Focus</div>
                <div className="text-xs text-gray-300">3× CrossFit, 1× Strength, 1× Running</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              Save Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
