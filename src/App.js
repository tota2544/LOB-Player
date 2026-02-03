import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

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

const DURATIONS = {
  exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
  pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
  back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
};

const getPositionAtDay = (startDay, rate, currentDay) => {
  if (currentDay < startDay) return 0;
  return Math.min((currentDay - startDay + 1) * rate, PROJECT_LENGTH);
};

const checkScheduleConflicts = (schedule) => {
  const endDay = Math.max(schedule.excS + DURATIONS.exc - 1, schedule.pipeS + DURATIONS.pipe - 1, schedule.backS + DURATIONS.back - 1);
  for (let day = MOB_DAYS + 1; day <= endDay; day++) {
    const excPos = getPositionAtDay(schedule.excS, CREWS.exc.rate, day);
    const pipePos = getPositionAtDay(schedule.pipeS, CREWS.pipe.rate, day);
    const backPos = getPositionAtDay(schedule.backS, CREWS.back.rate, day);
    if (pipePos > excPos && excPos < PROJECT_LENGTH) return { hasConflict: true, firstConflictDay: day, type: 'pipe-exc' };
    if (backPos > pipePos && pipePos < PROJECT_LENGTH) return { hasConflict: true, firstConflictDay: day, type: 'back-pipe' };
  }
  return { hasConflict: false, firstConflictDay: null, type: null };
};

const calculateBuffers = (schedule) => {
  const pipeE = schedule.pipeS + DURATIONS.pipe - 1;
  const backE = schedule.backS + DURATIONS.back - 1;
  return { bufferExcPipe: schedule.pipeS - schedule.excS, bufferPipeBack: backE - pipeE };
};

const generateLOBData = (schedule, maxDay = null) => {
  const endDay = maxDay || Math.max(schedule.excS + DURATIONS.exc, schedule.pipeS + DURATIONS.pipe, schedule.backS + DURATIONS.back) + 10;
  const data = [];
  for (let day = 0; day <= endDay; day++) {
    data.push({
      day,
      exc: getPositionAtDay(schedule.excS, CREWS.exc.rate, day),
      pipe: getPositionAtDay(schedule.pipeS, CREWS.pipe.rate, day),
      back: getPositionAtDay(schedule.backS, CREWS.back.rate, day),
    });
  }
  return data;
};

// ==================== R1 QUIZ ====================
function QuizStep({ dur, onComplete }) {
  const [answers, setAnswers] = useState({ q1: null, q2: null, q3: '' });
  const [submitted, setSubmitted] = useState({ q1: false, q2: false, q3: false });
  const correct = { q1: 'c', q2: 'b', q3: dur.back };
  const allDone = submitted.q1 && submitted.q2 && submitted.q3;

  const getClass = (qId, val) => {
    const sel = answers[qId] === val, sub = submitted[qId], corr = val === correct[qId];
    if (!sub) return `block w-full p-3 rounded border-2 cursor-pointer text-left ${sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`;
    if (corr) return 'block w-full p-3 rounded border-2 border-green-500 bg-green-50 text-left';
    if (sel && !corr) return 'block w-full p-3 rounded border-2 border-red-500 bg-red-50 text-left';
    return 'block w-full p-3 rounded border-2 border-gray-200 bg-gray-50 text-left opacity-50';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-lg">📚 Step 1: Knowledge Check</h3>
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q1: What is the correct sequence?</h4>
        <div className="space-y-2 mb-4">
          {[{v:'a',l:'Backfill → Pipe → Excavation'},{v:'b',l:'Pipe → Excavation → Backfill'},{v:'c',l:'Excavation → Pipe → Backfill'}].map(o => (
            <button key={o.v} onClick={() => !submitted.q1 && setAnswers(p => ({...p, q1: o.v}))} className={getClass('q1', o.v)} disabled={submitted.q1}>
              {o.v.toUpperCase()}) {o.l} {submitted.q1 && o.v === correct.q1 && '✓'}
            </button>
          ))}
        </div>
        {!submitted.q1 ? <button onClick={() => setSubmitted(p => ({...p, q1: true}))} disabled={!answers.q1} className={`px-4 py-2 rounded font-bold ${answers.q1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Check</button>
          : <div className={`p-3 rounded ${answers.q1 === correct.q1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{answers.q1 === correct.q1 ? '✅ Correct!' : '❌ Incorrect'}</div>}
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q2: Which crew is SLOWEST?</h4>
        <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
          <div>⛏️ Excavation: {CREWS.exc.rate} ft/day</div>
          <div>🔧 Pipe Laying: {CREWS.pipe.rate} ft/day</div>
          <div>🚜 Backfill: {CREWS.back.rate} ft/day</div>
        </div>
        <div className="space-y-2 mb-4">
          {[{v:'a',l:`Excavation (${CREWS.exc.rate})`},{v:'b',l:`Pipe Laying (${CREWS.pipe.rate})`},{v:'c',l:`Backfill (${CREWS.back.rate})`}].map(o => (
            <button key={o.v} onClick={() => !submitted.q2 && setAnswers(p => ({...p, q2: o.v}))} className={getClass('q2', o.v)} disabled={submitted.q2}>
              {o.v.toUpperCase()}) {o.l} {submitted.q2 && o.v === correct.q2 && '✓ SLOWEST'}
            </button>
          ))}
        </div>
        {!submitted.q2 ? <button onClick={() => setSubmitted(p => ({...p, q2: true}))} disabled={!answers.q2} className={`px-4 py-2 rounded font-bold ${answers.q2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Check</button>
          : <div className={`p-3 rounded ${answers.q2 === correct.q2 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{answers.q2 === correct.q2 ? '✅ Correct!' : '❌ Incorrect'}</div>}
      </div>
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q3: Backfill duration? (ROUNDUP({PROJECT_LENGTH}/{CREWS.back.rate}))</h4>
        <div className="flex items-center gap-3 mb-4">
          <input type="number" value={answers.q3} onChange={e => setAnswers(p => ({...p, q3: e.target.value}))} disabled={submitted.q3}
            className={`w-24 px-3 py-2 border-2 rounded text-center font-bold ${submitted.q3 ? (parseInt(answers.q3)===correct.q3 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300'}`} placeholder="?" />
          <span>days</span>
        </div>
        {!submitted.q3 ? <button onClick={() => setSubmitted(p => ({...p, q3: true}))} disabled={!answers.q3} className={`px-4 py-2 rounded font-bold ${answers.q3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Check</button>
          : <div className={`p-3 rounded ${parseInt(answers.q3)===correct.q3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{parseInt(answers.q3)===correct.q3 ? `✅ Correct! ${dur.back} days` : `❌ Answer: ${dur.back} days`}</div>}
      </div>
      {allDone && (
        <div className="border-2 rounded-lg p-5 text-center bg-green-50 border-green-500">
          <button onClick={onComplete} className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700">Continue to Bar Chart →</button>
        </div>
      )}
    </div>
  );
}

// ==================== R1 BAR CHART ====================
function DraggableBarChart({ schedule, onScheduleChange, conflictStatus }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const CHART_WIDTH = 700, CHART_PADDING = 100, MAX_DAY = 150;
  const PIXELS_PER_DAY = (CHART_WIDTH - CHART_PADDING) / MAX_DAY;
  const BAR_HEIGHT = 32, BAR_GAP = 8;

  const dayToPixel = d => CHART_PADDING + d * PIXELS_PER_DAY;
  const pixelToDay = p => Math.max(MOB_DAYS + 1, Math.min(Math.round((p - CHART_PADDING) / PIXELS_PER_DAY), 140));

  const handleMouseDown = (type, e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    setDragOffset(mouseX - dayToPixel(type === 'pipe' ? schedule.pipeStart : schedule.backStart));
    setDragging(type);
  };

  const handleMouseMove = useCallback(e => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const newDay = pixelToDay(e.clientX - rect.left - dragOffset);
    onScheduleChange({ ...schedule, [dragging === 'pipe' ? 'pipeStart' : 'backStart']: newDay });
  }, [dragging, dragOffset, schedule, onScheduleChange]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const bars = [
    { id: 'mob', label: 'Mobilization', start: 1, end: MOB_DAYS, color: 'bg-gray-400', locked: true },
    { id: 'exc', label: 'Excavation', start: MOB_DAYS + 1, end: MOB_DAYS + DURATIONS.exc, color: 'bg-blue-500', locked: true },
    { id: 'pipe', label: 'Pipe Laying', start: schedule.pipeStart, end: schedule.pipeStart + DURATIONS.pipe - 1, color: 'bg-green-500', locked: false },
    { id: 'back', label: 'Backfill', start: schedule.backStart, end: schedule.backStart + DURATIONS.back - 1, color: 'bg-orange-500', locked: false }
  ];

  return (
    <div ref={chartRef} className="relative bg-gray-50 rounded-lg p-4 overflow-x-auto" style={{ width: '100%', minWidth: CHART_WIDTH, height: bars.length * (BAR_HEIGHT + BAR_GAP) + 80 }}>
      {[0,20,40,60,80,100,120,140].map(d => <div key={d} className="absolute top-0 bottom-8 w-px bg-gray-200" style={{ left: dayToPixel(d) }} />)}
      <div className="absolute bottom-2 left-0 right-0 flex text-xs text-gray-500">
        {[0,20,40,60,80,100,120,140].map(d => <span key={d} className="absolute" style={{ left: dayToPixel(d) - 10 }}>{d}</span>)}
      </div>
      {bars.map((bar, i) => (
        <React.Fragment key={bar.id}>
          <div className="absolute left-2 text-xs font-medium text-gray-600 w-24" style={{ top: i * (BAR_HEIGHT + BAR_GAP) + 15 + BAR_HEIGHT / 2 - 8 }}>{bar.label}</div>
          <div className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold ${bar.locked ? 'cursor-not-allowed opacity-90' : 'cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl'} ${dragging === bar.id ? 'ring-4 ring-yellow-300 z-10' : ''} ${!bar.locked && conflictStatus.hasConflict ? 'animate-pulse' : ''}`}
            style={{ left: dayToPixel(bar.start), width: Math.max((bar.end - bar.start + 1) * PIXELS_PER_DAY, 30), height: BAR_HEIGHT, top: i * (BAR_HEIGHT + BAR_GAP) + 15 }}
            onMouseDown={bar.locked ? undefined : e => handleMouseDown(bar.id, e)}>
            {bar.locked && '🔒'}{bar.start}-{bar.end}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ==================== R1 SCHEDULER (allows proceeding with conflicts) ====================
function SchedulerStep({ onComplete }) {
  const [schedule, setSchedule] = useState({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 });
  const fullSchedule = useMemo(() => ({
    excS: MOB_DAYS + 1, excE: MOB_DAYS + DURATIONS.exc,
    pipeS: schedule.pipeStart, pipeE: schedule.pipeStart + DURATIONS.pipe - 1,
    backS: schedule.backStart, backE: schedule.backStart + DURATIONS.back - 1,
    end: Math.max(MOB_DAYS + DURATIONS.exc, schedule.pipeStart + DURATIONS.pipe - 1, schedule.backStart + DURATIONS.back - 1)
  }), [schedule]);
  const conflictStatus = useMemo(() => checkScheduleConflicts(fullSchedule), [fullSchedule]);

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="font-bold text-lg">🎮 Step 2: Bar Chart Scheduler</h3>
        <p className="text-sm text-gray-600">Drag <span className="text-green-600 font-bold">Pipe</span> and <span className="text-orange-600 font-bold">Backfill</span> bars.</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold">📊 Drag the Bars</h4>
          <button onClick={() => setSchedule({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 })} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">🔄 Reset</button>
        </div>
        <DraggableBarChart schedule={schedule} onScheduleChange={setSchedule} conflictStatus={conflictStatus} />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-bold mb-3">📋 Your Schedule</h4>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="px-3 py-2 border text-left">Activity</th><th className="px-3 py-2 border text-center">Start</th><th className="px-3 py-2 border text-center">End</th></tr></thead>
          <tbody>
            <tr className="bg-gray-50"><td className="px-3 py-2 border">📦 Mobilization</td><td className="px-3 py-2 border text-center">1</td><td className="px-3 py-2 border text-center">{MOB_DAYS}</td></tr>
            <tr className="bg-blue-50"><td className="px-3 py-2 border">⛏️ Excavation 🔒</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.excS}</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.excE}</td></tr>
            <tr className="bg-green-50"><td className="px-3 py-2 border">🔧 Pipe Laying</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.pipeS}</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.pipeE}</td></tr>
            <tr className="bg-orange-50"><td className="px-3 py-2 border">🚜 Backfill</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.backS}</td><td className="px-3 py-2 border text-center font-bold">{fullSchedule.backE}</td></tr>
          </tbody>
        </table>
        <div className="mt-4 p-3 bg-blue-50 rounded text-center">Duration: <span className="text-2xl font-bold text-blue-600">{fullSchedule.end} days</span></div>
      </div>
      <div className={`p-4 rounded-lg border-2 ${conflictStatus.hasConflict ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
        {conflictStatus.hasConflict ? (
          <><div className="font-bold text-yellow-800 text-lg">⚠️ Conflict Detected!</div><p className="text-yellow-700 text-sm mt-1">Proceed to R2 to learn how to fix this.</p></>
        ) : (
          <><div className="font-bold text-green-800 text-lg">✅ No Conflicts!</div><p className="text-green-700 text-sm mt-1">In R2, you'll learn WHY it works.</p></>
        )}
      </div>
      <button onClick={() => onComplete({ ...fullSchedule, hasConflict: conflictStatus.hasConflict })}
        className={`w-full py-4 rounded-lg font-bold text-lg ${conflictStatus.hasConflict ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
        {conflictStatus.hasConflict ? '⚠️ Proceed to R2 with Conflicts →' : '✅ Complete R1 → R2'}
      </button>
    </div>
  );
}


// ==================== R2 DRAGGABLE LOB ====================
function DraggableLOBChart({ schedule, onScheduleChange, conflictStatus }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const W = 550, H = 320, M = { top: 20, right: 20, bottom: 40, left: 60 };
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom, maxDay = 140;

  const dayToX = d => M.left + (d / maxDay) * IW;
  const xToDay = x => Math.round(((x - M.left) / IW) * maxDay);
  const distToY = d => M.top + IH - (d / PROJECT_LENGTH) * IH;
  const getLine = (s, dur) => ({ x1: dayToX(s), y1: distToY(0), x2: dayToX(s + dur - 1), y2: distToY(PROJECT_LENGTH) });

  const excLine = getLine(schedule.excS, DURATIONS.exc);
  const pipeLine = getLine(schedule.pipeS, DURATIONS.pipe);
  const backLine = getLine(schedule.backS, DURATIONS.back);

  const handleMouseMove = useCallback(e => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const newStart = Math.max(MOB_DAYS + 1, Math.min(xToDay(e.clientX - rect.left), 100));
    if (dragging === 'pipe') onScheduleChange({ ...schedule, pipeS: newStart, pipeE: newStart + DURATIONS.pipe - 1, end: Math.max(schedule.excE, newStart + DURATIONS.pipe - 1, schedule.backE) });
    else if (dragging === 'back') onScheduleChange({ ...schedule, backS: newStart, backE: newStart + DURATIONS.back - 1, end: Math.max(schedule.excE, schedule.pipeE, newStart + DURATIONS.back - 1) });
  }, [dragging, schedule, onScheduleChange]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', up); };
  }, [dragging, handleMouseMove]);

  const xTicks = [0,20,40,60,80,100,120,140], yTicks = [0,4000,8000,12000,PROJECT_LENGTH];

  return (
    <svg ref={chartRef} width={W} height={H} className="bg-gray-50 rounded-lg border">
      {xTicks.map(d => <g key={d}><line x1={dayToX(d)} y1={M.top} x2={dayToX(d)} y2={M.top+IH} stroke="#e5e7eb"/><text x={dayToX(d)} y={H-10} textAnchor="middle" fontSize={10} fill="#6b7280">{d}</text></g>)}
      {yTicks.map(d => <g key={d}><line x1={M.left} y1={distToY(d)} x2={M.left+IW} y2={distToY(d)} stroke="#e5e7eb"/><text x={M.left-5} y={distToY(d)+3} textAnchor="end" fontSize={10} fill="#6b7280">{(d/1000).toFixed(0)}k</text></g>)}
      <line x1={excLine.x1} y1={excLine.y1} x2={excLine.x2} y2={excLine.y2} stroke="#3b82f6" strokeWidth={4} strokeLinecap="round"/>
      <circle cx={excLine.x1} cy={excLine.y1} r={5} fill="#3b82f6"/><circle cx={excLine.x2} cy={excLine.y2} r={5} fill="#3b82f6"/>
      <line x1={pipeLine.x1} y1={pipeLine.y1} x2={pipeLine.x2} y2={pipeLine.y2} stroke={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'} strokeWidth={4} strokeLinecap="round" className="cursor-ew-resize" onMouseDown={e=>{e.preventDefault();setDragging('pipe');}}/>
      <circle cx={pipeLine.x1} cy={pipeLine.y1} r={8} fill={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'} className="cursor-ew-resize" stroke="white" strokeWidth={2} onMouseDown={e=>{e.preventDefault();setDragging('pipe');}}/>
      <circle cx={pipeLine.x2} cy={pipeLine.y2} r={5} fill={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'}/>
      <line x1={backLine.x1} y1={backLine.y1} x2={backLine.x2} y2={backLine.y2} stroke={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'} strokeWidth={4} strokeLinecap="round" className="cursor-ew-resize" onMouseDown={e=>{e.preventDefault();setDragging('back');}}/>
      <circle cx={backLine.x1} cy={backLine.y1} r={8} fill={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'} className="cursor-ew-resize" stroke="white" strokeWidth={2} onMouseDown={e=>{e.preventDefault();setDragging('back');}}/>
      <circle cx={backLine.x2} cy={backLine.y2} r={5} fill={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'}/>
      <g transform={`translate(${M.left+5},${M.top+5})`}>
        <rect x={0} y={0} width={130} height={60} fill="white" fillOpacity={0.9} rx={4} stroke="#e5e7eb"/>
        <circle cx={12} cy={14} r={4} fill="#3b82f6"/><text x={22} y={17} fontSize={10} fill="#374151">⛏️ Excavation (fixed)</text>
        <circle cx={12} cy={30} r={4} fill="#22c55e"/><text x={22} y={33} fontSize={10} fill="#374151">🔧 Pipe (drag ↔)</text>
        <circle cx={12} cy={46} r={4} fill="#f97316"/><text x={22} y={49} fontSize={10} fill="#374151">🚜 Backfill (drag ↔)</text>
      </g>
    </svg>
  );
}

// ==================== R2 COMPONENT (4 Phases) ====================
function Round2({ r1Schedule, onComplete }) {
  const [phase, setPhase] = useState(1);
  const [currentSchedule, setCurrentSchedule] = useState({ ...r1Schedule });

  const naiveSchedule = useMemo(() => ({ excS: MOB_DAYS+1, excE: MOB_DAYS+DURATIONS.exc, pipeS: MOB_DAYS+1, pipeE: MOB_DAYS+DURATIONS.pipe, backS: MOB_DAYS+1, backE: MOB_DAYS+DURATIONS.back, end: Math.max(MOB_DAYS+DURATIONS.exc, MOB_DAYS+DURATIONS.pipe, MOB_DAYS+DURATIONS.back) }), []);
  const optimalSchedule = useMemo(() => {
    const excS = MOB_DAYS+1, excE = excS+DURATIONS.exc-1;
    const pipeS = excS+DEFAULT_BUFFER, pipeE = pipeS+DURATIONS.pipe-1;
    const backS = pipeE+DEFAULT_BUFFER-DURATIONS.back+1, backE = backS+DURATIONS.back-1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, []);

  const currentConflict = useMemo(() => checkScheduleConflicts(currentSchedule), [currentSchedule]);
  const currentBuffers = useMemo(() => calculateBuffers(currentSchedule), [currentSchedule]);
  const r1Conflict = useMemo(() => checkScheduleConflicts(r1Schedule), [r1Schedule]);
  const naiveConflict = useMemo(() => checkScheduleConflicts(naiveSchedule), [naiveSchedule]);

  const isOptimal = currentSchedule.pipeS === optimalSchedule.pipeS && currentSchedule.backS === optimalSchedule.backS && !currentConflict.hasConflict;
  const isValid = !currentConflict.hasConflict && currentBuffers.bufferExcPipe >= DEFAULT_BUFFER && currentBuffers.bufferPipeBack >= DEFAULT_BUFFER;

  // Phase 1: Naive Schedule
  if (phase === 1) return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><h3 className="font-bold text-lg">🤔 What if all crews started on Day {MOB_DAYS+1}?</h3></div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-bold mb-3">📊 Naive Schedule (LOB View)</h4>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={generateLOBData(naiveSchedule)} margin={{top:10,right:30,bottom:30,left:60}}>
            <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" label={{value:'Time (days)',position:'insideBottom',offset:-5}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} label={{value:'Distance (ft)',angle:-90,position:'insideLeft',offset:10}}/>
            <Tooltip formatter={v=>v.toLocaleString()+' ft'}/>
            <Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={3} name="⛏️ Excavation" dot={false}/>
            <Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={3} name="🔧 Pipe" dot={false}/>
            <Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={3} name="🚜 Backfill" dot={false}/>
            {naiveConflict.hasConflict && <ReferenceLine x={naiveConflict.firstConflictDay} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5"/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <h4 className="font-bold text-red-800 text-lg">❌ CONFLICT at Day {naiveConflict.firstConflictDay}!</h4>
        <p className="text-red-700 text-sm mt-2">🚜 Backfill catches up to 🔧 Pipe. <strong>Impossible!</strong></p>
      </div>
      <button onClick={() => setPhase(2)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">See Your R1 Schedule →</button>
    </div>
  );

  // Phase 2: R1 Analysis
  if (phase === 2) return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><h3 className="font-bold text-lg">📊 Your R1 Schedule</h3></div>
      <div className="bg-white rounded-lg shadow p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={generateLOBData(r1Schedule)} margin={{top:10,right:30,bottom:30,left:60}}>
            <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" label={{value:'Time (days)',position:'insideBottom',offset:-5}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} label={{value:'Distance (ft)',angle:-90,position:'insideLeft',offset:10}}/>
            <Tooltip formatter={v=>v.toLocaleString()+' ft'}/>
            <Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={3} name="⛏️ Excavation" dot={false}/>
            <Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={3} name="🔧 Pipe" dot={false}/>
            <Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={3} name="🚜 Backfill" dot={false}/>
            {r1Conflict.hasConflict && <ReferenceLine x={r1Conflict.firstConflictDay} stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5"/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold mb-2">📋 Your R1</h4>
          <table className="w-full text-sm"><tbody>
            <tr className="bg-blue-50"><td className="p-2">⛏️ Exc</td><td className="p-2 text-right font-mono">{r1Schedule.excS}-{r1Schedule.excE}</td></tr>
            <tr className="bg-green-50"><td className="p-2">🔧 Pipe</td><td className="p-2 text-right font-mono">{r1Schedule.pipeS}-{r1Schedule.pipeE}</td></tr>
            <tr className="bg-orange-50"><td className="p-2">🚜 Back</td><td className="p-2 text-right font-mono">{r1Schedule.backS}-{r1Schedule.backE}</td></tr>
          </tbody></table>
          <div className="mt-2 text-center text-sm">Duration: <span className="font-bold">{r1Schedule.end} days</span></div>
        </div>
        <div className={`rounded-lg shadow p-4 ${r1Conflict.hasConflict ? 'bg-red-50' : 'bg-green-50'}`}>
          {r1Conflict.hasConflict ? <><h4 className="font-bold text-red-800">❌ CONFLICT!</h4><p className="text-red-700 text-sm">Day {r1Conflict.firstConflictDay}</p></> 
            : <><h4 className="font-bold text-green-800">✅ NO CONFLICTS</h4><p className="text-green-700 text-sm">Optimal: {optimalSchedule.end}d (yours: {r1Schedule.end}d)</p></>}
        </div>
      </div>
      <button onClick={() => setPhase(3)} className={`w-full py-3 rounded-lg font-bold ${r1Conflict.hasConflict ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
        {r1Conflict.hasConflict ? 'Fix My Schedule →' : 'Optimize My Schedule →'}
      </button>
    </div>
  );

  // Phase 3: Interactive LOB Editor
  if (phase === 3) return (
    <div className="space-y-4">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><h3 className="font-bold text-lg">🎮 LOB Editor</h3><p className="text-sm text-gray-600">Drag lines to find optimal schedule.</p></div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-bold">📊 Interactive LOB</h4>
          <button onClick={() => setCurrentSchedule({...r1Schedule})} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">🔄 Reset to R1</button>
        </div>
        <div className="flex justify-center"><DraggableLOBChart schedule={currentSchedule} onScheduleChange={setCurrentSchedule} conflictStatus={currentConflict}/></div>
        <p className="text-center text-xs text-gray-500 mt-2">Drag the large circles to adjust start times</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold mb-2">📋 Schedule</h4>
          <table className="w-full text-sm"><tbody>
            <tr className="bg-blue-50"><td className="p-2">⛏️ Exc 🔒</td><td className="p-2 text-right font-mono">{currentSchedule.excS}-{currentSchedule.excE}</td></tr>
            <tr className="bg-green-50"><td className="p-2">🔧 Pipe</td><td className="p-2 text-right font-mono font-bold">{currentSchedule.pipeS}-{currentSchedule.pipeE}</td></tr>
            <tr className="bg-orange-50"><td className="p-2">🚜 Back</td><td className="p-2 text-right font-mono font-bold">{currentSchedule.backS}-{currentSchedule.backE}</td></tr>
          </tbody></table>
          <div className="mt-2 p-2 bg-gray-100 rounded text-center">Duration: <span className={`text-lg font-bold ${currentSchedule.end===optimalSchedule.end?'text-green-600':'text-blue-600'}`}>{currentSchedule.end} days</span></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold mb-2">📊 Status</h4>
          <div className="space-y-2">
            <div className={`p-2 rounded text-sm flex justify-between ${currentBuffers.bufferExcPipe>=DEFAULT_BUFFER?'bg-green-50':'bg-red-50'}`}><span>Exc→Pipe:</span><span className="font-bold">{currentBuffers.bufferExcPipe}d {currentBuffers.bufferExcPipe>=DEFAULT_BUFFER?'✅':'❌'}</span></div>
            <div className={`p-2 rounded text-sm flex justify-between ${currentBuffers.bufferPipeBack>=DEFAULT_BUFFER?'bg-green-50':'bg-red-50'}`}><span>Pipe→Back:</span><span className="font-bold">{currentBuffers.bufferPipeBack}d {currentBuffers.bufferPipeBack>=DEFAULT_BUFFER?'✅':'❌'}</span></div>
            <div className={`p-2 rounded ${currentConflict.hasConflict?'bg-red-100':'bg-green-100'}`}>{currentConflict.hasConflict?<span className="text-red-700 font-bold">❌ CONFLICT Day {currentConflict.firstConflictDay}</span>:<span className="text-green-700 font-bold">✅ No Conflicts</span>}</div>
            {isOptimal && <div className="p-2 bg-yellow-100 rounded text-center"><span className="text-2xl">⭐</span> <span className="font-bold text-yellow-800">OPTIMAL!</span></div>}
          </div>
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="grid grid-cols-3 gap-2 text-sm text-center">
          <div className={`p-2 rounded ${!currentConflict.hasConflict?'bg-green-100':'bg-gray-100'}`}>{!currentConflict.hasConflict?'✅':'⬜'} No conflicts</div>
          <div className={`p-2 rounded ${currentBuffers.bufferExcPipe>=5&&currentBuffers.bufferPipeBack>=5?'bg-green-100':'bg-gray-100'}`}>{currentBuffers.bufferExcPipe>=5&&currentBuffers.bufferPipeBack>=5?'✅':'⬜'} Buffer ≥5d</div>
          <div className={`p-2 rounded ${isOptimal?'bg-green-100':'bg-gray-100'}`}>{isOptimal?'⭐':'⬜'} Optimal</div>
        </div>
      </div>
      {isValid && <button onClick={() => setPhase(4)} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">{isOptimal?'⭐ Perfect! See the Math →':'Compare with Optimal →'}</button>}
    </div>
  );

  // Phase 4: Formulas
  if (phase === 4) return (
    <div className="space-y-4">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"><h3 className="font-bold text-lg">📊 R1 vs Optimal Comparison</h3></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="font-bold text-center mb-2">Your R1</h4>
          <ResponsiveContainer width="100%" height={180}><LineChart data={generateLOBData(r1Schedule,130)} margin={{top:5,right:15,bottom:20,left:35}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" tick={{fontSize:9}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} tick={{fontSize:9}}/><Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={2} dot={false}/><Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={2} dot={false}/><Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
          <div className="text-center text-sm">Duration: <span className="font-bold">{r1Schedule.end}d</span> {r1Conflict.hasConflict?'❌':'✅'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-2 border-green-300">
          <h4 className="font-bold text-center mb-2">⭐ Optimal</h4>
          <ResponsiveContainer width="100%" height={180}><LineChart data={generateLOBData(optimalSchedule,130)} margin={{top:5,right:15,bottom:20,left:35}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" tick={{fontSize:9}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} tick={{fontSize:9}}/><Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={2} dot={false}/><Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={2} dot={false}/><Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
          <div className="text-center text-sm">Duration: <span className="font-bold text-green-600">{optimalSchedule.end}d</span> ✅</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-bold mb-3">🎓 The Formulas</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <h5 className="font-bold text-green-800 mb-2">🔧 Pipe Laying</h5>
            <p className="text-sm text-gray-600">Pipe (180) is <strong>SLOWER</strong> than Exc (220) → Buffer at <strong>START</strong></p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-sm">Start = PrevStart + Buffer<br/><span className="text-green-700 font-bold">{optimalSchedule.pipeS} = {optimalSchedule.excS} + {DEFAULT_BUFFER}</span></div>
          </div>
          <div className="p-3 bg-orange-50 rounded border border-orange-200">
            <h5 className="font-bold text-orange-800 mb-2">🚜 Backfill</h5>
            <p className="text-sm text-gray-600">Backfill (250) is <strong>FASTER</strong> than Pipe (180) → Buffer at <strong>END</strong></p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-sm">Start = PrevEnd + Buffer - Dur + 1<br/><span className="text-orange-700 font-bold">{optimalSchedule.backS} = {optimalSchedule.pipeE} + {DEFAULT_BUFFER} - {DURATIONS.back} + 1</span></div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <h4 className="font-bold text-blue-800 text-center mb-2">📌 KEY RULE</h4>
        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div className="p-2 bg-white rounded">Following crew <strong>SLOWER?</strong><br/><span className="text-green-600 font-bold">→ Buffer at START</span></div>
          <div className="p-2 bg-white rounded">Following crew <strong>FASTER?</strong><br/><span className="text-orange-600 font-bold">→ Buffer at END</span></div>
        </div>
      </div>
      <button onClick={() => onComplete(optimalSchedule)} className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700">Complete R2 → R3 🎉</button>
    </div>
  );
  return null;
}

✅ Constraints Met!' : '⚠️ Constraints Not Met'}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>Duration: <span className={`font-bold ${results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{results[5]?.end} days</span> (limit: ≤{TARGET_DAYS})</div>
              <div>Cost: <span className={`font-bold ${results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${results[5]?.cost?.toLocaleString()}</span> (limit: ≤${TARGET_COST.toLocaleString()})</div>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">🔄 Play Again</button>
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
          <div className="text-sm">🎯 ≤{TARGET_DAYS}d | 💰 ≤${TARGET_COST/1000}K</div>
        </div>
      </div>
      <div className="bg-white border-b"><div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">{[1,2,3,4,5].map(r => <div key={r} className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`}/>)}</div></div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* R1: NEW */}
        {round === 1 && (<>
          <div className="bg-white rounded-lg shadow p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${r1Step===1?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800'}`}>{r1Step===1?'1️⃣':'✅'} Quiz</div>
              <span className="text-gray-400">→</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${r1Step===2?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-500'}`}>2️⃣ Scheduler</div>
            </div>
          </div>
          {r1Step === 1 && <QuizStep dur={dur} onComplete={() => setR1Step(2)}/>}
          {r1Step === 2 && <SchedulerStep onComplete={schedule => { setResults(p => ({...p, 1: schedule})); setRound(2); }}/>}
        </>)}

        {/* R2: NEW */}
        {round === 2 && results[1] && <Round2 r1Schedule={results[1]} onComplete={schedule => { setResults(p => ({...p, 2: {...schedule, cost: r2Cost.total}})); setRound(3); }}/>}

        {/* R3: ORIGINAL */}
        {round === 3 && (<>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><h3 className="font-bold">📋 R3: Buffer Analysis</h3><p className="text-sm">See how buffer affects duration.</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="15" value={r3Buffer} onChange={e => setR3Buffer(+e.target.value)} className="flex-1"/><span className="text-3xl font-bold text-green-600 w-16 text-center">{r3Buffer}</span><span>days</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Schedule (Buffer = {r3Buffer} days)</h3>
            <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="px-2 py-2 border">Activity</th><th className="px-2 py-2 border">Rate</th><th className="px-2 py-2 border">Duration</th><th className="px-2 py-2 border">Start</th><th className="px-2 py-2 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-2 border">Mobilization</td><td className="px-2 py-2 border text-center">-</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td><td className="px-2 py-2 border text-center">1</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-2 border">Excavation</td><td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td><td className="px-2 py-2 border text-center">{dur.exc}</td><td className="px-2 py-2 border text-center">{r3.excS}</td><td className="px-2 py-2 border text-center">{r3.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-2 border">Pipe Laying</td><td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td><td className="px-2 py-2 border text-center">{dur.pipe}</td><td className="px-2 py-2 border text-center">{r3.pipeS}</td><td className="px-2 py-2 border text-center">{r3.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-2 border">Backfill</td><td className="px-2 py-2 border text-center">{CREWS.back.rate}</td><td className="px-2 py-2 border text-center">{dur.back}</td><td className="px-2 py-2 border text-center">{r3.backS}</td><td className="px-2 py-2 border text-center">{r3.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Project End: <strong className="text-2xl text-green-600">{r3.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 (dashed) vs R3 (solid)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r3])} margin={{top:10,right:30,bottom:30,left:60}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" label={{value:'Duration (day)',position:'insideBottom',offset:-5}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} label={{value:'Distance (ft)',angle:-90,position:'insideLeft',offset:10}}/><Tooltip/><Legend verticalAlign="top" height={36}/><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false}/><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false}/><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false}/><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={3} name="Exc R3" dot={false}/><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={3} name="Pipe R3" dot={false}/><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={3} name="Back R3" dot={false}/></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-yellow-50 p-4 rounded"><strong>💡 Key Insight:</strong> Buffer ↑ = Duration ↑, but Cost stays the same!</div>
          <button onClick={() => { setResults(p => ({...p, 3: {...r3, buffer: r3Buffer}})); setRound(4); }} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R3 → R4</button>
        </>)}

        {/* R4: ORIGINAL */}
        {round === 4 && (<>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded"><h3 className="font-bold">📋 R4: Rate Analysis</h3><p className="text-sm">Select equipment type (1 unit each).</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Equipment Selection</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc','pipe','back'].map(type => (<div key={type} className="border rounded p-3"><h4 className={`font-bold mb-2 ${type==='exc'?'text-blue-700':type==='pipe'?'text-green-700':'text-orange-700'}`}>{type==='exc'?'Excavation':type==='pipe'?'Pipe Laying':'Backfill'}</h4>{EQUIPMENT[type].map((eq,i) => (<label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type]===i?'bg-blue-100 border-2 border-blue-500':'bg-gray-50'}`}><input type="radio" checked={r4Eq[type]===i} onChange={() => setR4Eq(p => ({...p,[type]:i}))} className="mr-2"/>{eq.name}<div className="text-xs text-gray-500 ml-5">{eq.rate} ft/day | ${eq.cost}/day</div></label>))}</div>))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R4 Schedule</h3>
            <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Activity</th><th className="px-2 py-1 border">Equipment</th><th className="px-2 py-1 border">Rate</th><th className="px-2 py-1 border">Duration</th><th className="px-2 py-1 border">Cost/day</th><th className="px-2 py-1 border">Start</th><th className="px-2 py-1 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation</td><td className="px-2 py-1 border text-center text-xs">{r4.excName}</td><td className="px-2 py-1 border text-center">{r4.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.excDur}</td><td className="px-2 py-1 border text-center">${r4.excCost}</td><td className="px-2 py-1 border text-center">{r4.excS}</td><td className="px-2 py-1 border text-center">{r4.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying</td><td className="px-2 py-1 border text-center text-xs">{r4.pipeName}</td><td className="px-2 py-1 border text-center">{r4.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.pipeDur}</td><td className="px-2 py-1 border text-center">${r4.pipeCost}</td><td className="px-2 py-1 border text-center">{r4.pipeS}</td><td className="px-2 py-1 border text-center">{r4.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill</td><td className="px-2 py-1 border text-center text-xs">{r4.backName}</td><td className="px-2 py-1 border text-center">{r4.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.backDur}</td><td className="px-2 py-1 border text-center">${r4.backCost}</td><td className="px-2 py-1 border text-center">{r4.backS}</td><td className="px-2 py-1 border text-center">{r4.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Project End: <strong className="text-2xl text-orange-600">{r4.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 (dashed) vs R4 (solid)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r4])} margin={{top:10,right:30,bottom:30,left:60}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" label={{value:'Duration (day)',position:'insideBottom',offset:-5}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} label={{value:'Distance (ft)',angle:-90,position:'insideLeft',offset:10}}/><Tooltip/><Legend verticalAlign="top" height={36}/><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false}/><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false}/><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false}/><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={3} name="Exc R4" dot={false}/><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={3} name="Pipe R4" dot={false}/><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={3} name="Back R4" dot={false}/></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold mb-2">💰 R4 Budget</h3><BudgetTable cost={r4Cost} durExc={r4.excDur} durPipe={r4.pipeDur} durBack={r4.backDur} costExc={r4.excCost} costPipe={r4.pipeCost} costBack={r4.backCost}/></div>
          <button onClick={() => { setResults(p => ({...p, 4: {end: r4.end, cost: r4Cost.total}})); setRound(5); }} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R4 → R5</button>
        </>)}

        {/* R5: ORIGINAL */}
        {round === 5 && (<>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"><h3 className="font-bold">📋 R5: Optimization</h3><p className="text-sm">Meet constraints: ≤{TARGET_DAYS} days and ≤${TARGET_COST.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Equipment Configuration (Multiple Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc','pipe','back'].map(type => (<div key={type} className={`border rounded p-3 ${type==='exc'?'bg-blue-50':type==='pipe'?'bg-green-50':'bg-orange-50'}`}><h4 className={`font-bold mb-2 ${type==='exc'?'text-blue-700':type==='pipe'?'text-green-700':'text-orange-700'}`}>{type==='exc'?'Excavation':type==='pipe'?'Pipe Laying':'Backfill'}</h4>{Object.keys(r5Config[type]).map(key => { const eq = EQUIPMENT[type][type==='pipe'?(key==='standard'?0:1):(key==='small'?0:key==='standard'?1:2)]; return (<div key={key} className="flex items-center justify-between bg-white p-2 rounded mb-1"><div className="text-sm">{eq.name}<div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div></div><div className="flex items-center gap-1"><button onClick={() => setR5Config(p => ({...p,[type]:{...p[type],[key]:Math.max(0,p[type][key]-1)}}))} className="w-6 h-6 bg-gray-200 rounded font-bold">-</button><span className="w-6 text-center font-bold">{r5Config[type][key]}</span><button onClick={() => setR5Config(p => ({...p,[type]:{...p[type],[key]:p[type][key]+1}}))} className="w-6 h-6 bg-blue-200 rounded font-bold">+</button></div></div>); })}</div>))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1"/><span className="text-2xl font-bold text-purple-600 w-12">{r5Buffer}</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R5 Schedule</h3>
            <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Activity</th><th className="px-2 py-1 border">Rate</th><th className="px-2 py-1 border">Duration</th><th className="px-2 py-1 border">Cost/day</th><th className="px-2 py-1 border">Start</th><th className="px-2 py-1 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation</td><td className="px-2 py-1 border text-center">{r5.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.excDur}</td><td className="px-2 py-1 border text-center">${r5.excCost}</td><td className="px-2 py-1 border text-center">{r5.excS}</td><td className="px-2 py-1 border text-center">{r5.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying</td><td className="px-2 py-1 border text-center">{r5.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.pipeDur}</td><td className="px-2 py-1 border text-center">${r5.pipeCost}</td><td className="px-2 py-1 border text-center">{r5.pipeS}</td><td className="px-2 py-1 border text-center">{r5.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill</td><td className="px-2 py-1 border text-center">{r5.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.backDur}</td><td className="px-2 py-1 border text-center">${r5.backCost}</td><td className="px-2 py-1 border text-center">{r5.backS}</td><td className="px-2 py-1 border text-center">{r5.backE}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📈 R5 Line of Balance (LOB)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r5])} margin={{top:10,right:30,bottom:30,left:60}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day" label={{value:'Duration (day)',position:'insideBottom',offset:-5}}/><YAxis domain={[0,PROJECT_LENGTH]} tickFormatter={v=>(v/1000).toFixed(0)+'k'} label={{value:'Distance (ft)',angle:-90,position:'insideLeft',offset:10}}/><Tooltip/><Legend verticalAlign="top" height={36}/><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={3} name="Excavation" dot={false}/><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={3} name="Pipe Laying" dot={false}/><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={3} name="Backfill" dot={false}/></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Constraints Check</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${r5.end<=TARGET_DAYS?'bg-green-100 border-2 border-green-500':'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Duration</div><div className={`text-3xl font-bold ${r5.end<=TARGET_DAYS?'text-green-600':'text-red-600'}`}>{r5.end} days</div><div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end<=TARGET_DAYS?'✅':'❌'}</div></div>
              <div className={`p-4 rounded-lg text-center ${r5Cost.total<=TARGET_COST?'bg-green-100 border-2 border-green-500':'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Total Cost</div><div className={`text-3xl font-bold ${r5Cost.total<=TARGET_COST?'text-green-600':'text-red-600'}`}>${(r5Cost.total/1000).toFixed(0)}K</div><div className="text-sm">Target: ≤${TARGET_COST/1000}K {r5Cost.total<=TARGET_COST?'✅':'❌'}</div></div>
            </div>
            {(r5.end > TARGET_DAYS || r5Cost.total > TARGET_COST) && <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 font-bold text-center">⚠️ Keep optimizing...</div>}
          </div>
          <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold mb-2">💰 R5 Budget</h3><BudgetTable cost={r5Cost} durExc={r5.excDur} durPipe={r5.pipeDur} durBack={r5.backDur} costExc={r5.excCost} costPipe={r5.pipeCost} costBack={r5.backCost}/></div>
          <button onClick={() => { setResults(p => ({...p, 5: {end: r5.end, cost: r5Cost.total, buffer: r5Buffer, pass: r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST}})); setRound(6); }} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold">Finish Game 🏆</button>
        </>)}
      </div>
    </div>
  );
}
