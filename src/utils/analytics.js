/**
 * Analytics and progress tracking utilities
 */

/**
 * Calculate workout statistics for a given period
 */
export function calculateWorkoutStats(workoutLogs, startDate, endDate) {
  const logs = Object.entries(workoutLogs)
    .filter(([dateKey]) => {
      const date = new Date(dateKey);
      return date >= startDate && date <= endDate;
    });

  const completed = logs.filter(([, log]) => log.completed === true).length;
  const skipped = logs.filter(([, log]) => log.completed === false).length;
  const total = logs.length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  return {
    completed,
    skipped,
    total,
    completionRate: Math.round(completionRate)
  };
}

/**
 * Get workout streak (consecutive days with completed workouts)
 */
export function calculateStreak(workoutLogs) {
  const sortedDates = Object.entries(workoutLogs)
    .filter(([, log]) => log.completed === true)
    .map(([dateKey]) => new Date(dateKey))
    .sort((a, b) => b - a);

  if (sortedDates.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if streak is current (last workout was today or yesterday)
  const lastWorkout = new Date(sortedDates[0]);
  lastWorkout.setHours(0, 0, 0, 0);
  const daysSinceLastWorkout = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastWorkout > 1) {
    return 0; // Streak is broken
  }

  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    current.setHours(0, 0, 0, 0);
    const previous = new Date(sortedDates[i - 1]);
    previous.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((previous - current) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate total volume for strength workouts
 */
export function calculateVolume(workoutLogs, exerciseName = null) {
  const volumes = [];

  Object.entries(workoutLogs).forEach(([dateKey, log]) => {
    if (!log.exercises) return;

    Object.entries(log.exercises).forEach(([idx, exercise]) => {
      if (exerciseName && exercise.name !== exerciseName) return;
      
      const weight = parseFloat(exercise.weight) || 0;
      const repsStr = exercise.reps || '';
      const sets = parseInt(exercise.sets) || 0;

      // Parse reps (e.g., "5/5/5" or "8")
      let totalReps = 0;
      if (repsStr.includes('/')) {
        totalReps = repsStr.split('/').reduce((sum, r) => sum + (parseInt(r) || 0), 0);
      } else {
        totalReps = (parseInt(repsStr) || 0) * (sets || 1);
      }

      const volume = weight * totalReps;
      
      if (volume > 0) {
        volumes.push({
          date: dateKey,
          exercise: exerciseName || exercise.name || 'Unknown',
          weight,
          reps: totalReps,
          sets,
          volume
        });
      }
    });
  });

  return volumes.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Find personal records for exercises
 */
export function findPersonalRecords(workoutLogs) {
  const prs = {};

  Object.entries(workoutLogs).forEach(([dateKey, log]) => {
    if (!log.exercises) return;

    Object.entries(log.exercises).forEach(([idx, exercise]) => {
      const weight = parseFloat(exercise.weight) || 0;
      if (weight === 0) return;

      const exerciseName = exercise.name || 'Unknown';
      
      if (!prs[exerciseName] || weight > prs[exerciseName].weight) {
        prs[exerciseName] = {
          weight,
          date: dateKey,
          reps: exercise.reps,
          sets: exercise.sets
        };
      }
    });
  });

  return prs;
}

/**
 * Calculate running statistics
 */
export function calculateRunningStats(workoutLogs, type = 'all') {
  const runs = [];

  Object.entries(workoutLogs).forEach(([dateKey, log]) => {
    if (!log.running) return;

    if (type === 'long' && log.running.distance) {
      runs.push({
        date: dateKey,
        type: 'long',
        distance: parseFloat(log.running.distance) || 0,
        duration: parseFloat(log.running.duration) || 0,
        pace: log.running.pace,
        heartRate: parseInt(log.running.heartRate) || 0
      });
    } else if (type === 'sprints' && log.running.sprintsCompleted) {
      runs.push({
        date: dateKey,
        type: 'sprints',
        completed: parseInt(log.running.sprintsCompleted) || 0,
        distance: parseInt(log.running.sprintDistance) || 0,
        bestTime: log.running.bestTime
      });
    } else if (type === 'all' && (log.running.distance || log.running.sprintsCompleted)) {
      runs.push({
        date: dateKey,
        type: log.running.distance ? 'long' : 'sprints',
        ...log.running
      });
    }
  });

  return runs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get workout type distribution
 */
export function getWorkoutTypeDistribution(workoutLogs, workoutProgram) {
  const distribution = {
    Strength: 0,
    CrossFit: 0,
    Sprints: 0,
    'Long Run': 0,
    Rest: 0
  };

  Object.entries(workoutLogs).forEach(([dateKey, log]) => {
    if (log.completed !== true) return;

    const date = new Date(dateKey);
    const dayIndex = date.getDay();
    const workout = workoutProgram[dayIndex];
    
    if (workout && workout.typeEn) {
      distribution[workout.typeEn] = (distribution[workout.typeEn] || 0) + 1;
    }
  });

  return distribution;
}

/**
 * Calculate weekly progress over time
 */
export function calculateWeeklyProgress(workoutLogs, weeksBack = 12) {
  const weeks = [];
  const today = new Date();
  
  for (let i = 0; i < weeksBack; i++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    
    const stats = calculateWorkoutStats(workoutLogs, weekStart, weekEnd);
    
    weeks.unshift({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      ...stats
    });
  }
  
  return weeks;
}

/**
 * Get recent activity summary
 */
export function getRecentActivity(workoutLogs, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentLogs = Object.entries(workoutLogs)
    .filter(([dateKey]) => new Date(dateKey) >= cutoffDate)
    .sort(([a], [b]) => new Date(b) - new Date(a));

  return {
    total: recentLogs.length,
    completed: recentLogs.filter(([, log]) => log.completed === true).length,
    logs: recentLogs.slice(0, 10)
  };
}
