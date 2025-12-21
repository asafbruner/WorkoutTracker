import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Unlock, Check, X, Edit3, Calendar, History, ChevronLeft, ChevronRight, Dumbbell, Plus, Trash2, ClipboardList, TrendingUp, Download, Upload, Activity, Timer, Save, Eye, EyeOff, Lock, Settings } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import ProgressDashboard from './components/ProgressDashboard';
import ScheduleConfig from './components/ScheduleConfig';
import { verifyPassword, getActivePasswordHash } from './utils/auth';
import { registerServiceWorker, setupInstallPrompt, showInstallPrompt, isInstalled } from './utils/pwa';
import { calculateStreak } from './utils/analytics';

// Default workout program based on the spreadsheet
const defaultWorkouts = {
  0: { // Sunday - א
    type: 'כוח',
    typeEn: 'Strength',
    color: 'bg-indigo-600',
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
    color: 'bg-amber-600',
    exercises: [
      { name: 'CrossFit WOD', sets: 'Based on gym programming', notes: 'מבוסס על תכנית האימונים במועדון' }
    ]
  },
  2: { // Tuesday - ג
    type: 'קרוספיט',
    typeEn: 'CrossFit',
    color: 'bg-amber-600',
    exercises: [
      { name: 'CrossFit WOD', sets: 'Based on gym programming', notes: 'מבוסס על תכנית האימונים במועדון' }
    ]
  },
  3: { // Wednesday - ד
    type: 'ריצה (ספרינטים)',
    typeEn: 'Sprints',
    color: 'bg-lime-600',
    exercises: [
      { name: 'Warm-up', sets: '10 mins', notes: 'Easy jog + high knees, butt kicks, triple jump' },
      { name: '150m Sprint', sets: '8 sets', notes: 'RPE: 9-10, REST: 90-120sec walking to start line' },
      { name: 'Cool-down', sets: '7-10 min', notes: 'Light jog' }
    ]
  },
  4: { // Thursday - ה
    type: 'כוח',
    typeEn: 'Strength',
    color: 'bg-indigo-600',
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
    color: 'bg-teal-600',
    exercises: [
      { name: '30 min Long Run', sets: '1 session', notes: 'Heart rate: 120-135bpm, Pace: 05:50-06:00, RPE: 4-5' }
    ]
  },
  6: { // Saturday - ש
    type: 'מנוחה',
    typeEn: 'Rest',
    color: 'bg-slate-600',
    exercises: [
      { name: 'Rest Day', sets: '', notes: 'Recovery and regeneration' }
    ]
  }
};

const hebrewDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WorkoutTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [workoutProgram, setWorkoutProgram] = useState(defaultWorkouts);
  const [weeklySchedules, setWeeklySchedules] = useState({}); // Store per-week schedules
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const [logDate, setLogDate] = useState(null);
  const [editDate, setEditDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('weekly'); // 'daily', 'weekly', 'monthly'
  const saveTimeoutRef = useRef(null);

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

  // Get month dates (all days in current month with padding to start on Sunday)
  const getMonthDates = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Create dates at noon to avoid timezone issues
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0);
    
    const dates = [];
    
    // Add padding days from previous month to start on Sunday
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const paddingDate = new Date(firstDay);
      paddingDate.setDate(paddingDate.getDate() - (i + 1));
      dates.push({ date: paddingDate, isPadding: true });
    }
    
    // Add all days in current month
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push({ date: new Date(d), isPadding: false });
    }
    
    // Add padding days from next month to complete the week
    const lastDayOfWeek = lastDay.getDay();
    if (lastDayOfWeek < 6) {
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const paddingDate = new Date(lastDay);
        paddingDate.setDate(paddingDate.getDate() + i);
        dates.push({ date: paddingDate, isPadding: true });
      }
    }
    
    return dates;
  }, []);

  // Get display dates based on view mode
  const getDisplayDates = useCallback(() => {
    if (viewMode === 'daily') {
      return [new Date(currentWeek)];
    } else if (viewMode === 'weekly') {
      return getWeekDates(currentWeek);
    } else {
      // For monthly view, return raw dates array without wrapping
      return getMonthDates(currentWeek);
    }
  }, [viewMode, currentWeek, getWeekDates, getMonthDates]);

  const weekDates = getWeekDates(currentWeek);
  const displayDates = getDisplayDates();

  // Get week key for storing per-week schedules
  const getWeekKey = useCallback((date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);
    return weekStart.toISOString().split('T')[0]; // Use Sunday's date as key
  }, []);

  const currentWeekKey = getWeekKey(currentWeek);

  // Get workout for specific date (checks week-specific schedule first, then falls back to default)
  const getWorkoutForDate = useCallback((date) => {
    const weekKey = getWeekKey(date);
    const dayIndex = date.getDay();
    
    // Check if there's a custom schedule for this week
    if (weeklySchedules[weekKey] && weeklySchedules[weekKey][dayIndex]) {
      return weeklySchedules[weekKey][dayIndex];
    }
    
    // Fall back to default program
    return workoutProgram[dayIndex];
  }, [weeklySchedules, workoutProgram, getWeekKey]);

  // Initialize PWA on mount
  useEffect(() => {
    registerServiceWorker();
    setupInstallPrompt((available) => {
      console.log('Install prompt available:', available);
    });
  }, []);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 3000);

      try {
        const authResult = await window.storage.get('auth_state');
        if (authResult?.value === 'authenticated') {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Auth load error:', e);
      }

      try {
        const programResult = await window.storage.get('workout_program');
        if (programResult?.value) {
          setWorkoutProgram(JSON.parse(programResult.value));
        }
      } catch (e) {
        console.error('Program load error:', e);
      }

      try {
        const logsResult = await window.storage.get('workout_logs');
        if (logsResult?.value) {
          setWorkoutLogs(JSON.parse(logsResult.value));
        }
      } catch (e) {
        console.error('Logs load error:', e);
      }

      try {
        const schedulesResult = await window.storage.get('weekly_schedules');
        if (schedulesResult?.value) {
          setWeeklySchedules(JSON.parse(schedulesResult.value));
        }
      } catch (e) {
        console.error('Schedules load error:', e);
      }
      
      clearTimeout(timeoutId);
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

  // Handle login with password hashing
  const handleLogin = async (password) => {
    try {
      const hash = await getActivePasswordHash();
      const isValid = await verifyPassword(password, hash);
      
      if (isValid) {
        setIsAuthenticated(true);
        await window.storage.set('auth_state', 'authenticated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
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

  // Navigate based on view mode
  const navigate = (direction) => {
    const newDate = new Date(currentWeek);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else { // monthly
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentWeek(newDate);
  };

  // Get period title based on view mode
  const getPeriodTitle = () => {
    if (viewMode === 'daily') {
      return currentWeek.toLocaleDateString('en-IL', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric' 
      });
    } else if (viewMode === 'weekly') {
      const dates = getWeekDates(currentWeek);
      return {
        main: dates[0].toLocaleDateString('en-IL', { month: 'long', year: 'numeric' }),
        sub: `${dates[0].toLocaleDateString('en-IL', { day: 'numeric', month: 'short' })} - ${dates[6].toLocaleDateString('en-IL', { day: 'numeric', month: 'short' })}`
      };
    } else { // monthly
      return currentWeek.toLocaleDateString('en-IL', { month: 'long', year: 'numeric' });
    }
  };

  const periodTitle = getPeriodTitle();

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

  // Open edit modal
  const openEditModal = (date) => {
    setEditDate(date);
    setShowEditModal(true);
  };

  // Update workout for specific date
  const updateWorkoutForDate = async (date, updates, applyToFuture = false) => {
    const weekKey = getWeekKey(date);
    const dayIndex = date.getDay();
    const currentWorkout = getWorkoutForDate(date);
    
    const updatedWorkout = {
      ...currentWorkout,
      ...updates
    };

    if (applyToFuture) {
      // Update the default program for this day of week
      const newProgram = {
        ...workoutProgram,
        [dayIndex]: updatedWorkout
      };
      setWorkoutProgram(newProgram);
      await saveData('workout_program', newProgram);
      setSaveStatus('✓ Applied to all future occurrences');
    } else {
      // Update only for the current week
      const newWeeklySchedules = {
        ...weeklySchedules,
        [weekKey]: {
          ...(weeklySchedules[weekKey] || {}),
          [dayIndex]: updatedWorkout
        }
      };
      setWeeklySchedules(newWeeklySchedules);
      await saveData('weekly_schedules', newWeeklySchedules);
      setSaveStatus('✓ Updated for this week');
    }
    
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Reset workout to default
  const resetWorkoutToDefault = async (date) => {
    const weekKey = getWeekKey(date);
    const dayIndex = date.getDay();
    
    // Remove custom schedule for this day in this week
    const newWeeklySchedules = { ...weeklySchedules };
    if (newWeeklySchedules[weekKey]) {
      delete newWeeklySchedules[weekKey][dayIndex];
      
      // If week schedule is now empty, remove it entirely
      if (Object.keys(newWeeklySchedules[weekKey]).length === 0) {
        delete newWeeklySchedules[weekKey];
      }
    }
    
    setWeeklySchedules(newWeeklySchedules);
    await saveData('weekly_schedules', newWeeklySchedules);
    setSaveStatus('✓ Reset to default');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Handle schedule save for current week only
  const handleScheduleSave = async (schedule) => {
    // Map workout types to their configurations
    const workoutTypeConfigs = {
      'Strength': {
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
      'CrossFit': {
        type: 'קרוספיט',
        typeEn: 'CrossFit',
        color: 'bg-orange-500',
        exercises: [
          { name: 'CrossFit WOD', sets: 'Based on gym programming', notes: 'מבוסס על תכנית האימונים במועדון' }
        ]
      },
      'Sprints': {
        type: 'ריצה (ספרינטים)',
        typeEn: 'Sprints',
        color: 'bg-green-500',
        exercises: [
          { name: 'Warm-up', sets: '10 mins', notes: 'Easy jog + high knees, butt kicks, triple jump' },
          { name: '150m Sprint', sets: '8 sets', notes: 'RPE: 9-10, REST: 90-120sec walking to start line' },
          { name: 'Cool-down', sets: '7-10 min', notes: 'Light jog' }
        ]
      },
      'Long Run': {
        type: 'ריצה (Zone 2)',
        typeEn: 'Long Run',
        color: 'bg-emerald-500',
        exercises: [
          { name: '30 min Long Run', sets: '1 session', notes: 'Heart rate: 120-135bpm, Pace: 05:50-06:00, RPE: 4-5' }
        ]
      },
      'Rest': {
        type: 'מנוחה',
        typeEn: 'Rest',
        color: 'bg-gray-400',
        exercises: [
          { name: 'Rest Day', sets: '', notes: 'Recovery and regeneration' }
        ]
      }
    };

    // Create schedule for the current week only
    const weekSchedule = {};
    schedule.forEach(({ day, workoutType }) => {
      // Check if we have existing data for this day in current week
      const existingWorkout = getWorkoutForDate(weekDates[day]);
      const newWorkoutType = workoutTypeConfigs[workoutType];
      
      if (existingWorkout && existingWorkout.typeEn === workoutType) {
        // Keep existing configuration if same type
        weekSchedule[day] = existingWorkout;
      } else {
        // Use default configuration for new type
        weekSchedule[day] = { ...newWorkoutType };
      }
    });

    // Save to weekly schedules
    const newWeeklySchedules = {
      ...weeklySchedules,
      [currentWeekKey]: weekSchedule
    };
    
    setWeeklySchedules(newWeeklySchedules);
    await saveData('weekly_schedules', newWeeklySchedules);
    setSaveStatus('✓ Schedule saved for this week');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Export data to JSON file
  const handleExportData = async () => {
    try {
      const data = await window.storage.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveStatus('✓ Data exported');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Export error:', error);
      setSaveStatus('Export failed');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Import data from JSON file
  const handleImportData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = await window.storage.importData(data);
      
      if (result.success) {
        // Reload data from storage
        const logsResult = await window.storage.get('workout_logs');
        if (logsResult?.value) {
          setWorkoutLogs(JSON.parse(logsResult.value));
        }
        
        const programResult = await window.storage.get('workout_program');
        if (programResult?.value) {
          setWorkoutProgram(JSON.parse(programResult.value));
        }
        
        setSaveStatus('✓ Data imported');
      } else {
        setSaveStatus('Import failed');
      }
      
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Import error:', error);
      setSaveStatus('Import failed - Invalid file');
      setTimeout(() => setSaveStatus(''), 3000);
    }
    
    // Reset file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Use LoginScreen component
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Edit Workout Modal Component
  const EditWorkoutModal = () => {
    if (!showEditModal || !editDate) return null;
    
    const workout = getWorkoutForDate(editDate);
    const [localWorkout, setLocalWorkout] = useState(workout);
    const [applyToFuture, setApplyToFuture] = useState(false);

    const handleSave = async () => {
      await updateWorkoutForDate(editDate, localWorkout, applyToFuture);
      setShowEditModal(false);
    };

    const handleReset = async () => {
      await resetWorkoutToDefault(editDate);
      setShowEditModal(false);
    };

    const addExerciseToWorkout = () => {
      setLocalWorkout({
        ...localWorkout,
        exercises: [
          ...localWorkout.exercises,
          { name: 'New Exercise', sets: '', targetWeight: '', targetReps: '', notes: '' }
        ]
      });
    };

    const removeExerciseFromWorkout = (index) => {
      setLocalWorkout({
        ...localWorkout,
        exercises: localWorkout.exercises.filter((_, i) => i !== index)
      });
    };

    const updateExerciseInWorkout = (index, field, value) => {
      setLocalWorkout({
        ...localWorkout,
        exercises: localWorkout.exercises.map((ex, i) => 
          i === index ? { ...ex, [field]: value } : ex
        )
      });
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 my-4">
          {/* Modal Header */}
          <div className={`${workout.color} px-6 py-4 rounded-t-2xl sticky top-0 z-10`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Workout</h2>
                <p className="text-white/80">
                  {editDate.toLocaleDateString('en-IL', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Workout Type Display (read-only as per requirements) */}
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-1">Workout Type</div>
              <div className="font-semibold text-white">{workout.typeEn}</div>
              <div className="text-sm text-gray-400">{workout.type}</div>
              <div className="text-xs text-gray-500 mt-2">
                Note: To change workout type, use the Schedule feature
              </div>
            </div>

            {/* Exercises Editor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Exercises
              </h3>
              
              {localWorkout.exercises.map((exercise, idx) => (
                <div key={idx} className="bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-white">Exercise {idx + 1}</h4>
                    <button
                      onClick={() => removeExerciseFromWorkout(idx)}
                      className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Exercise Name</label>
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExerciseInWorkout(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Back Squats"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Sets / Reps Description</label>
                    <input
                      type="text"
                      value={exercise.sets}
                      onChange={(e) => updateExerciseInWorkout(idx, 'sets', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3 sets: 5 reps"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Target Weight (kg)</label>
                      <input
                        type="text"
                        value={exercise.targetWeight || ''}
                        onChange={(e) => updateExerciseInWorkout(idx, 'targetWeight', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 70"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Target Reps</label>
                      <input
                        type="text"
                        value={exercise.targetReps || ''}
                        onChange={(e) => updateExerciseInWorkout(idx, 'targetReps', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Notes</label>
                    <textarea
                      value={exercise.notes || ''}
                      onChange={(e) => updateExerciseInWorkout(idx, 'notes', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                      placeholder="Additional notes about this exercise..."
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addExerciseToWorkout}
                className="w-full py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
            </div>

            {/* Apply to Future Option */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToFuture}
                  onChange={(e) => setApplyToFuture(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-white">Apply to all future occurrences</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {applyToFuture 
                      ? `This will update the default ${workout.typeEn} workout for all future ${englishDays[editDate.getDay()]}s`
                      : 'Changes will only apply to this week\'s workout'
                    }
                  </div>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Log Modal Component
  const LogModal = () => {
    if (!showLogModal || !logDate) return null;
    
    const dayIndex = logDate.getDay();
    const workout = workoutProgram[dayIndex];
    const log = getDateLog(logDate);
    const isStrength = workout.typeEn === 'Strength';
    const isRunning = workout.typeEn === 'Sprints' || workout.typeEn === 'Long Run';
    const isCrossfit = workout.typeEn === 'CrossFit';

    // Store form data in ref to avoid re-renders
    const formDataRef = useRef({
      exercises: {},
      running: {},
      notes: ''
    });

    // Initialize form data from log only once when modal opens
    const initializedRef = useRef(false);
    useEffect(() => {
      if (!initializedRef.current) {
        formDataRef.current = {
          exercises: { ...log.exercises },
          running: { ...log.running },
          notes: log.notes || ''
        };
        initializedRef.current = true;
      }
      
      return () => {
        initializedRef.current = false;
      };
    }, [logDate]);

    const updateExerciseLog = useCallback((exerciseIndex, field, value) => {
      // Update ref immediately
      if (!formDataRef.current.exercises[exerciseIndex]) {
        formDataRef.current.exercises[exerciseIndex] = {};
      }
      formDataRef.current.exercises[exerciseIndex][field] = value;

      // Debounce state update
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const dateKey = logDate.toISOString().split('T')[0];
        // Save directly to storage without triggering state update to prevent re-render
        window.storage.get('workout_logs').then(result => {
          const currentLogs = result?.value ? JSON.parse(result.value) : {};
          const currentLog = currentLogs[dateKey] || { completed: null, exercises: {}, running: {}, notes: '' };
          const newLogs = {
            ...currentLogs,
            [dateKey]: {
              ...currentLog,
              exercises: { ...formDataRef.current.exercises },
              timestamp: new Date().toISOString()
            }
          };
          window.storage.set('workout_logs', JSON.stringify(newLogs));
        });
      }, 1500);
    }, [logDate]);

    const updateRunningLog = useCallback((field, value) => {
      // Update ref immediately
      formDataRef.current.running[field] = value;

      // Debounce state update
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const dateKey = logDate.toISOString().split('T')[0];
        // Save directly to storage without triggering state update to prevent re-render
        window.storage.get('workout_logs').then(result => {
          const currentLogs = result?.value ? JSON.parse(result.value) : {};
          const currentLog = currentLogs[dateKey] || { completed: null, exercises: {}, running: {}, notes: '' };
          const newLogs = {
            ...currentLogs,
            [dateKey]: {
              ...currentLog,
              running: { ...formDataRef.current.running },
              timestamp: new Date().toISOString()
            }
          };
          window.storage.set('workout_logs', JSON.stringify(newLogs));
        });
      }, 1500);
    }, [logDate]);

    const updateGeneralNotes = useCallback((notes) => {
      // Update ref immediately
      formDataRef.current.notes = notes;

      // Debounce state update
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        const dateKey = logDate.toISOString().split('T')[0];
        // Save directly to storage without triggering state update to prevent re-render
        window.storage.get('workout_logs').then(result => {
          const currentLogs = result?.value ? JSON.parse(result.value) : {};
          const currentLog = currentLogs[dateKey] || { completed: null, exercises: {}, running: {}, notes: '' };
          const newLogs = {
            ...currentLogs,
            [dateKey]: {
              ...currentLog,
              notes: formDataRef.current.notes,
              timestamp: new Date().toISOString()
            }
          };
          window.storage.set('workout_logs', JSON.stringify(newLogs));
        });
      }, 1500);
    }, [logDate]);

    // Save on modal close and update state
    const handleClose = useCallback(() => {
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save immediately and update state
      const dateKey = logDate.toISOString().split('T')[0];
      setWorkoutLogs(prevLogs => {
        const currentLog = prevLogs[dateKey] || { completed: null, exercises: {}, running: {}, notes: '' };
        const newLogs = {
          ...prevLogs,
          [dateKey]: {
            ...currentLog,
            exercises: { ...formDataRef.current.exercises },
            running: { ...formDataRef.current.running },
            notes: formDataRef.current.notes,
            timestamp: new Date().toISOString()
          }
        };
        
        window.storage.set('workout_logs', JSON.stringify(newLogs));
        return newLogs;
      });
      
      setShowLogModal(false);
    }, [logDate]);

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
                          key={`weight-${idx}-${logDate.toISOString()}`}
                          type="number"
                          defaultValue={log.exercises[idx]?.weight || ''}
                          onFocus={(e) => {
                            // Select all text on focus for easy overwriting
                            e.target.select();
                          }}
                          onChange={(e) => updateExerciseLog(idx, 'weight', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="kg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Reps</label>
                        <input
                          key={`reps-${idx}-${logDate.toISOString()}`}
                          type="text"
                          defaultValue={log.exercises[idx]?.reps || ''}
                          onFocus={(e) => {
                            // Select all text on focus for easy overwriting
                            e.target.select();
                          }}
                          onChange={(e) => updateExerciseLog(idx, 'reps', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5/5/5"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Sets Done</label>
                        <input
                          key={`sets-${idx}-${logDate.toISOString()}`}
                          type="number"
                          defaultValue={log.exercises[idx]?.sets || ''}
                          onChange={(e) => updateExerciseLog(idx, 'sets', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="3"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Notes</label>
                        <input
                          key={`notes-${idx}-${logDate.toISOString()}`}
                          type="text"
                          defaultValue={log.exercises[idx]?.notes || ''}
                          onFocus={(e) => {
                            // Select all text on focus for easy overwriting
                            e.target.select();
                          }}
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
                        key={`duration-${logDate.toISOString()}`}
                        type="number"
                        defaultValue={log.running?.duration || ''}
                        onChange={(e) => updateRunningLog('duration', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Distance (km)</label>
                      <input
                        key={`distance-${logDate.toISOString()}`}
                        type="number"
                        step="0.1"
                        defaultValue={log.running?.distance || ''}
                        onFocus={(e) => {
                          // Select all text on focus for easy overwriting
                          e.target.select();
                        }}
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
                        key={`pace-${logDate.toISOString()}`}
                        type="text"
                        defaultValue={log.running?.pace || ''}
                        onChange={(e) => updateRunningLog('pace', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="5:50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Avg Heart Rate (bpm)</label>
                      <input
                        key={`heartRate-${logDate.toISOString()}`}
                        type="number"
                        defaultValue={log.running?.heartRate || ''}
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
                        key={`rpe-${logDate.toISOString()}`}
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={log.running?.rpe || ''}
                        onChange={(e) => updateRunningLog('rpe', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Calories Burned</label>
                      <input
                        key={`calories-${logDate.toISOString()}`}
                        type="number"
                        defaultValue={log.running?.calories || ''}
                        onChange={(e) => updateRunningLog('calories', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Route / Location</label>
                    <input
                      key={`route-${logDate.toISOString()}`}
                      type="text"
                      defaultValue={log.running?.route || ''}
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
                        key={`sprintsCompleted-${logDate.toISOString()}`}
                        type="number"
                        defaultValue={log.running?.sprintsCompleted || ''}
                        onChange={(e) => updateRunningLog('sprintsCompleted', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Sprint Distance (m)</label>
                      <input
                        key={`sprintDistance-${logDate.toISOString()}`}
                        type="number"
                        defaultValue={log.running?.sprintDistance || ''}
                        onChange={(e) => updateRunningLog('sprintDistance', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="150"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Sprint Times (comma separated)</label>
                    <input
                      key={`sprintTimes-${logDate.toISOString()}`}
                      type="text"
                      defaultValue={log.running?.sprintTimes || ''}
                      onChange={(e) => updateRunningLog('sprintTimes', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="22s, 23s, 22s, 24s, 23s, 24s, 25s, 26s"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Best Sprint Time</label>
                      <input
                        key={`bestTime-${logDate.toISOString()}`}
                        type="text"
                        defaultValue={log.running?.bestTime || ''}
                        onChange={(e) => updateRunningLog('bestTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="21s"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Avg Sprint Time</label>
                      <input
                        key={`avgTime-${logDate.toISOString()}`}
                        type="text"
                        defaultValue={log.running?.avgTime || ''}
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
                        key={`restTime-${logDate.toISOString()}`}
                        type="text"
                        defaultValue={log.running?.restTime || ''}
                        onChange={(e) => updateRunningLog('restTime', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="90-120"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">RPE (1-10)</label>
                      <input
                        key={`sprint-rpe-${logDate.toISOString()}`}
                        type="number"
                        min="1"
                        max="10"
                        defaultValue={log.running?.rpe || ''}
                        onChange={(e) => updateRunningLog('rpe', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Warm-up Duration (min)</label>
                    <input
                      key={`warmupDuration-${logDate.toISOString()}`}
                      type="number"
                      defaultValue={log.running?.warmupDuration || ''}
                      onChange={(e) => updateRunningLog('warmupDuration', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Location</label>
                    <input
                      key={`sprint-route-${logDate.toISOString()}`}
                      type="text"
                      defaultValue={log.running?.route || ''}
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
                      key={`wodName-${logDate.toISOString()}`}
                      type="text"
                      defaultValue={log.exercises[0]?.wodName || ''}
                      onChange={(e) => updateExerciseLog(0, 'wodName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Fran, AMRAP 20..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Time / Score</label>
                      <input
                        key={`score-${logDate.toISOString()}`}
                        type="text"
                        defaultValue={log.exercises[0]?.score || ''}
                        onChange={(e) => updateExerciseLog(0, 'score', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="12:30 / 5 rounds"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Rx / Scaled</label>
                      <select
                        key={`rx-${logDate.toISOString()}`}
                        defaultValue={log.exercises[0]?.rx || ''}
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
                key={`general-notes-${logDate.toISOString()}`}
                defaultValue={log.notes || ''}
                onFocus={(e) => {
                  // Select all text on focus for easy overwriting
                  e.target.select();
                }}
                onChange={(e) => updateGeneralNotes(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="How did the workout feel? Any PRs? Issues?"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleClose}
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
      {/* Progress Dashboard Modal */}
      {showProgressDashboard && (
        <ProgressDashboard
          workoutLogs={workoutLogs}
          workoutProgram={workoutProgram}
          onClose={() => setShowProgressDashboard(false)}
        />
      )}

      {/* Schedule Config Modal */}
      {showScheduleConfig && (
        <ScheduleConfig
          currentSchedule={workoutProgram}
          onSave={handleScheduleSave}
          onClose={() => setShowScheduleConfig(false)}
        />
      )}

      {/* Log Modal */}
      <LogModal />

      {/* Edit Workout Modal */}
      <EditWorkoutModal />

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
              onClick={handleExportData}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Export workout data as backup"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <label className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowScheduleConfig(!showScheduleConfig)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                showScheduleConfig ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Configure your weekly workout schedule"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Schedule</span>
            </button>
            <button
              onClick={() => setShowProgressDashboard(!showProgressDashboard)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                showProgressDashboard ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                showHistory ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Unlock className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
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

        {/* View Mode Switcher */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-700 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'daily' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'weekly' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'monthly' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            {viewMode === 'weekly' ? (
              <>
                <h2 className="text-2xl font-bold">{periodTitle.main}</h2>
                <p className="text-gray-400">{periodTitle.sub}</p>
              </>
            ) : (
              <h2 className="text-2xl font-bold">{periodTitle}</h2>
            )}
          </div>
          
          <button
            onClick={() => navigate(1)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar View */}
        <div className={`grid gap-4 ${
          viewMode === 'daily' 
            ? 'grid-cols-1 max-w-2xl mx-auto' 
            : viewMode === 'weekly'
            ? 'grid-cols-1 md:grid-cols-7'
            : 'grid-cols-7'
        }`}>
          {displayDates.map((item, index) => {
            // Handle both date formats (monthly has {date, isPadding}, others have just date)
            let date, isPadding;
            
            if (viewMode === 'monthly') {
              // Monthly view items are objects with {date, isPadding}
              date = item.date;
              isPadding = item.isPadding;
            } else {
              // Daily and weekly views items are just Date objects
              date = item;
              isPadding = false;
            }
            
            // Always use getWorkoutForDate to ensure consistency across all views
            const workout = getWorkoutForDate(date);
            const log = getDateLog(date);
            
            // Debug for December 14, 2025
            if (date.getDate() === 14 && date.getMonth() === 11 && date.getFullYear() === 2025) {
              console.log('Dec 14, 2025 in', viewMode, 'view:', {
                dateISO: date.toISOString(),
                dateKey: date.toISOString().split('T')[0],
                logCompleted: log.completed,
                hasLog: log.completed !== null
              });
            }
            
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all ${
                  viewMode === 'daily' ? 'flex flex-col' : 'flex flex-col h-full'
                } ${
                  isToday(date) 
                    ? 'border-blue-500 ring-2 ring-blue-500/30' 
                    : isPadding
                    ? 'border-gray-800 opacity-40'
                    : 'border-gray-700'
                } ${isPadding ? 'bg-gray-800/30' : 'bg-gray-800'}`}
              >
                {/* Day Header */}
                <div className={`${workout.color} px-4 py-3 rounded-t-xl flex items-center justify-between ${isPadding ? 'opacity-50' : ''}`}>
                  <div>
                    <div className="font-bold text-lg">
                      {viewMode === 'monthly' 
                        ? date.toLocaleDateString('en-IL', { weekday: 'short' })
                        : englishDays[date.getDay()]
                      }
                    </div>
                    <div className="text-sm opacity-80">
                      {viewMode === 'monthly'
                        ? date.getDate()
                        : `${hebrewDays[date.getDay()]} • ${date.getDate()}`
                      }
                    </div>
                  </div>
                  {log.completed !== null && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      log.completed 
                        ? 'bg-white text-green-600 border-white shadow-lg' 
                        : 'bg-white text-red-600 border-white shadow-lg'
                    }`}>
                      {log.completed ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 stroke-[3]" />}
                    </div>
                  )}
                </div>

                {/* Workout Type */}
                {!isPadding && (
                  <div className="px-4 py-2 border-b border-gray-700">
                    <div className="font-semibold">{workout.typeEn}</div>
                    <div className="text-sm text-gray-400">{workout.type}</div>
                  </div>
                )}

                {/* Exercises Preview */}
                {!isPadding && (
                  <div className={`p-4 space-y-2 ${viewMode === 'daily' ? '' : 'flex-1'}`}>
                    {viewMode === 'monthly' ? (
                      // Condensed view for monthly
                      workout.typeEn !== 'Rest' && (
                        <div className="text-xs text-gray-400">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </div>
                      )
                    ) : viewMode === 'daily' ? (
                      // Show ALL exercises in daily view
                      <>
                        {workout.exercises.map((exercise, exIndex) => (
                          <div key={exIndex} className="text-sm">
                            <div className="font-medium text-white">{exercise.name}</div>
                            {exercise.sets && <div className="text-gray-400 text-xs">{exercise.sets}</div>}
                            {exercise.notes && <div className="text-gray-500 text-xs mt-1">{exercise.notes}</div>}
                          </div>
                        ))}
                      </>
                    ) : (
                      // Preview for weekly (show first 3)
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
                )}

                {/* Log and Edit Buttons */}
                {!isPadding && workout.typeEn !== 'Rest' && (
                  <div className="px-4 pb-4 space-y-2">
                    <button
                      onClick={() => openLogModal(date)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Log Workout
                    </button>
                    <button
                      onClick={() => openEditModal(date)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Workout
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
              {weekDates.filter(d => {
                const workout = getWorkoutForDate(d);
                return workout.typeEn === 'Strength' && getDateLog(d).completed === true;
              }).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">CrossFit</div>
            <div className="text-2xl font-bold text-orange-400">
              {weekDates.filter(d => {
                const workout = getWorkoutForDate(d);
                return workout.typeEn === 'CrossFit' && getDateLog(d).completed === true;
              }).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Running</div>
            <div className="text-2xl font-bold text-emerald-400">
              {weekDates.filter(d => {
                const workout = getWorkoutForDate(d);
                const log = getDateLog(d);
                // Check if it's any running-related workout
                const isRunning = workout.typeEn === 'Sprints' || 
                                 workout.typeEn === 'Long Run' ||
                                 workout.typeEn?.toLowerCase().includes('run') ||
                                 workout.typeEn?.toLowerCase().includes('fartlek') ||
                                 workout.type?.includes('ריצה'); // Hebrew for "running"
                return isRunning && log.completed === true;
              }).length}/2
            </div>
            <div className="text-gray-500 text-xs">this week</div>
          </div>
        </div>
      </main>
    </div>
  );
}
