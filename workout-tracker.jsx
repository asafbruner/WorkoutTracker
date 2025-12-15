import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Check, X, Edit3, Save, Calendar, History, ChevronLeft, ChevronRight, Dumbbell, Activity, Timer, Coffee, Plus, Trash2, Eye, EyeOff, ClipboardList, TrendingUp } from 'lucide-react';

// Default workout program based on the spreadsheet
const defaultWorkouts = {
  0: { // Sunday - א
    type: 'כוח',
    typeEn: 'Strength',
    color: 'bg-blue-500',
    exercises: [
      { name: 'Back Squats', sets: '3 super-sets: 5 reps', targetWeight: '70', notes: '+ 8 Weighted dips (2min rest between)' },
      { name: 'Weighted Dips', sets: '3 super-sets: 8 reps', targetWeight: '12', notes: 'Part of super-set with squats' },
      { name: 'Strict Press', sets: '3 super-sets: 5 reps', targetWeight: '45', notes: '+ 8 Weighted pull ups (2min rest between)' },
      { name: 'Weighted Pull Ups', sets: '3 super-sets: 8 reps', targetWeight: '', notes: 'Part of super-set with press' },
      { name: 'Max Reps Dips (B.W)', sets: '1 set', targetReps: '20', notes: '' },
      { name: 'Max Reps Pull Ups (B.W)', sets: '1 set', targetReps: '20', notes: '' }
    ]
  },
  1: { // Monday - ב
    type: 'קרוספיט',
    typeEn: 'CrossFit',
    color: 'bg-orange-500',
    exercises: [
      { name: 'CrossFit WOD', sets: 'Based on gym programming', notes: 'מבוסס על תכנית האימונים במועדון' }
    ]
  },
  2: { // Tuesday - ג
    type: 'קרוספיט',
    typeEn: 'CrossFit',
    color: 'bg-orange-500',
    exercises: [
      { name: 'CrossFit WOD', sets: 'Based on gym programming', notes: 'מבוסס על תכנית האימונים במועדון' }
    ]
  },
  3: { // Wednesday - ד
    type: 'ריצה (ספרינטים)',
    typeEn: 'Sprints',
    color: 'bg-green-500',
    exercises: [
      { name: 'Warm-up', sets: '10 mins', notes: 'Easy jog + high knees, butt kicks, triple jump' },
      { name: '150m Sprint', sets: '8 sets', notes: 'RPE: 9-10, REST: 90-120sec walking to start line' },
      { name: 'Cool-down', sets: '7-10 min', notes: 'Light jog' }
    ]
  },
  4: { // Thursday - ה
    type: 'כוח',
    typeEn: 'Strength',
    color: 'bg-blue-500',
    exercises: [
      { name: 'Deadlifts', sets: '3 super-sets: 5 reps', targetWeight: '', notes: '+ 8 Weighted dips (2min rest between)' },
      { name: 'Weighted Dips', sets: '3 super-sets: 8 reps', targetWeight: '', notes: 'Part of super-set with deadlifts' },
      { name: 'Bench Press', sets: '3 super-sets: 5 reps', targetWeight: '', notes: '+ 8 Barbell bent over row (2min rest between)' },
      { name: 'Barbell Bent Over Row', sets: '3 super-sets: 8 reps', targetWeight: '', notes: 'Part of super-set with bench' },
      { name: 'Max Reps Dips (B.W)', sets: '1 set', targetReps: '', notes: '' },
      { name: 'Max Reps Pull Ups (B.W)', sets: '1 set', targetReps: '', notes: '' }
    ]
  },
  5: { // Friday - ו
    type: 'ריצה (Zone 2)',
    typeEn: 'Long Run',
    color: 'bg-emerald-500',
    exercises: [
      { name: '30 min Long Run', sets: '1 session', notes: 'Heart rate: 120-135bpm, Pace: 05:50-06:00, RPE: 4-5' }
    ]
  },
  6: { // Saturday - ש
    type: 'מנוחה',
    typeEn: 'Rest',
    color: 'bg-gray-400',
    exercises: [
      { name: 'Rest Day', sets: '', notes: 'Recovery and regeneration' }
    ]
  }
};

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Password (change this!)
const PASSWORD_HASH = 'asaf2024';

export default function WorkoutTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [workoutProgram, setWorkoutProgram] = useState(defaultWorkouts);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // Get week dates
  const getWeekDates = useCallback((date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const weekDates = getWeekDates(currentWeek);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const authResult = await window.storage.get('auth_state');
        if (authResult?.value === 'authenticated') {
          setIsAuthenticated(true);
        }
      } catch (e) {}

      try {
        const programResult = await window.storage.get('workout_program');
        if (programResult?.value) {
          setWorkoutProgram(JSON.parse(programResult.value));
        }
      } catch (e) {}

      try {
        const logsResult = await window.storage.get('workout_logs');
        if (logsResult?.value) {
          setWorkoutLogs(JSON.parse(logsResult.value));
        }
      } catch (e) {}
      
      setLoading(false);
    };
    loadData();
  }, []);

  // Save data to storage
  const saveData = async (key, value) => {
    try {
      await window.storage.set(key, JSON.stringify(value));
      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Save failed');
    }
  };

  // Handle login
  const handleLogin = async () => {
    if (password === PASSWORD_HASH) {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        await window.storage.set('auth_state', 'authenticated');
      } catch (e) {}
    } else {
      setAuthError('Incorrect password');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsAuthenticated(false);
    try {
      await window.storage.delete('auth_state');
    } catch (e) {}
  };

  // Get log for specific date
  const getDateLog = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return workoutLogs[dateKey] || { completed: null, exercises: {}, running: {}, notes: '' };
  };

  // Update workout log
  const updateLog = async (date, updates) => {
    const dateKey = date.toISOString().split('T')[0];
    const newLogs = {
      ...workoutLogs,
      [dateKey]: {
        ...getDateLog(date),
        ...updates,
        timestamp: new Date().toISOString()
      }
    };
    setWorkoutLogs(newLogs);
    await saveData('workout_logs', newLogs);
  };

  // Toggle workout completion
  const toggleCompletion = async (date, value) => {
    await updateLog(date, { completed: value });
  };

  // Update workout program
  const updateWorkoutProgram = async (dayIndex, updates) => {
    const newProgram = {
      ...workoutProgram,
      [dayIndex]: {
        ...workoutProgram[dayIndex],
        ...updates
      }
    };
    setWorkoutProgram(newProgram);
    await saveData('workout_program', newProgram);
  };

  // Add exercise to day
  const addExercise = async (dayIndex) => {
    const newExercises = [
      ...workoutProgram[dayIndex].exercises,
      { name: 'New Exercise', sets: '', targetWeight: '', targetReps: '', notes: '' }
    ];
    await updateWorkoutProgram(dayIndex, { exercises: newExercises });
  };

  // Remove exercise from day
  const removeExercise = async (dayIndex, exerciseIndex) => {
    const newExercises = workoutProgram[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
    await updateWorkoutProgram(dayIndex, { exercises: newExercises });
  };

  // Update exercise in program
  const updateExercise = async (dayIndex, exerciseIndex, updates) => {
    const newExercises = workoutProgram[dayIndex].exercises.map((ex, i) => 
      i === exerciseIndex ? { ...ex, ...updates } : ex
    );
    await updateWorkoutProgram(dayIndex, { exercises: newExercises });
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get history for display
  const getHistory = () => {
    return Object.entries(workoutLogs)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 50);
  };

  // Open log modal
  const openLogModal = (date) => {
    setLogDate(date);
    setShowLogModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Workout Tracker</h1>
            <p className="text-gray-400">תכנית אימונים - אסף ברונר</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Log Modal Component
  const LogModal = () => {
    if (!showLogModal || !logDate) return null;
    
    const dayIndex = logDate.getDay();
    const workout = workoutProgram[dayIndex];
    const log = getDateLog(logDate);
    const isStrength = workout.typeEn === 'Strength';
    const isRunning = workout.typeEn === 'Sprints' || workout.typeEn === 'Long Run';
    const isCrossfit = workout.typeEn === 'CrossFit';

    const updateExerciseLog = (exerciseIndex, field, value) => {
      const newExercises = {
        ...log.exercises,
        [exerciseIndex]: {
          ...(log.exercises[exerciseIndex] || {}),
          [field]: value
        }
      };
      updateLog(logDate, { exercises: newExercises });
    };

    const updateRunningLog = (field, value) => {
      const newRunning = {
        ...log.running,
        [field]: value
      };
      updateLog(logDate, { running: newRunning });
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 my-4">
          {/* Modal Header */}
          <div className={`${workout.color} px-6 py-4 rounded-t-2xl sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{workout.typeEn}</h2>
                <p className="text-white/80">
                  {logDate.toLocaleDateString('en-IL', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Completion Status */}
            <div className="flex gap-3">
              <button
                onClick={() => toggleCompletion(logDate, true)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                  log.completed === true 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
                    : 'bg-gray-700 text-gray-400 hover:bg-green-600/30 hover:text-green-400'
                }`}
              >
                <Check className="w-5 h-5" />
                Completed
              </button>
              <button
                onClick={() => toggleCompletion(logDate, false)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                  log.completed === false 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-gray-700 text-gray-400 hover:bg-red-600/30 hover:text-red-400'
                }`}
              >
                <X className="w-5 h-5" />
                Skipped
              </button>
            </div>

            {/* Strength Logging */}
            {isStrength && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-blue-400" />
                  Strength Exercises
                </h3>
                
                {workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{exercise.name}</h4>
                        <p className="text-sm text-gray-400">{exercise.sets}</p>
                        {exercise.targetWeight && (
                          <p className="text-xs text-blue-400">Target: {exercise.targetWeight}kg</p>
                        )}
                        {exercise.targetReps && (
                          <p className="text-xs text-blue-400">Target: {exercise.targetReps} reps</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={log.exercises[idx]?.weight || ''}
                          onChange={(e) => updateExerciseLog(idx, 'weight', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="kg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Reps</label>
                        <input
                          type="text"
                          value={log.exercises[idx]?.reps || ''}
                          onChange={(e) => updateExerciseLog(idx, 'reps', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5/5/5"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Sets Done</label>
                        <input
                          type="number"
                          value={log.exercises[idx]?.sets || ''}
                          onChange={(e) => updateExerciseLog(idx, 'sets', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="3"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Notes</label>
                      <input
                        type="text"
                        value={log.exercises[idx]?.notes || ''}
                        onChange={(e) => updateExerciseLog(idx, 'notes', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="How did it feel? Any issues?"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Running Logging - Long Run */}
            {isRunning && workout.typeEn === 'Long Run' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Long Run Log
                </h3>
                
                <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={log.running?.duration || ''}
                        onChange={(e) => updateRunningLog('duration', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Distance (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={log.running?.distance || ''}
                        onChange={(e) => updateRunningLog('distance', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="5.0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Avg Pace (min/km)</label>
                      <input
                        type="text"
                        value={log.running?.pace || ''}
                        onChange={(e) => updateRunningLog('pace', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="5:50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Avg Heart Rate (bpm)</label>
                      <input
                        type="number"
                        value={log.running?.heartRate || ''}
                        onChange={(e) => updateRunningLog('heartRate', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="125"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">RPE (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={log.running?.rpe || ''}
                        onChange={(e) => updateRunningLog('rpe', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Calories Burned</label>
                      <input
                        type="number"
                        value={log.running?.calories || ''}
                        onChange={(e) => updateRunningLog('calories', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Route / Location</label>
                    <input
                      type="text"
                      value={log.running?.route || ''}
                      onChange={(e) => updateRunningLog('route', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Park, Treadmill, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Running Logging - Sprints */}
            {isRunning && workout.typeEn === 'Sprints' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Sprint Session Log
                </h3>
                
                <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Sprints Completed</label>
                      <input
                        type="number"
                        value={log.running?.sprintsCompleted || ''}
                        onChange={(e) => updateRunningLog('sprintsCompleted', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Sprint Distance (m)</label>
                      <input
                        type="number"
                        value={log.running?.sprintDistance || ''}
                        onChange={(e) => updateRunningLog('sprintDistance', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="150"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Sprint Times (comma separated)</label>
                    <input
                      type="text"
                      value={log.running?.sprintTimes || ''}
                      onChange={(e) => updateRunningLog('sprintTimes', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="22s, 23s, 22s, 24s, 23s, 24s, 25s, 26s"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Best Sprint Time</label>
                      <input
                        type="text"
                        value={log.running?.bestTime || ''}
                        onChange={(e) => updateRunningLog('bestTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="21s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Avg Sprint Time</label>
                      <input
                        type="text"
                        value={log.running?.avgTime || ''}
                        onChange={(e) => updateRunningLog('avgTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="23s"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Rest Between (sec)</label>
                      <input
                        type="text"
                        value={log.running?.restTime || ''}
                        onChange={(e) => updateRunningLog('restTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="90-120"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">RPE (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={log.running?.rpe || ''}
                        onChange={(e) => updateRunningLog('rpe', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Warm-up Duration (min)</label>
                    <input
                      type="number"
                      value={log.running?.warmupDuration || ''}
                      onChange={(e) => updateRunningLog('warmupDuration', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Location</label>
                    <input
                      type="text"
                      value={log.running?.route || ''}
                      onChange={(e) => updateRunningLog('route', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Track, field, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CrossFit Logging */}
            {isCrossfit && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-orange-400" />
                  CrossFit WOD
                </h3>
                
                <div className="bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">WOD Name/Description</label>
                    <input
                      type="text"
                      value={log.exercises[0]?.wodName || ''}
                      onChange={(e) => updateExerciseLog(0, 'wodName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Fran, AMRAP 20..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Time / Score</label>
                      <input
                        type="text"
                        value={log.exercises[0]?.score || ''}
                        onChange={(e) => updateExerciseLog(0, 'score', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="12:30 / 5 rounds"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Rx / Scaled</label>
                      <select
                        value={log.exercises[0]?.rx || ''}
                        onChange={(e) => updateExerciseLog(0, 'rx', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select...</option>
                        <option value="Rx">Rx</option>
                        <option value="Scaled">Scaled</option>
                        <option value="Rx+">Rx+</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Notes */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">General Notes</label>
              <textarea
                value={log.notes || ''}
                onChange={(e) => updateLog(logDate, { notes: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="How did the workout feel? Any PRs? Issues?"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={() => setShowLogModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save & Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Log Modal */}
      <LogModal />

      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold">Workout Tracker</h1>
            {saveStatus && (
              <span className="text-sm text-green-400 animate-pulse">{saveStatus}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                showHistory ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                editMode ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? 'Done' : 'Edit'}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Unlock className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* History Panel */}
        {showHistory && (
          <div className="mb-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Workout History
            </h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {getHistory().length === 0 ? (
                <p className="text-gray-400">No workout history yet</p>
              ) : (
                getHistory().map(([dateKey, log]) => {
                  const date = new Date(dateKey);
                  const dayIndex = date.getDay();
                  const workout = workoutProgram[dayIndex];
                  return (
                    <div 
                      key={dateKey} 
                      className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => openLogModal(date)}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        log.completed === true ? 'bg-green-500' : 
                        log.completed === false ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {date.toLocaleDateString('en-IL', { weekday: 'short', month: 'short', day: 'numeric' })}
                          <span className={`ml-2 text-sm px-2 py-0.5 rounded ${workout.color} text-white`}>
                            {workout.typeEn}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {workout.typeEn === 'Strength' && log.exercises && Object.keys(log.exercises).length > 0 && (
                            Object.entries(log.exercises).slice(0, 3).map(([idx, ex]) => (
                              <span key={idx} className="mr-3">
                                {ex.weight && `${ex.weight}kg`}
                                {ex.reps && ` × ${ex.reps}`}
                              </span>
                            ))
                          )}
                          {workout.typeEn === 'Long Run' && log.running && (
                            <>
                              {log.running.distance && `${log.running.distance}km `}
                              {log.running.duration && `${log.running.duration}min `}
                              {log.running.pace && `@ ${log.running.pace}/km `}
                              {log.running.heartRate && `❤️ ${log.running.heartRate}bpm`}
                            </>
                          )}
                          {workout.typeEn === 'Sprints' && log.running && (
                            <>
                              {log.running.sprintsCompleted && `${log.running.sprintsCompleted} × `}
                              {log.running.sprintDistance && `${log.running.sprintDistance}m `}
                              {log.running.bestTime && `Best: ${log.running.bestTime}`}
                            </>
                          )}
                          {workout.typeEn === 'CrossFit' && log.exercises?.[0]?.wodName && (
                            <>
                              {log.exercises[0].wodName}
                              {log.exercises[0].score && ` - ${log.exercises[0].score}`}
                              {log.exercises[0].rx && ` (${log.exercises[0].rx})`}
                            </>
                          )}
                          {log.notes && <span className="text-gray-500 ml-2">📝</span>}
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {weekDates[0].toLocaleDateString('en-IL', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-gray-400">
              {weekDates[0].toLocaleDateString('en-IL', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('en-IL', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Weekly Calendar */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const workout = workoutProgram[index];
            const log = getDateLog(date);
            
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all ${
                  isToday(date) 
                    ? 'border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-gray-700'
                } bg-gray-800`}
              >
                {/* Day Header */}
                <div className={`${workout.color} px-4 py-3 rounded-t-xl flex items-center justify-between`}>
                  <div>
                    <div className="font-bold text-lg">{englishDays[index]}</div>
                    <div className="text-sm opacity-80">{hebrewDays[index]} • {date.getDate()}</div>
                  </div>
                  {log.completed !== null && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      log.completed ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {log.completed ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                {/* Workout Type */}
                <div className="px-4 py-2 border-b border-gray-700">
                  <div className="font-semibold">{workout.typeEn}</div>
                  <div className="text-sm text-gray-400">{workout.type}</div>
                </div>

                {/* Exercises Preview */}
                <div className="p-4 space-y-2">
                  {editMode ? (
                    <>
                      {workout.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="space-y-2 bg-gray-700/50 p-2 rounded-lg">
                          <input
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, exIndex, { name: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-600 rounded text-white text-sm"
                            placeholder="Exercise name"
                          />
                          <input
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, exIndex, { sets: e.target.value })}
                            className="w-full px-2 py-1 bg-gray-600 rounded text-white text-sm"
                            placeholder="Sets/Reps"
                          />
                          <button
                            onClick={() => removeExercise(index, exIndex)}
                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addExercise(index)}
                        className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Exercise
                      </button>
                    </>
                  ) : (
                    <>
                      {workout.exercises.slice(0, 3).map((exercise, exIndex) => (
                        <div key={exIndex} className="text-sm">
                          <div className="font-medium text-white truncate">{exercise.name}</div>
                          {exercise.sets && <div className="text-gray-400 text-xs truncate">{exercise.sets}</div>}
                        </div>
                      ))}
                      {workout.exercises.length > 3 && (
                        <div className="text-xs text-gray-500">+{workout.exercises.length - 3} more...</div>
                      )}
                    </>
                  )}
                </div>

                {/* Log Button */}
                {!editMode && workout.typeEn !== 'Rest' && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => openLogModal(date)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Log Workout
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-2xl font-bold text-green-400">
              {weekDates.filter(d => getDateLog(d).completed === true).length}/6
            </div>
            <div className="text-gray-500 text-xs">workouts completed</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Strength</div>
            <div className="text-2xl font-bold text-blue-400">
              {weekDates.filter((d, i) => workoutProgram[i].typeEn === 'Strength' && getDateLog(d).completed === true).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">CrossFit</div>
            <div className="text-2xl font-bold text-orange-400">
              {weekDates.filter((d, i) => workoutProgram[i].typeEn === 'CrossFit' && getDateLog(d).completed === true).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Running</div>
            <div className="text-2xl font-bold text-emerald-400">
              {weekDates.filter((d, i) => (workoutProgram[i].typeEn === 'Sprints' || workoutProgram[i].typeEn === 'Long Run') && getDateLog(d).completed === true).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
        </div>
      </main>
    </div>
  );
}
