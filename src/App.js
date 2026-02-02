import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const PROJECT_LENGTH = 15840;
const MOB_DAYS = 14;
const MOB_COST = 25000;
const DEFAULT_BUFFER = 5;
const INDIRECT_RATE = 0.30;
const PROFIT_RATE = 0.05;
const TARGET_DAYS = 55;
const TARGET_COST = 550000;

const CREWS = {
  exc: { rate: 220, cost: 1600, name: 'Excavation & Bedding', equipment: '1 Excavator' },
  pipe: { rate: 180, cost: 2500, name: 'Pipe Laying & Alignment', equipment: '1 Mobile Crane' },
  back: { rate: 250, cost: 2300, name: 'Backfill & Compaction', equipment: '1 Excavator + 1 Compactor' },
};

// Calculated durations
const DURATIONS = {
  exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),   // 72
  pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate), // 88
  back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate)  // 64
};

// Helper: Get position at a specific day
const getPositionAtDay = (startDay, rate, currentDay) => {
  if (currentDay < startDay) return 0;
  const daysWorked = currentDay - startDay + 1;
  return Math.min(daysWorked * rate, PROJECT_LENGTH);
};

// ==================== QUIZ STEP COMPONENT ====================
function QuizStep({ onComplete }) {
  const [answers, setAnswers] = useState({ q1: null, q2: null, q3: '' });
  const [submitted, setSubmitted] = useState({ q1: false, q2: false, q3: false });
  
  const correctAnswers = { q1: 'c', q2: 'b', q3: 64 };
  
  const isCorrect = {
    q1: answers.q1 === correctAnswers.q1,
    q2: answers.q2 === correctAnswers.q2,
    q3: parseInt(answers.q3) === correctAnswers.q3
  };
  
  const allCorrect = submitted.q1 && submitted.q2 && submitted.q3 &&
                     isCorrect.q1 && isCorrect.q2 && isCorrect.q3;
  
  const handleSubmit = (questionId) => {
    setSubmitted(prev => ({ ...prev, [questionId]: true }));
  };
  
  const getOptionClass = (questionId, optionValue) => {
    const isSelected = answers[questionId] === optionValue;
    const isSubmitted = submitted[questionId];
    const isThisCorrect = optionValue === correctAnswers[questionId];
    
    if (!isSubmitted) {
      return `block w-full p-3 rounded border-2 cursor-pointer transition-all text-left
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`;
    }
    
    if (isThisCorrect) {
      return 'block w-full p-3 rounded border-2 border-green-500 bg-green-50 text-left';
    }
    
    if (isSelected && !isThisCorrect) {
      return 'block w-full p-3 rounded border-2 border-red-500 bg-red-50 text-left';
    }
    
    return 'block w-full p-3 rounded border-2 border-gray-200 bg-gray-50 text-left opacity-50';
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-lg">📚 Step 1: Knowledge Check</h3>
        <p className="text-sm text-gray-600 mt-1">
          Before creating your schedule, answer these questions to confirm you understand the project basics.
        </p>
      </div>
      
      {/* Question 1: Activity Sequence */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">Q1</span>
          <div>
            <h4 className="font-bold">What is the correct sequence of activities?</h4>
            <p className="text-sm text-gray-500">Select the order in which crews must work on the pipeline.</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {[
            { value: 'a', label: 'Backfill → Pipe Laying → Excavation' },
            { value: 'b', label: 'Pipe Laying → Excavation → Backfill' },
            { value: 'c', label: 'Excavation → Pipe Laying → Backfill' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => !submitted.q1 && setAnswers(prev => ({ ...prev, q1: option.value }))}
              className={getOptionClass('q1', option.value)}
              disabled={submitted.q1}
            >
              <span className="font-medium">{option.value.toUpperCase()})</span> {option.label}
              {submitted.q1 && option.value === correctAnswers.q1 && (
                <span className="ml-2 text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
        
        {!submitted.q1 ? (
          <button
            onClick={() => handleSubmit('q1')}
            disabled={!answers.q1}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q1 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-3 rounded ${isCorrect.q1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect.q1 
              ? '✅ Correct! You must dig before laying pipe, and lay pipe before backfilling.'
              : '❌ Incorrect. Think about it: you cannot lay pipe without digging a trench first.'}
          </div>
        )}
      </div>
      
      {/* Question 2: Slowest Crew */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">Q2</span>
          <div>
            <h4 className="font-bold">Which crew is the SLOWEST?</h4>
            <p className="text-sm text-gray-500">Compare the production rates below.</p>
          </div>
        </div>
        
        {/* Rate reference table */}
        <div className="bg-gray-50 rounded p-3 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">Crew</th>
                <th className="pb-2 text-right">Rate (ft/day)</th>
                <th className="pb-2 text-right">Duration (days)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>⛏️ Excavation</td><td className="text-right font-mono">220</td><td className="text-right font-mono">72</td></tr>
              <tr><td>🔧 Pipe Laying</td><td className="text-right font-mono">180</td><td className="text-right font-mono">88</td></tr>
              <tr><td>🚜 Backfill</td><td className="text-right font-mono">250</td><td className="text-right font-mono">64</td></tr>
            </tbody>
          </table>
        </div>
        
        <div className="space-y-2 mb-4">
          {[
            { value: 'a', label: 'Excavation (220 ft/day)' },
            { value: 'b', label: 'Pipe Laying (180 ft/day)' },
            { value: 'c', label: 'Backfill (250 ft/day)' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => !submitted.q2 && setAnswers(prev => ({ ...prev, q2: option.value }))}
              className={getOptionClass('q2', option.value)}
              disabled={submitted.q2}
            >
              <span className="font-medium">{option.value.toUpperCase()})</span> {option.label}
              {submitted.q2 && option.value === correctAnswers.q2 && (
                <span className="ml-2 text-green-600">✓ SLOWEST</span>
              )}
            </button>
          ))}
        </div>
        
        {!submitted.q2 ? (
          <button
            onClick={() => handleSubmit('q2')}
            disabled={!answers.q2}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q2 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-3 rounded ${isCorrect.q2 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect.q2 
              ? '✅ Correct! Pipe Laying at 180 ft/day is the slowest. This will be important for scheduling!'
              : '❌ Incorrect. The slowest crew has the LOWEST production rate (ft/day).'}
          </div>
        )}
      </div>
      
      {/* Question 3: Duration Calculation */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">Q3</span>
          <div>
            <h4 className="font-bold">What is Backfill's duration?</h4>
            <p className="text-sm text-gray-500">Calculate using the formula below.</p>
          </div>
        </div>
        
        {/* Formula reference */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <div className="font-mono text-sm">
            <strong>Formula:</strong> Duration = ROUNDUP(Project Length ÷ Rate)
          </div>
          <div className="font-mono text-sm mt-1">
            <strong>Given:</strong> Project Length = 15,840 ft | Backfill Rate = 250 ft/day
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-600">Backfill Duration =</span>
          <input
            type="number"
            value={answers.q3}
            onChange={(e) => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
            disabled={submitted.q3}
            className={`w-24 px-3 py-2 border-2 rounded text-center font-bold text-lg
              ${submitted.q3 
                ? (isCorrect.q3 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                : 'border-gray-300 focus:border-blue-500'}`}
            placeholder="?"
          />
          <span className="text-gray-600">days</span>
        </div>
        
        {!submitted.q3 ? (
          <button
            onClick={() => handleSubmit('q3')}
            disabled={!answers.q3}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q3 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-3 rounded ${isCorrect.q3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect.q3 
              ? '✅ Correct! 15,840 ÷ 250 = 63.36 → rounds up to 64 days'
              : `❌ Incorrect. Calculate: 15,840 ÷ 250 = 63.36, which rounds UP to 64 days.`}
          </div>
        )}
      </div>
      
      {/* Continue button */}
      {allCorrect && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-5 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="font-bold text-xl text-green-800 mb-2">All Questions Correct!</h3>
          <p className="text-green-700 mb-4">You're ready to create your schedule.</p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all"
          >
            Continue to Step 2: Interactive Scheduler →
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== DRAGGABLE BAR CHART COMPONENT ====================
function DraggableBarChart({ schedule, onScheduleChange, conflictStatus }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Chart dimensions
  const CHART_WIDTH = 700;
  const CHART_PADDING = 100;
  const MAX_DAY = 150;
  const PIXELS_PER_DAY = (CHART_WIDTH - CHART_PADDING) / MAX_DAY;
  const BAR_HEIGHT = 32;
  const BAR_GAP = 8;
  
  const dayToPixel = (day) => CHART_PADDING + day * PIXELS_PER_DAY;
  
  const pixelToDay = (pixel) => {
    const day = Math.round((pixel - CHART_PADDING) / PIXELS_PER_DAY);
    return Math.max(15, Math.min(day, 100));
  };
  
  const handleMouseDown = (barType, e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const currentStart = barType === 'pipe' ? schedule.pipeStart : schedule.backStart;
    setDragOffset(mouseX - dayToPixel(currentStart));
    setDragging(barType);
  };
  
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newDay = pixelToDay(mouseX - dragOffset);
    
    onScheduleChange({
      ...schedule,
      [dragging === 'pipe' ? 'pipeStart' : 'backStart']: newDay
    });
  }, [dragging, dragOffset, schedule, onScheduleChange]);
  
  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);
  
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);
  
  const bars = [
    { id: 'mob', label: 'Mobilization', start: 1, end: 14, color: 'bg-gray-400', locked: true },
    { id: 'exc', label: 'Excavation', start: 15, end: 15 + DURATIONS.exc - 1, color: 'bg-blue-500', locked: true },
    { id: 'pipe', label: 'Pipe Laying', start: schedule.pipeStart, end: schedule.pipeStart + DURATIONS.pipe - 1, color: 'bg-green-500', locked: false },
    { id: 'back', label: 'Backfill', start: schedule.backStart, end: schedule.backStart + DURATIONS.back - 1, color: 'bg-orange-500', locked: false }
  ];
  
  return (
    <div 
      ref={chartRef}
      className="relative bg-gray-50 rounded-lg p-4 overflow-x-auto"
      style={{ width: '100%', minWidth: CHART_WIDTH, height: bars.length * (BAR_HEIGHT + BAR_GAP) + 80 }}
    >
      {/* Day axis labels */}
      <div className="absolute bottom-2 left-0 right-0 flex text-xs text-gray-500">
        {[0, 20, 40, 60, 80, 100, 120, 140].map(day => (
          <span key={day} className="absolute" style={{ left: dayToPixel(day) - 10 }}>{day}</span>
        ))}
      </div>
      
      {/* Grid lines */}
      {[0, 20, 40, 60, 80, 100, 120, 140].map(day => (
        <div 
          key={day}
          className="absolute top-0 bottom-8 w-px bg-gray-200"
          style={{ left: dayToPixel(day) }}
        />
      ))}
      
      {/* Row labels */}
      {bars.map((bar, index) => (
        <div
          key={`label-${bar.id}`}
          className="absolute left-2 text-xs font-medium text-gray-600 w-20"
          style={{ top: index * (BAR_HEIGHT + BAR_GAP) + 15 + BAR_HEIGHT/2 - 8 }}
        >
          {bar.label}
        </div>
      ))}
      
      {/* Bars */}
      {bars.map((bar, index) => (
        <div
          key={bar.id}
          className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold
            ${bar.locked ? 'cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl'}
            ${dragging === bar.id ? 'ring-4 ring-yellow-300 shadow-xl z-10' : ''}
            ${!bar.locked && conflictStatus.hasConflict ? 'animate-pulse' : ''}
            transition-shadow
          `}
          style={{
            left: dayToPixel(bar.start),
            width: Math.max((bar.end - bar.start + 1) * PIXELS_PER_DAY, 30),
            height: BAR_HEIGHT,
            top: index * (BAR_HEIGHT + BAR_GAP) + 15
          }}
          onMouseDown={bar.locked ? undefined : (e) => handleMouseDown(bar.id, e)}
        >
          {bar.locked && <span className="mr-1">🔒</span>}
          {bar.start}-{bar.end}
        </div>
      ))}
    </div>
  );
}

// ==================== PIPELINE VIEWER COMPONENT ====================
function PipelineViewer({ schedule, viewDay, onViewDayChange }) {
  const projectEnd = Math.max(
    15 + DURATIONS.exc - 1,
    schedule.pipeStart + DURATIONS.pipe - 1,
    schedule.backStart + DURATIONS.back - 1
  );
  
  const positions = {
    exc: getPositionAtDay(15, CREWS.exc.rate, viewDay),
    pipe: getPositionAtDay(schedule.pipeStart, CREWS.pipe.rate, viewDay),
    back: getPositionAtDay(schedule.backStart, CREWS.back.rate, viewDay)
  };
  
  const conflicts = [];
  if (positions.pipe > positions.exc && positions.exc < PROJECT_LENGTH) {
    conflicts.push({ type: 'pipe-exc', diff: positions.pipe - positions.exc });
  }
  if (positions.back > positions.pipe && positions.pipe < PROJECT_LENGTH) {
    conflicts.push({ type: 'back-pipe', diff: positions.back - positions.pipe });
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-bold mb-3">📍 Pipeline Position at Day {viewDay}</h4>
      
      {/* Day slider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Day:</span>
        <input
          type="range"
          min={15}
          max={projectEnd}
          value={viewDay}
          onChange={(e) => onViewDayChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <input
          type="number"
          min={15}
          max={projectEnd}
          value={viewDay}
          onChange={(e) => onViewDayChange(Math.max(15, Math.min(parseInt(e.target.value) || 15, projectEnd)))}
          className="w-16 px-2 py-1 border rounded text-center"
        />
      </div>
      
      {/* Pipeline visualization */}
      <div className="relative bg-gray-100 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0 ft</span>
          <span>4,000</span>
          <span>8,000</span>
          <span>12,000</span>
          <span>15,840 ft</span>
        </div>
        
        <div className="h-2 bg-gray-300 rounded-full mb-4" />
        
        {[
          { id: 'exc', name: 'Excavation', icon: '⛏️', color: 'bg-blue-500', pos: positions.exc },
          { id: 'pipe', name: 'Pipe Laying', icon: '🔧', color: 'bg-green-500', pos: positions.pipe },
          { id: 'back', name: 'Backfill', icon: '🚜', color: 'bg-orange-500', pos: positions.back }
        ].map((crew) => (
          <div key={crew.id} className="relative h-10 mb-2">
            <div 
              className={`absolute h-3 ${crew.color} rounded-full top-3`}
              style={{ width: `${(crew.pos / PROJECT_LENGTH) * 100}%` }}
            />
            <div 
              className="absolute top-0 transform -translate-x-1/2 text-xl"
              style={{ left: `${(crew.pos / PROJECT_LENGTH) * 100}%` }}
            >
              {crew.icon}
            </div>
            <span className="absolute right-0 top-2 text-xs text-gray-600">
              {crew.name}: {crew.pos.toLocaleString()} ft
            </span>
          </div>
        ))}
      </div>
      
      {/* Conflict status at current day */}
      {conflicts.length > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="font-bold text-red-700 mb-2">❌ Conflict at Day {viewDay}!</div>
          {conflicts.map((c, i) => (
            <div key={i} className="text-sm text-red-600">
              {c.type === 'back-pipe' 
                ? `🚜 Backfill is ${c.diff.toLocaleString()} ft AHEAD of 🔧 Pipe Laying`
                : `🔧 Pipe Laying is ${c.diff.toLocaleString()} ft AHEAD of ⛏️ Excavation`}
            </div>
          ))}
          <div className="text-sm text-red-600 mt-2">
            💡 Tip: Drag the bars in the chart above to fix this conflict.
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="font-bold text-green-700">✅ No conflict at Day {viewDay}</div>
          <div className="text-sm text-green-600">All crews are in proper sequence.</div>
        </div>
      )}
    </div>
  );
}

// ==================== SCHEDULER STEP COMPONENT ====================
function SchedulerStep({ onComplete }) {
  const [schedule, setSchedule] = useState({ pipeStart: 15, backStart: 15 });
  const [viewDay, setViewDay] = useState(45);
  
  const fullSchedule = {
    excS: 15,
    excE: 15 + DURATIONS.exc - 1,
    pipeS: schedule.pipeStart,
    pipeE: schedule.pipeStart + DURATIONS.pipe - 1,
    backS: schedule.backStart,
    backE: schedule.backStart + DURATIONS.back - 1
  };
  
  const projectEnd = Math.max(fullSchedule.excE, fullSchedule.pipeE, fullSchedule.backE);
  
  // Check for conflicts across all days
  const checkAllConflicts = useCallback(() => {
    for (let day = 15; day <= projectEnd; day++) {
      const excPos = getPositionAtDay(15, CREWS.exc.rate, day);
      const pipePos = getPositionAtDay(schedule.pipeStart, CREWS.pipe.rate, day);
      const backPos = getPositionAtDay(schedule.backStart, CREWS.back.rate, day);
      
      if (pipePos > excPos && excPos < PROJECT_LENGTH) {
        return { hasConflict: true, firstConflictDay: day, type: 'pipe-exc' };
      }
      if (backPos > pipePos && pipePos < PROJECT_LENGTH) {
        return { hasConflict: true, firstConflictDay: day, type: 'back-pipe' };
      }
    }
    return { hasConflict: false, firstConflictDay: null, type: null };
  }, [schedule, projectEnd]);
  
  const conflictStatus = checkAllConflicts();
  const canProceed = !conflictStatus.hasConflict;
  
  const handleReset = () => {
    setSchedule({ pipeStart: 15, backStart: 15 });
    setViewDay(45);
  };
  
  const jumpToConflict = () => {
    if (conflictStatus.firstConflictDay) {
      setViewDay(conflictStatus.firstConflictDay);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="font-bold text-lg">🎮 Step 2: Interactive Bar Chart Scheduler</h3>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Starting Point:</strong> All activities begin at Day 15 (naive schedule). 
          Drag the <span className="text-green-600 font-bold">green</span> and <span className="text-orange-600 font-bold">orange</span> bars to create a conflict-free schedule!
        </p>
      </div>
      
      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold">📊 Drag the Bars to Adjust Start Times</h4>
          <button onClick={handleReset} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">
            🔄 Reset
          </button>
        </div>
        
        <DraggableBarChart
          schedule={schedule}
          onScheduleChange={setSchedule}
          conflictStatus={conflictStatus}
        />
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-400 rounded"></div><span>Mobilization</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-500 rounded"></div><span>Excavation 🔒</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Pipe Laying (drag)</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-500 rounded"></div><span>Backfill (drag)</span></div>
        </div>
      </div>
      
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Schedule Table */}
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold mb-3">📋 Schedule Table</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border text-left">Activity</th>
                <th className="px-3 py-2 border text-center">Rate</th>
                <th className="px-3 py-2 border text-center">Duration</th>
                <th className="px-3 py-2 border text-center">Start</th>
                <th className="px-3 py-2 border text-center">End</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 border">📦 Mobilization</td>
                <td className="px-3 py-2 border text-center">-</td>
                <td className="px-3 py-2 border text-center">14</td>
                <td className="px-3 py-2 border text-center">1</td>
                <td className="px-3 py-2 border text-center">14</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-3 py-2 border">⛏️ Excavation</td>
                <td className="px-3 py-2 border text-center">{CREWS.exc.rate}</td>
                <td className="px-3 py-2 border text-center">{DURATIONS.exc}</td>
                <td className="px-3 py-2 border text-center font-bold">15 🔒</td>
                <td className="px-3 py-2 border text-center font-bold">{fullSchedule.excE}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-3 py-2 border">🔧 Pipe Laying</td>
                <td className="px-3 py-2 border text-center">{CREWS.pipe.rate}</td>
                <td className="px-3 py-2 border text-center">{DURATIONS.pipe}</td>
                <td className="px-3 py-2 border text-center font-bold text-green-700">{fullSchedule.pipeS}</td>
                <td className="px-3 py-2 border text-center font-bold text-green-700">{fullSchedule.pipeE}</td>
              </tr>
              <tr className="bg-orange-50">
                <td className="px-3 py-2 border">🚜 Backfill</td>
                <td className="px-3 py-2 border text-center">{CREWS.back.rate}</td>
                <td className="px-3 py-2 border text-center">{DURATIONS.back}</td>
                <td className="px-3 py-2 border text-center font-bold text-orange-700">{fullSchedule.backS}</td>
                <td className="px-3 py-2 border text-center font-bold text-orange-700">{fullSchedule.backE}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-center">
            <span className="text-gray-600">Project End:</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">{projectEnd} days</span>
          </div>
        </div>
        
        {/* Pipeline Viewer */}
        <PipelineViewer schedule={schedule} viewDay={viewDay} onViewDayChange={setViewDay} />
      </div>
      
      {/* Global Conflict Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-bold mb-3">🔍 Conflict Analysis</h4>
        
        {conflictStatus.hasConflict ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h5 className="font-bold text-red-800 text-lg">Conflict Detected!</h5>
                <p className="text-red-700 mt-1">
                  {conflictStatus.type === 'back-pipe' 
                    ? 'Backfill crew will catch up to and pass the Pipe Laying crew.'
                    : 'Pipe Laying crew will catch up to and pass the Excavation crew.'}
                </p>
                <p className="text-red-600 text-sm mt-2">
                  First conflict at <strong>Day {conflictStatus.firstConflictDay}</strong>.
                </p>
                
                <div className="flex gap-3 mt-3">
                  <button onClick={jumpToConflict} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">
                    🔍 View Day {conflictStatus.firstConflictDay}
                  </button>
                  <button onClick={handleReset} className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300">
                    🔄 Reset
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>💡 Tips to fix:</strong>
                  <ul className="list-disc list-inside text-sm mt-1 text-yellow-800">
                    {conflictStatus.type === 'back-pipe' && (
                      <>
                        <li>Drag the <strong>orange Backfill bar</strong> to the RIGHT</li>
                        <li>Backfill (250 ft/day) is faster than Pipe Laying (180 ft/day)</li>
                      </>
                    )}
                    {conflictStatus.type === 'pipe-exc' && (
                      <>
                        <li>Drag the <strong>green Pipe Laying bar</strong> to the RIGHT</li>
                        <li>Give Excavation more time before starting Pipe Laying</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🎉</span>
              <div className="flex-1">
                <h5 className="font-bold text-green-800 text-lg">No Conflicts Detected!</h5>
                <p className="text-green-700 mt-1">All crews maintain proper sequence throughout the project.</p>
                <ul className="text-sm text-green-600 mt-2">
                  <li>✅ Excavation stays ahead of Pipe Laying</li>
                  <li>✅ Pipe Laying stays ahead of Backfill</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Key Insight */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-bold text-purple-800 mb-2">💡 Key Insight from R1</h4>
        <p className="text-purple-700 text-sm">
          <strong>Bar charts show WHEN activities happen, but not WHERE crews are working.</strong>
        </p>
        <p className="text-purple-600 text-sm mt-2">
          In <strong>Round 2</strong>, you'll learn about <strong>Line of Balance (LOB)</strong> — 
          a better visualization that shows both time AND location!
        </p>
      </div>
      
      {/* Complete Button */}
      <div className="text-center">
        {canProceed ? (
          <button
            onClick={() => onComplete(fullSchedule)}
            className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 shadow-lg"
          >
            ✅ Complete R1 → Proceed to R2
          </button>
        ) : (
          <button disabled className="px-8 py-4 bg-gray-300 text-gray-500 rounded-lg font-bold text-lg cursor-not-allowed">
            🚫 Fix All Conflicts to Proceed
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== MAIN ROUND 1 COMPONENT ====================
function Round1({ playerName, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const handleQuizComplete = () => {
    setQuizCompleted(true);
    setCurrentStep(2);
  };
  
  const handleSchedulerComplete = (finalSchedule) => {
    onComplete({ round: 1, ...finalSchedule, quizCompleted: true });
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white py-3 px-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span><span className="text-blue-300">Player:</span> <strong>{playerName}</strong></span>
          <span className="font-bold text-lg">Round 1: Bar Chart Scheduling</span>
          <div className="text-sm">Step {currentStep} of 2</div>
        </div>
      </div>
      
      {/* Progress */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
              ${currentStep === 1 ? 'bg-blue-100 text-blue-800' : quizCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
              {quizCompleted ? '✅' : '1️⃣'} Knowledge Quiz
            </div>
            <span className="text-gray-400">→</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
              ${currentStep === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
              2️⃣ Interactive Scheduler
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-5xl mx-auto p-4">
        {currentStep === 1 && <QuizStep onComplete={handleQuizComplete} />}
        {currentStep === 2 && <SchedulerStep onComplete={handleSchedulerComplete} />}
      </div>
    </div>
  );
}

// ==================== APP WRAPPER FOR TESTING ====================
export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [name, setName] = useState('');
  const [r1Complete, setR1Complete] = useState(false);
  const [r1Results, setR1Results] = useState(null);
  
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">🎮 LOB Game - R1 Test</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg"
          />
          <button
            onClick={() => name && setGameStarted(true)}
            disabled={!name}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Start Round 1 →
          </button>
        </div>
      </div>
    );
  }
  
  if (r1Complete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">Round 1 Complete!</h1>
          <p className="text-gray-600 mb-6">Great job, {name}!</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <h3 className="font-bold mb-2">Your Schedule:</h3>
            <ul className="text-sm space-y-1">
              <li>Excavation: Day {r1Results.excS} - {r1Results.excE}</li>
              <li>Pipe Laying: Day {r1Results.pipeS} - {r1Results.pipeE}</li>
              <li>Backfill: Day {r1Results.backS} - {r1Results.backE}</li>
            </ul>
          </div>
          <button
            onClick={() => { setR1Complete(false); setGameStarted(false); setName(''); }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Round1
      playerName={name}
      onComplete={(results) => {
        setR1Results(results);
        setR1Complete(true);
      }}
    />
  );
}
