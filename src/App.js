import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PROJECT_LENGTH = 15840;
const MOB_DAYS = 14;
const MOB_COST = 25000;
const DEFAULT_BUFFER = 5;
const INDIRECT_RATE = 0.30;
const PROFIT_RATE = 0.05;
const TARGET_DAYS = 55;
const TARGET_COST = 550000;

const CREWS = {
  exc: { rate: 220, cost: 1600, name: 'Excavation & Bedding', equipment: 'Excavator' },
  pipe: { rate: 180, cost: 2500, name: 'Pipe Laying & Alignment', equipment: 'Mobile Crane' },
  back: { rate: 250, cost: 2300, name: 'Backfill & Compaction', equipment: 'Excavator + Compactor' },
};

const EQUIPMENT = {
  exc: [
    { name: 'Small Excavator', rate: 165, cost: 900 },
    { name: 'Standard Excavator', rate: 220, cost: 1600 },
    { name: 'Large Excavator', rate: 330, cost: 2400 },
  ],
  pipe: [
    { name: 'Standard Mobile Crane', rate: 180, cost: 2500 },
    { name: 'Heavy Mobile Crane', rate: 270, cost: 3200 },
  ],
  back: [
    { name: 'Small Backfill Set', rate: 180, cost: 1400 },
    { name: 'Standard Backfill Set', rate: 250, cost: 2300 },
    { name: 'Large Backfill Set', rate: 375, cost: 3000 },
  ],
};

// -------------------- R1 DRAG SCHEDULER HELPERS/COMPONENTS --------------------
const DURATIONS = {
  exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
  pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
  back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
};

const getPositionAtDay = (startDay, rate, currentDay) => {
  if (currentDay < startDay) return 0;
  const daysWorked = currentDay - startDay + 1;
  return Math.min(daysWorked * rate, PROJECT_LENGTH);
};

function QuizStep({ dur, onComplete }) {
  const [answers, setAnswers] = useState({ q1: null, q2: null, q3: '' });
  const [submitted, setSubmitted] = useState({ q1: false, q2: false, q3: false });

  const correctAnswers = { q1: 'c', q2: 'b', q3: dur.back };

  const isCorrect = {
    q1: answers.q1 === correctAnswers.q1,
    q2: answers.q2 === correctAnswers.q2,
    q3: parseInt(answers.q3) === correctAnswers.q3,
  };

  const allCorrect =
    submitted.q1 && submitted.q2 && submitted.q3 &&
    isCorrect.q1 && isCorrect.q2 && isCorrect.q3;
  
  const allSubmitted = submitted.q1 && submitted.q2 && submitted.q3;

  const handleSubmit = (questionId) => setSubmitted(prev => ({ ...prev, [questionId]: true }));

  const getOptionClass = (questionId, optionValue) => {
    const isSelected = answers[questionId] === optionValue;
    const isSubmitted = submitted[questionId];
    const isThisCorrect = optionValue === correctAnswers[questionId];

    if (!isSubmitted) {
      return `block w-full p-3 rounded border-2 cursor-pointer transition-all text-left
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`;
    }
    if (isThisCorrect) return 'block w-full p-3 rounded border-2 border-green-500 bg-green-50 text-left';
    if (isSelected && !isThisCorrect) return 'block w-full p-3 rounded border-2 border-red-500 bg-red-50 text-left';
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

      {/* Q1 */}
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
              {submitted.q1 && option.value === correctAnswers.q1 && <span className="ml-2 text-green-600">✓</span>}
            </button>
          ))}
        </div>

        {!submitted.q1 ? (
          <button
            onClick={() => handleSubmit('q1')}
            disabled={!answers.q1}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
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

      {/* Q2 */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">Q2</span>
          <div>
            <h4 className="font-bold">Which crew is the SLOWEST?</h4>
            <p className="text-sm text-gray-500">Compare the production rates below.</p>
          </div>
        </div>

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
              <tr><td>⛏️ Excavation</td><td className="text-right font-mono">{CREWS.exc.rate}</td><td className="text-right font-mono">{dur.exc}</td></tr>
              <tr><td>🔧 Pipe Laying</td><td className="text-right font-mono">{CREWS.pipe.rate}</td><td className="text-right font-mono">{dur.pipe}</td></tr>
              <tr><td>🚜 Backfill</td><td className="text-right font-mono">{CREWS.back.rate}</td><td className="text-right font-mono">{dur.back}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { value: 'a', label: `Excavation (${CREWS.exc.rate} ft/day)` },
            { value: 'b', label: `Pipe Laying (${CREWS.pipe.rate} ft/day)` },
            { value: 'c', label: `Backfill (${CREWS.back.rate} ft/day)` }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => !submitted.q2 && setAnswers(prev => ({ ...prev, q2: option.value }))}
              className={getOptionClass('q2', option.value)}
              disabled={submitted.q2}
            >
              <span className="font-medium">{option.value.toUpperCase()})</span> {option.label}
              {submitted.q2 && option.value === correctAnswers.q2 && <span className="ml-2 text-green-600">✓ SLOWEST</span>}
            </button>
          ))}
        </div>

        {!submitted.q2 ? (
          <button
            onClick={() => handleSubmit('q2')}
            disabled={!answers.q2}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q2 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-3 rounded ${isCorrect.q2 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect.q2
              ? '✅ Correct! Pipe Laying is the slowest. This will be important for scheduling!'
              : '❌ Incorrect. The slowest crew has the LOWEST production rate (ft/day).'}
          </div>
        )}
      </div>

      {/* Q3 */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">Q3</span>
          <div>
            <h4 className="font-bold">What is Backfill's duration?</h4>
            <p className="text-sm text-gray-500">Calculate using the formula below.</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <div className="font-mono text-sm"><strong>Formula:</strong> Duration = ROUNDUP(Project Length ÷ Rate)</div>
          <div className="font-mono text-sm mt-1"><strong>Given:</strong> Project Length = {PROJECT_LENGTH.toLocaleString()} ft | Backfill Rate = {CREWS.back.rate} ft/day</div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-gray-600">Backfill Duration =</span>
          <input
            type="number"
            value={answers.q3}
            onChange={(e) => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
            disabled={submitted.q3}
            className={`w-24 px-3 py-2 border-2 rounded text-center font-bold text-lg
              ${submitted.q3 ? (isCorrect.q3 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300 focus:border-blue-500'}`}
            placeholder="?"
          />
          <span className="text-gray-600">days</span>
        </div>

        {!submitted.q3 ? (
          <button
            onClick={() => handleSubmit('q3')}
            disabled={!answers.q3}
            className={`px-4 py-2 rounded font-bold transition-all
              ${answers.q3 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Check Answer
          </button>
        ) : (
          <div className={`p-3 rounded ${isCorrect.q3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isCorrect.q3 ? `✅ Correct! Rounds up to ${dur.back} days.` : `❌ Incorrect. It rounds UP to ${dur.back} days.`}
          </div>
        )}
      </div>

      {allSubmitted && (
        <div
          className={`border-2 rounded-lg p-5 text-center ${
            allCorrect ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'
          }`}
        >
          <h3 className="font-bold text-xl mb-2">
            {allCorrect ? 'All Questions Correct!' : 'Quiz Complete'}
          </h3>
      
          <p className="mb-4 text-sm">
            {allCorrect
              ? "You're ready to create your schedule."
              : 'You can continue, but review the corrections above.'}
          </p>
      
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all"
          >
            Continue to Step 2: Interactive Scheduler →
          </button>
        </div>
      )}

function DraggableBarChart({ schedule, onScheduleChange, conflictStatus }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  const CHART_WIDTH = 700;
  const CHART_PADDING = 100;
  const MAX_DAY = 150;
  const PIXELS_PER_DAY = (CHART_WIDTH - CHART_PADDING) / MAX_DAY;
  const BAR_HEIGHT = 32;
  const BAR_GAP = 8;

  const dayToPixel = (day) => CHART_PADDING + day * PIXELS_PER_DAY;

  const pixelToDay = (pixel) => {
    const day = Math.round((pixel - CHART_PADDING) / PIXELS_PER_DAY);
    return Math.max(MOB_DAYS + 1, Math.min(day, 140));
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

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const bars = [
    { id: 'mob', label: 'Mobilization', start: 1, end: MOB_DAYS, color: 'bg-gray-400', locked: true },
    { id: 'exc', label: 'Excavation', start: MOB_DAYS + 1, end: (MOB_DAYS + 1) + DURATIONS.exc - 1, color: 'bg-blue-500', locked: true },
    { id: 'pipe', label: 'Pipe Laying', start: schedule.pipeStart, end: schedule.pipeStart + DURATIONS.pipe - 1, color: 'bg-green-500', locked: false },
    { id: 'back', label: 'Backfill', start: schedule.backStart, end: schedule.backStart + DURATIONS.back - 1, color: 'bg-orange-500', locked: false }
  ];

  return (
    <div
      ref={chartRef}
      className="relative bg-gray-50 rounded-lg p-4 overflow-x-auto"
      style={{ width: '100%', minWidth: CHART_WIDTH, height: bars.length * (BAR_HEIGHT + BAR_GAP) + 80 }}
    >
      {[0, 20, 40, 60, 80, 100, 120, 140].map(day => (
        <div key={`grid-${day}`} className="absolute top-0 bottom-8 w-px bg-gray-200" style={{ left: dayToPixel(day) }} />
      ))}

      <div className="absolute bottom-2 left-0 right-0 flex text-xs text-gray-500">
        {[0, 20, 40, 60, 80, 100, 120, 140].map(day => (
          <span key={`tick-${day}`} className="absolute" style={{ left: dayToPixel(day) - 10 }}>{day}</span>
        ))}
      </div>

      {bars.map((bar, index) => (
        <div
          key={`label-${bar.id}`}
          className="absolute left-2 text-xs font-medium text-gray-600 w-24"
          style={{ top: index * (BAR_HEIGHT + BAR_GAP) + 15 + BAR_HEIGHT / 2 - 8 }}
        >
          {bar.label}
        </div>
      ))}

      {bars.map((bar, index) => (
        <div
          key={bar.id}
          className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold
            ${bar.locked ? 'cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl'}
            ${dragging === bar.id ? 'ring-4 ring-yellow-300 shadow-xl z-10' : ''}
            ${!bar.locked && conflictStatus.hasConflict ? 'animate-pulse' : ''}
            transition-shadow`}
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

function PipelineViewer({ schedule, viewDay, onViewDayChange }) {
  const projectEnd = Math.max(
    (MOB_DAYS + 1) + DURATIONS.exc - 1,
    schedule.pipeStart + DURATIONS.pipe - 1,
    schedule.backStart + DURATIONS.back - 1
  );

  const positions = {
    exc: getPositionAtDay(MOB_DAYS + 1, CREWS.exc.rate, viewDay),
    pipe: getPositionAtDay(schedule.pipeStart, CREWS.pipe.rate, viewDay),
    back: getPositionAtDay(schedule.backStart, CREWS.back.rate, viewDay)
  };

  const conflicts = [];
  if (positions.pipe > positions.exc && positions.exc < PROJECT_LENGTH) conflicts.push({ type: 'pipe-exc', diff: positions.pipe - positions.exc });
  if (positions.back > positions.pipe && positions.pipe < PROJECT_LENGTH) conflicts.push({ type: 'back-pipe', diff: positions.back - positions.pipe });

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="font-bold mb-3">📍 Pipeline Position at Day {viewDay}</h4>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Day:</span>
        <input
          type="range"
          min={MOB_DAYS + 1}
          max={projectEnd}
          value={viewDay}
          onChange={(e) => onViewDayChange(parseInt(e.target.value))}
          className="flex-1"
        />
        <input
          type="number"
          min={MOB_DAYS + 1}
          max={projectEnd}
          value={viewDay}
          onChange={(e) => onViewDayChange(Math.max(MOB_DAYS + 1, Math.min(parseInt(e.target.value) || (MOB_DAYS + 1), projectEnd)))}
          className="w-16 px-2 py-1 border rounded text-center"
        />
      </div>

      <div className="relative bg-gray-100 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0 ft</span><span>4,000</span><span>8,000</span><span>12,000</span><span>{PROJECT_LENGTH.toLocaleString()} ft</span>
        </div>

        <div className="h-2 bg-gray-300 rounded-full mb-4" />

        {[
          { id: 'exc', name: 'Excavation', icon: '⛏️', color: 'bg-blue-500', pos: positions.exc },
          { id: 'pipe', name: 'Pipe Laying', icon: '🔧', color: 'bg-green-500', pos: positions.pipe },
          { id: 'back', name: 'Backfill', icon: '🚜', color: 'bg-orange-500', pos: positions.back }
        ].map((crew) => (
          <div key={crew.id} className="relative h-10 mb-2">
            <div className={`absolute h-3 ${crew.color} rounded-full top-3`} style={{ width: `${(crew.pos / PROJECT_LENGTH) * 100}%` }} />
            <div className="absolute top-0 transform -translate-x-1/2 text-xl" style={{ left: `${(crew.pos / PROJECT_LENGTH) * 100}%` }}>
              {crew.icon}
            </div>
            <span className="absolute right-0 top-2 text-xs text-gray-600">
              {crew.name}: {crew.pos.toLocaleString()} ft
            </span>
          </div>
        ))}
      </div>

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

function SchedulerStep({ onComplete }) {
  const [schedule, setSchedule] = useState({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 });
  const [viewDay, setViewDay] = useState(MOB_DAYS + 30);

  const fullSchedule = {
    excS: MOB_DAYS + 1,
    excE: (MOB_DAYS + 1) + DURATIONS.exc - 1,
    pipeS: schedule.pipeStart,
    pipeE: schedule.pipeStart + DURATIONS.pipe - 1,
    backS: schedule.backStart,
    backE: schedule.backStart + DURATIONS.back - 1,
    end: Math.max((MOB_DAYS + 1) + DURATIONS.exc - 1, schedule.pipeStart + DURATIONS.pipe - 1, schedule.backStart + DURATIONS.back - 1)
  };

  const projectEnd = fullSchedule.end;

  const checkAllConflicts = useCallback(() => {
    for (let day = MOB_DAYS + 1; day <= projectEnd; day++) {
      const excPos = getPositionAtDay(MOB_DAYS + 1, CREWS.exc.rate, day);
      const pipePos = getPositionAtDay(schedule.pipeStart, CREWS.pipe.rate, day);
      const backPos = getPositionAtDay(schedule.backStart, CREWS.back.rate, day);

      if (pipePos > excPos && excPos < PROJECT_LENGTH) return { hasConflict: true, firstConflictDay: day, type: 'pipe-exc' };
      if (backPos > pipePos && pipePos < PROJECT_LENGTH) return { hasConflict: true, firstConflictDay: day, type: 'back-pipe' };
    }
    return { hasConflict: false, firstConflictDay: null, type: null };
  }, [schedule, projectEnd]);

  const conflictStatus = checkAllConflicts();
  const canProceed = !conflictStatus.hasConflict;

  const handleReset = () => {
    setSchedule({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 });
    setViewDay(MOB_DAYS + 30);
  };

  const jumpToConflict = () => {
    if (conflictStatus.firstConflictDay) setViewDay(conflictStatus.firstConflictDay);
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="font-bold text-lg">🎮 Step 2: Interactive Bar Chart Scheduler</h3>
        <p className="text-sm text-gray-600 mt-1">
          Drag the <span className="text-green-600 font-bold">green</span> and <span className="text-orange-600 font-bold">orange</span> bars to create a conflict-free schedule.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold">📊 Drag the Bars to Adjust Start Times</h4>
          <button onClick={handleReset} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">
            🔄 Reset
          </button>
        </div>

        <DraggableBarChart schedule={schedule} onScheduleChange={setSchedule} conflictStatus={conflictStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold mb-3">📋 Schedule Table</h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 border text-left">Activity</th>
                <th className="px-3 py-2 border text-center">Start</th>
                <th className="px-3 py-2 border text-center">End</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-50"><td className="px-3 py-2 border">📦 Mobilization</td><td className="px-3 py-2 border text-center">1</td><td className="px-3 py-2 border text-center">{MOB_DAYS}</td></tr>
              <tr className="bg-blue-50"><td className="px-3 py-2 border">⛏️ Excavation</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.excS} 🔒</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.excE}</td></tr>
              <tr className="bg-green-50"><td className="px-3 py-2 border">🔧 Pipe Laying</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.pipeS}</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.pipeE}</td></tr>
              <tr className="bg-orange-50"><td className="px-3 py-2 border">🚜 Backfill</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.backS}</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.backE}</td></tr>
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-blue-50 rounded text-center">
            <span className="text-gray-600">Project End:</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">{projectEnd} days</span>
          </div>

          {conflictStatus.hasConflict && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
              <div className="font-bold text-red-700">Conflict detected (first at Day {conflictStatus.firstConflictDay})</div>
              <button onClick={jumpToConflict} className="mt-2 px-3 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">
                View Conflict Day
              </button>
            </div>
          )}
        </div>

        <PipelineViewer schedule={schedule} viewDay={viewDay} onViewDayChange={setViewDay} />
      </div>

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
// -------------------- END R1 DRAG SCHEDULER --------------------

export default function LOBGame() {
  const [round, setRound] = useState(0);
  const [name, setName] = useState('');

  // R1 state
  const [r1Step, setR1Step] = useState(1); // 1=Quiz, 2=Scheduler
  const [r1Input, setR1Input] = useState({ pipeS: '', backS: '' });

  const [r2Input, setR2Input] = useState({ excS: '', excE: '', pipeS: '', pipeE: '', backS: '', backE: '' });
  const [r2Validated, setR2Validated] = useState(false);
  const [r3Buffer, setR3Buffer] = useState(5);
  const [r4Eq, setR4Eq] = useState({ exc: 1, pipe: 0, back: 1 });
  const [r5Config, setR5Config] = useState({
    exc: { small: 0, standard: 1, large: 0 },
    pipe: { standard: 1, heavy: 0 },
    back: { small: 0, standard: 1, large: 0 },
  });
  const [r5Buffer, setR5Buffer] = useState(5);
  const [results, setResults] = useState({});

  const dur = useMemo(() => ({
    exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
    pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
    back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
  }), []);

  const r1Student = useMemo(() => {
    const excS = MOB_DAYS + 1;
    const excE = excS + dur.exc - 1;
    const pipeS = parseInt(r1Input.pipeS) || 0;
    const pipeE = pipeS > 0 ? pipeS + dur.pipe - 1 : 0;
    const backS = parseInt(r1Input.backS) || 0;
    const backE = backS > 0 ? backS + dur.back - 1 : 0;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [r1Input, dur]);

  const r2Correct = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + DEFAULT_BUFFER, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + DEFAULT_BUFFER - dur.back + 1, backE = backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [dur]);

  const r2Student = useMemo(() => ({
    excS: parseInt(r2Input.excS) || 0, excE: parseInt(r2Input.excE) || 0,
    pipeS: parseInt(r2Input.pipeS) || 0, pipeE: parseInt(r2Input.pipeE) || 0,
    backS: parseInt(r2Input.backS) || 0, backE: parseInt(r2Input.backE) || 0,
    end: Math.max(parseInt(r2Input.excE) || 0, parseInt(r2Input.pipeE) || 0, parseInt(r2Input.backE) || 0)
  }), [r2Input]);

  const r2IsCorrect =
    r2Student.excS === r2Correct.excS && r2Student.excE === r2Correct.excE &&
    r2Student.pipeS === r2Correct.pipeS && r2Student.pipeE === r2Correct.pipeE &&
    r2Student.backS === r2Correct.backS && r2Student.backE === r2Correct.backE;

  const r2Cost = useMemo(() => {
    const excC = dur.exc * CREWS.exc.cost;
    const pipeC = dur.pipe * CREWS.pipe.cost;
    const backC = dur.back * CREWS.back.cost;

    const direct = MOB_COST + excC + pipeC + backC;
    const indirect = Math.round(direct * INDIRECT_RATE);
    const profit = Math.round((direct + indirect) * PROFIT_RATE);

    return { direct, indirect, profit, total: direct + indirect + profit, excC, pipeC, backC };
  }, [dur]);

  const r3 = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + r3Buffer, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + r3Buffer - dur.back + 1, backE = backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [dur, r3Buffer]);

  const r4 = useMemo(() => {
    const exc = EQUIPMENT.exc[r4Eq.exc], pipe = EQUIPMENT.pipe[r4Eq.pipe], back = EQUIPMENT.back[r4Eq.back];
    const excDur = Math.ceil(PROJECT_LENGTH / exc.rate), pipeDur = Math.ceil(PROJECT_LENGTH / pipe.rate), backDur = Math.ceil(PROJECT_LENGTH / back.rate);

    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    const pipeS = pipe.rate < exc.rate ? excS + DEFAULT_BUFFER : excE + DEFAULT_BUFFER - pipeDur + 1;
    const pipeE = pipeS + pipeDur - 1;
    const backS = back.rate < pipe.rate ? pipeS + DEFAULT_BUFFER : pipeE + DEFAULT_BUFFER - backDur + 1;
    const backE = backS + backDur - 1;

    return {
      excS, excE, excDur, excRate: exc.rate, excCost: exc.cost, excName: exc.name,
      pipeS, pipeE, pipeDur, pipeRate: pipe.rate, pipeCost: pipe.cost, pipeName: pipe.name,
      backS, backE, backDur, backRate: back.rate, backCost: back.cost, backName: back.name,
      end: Math.max(excE, pipeE, backE)
    };
  }, [r4Eq]);

  const r4Cost = useMemo(() => {
    const excC = r4.excDur * r4.excCost;
    const pipeC = r4.pipeDur * r4.pipeCost;
    const backC = r4.backDur * r4.backCost;

    const direct = MOB_COST + excC + pipeC + backC;
    const indirect = Math.round(direct * INDIRECT_RATE);
    const profit = Math.round((direct + indirect) * PROFIT_RATE);

    return { direct, indirect, profit, total: direct + indirect + profit, excC, pipeC, backC };
  }, [r4]);

  const r5Calc = useMemo(() => {
    const excRate = (r5Config.exc.small * 165) + (r5Config.exc.standard * 220) + (r5Config.exc.large * 330) || 1;
    const excCost = (r5Config.exc.small * 900) + (r5Config.exc.standard * 1200) + (r5Config.exc.large * 1800);

    const pipeRate = (r5Config.pipe.standard * 180) + (r5Config.pipe.heavy * 270) || 1;
    const pipeCost = (r5Config.pipe.standard * 1800) + (r5Config.pipe.heavy * 2800);

    const backRate = (r5Config.back.small * 180) + (r5Config.back.standard * 250) + (r5Config.back.large * 375) || 1;
    const backCost = (r5Config.back.small * 1400) + (r5Config.back.standard * 1800) + (r5Config.back.large * 2600);

    return { exc: { rate: excRate, cost: excCost }, pipe: { rate: pipeRate, cost: pipeCost }, back: { rate: backRate, cost: backCost } };
  }, [r5Config]);

  const r5 = useMemo(() => {
    const excDur = Math.ceil(PROJECT_LENGTH / r5Calc.exc.rate);
    const pipeDur = Math.ceil(PROJECT_LENGTH / r5Calc.pipe.rate);
    const backDur = Math.ceil(PROJECT_LENGTH / r5Calc.back.rate);

    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    const pipeS = r5Calc.pipe.rate < r5Calc.exc.rate ? excS + r5Buffer : excE + r5Buffer - pipeDur + 1;
    const pipeE = pipeS + pipeDur - 1;
    const backS = r5Calc.back.rate < r5Calc.pipe.rate ? pipeS + r5Buffer : pipeE + r5Buffer - backDur + 1;
    const backE = backS + backDur - 1;

    return {
      excS, excE, excDur, excRate: r5Calc.exc.rate, excCost: r5Calc.exc.cost,
      pipeS, pipeE, pipeDur, pipeRate: r5Calc.pipe.rate, pipeCost: r5Calc.pipe.cost,
      backS, backE, backDur, backRate: r5Calc.back.rate, backCost: r5Calc.back.cost,
      end: Math.max(excE, pipeE, backE)
    };
  }, [r5Calc, r5Buffer]);

  const r5Cost = useMemo(() => {
    const excC = r5.excDur * r5.excCost;
    const pipeC = r5.pipeDur * r5.pipeCost;
    const backC = r5.backDur * r5.backCost;

    const direct = MOB_COST + excC + pipeC + backC;
    const indirect = Math.round(direct * INDIRECT_RATE);
    const profit = Math.round((direct + indirect) * PROFIT_RATE);

    return { direct, indirect, profit, total: direct + indirect + profit, excC, pipeC, backC };
  }, [r5]);

  const genLOB = (schedules) => {
    const data = [];
    const maxDay = Math.max(...schedules.map(s => s.end || 0), 100) + 10;

    for (let d = 0; d <= maxDay; d += 2) {
      const pt = { day: d };
      schedules.forEach((s, i) => {
        ['exc', 'pipe', 'back'].forEach(type => {
          const start = s[type + 'S'], end = s[type + 'E'];
          if (start > 0 && end > 0) {
            pt[type + i] = d < start ? 0 : d > end ? PROJECT_LENGTH : ((d - start) / (end - start)) * PROJECT_LENGTH;
          }
        });
      });
      data.push(pt);
    }
    return data;
  };

  const nextRound = () => {
    const res = { round };
    if (round === 1) Object.assign(res, { ...r1Student });
    if (round === 2) Object.assign(res, { ...r2Student, cost: r2Cost.total });
    if (round === 3) Object.assign(res, { ...r3, buffer: r3Buffer });
    if (round === 4) Object.assign(res, { end: r4.end, cost: r4Cost.total });
    if (round === 5) Object.assign(res, { end: r5.end, cost: r5Cost.total, buffer: r5Buffer, pass: r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST });

    setResults(p => ({ ...p, [round]: res }));
    setRound(round + 1);
  };

  const InputCell = ({ value, onChange, correct, submitted }) => {
    let bg = "bg-yellow-50 border-yellow-400";
    if (submitted) bg = parseInt(value) === correct ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500";
    return (
      <input
        type="number"
        value={value}
        onChange={onChange}
        className={`w-16 px-1 py-1 border-2 rounded text-center text-sm ${bg}`}
      />
    );
  };

  const BudgetTable = ({ cost, durExc, durPipe, durBack, costExc, costPipe, costBack }) => (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <table className="w-full border"><tbody>
        <tr><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-right">${MOB_COST.toLocaleString()}</td></tr>
        <tr><td className="px-2 py-1 border">Excavation ({durExc}d × ${costExc})</td><td className="px-2 py-1 border text-right">${cost.excC.toLocaleString()}</td></tr>
        <tr><td className="px-2 py-1 border">Pipe Laying ({durPipe}d × ${costPipe})</td><td className="px-2 py-1 border text-right">${cost.pipeC.toLocaleString()}</td></tr>
        <tr><td className="px-2 py-1 border">Backfill ({durBack}d × ${costBack})</td><td className="px-2 py-1 border text-right">${cost.backC.toLocaleString()}</td></tr>
        <tr className="bg-gray-100 font-bold"><td className="px-2 py-1 border">Direct Total</td><td className="px-2 py-1 border text-right">${cost.direct.toLocaleString()}</td></tr>
      </tbody></table>
      <table className="w-full border"><tbody>
        <tr><td className="px-2 py-1 border">Direct Cost</td><td className="px-2 py-1 border text-right">${cost.direct.toLocaleString()}</td></tr>
        <tr><td className="px-2 py-1 border">Indirect (30%)</td><td className="px-2 py-1 border text-right">${cost.indirect.toLocaleString()}</td></tr>
        <tr><td className="px-2 py-1 border">Profit (5%)</td><td className="px-2 py-1 border text-right">${cost.profit.toLocaleString()}</td></tr>
        <tr className="bg-green-100 font-bold text-lg"><td className="px-2 py-1 border">TOTAL</td><td className="px-2 py-1 border text-right">${cost.total.toLocaleString()}</td></tr>
      </tbody></table>
    </div>
  );

  // INTRO SCREEN (unchanged from your paste)
  if (round === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center text-white mb-6">
            <h1 className="text-4xl font-bold">🎮 LOB SIMULATION GAME</h1>
            <p className="text-blue-200">5-Round Educational Simulation</p>
          </div>

          {/* (Your intro content kept as-is) */}
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">📋 PROJECT OVERVIEW</h2>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm leading-relaxed text-blue-900">
                This simulation places you in the role of a construction planner responsible for scheduling
                a major water pipeline project. Over five rounds, you will explore how crew productivity,
                spacing (buffers), and activity sequencing influence progress using the Line of Balance (LOB)
                method. Your goal is to build a feasible schedule, avoid crew conflicts, and optimize both
                duration and cost—just like a real project engineer.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Project</div>
                <div className="font-bold">College Station Water Pipeline</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Pipeline Type</div>
                <div className="font-bold">24" Prestressed Concrete Cylinder Pipe</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Total Length</div>
                <div className="font-bold text-xl">{PROJECT_LENGTH.toLocaleString()} ft</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Mobilization</div>
                <div className="font-bold">{MOB_DAYS} days — ${MOB_COST.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">👷 CREW DEFINITIONS</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm font-bold table-auto">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-3 py-3 text-left">Crew</th>
                    <th className="px-3 py-3 text-left">Activity</th>
                    <th className="px-3 py-3 text-left">Equipment</th>
                    <th className="px-3 py-3 text-right">Daily Cost ($/day)</th>
                    <th className="px-3 py-3 text-right">Production Rate (ft/day)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 border-b">
                    <td className="px-3 py-3 text-blue-700">Crew A</td>
                    <td className="px-3 py-3">{CREWS.exc.name}</td>
                    <td className="px-3 py-3">{CREWS.exc.equipment}</td>
                    <td className="px-3 py-3 text-right">{CREWS.exc.cost}</td>
                    <td className="px-3 py-3 text-right">{CREWS.exc.rate}</td>
                  </tr>
                  <tr className="bg-green-50 border-b">
                    <td className="px-3 py-3 text-green-700">Crew B</td>
                    <td className="px-3 py-3">{CREWS.pipe.name}</td>
                    <td className="px-3 py-3">{CREWS.pipe.equipment}</td>
                    <td className="px-3 py-3 text-right">{CREWS.pipe.cost}</td>
                    <td className="px-3 py-3 text-right">{CREWS.pipe.rate}</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="px-3 py-3 text-orange-700">Crew C</td>
                    <td className="px-3 py-3">{CREWS.back.name}</td>
                    <td className="px-3 py-3">{CREWS.back.equipment}</td>
                    <td className="px-3 py-3 text-right">{CREWS.back.cost}</td>
                    <td className="px-3 py-3 text-right">{CREWS.back.rate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 mb-4">🚀 Ready to Play?</h2>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg"
            />
            <button
              onClick={() => name && setRound(1)}
              disabled={!name}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Start Game →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FINAL SCREEN (kept; fixed template strings)
  if (round === 6) {
    const pass = results[5]?.pass;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-6xl">{pass ? '🏆' : '📊'}</div>
            <h1 className="text-3xl font-bold text-blue-900">Game Complete!</h1>
            <p className="text-gray-600">Great job, {name}!</p>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${pass ? 'bg-green-100 border-2 border-green-500' : 'bg-yellow-100 border-2 border-yellow-500'}`}>
            <h3 className="font-bold text-lg">{pass ? '✅ Constraints Met!' : '⚠️ Constraints Not Met'}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                Duration:{' '}
                <span className={`font-bold ${results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>
                  {results[5]?.end} days
                </span>{' '}
                <span className="text-gray-400">(limit: ≤{TARGET_DAYS})</span>
              </div>
              <div>
                Cost:{' '}
                <span className={`font-bold ${results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>
                  ${results[5]?.cost?.toLocaleString()}
                </span>{' '}
                <span className="text-gray-400">(limit: ≤${TARGET_COST.toLocaleString()})</span>
              </div>
            </div>
          </div>

          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  const titles = { 1: 'Bar Chart', 2: 'LOB Analysis', 3: 'Buffer Analysis', 4: 'Rate Analysis', 5: 'Optimize for Constraints' };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white py-2 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span><span className="text-blue-300">Player:</span> <strong>{name}</strong></span>
          <span className="font-bold">Round {round}: {titles[round]}</span>
          <div className="text-sm">🎯 ≤{TARGET_DAYS}d | 💰 ≤${TARGET_COST / 1000}K</div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">
          {[1, 2, 3, 4, 5].map(r => (
            <div
              key={r}
              className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* R1: Drag Scheduler + Quiz (REPLACED) */}
        {round === 1 && (
          <>
            <div className="bg-white rounded-lg shadow p-3 mb-4">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${r1Step === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {r1Step === 1 ? '1️⃣' : '✅'} Knowledge Quiz
                </div>
                <span className="text-gray-400">→</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${r1Step === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  2️⃣ Interactive Scheduler
                </div>
              </div>
            </div>

            {r1Step === 1 && <QuizStep dur={dur} onComplete={() => setR1Step(2)} />}

            {r1Step === 2 && (
              <SchedulerStep
                onComplete={(fullSchedule) => {
                  // feed R2 "Your R1 schedule as LOB"
                  setR1Input({ pipeS: String(fullSchedule.pipeS), backS: String(fullSchedule.backS) });

                  // store R1 results for summary table
                  setResults(p => ({ ...p, 1: { round: 1, ...fullSchedule } }));

                  // go to R2
                  setRound(2);
                }}
              />
            )}
          </>
        )}

        {/* R2: LOB Analysis (your original, unchanged) */}
        {round === 2 && (<>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h3 className="font-bold">📋 R2: Analyze with Line of Balance (LOB)</h3>
            <p className="text-sm text-gray-600">The LOB from R1 must be revised. Apply {DEFAULT_BUFFER}-day buffer.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Your R1 Schedule as LOB</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={genLOB([r1Student])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation & Bedding" dot={false} />
                <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying & Alignment" dot={false} />
                <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill & Compaction" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">⚠️ The LOB from R1 must be revised.</div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📐 Buffer Formulas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded"><strong>Simple Buffer</strong> (slower follows faster):<br /><code>Start = Prev Start + Buffer</code></div>
              <div className="bg-orange-50 p-3 rounded"><strong>Delayed Buffer</strong> (faster follows slower):<br /><code>Start = Prev End + Buffer - Duration + 1</code></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📝 Revise Schedule ({DEFAULT_BUFFER}-day Buffer)</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 border">Activity</th>
                  <th className="px-2 py-2 border">Rate (ft/day)</th>
                  <th className="px-2 py-2 border">Duration (days)</th>
                  <th className="px-2 py-2 border bg-yellow-50">Start</th>
                  <th className="px-2 py-2 border bg-yellow-50">End</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="px-2 py-2 border">Mobilization</td>
                  <td className="px-2 py-2 border text-center">-</td>
                  <td className="px-2 py-2 border text-center">{MOB_DAYS}</td>
                  <td className="px-2 py-2 border text-center">1</td>
                  <td className="px-2 py-2 border text-center">{MOB_DAYS}</td>
                </tr>

                <tr className="text-blue-700">
                  <td className="px-2 py-2 border">Excavation & Bedding</td>
                  <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                  <td className="px-2 py-2 border text-center">{dur.exc}</td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.excS} onChange={(e) => setR2Input({ ...r2Input, excS: e.target.value })} correct={r2Correct.excS} submitted={r2Validated} />
                  </td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.excE} onChange={(e) => setR2Input({ ...r2Input, excE: e.target.value })} correct={r2Correct.excE} submitted={r2Validated} />
                  </td>
                </tr>

                <tr className="text-green-700">
                  <td className="px-2 py-2 border">Pipe Laying & Alignment</td>
                  <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                  <td className="px-2 py-2 border text-center">{dur.pipe}</td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.pipeS} onChange={(e) => setR2Input({ ...r2Input, pipeS: e.target.value })} correct={r2Correct.pipeS} submitted={r2Validated} />
                  </td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.pipeE} onChange={(e) => setR2Input({ ...r2Input, pipeE: e.target.value })} correct={r2Correct.pipeE} submitted={r2Validated} />
                  </td>
                </tr>

                <tr className="text-orange-700">
                  <td className="px-2 py-2 border">Backfill & Compaction</td>
                  <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                  <td className="px-2 py-2 border text-center">{dur.back}</td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.backS} onChange={(e) => setR2Input({ ...r2Input, backS: e.target.value })} correct={r2Correct.backS} submitted={r2Validated} />
                  </td>
                  <td className="px-2 py-2 border text-center">
                    <InputCell value={r2Input.backE} onChange={(e) => setR2Input({ ...r2Input, backE: e.target.value })} correct={r2Correct.backE} submitted={r2Validated} />
                  </td>
                </tr>
              </tbody>
            </table>

            <button onClick={() => setR2Validated(true)} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded font-bold">
              Check Answers
            </button>

            {r2Validated && !r2IsCorrect && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">❌ Some answers incorrect. Try again.</div>}
            {r2Validated && r2IsCorrect && <div className="mt-2 p-2 bg-green-100 text-green-700 rounded">✅ All correct!</div>}
          </div>

          {r2IsCorrect && (<>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Revised LOB Chart</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={genLOB([r2Student])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation & Bedding" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying & Alignment" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill & Compaction" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">💰 Budget (Auto-Calculated)</h3>
              <BudgetTable cost={r2Cost} durExc={dur.exc} durPipe={dur.pipe} durBack={dur.back} costExc={CREWS.exc.cost} costPipe={CREWS.pipe.cost} costBack={CREWS.back.cost} />
            </div>
          </>)}

          <button onClick={nextRound} disabled={!r2IsCorrect} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300">
            {r2IsCorrect ? 'Complete R2 → R3' : 'Answer correctly to proceed'}
          </button>
        </>)}

        {/* R3: Buffer Analysis */}
        {round === 3 && (<>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><h3 className="font-bold">📋 R3: Buffer Analysis</h3><p className="text-sm">See how buffer affects duration.</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="15" value={r3Buffer} onChange={e => setR3Buffer(+e.target.value)} className="flex-1" /><span className="text-3xl font-bold text-green-600 w-16 text-center">{r3Buffer}</span><span>days</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Schedule (Buffer = {r3Buffer} days)</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-2 border">Activity</th><th className="px-2 py-2 border">Rate (ft/day)</th><th className="px-2 py-2 border">Duration (days)</th><th className="px-2 py-2 border">Start</th><th className="px-2 py-2 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-2 border">Mobilization</td><td className="px-2 py-2 border text-center">-</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td><td className="px-2 py-2 border text-center">1</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-2 border">Excavation & Bedding</td><td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td><td className="px-2 py-2 border text-center">{dur.exc}</td><td className="px-2 py-2 border text-center">{r3.excS}</td><td className="px-2 py-2 border text-center">{r3.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-2 border">Pipe Laying & Alignment</td><td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td><td className="px-2 py-2 border text-center">{dur.pipe}</td><td className="px-2 py-2 border text-center">{r3.pipeS}</td><td className="px-2 py-2 border text-center">{r3.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-2 border">Backfill & Compaction</td><td className="px-2 py-2 border text-center">{CREWS.back.rate}</td><td className="px-2 py-2 border text-center">{dur.back}</td><td className="px-2 py-2 border text-center">{r3.backS}</td><td className="px-2 py-2 border text-center">{r3.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Project End: <strong className="text-2xl text-green-600">{r3.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 (dashed) vs R3 (solid)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r3])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} /><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={3} name="Exc R3" dot={false} /><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={3} name="Pipe R3" dot={false} /><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={3} name="Back R3" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-yellow-50 p-4 rounded"><strong>💡 Key Insight:</strong> Buffer ↑ = Duration ↑, but Cost stays the same!</div>
          <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R3 → R4</button>
        </>)}

        {/* R4: Rate Analysis */}
        {round === 4 && (<>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded"><h3 className="font-bold">📋 R4: Rate Analysis</h3><p className="text-sm">Select equipment type (1 unit each).</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Equipment Selection</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc', 'pipe', 'back'].map((type) => (<div key={type} className="border rounded p-3"><h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>{type === 'exc' ? 'Excavation & Bedding' : type === 'pipe' ? 'Pipe Laying & Alignment' : 'Backfill & Compaction'}</h4>{EQUIPMENT[type].map((eq, i) => (<label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type] === i ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}><input type="radio" checked={r4Eq[type] === i} onChange={() => setR4Eq(p => ({...p, [type]: i}))} className="mr-2" />{eq.name}<div className="text-xs text-gray-500 ml-5">{eq.rate} ft/day | ${eq.cost}/day</div></label>))}</div>))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R4 Schedule</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Activity</th><th className="px-2 py-1 border">Equipment</th><th className="px-2 py-1 border">Rate (ft/day)</th><th className="px-2 py-1 border">Duration (days)</th><th className="px-2 py-1 border">Cost/day</th><th className="px-2 py-1 border">Start</th><th className="px-2 py-1 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation & Bedding</td><td className="px-2 py-1 border text-center text-xs">{r4.excName}</td><td className="px-2 py-1 border text-center">{r4.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.excDur}</td><td className="px-2 py-1 border text-center">${r4.excCost}</td><td className="px-2 py-1 border text-center">{r4.excS}</td><td className="px-2 py-1 border text-center">{r4.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying & Alignment</td><td className="px-2 py-1 border text-center text-xs">{r4.pipeName}</td><td className="px-2 py-1 border text-center">{r4.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.pipeDur}</td><td className="px-2 py-1 border text-center">${r4.pipeCost}</td><td className="px-2 py-1 border text-center">{r4.pipeS}</td><td className="px-2 py-1 border text-center">{r4.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill & Compaction</td><td className="px-2 py-1 border text-center text-xs">{r4.backName}</td><td className="px-2 py-1 border text-center">{r4.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.backDur}</td><td className="px-2 py-1 border text-center">${r4.backCost}</td><td className="px-2 py-1 border text-center">{r4.backS}</td><td className="px-2 py-1 border text-center">{r4.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Project End: <strong className="text-2xl text-orange-600">{r4.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 (dashed) vs R4 (solid)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r4])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} /><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={3} name="Exc R4" dot={false} /><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={3} name="Pipe R4" dot={false} /><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={3} name="Back R4" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">💰 R4 Budget</h3>
            <BudgetTable cost={r4Cost} durExc={r4.excDur} durPipe={r4.pipeDur} durBack={r4.backDur} costExc={r4.excCost} costPipe={r4.pipeCost} costBack={r4.backCost} />
          </div>
          <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R4 → R5</button>
        </>)}

        {/* R5: Optimize for Constraints */}
        {round === 5 && (<>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"><h3 className="font-bold">📋 R5: Optimization</h3><p className="text-sm">Meet constraints: ≤{TARGET_DAYS} days and ≤${TARGET_COST.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Equipment Configuration (Multiple Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc', 'pipe', 'back'].map((type) => (<div key={type} className={`border rounded p-3 ${type === 'exc' ? 'bg-blue-50' : type === 'pipe' ? 'bg-green-50' : 'bg-orange-50'}`}><h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>{type === 'exc' ? 'Excavation & Bedding' : type === 'pipe' ? 'Pipe Laying & Alignment' : 'Backfill & Compaction'}</h4>{Object.keys(r5Config[type]).map((key) => { const eq = EQUIPMENT[type][type === 'pipe' ? (key === 'standard' ? 0 : 1) : (key === 'small' ? 0 : key === 'standard' ? 1 : 2)]; return (<div key={key} className="flex items-center justify-between bg-white p-2 rounded mb-1"><div className="text-sm">{eq.name}<div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div></div><div className="flex items-center gap-1"><button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: Math.max(0, p[type][key] - 1)}}))} className="w-6 h-6 bg-gray-200 rounded font-bold">-</button><span className="w-6 text-center font-bold">{r5Config[type][key]}</span><button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: p[type][key] + 1}}))} className="w-6 h-6 bg-blue-200 rounded font-bold">+</button></div></div>); })}</div>))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1" /><span className="text-2xl font-bold text-purple-600 w-12">{r5Buffer}</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R5 Schedule</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Activity</th><th className="px-2 py-1 border">Rate (ft/day)</th><th className="px-2 py-1 border">Duration (days)</th><th className="px-2 py-1 border">Cost/day</th><th className="px-2 py-1 border">Start</th><th className="px-2 py-1 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation & Bedding</td><td className="px-2 py-1 border text-center">{r5.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.excDur}</td><td className="px-2 py-1 border text-center">${r5.excCost}</td><td className="px-2 py-1 border text-center">{r5.excS}</td><td className="px-2 py-1 border text-center">{r5.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying & Alignment</td><td className="px-2 py-1 border text-center">{r5.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.pipeDur}</td><td className="px-2 py-1 border text-center">${r5.pipeCost}</td><td className="px-2 py-1 border text-center">{r5.pipeS}</td><td className="px-2 py-1 border text-center">{r5.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill & Compaction</td><td className="px-2 py-1 border text-center">{r5.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.backDur}</td><td className="px-2 py-1 border text-center">${r5.backCost}</td><td className="px-2 py-1 border text-center">{r5.backS}</td><td className="px-2 py-1 border text-center">{r5.backE}</td></tr>
              </tbody>
            </table>
          </div>
                    {/* R5: LOB Chart (based on the R5 schedule) */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📈 R5 Line of Balance (LOB)</h3>
          
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={genLOB([r5])}
                margin={{ top: 10, right: 30, bottom: 30, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  domain={[0, PROJECT_LENGTH]}
                  tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
                  label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
          
                <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={3} name="Excavation & Bedding" dot={false} />
                <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={3} name="Pipe Laying & Alignment" dot={false} />
                <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={3} name="Backfill & Compaction" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          
            <div className="mt-2 text-sm text-gray-600">
              This LOB is generated directly from your R5 start/end days and productivity rates.
            </div>
          </div>
          ``
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Constraints Check</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${r5.end <= TARGET_DAYS ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Duration</div><div className={`text-3xl font-bold ${r5.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{r5.end} days</div><div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end <= TARGET_DAYS ? '✅' : '❌'}</div></div>
              <div className={`p-4 rounded-lg text-center ${r5Cost.total <= TARGET_COST ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Total Cost</div><div className={`text-3xl font-bold ${r5Cost.total <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${(r5Cost.total/1000).toFixed(0)}K</div><div className="text-sm">Target: ≤${TARGET_COST/1000}K {r5Cost.total <= TARGET_COST ? '✅' : '❌'}</div></div>
            </div>
            {(r5.end > TARGET_DAYS || r5Cost.total > TARGET_COST) && <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 font-bold text-center">⚠️ Keep optimizing...</div>}
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">💰 R5 Budget</h3>
            <BudgetTable cost={r5Cost} durExc={r5.excDur} durPipe={r5.pipeDur} durBack={r5.backDur} costExc={r5.excCost} costPipe={r5.pipeCost} costBack={r5.backCost} />
          </div>
          <button onClick={nextRound} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold">Finish Game 🏆</button>
        </>)}
      </div>
    </div>
  );
}
