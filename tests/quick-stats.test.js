import { describe, it, expect } from 'vitest';

describe('Quick Stats Calculation', () => {
  it('should handle various running workout type names', () => {
    const testCases = [
      { type: 'Sprints', shouldBeRunning: true },
      { type: 'Long Run', shouldBeRunning: true },
      { type: 'Fartlek', shouldBeRunning: true },
      { type: 'Tempo Run', shouldBeRunning: true },
      { type: 'Easy Run', shouldBeRunning: true },
      { type: 'Zone 2', shouldBeRunning: false }, // Zone 2 alone doesn't indicate running
      { type: 'Zone 2 Run', shouldBeRunning: true }
    ];
    
    testCases.forEach(({ type, shouldBeRunning }) => {
      const workout = { typeEn: type };
      let isRunning = false;
      
      if (workout.typeEn === 'Sprints' || workout.typeEn === 'Long Run') {
        isRunning = true;
      } else if (workout.typeEn && workout.typeEn.toLowerCase().includes('run')) {
        isRunning = true;
      } else if (workout.typeEn && workout.typeEn.toLowerCase().includes('fartlek')) {
        isRunning = true;
      }
      
      expect(isRunning).toBe(shouldBeRunning);
    });
  });

  it('should correctly identify running workout with Hebrew text', () => {
    const workout = { 
      type: 'ריצה (פארטלק)', 
      typeEn: 'Fartlek' 
    };
    
    const isRunning = 
      workout.typeEn === 'Sprints' || 
      workout.typeEn === 'Long Run' ||
      (workout.typeEn && workout.typeEn.toLowerCase().includes('run')) ||
      (workout.typeEn && workout.typeEn.toLowerCase().includes('fartlek')) ||
      (workout.type && workout.type.includes('ריצה'));
    
    expect(isRunning).toBe(true);
  });
});
