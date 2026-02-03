import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// ==================== CONSTANTS ====================
const PROJECT_LENGTH = 15840;
const MOB_DAYS = 14;
const MOB_COST = 25000;
const DEFAULT_BUFFER = 5;
const INDIRECT_RATE = 0.30;
const PROFIT_RATE = 0.05;
const TARGET_DAYS = 55;
const TARGET_COST = 550000;

const CREWS = {
  exc: { rate: 220, cost: 1600, name: 'Excavation & Bedding' },
  pipe: { rate: 180, cost: 2500, name: 'Pipe Laying & Alignment' },
  back: { rate: 250, cost: 2300, name: 'Backfill & Compaction' },
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

// ==================== HELPER FUNCTIONS ====================
const getPositionAtDay = (startDay, rate, currentDay) => {
  if (currentDay < startDay) return 0;
  return Math.min((currentDay - startDay + 1) * rate, PROJECT_LENGTH);
};

const checkScheduleConflicts = (schedule) => {
  const { excS, pipeS, backS } = schedule;
  const endDay = Math.max(excS + DURATIONS.exc - 1, pipeS + DURATIONS.pipe - 1, backS + DURATIONS.back - 1);
  
  for (let day = MOB_DAYS + 1; day <= endDay; day++) {
    const excPos = getPositionAtDay(excS, CREWS.exc.rate, day);
    const pipePos = getPositionAtDay(pipeS, CREWS.pipe.rate, day);
    const backPos = getPositionAtDay(backS, CREWS.back.rate, day);

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

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-lg">📚 Step 1: Knowledge Check</h3>
      </div>

      {/* Q1 */}
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q1: What is the correct sequence?</h4>
        <div className="space-y-2">
          {[{v:'a',l:'Backfill → Pipe → Excavation'},{v:'b',l:'Pipe → Excavation → Backfill'},{v:'c',l:'Excavation → Pipe → Backfill'}].map(o => (
            <button key={o.v} onClick={() => !submitted.q1 && setAnswers(p => ({...p, q1: o.v}))}
              className={`block w-full p-3 rounded border-2 text-left ${submitted.q1 ? (o.v === correct.q1 ? 'border-green-500 bg-green-50' : answers.q1 === o.v ? 'border-red-500 bg-red-50' : 'border-gray-200') : answers.q1 === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {o.v.toUpperCase()}) {o.l} {submitted.q1 && o.v === correct.q1 && '✓'}
            </button>
          ))}
        </div>
        {!submitted.q1 ? <button onClick={() => setSubmitted(p => ({...p, q1: true}))} disabled={!answers.q1} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded font-bold disabled:bg-gray-300">Check</button>
          : <div className={`mt-3 p-3 rounded ${answers.q1 === correct.q1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{answers.q1 === correct.q1 ? '✅ Correct!' : '❌ Incorrect'}</div>}
      </div>

      {/* Q2 */}
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q2: Which crew is SLOWEST?</h4>
        <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
          <div>⛏️ Excavation: {CREWS.exc.rate} ft/day</div>
          <div>🔧 Pipe Laying: {CREWS.pipe.rate} ft/day</div>
          <div>🚜 Backfill: {CREWS.back.rate} ft/day</div>
        </div>
        <div className="space-y-2">
          {[{v:'a',l:`Excavation (${CREWS.exc.rate})`},{v:'b',l:`Pipe Laying (${CREWS.pipe.rate})`},{v:'c',l:`Backfill (${CREWS.back.rate})`}].map(o => (
            <button key={o.v} onClick={() => !submitted.q2 && setAnswers(p => ({...p, q2: o.v}))}
              className={`block w-full p-3 rounded border-2 text-left ${submitted.q2 ? (o.v === correct.q2 ? 'border-green-500 bg-green-50' : answers.q2 === o.v ? 'border-red-500 bg-red-50' : 'border-gray-200') : answers.q2 === o.v ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {o.v.toUpperCase()}) {o.l} {submitted.q2 && o.v === correct.q2 && '✓ SLOWEST'}
            </button>
          ))}
        </div>
        {!submitted.q2 ? <button onClick={() => setSubmitted(p => ({...p, q2: true}))} disabled={!answers.q2} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded font-bold disabled:bg-gray-300">Check</button>
          : <div className={`mt-3 p-3 rounded ${answers.q2 === correct.q2 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{answers.q2 === correct.q2 ? '✅ Correct!' : '❌ Incorrect'}</div>}
      </div>

      {/* Q3 */}
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold mb-3">Q3: Backfill duration? (ROUNDUP {PROJECT_LENGTH} ÷ {CREWS.back.rate})</h4>
        <div className="flex items-center gap-3">
          <input type="number" value={answers.q3} onChange={(e) => setAnswers(p => ({...p, q3: e.target.value}))} disabled={submitted.q3}
            className={`w-24 px-3 py-2 border-2 rounded text-center font-bold ${submitted.q3 ? (parseInt(answers.q3) === correct.q3 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-300'}`} placeholder="?" />
          <span>days</span>
        </div>
        {!submitted.q3 ? <button onClick={() => setSubmitted(p => ({...p, q3: true}))} disabled={!answers.q3} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded font-bold disabled:bg-gray-300">Check</button>
          : <div className={`mt-3 p-3 rounded ${parseInt(answers.q3) === correct.q3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{parseInt(answers.q3) === correct.q3 ? '✅ Correct!' : `❌ Answer: ${correct.q3}`}</div>}
      </div>

      {allDone && (
        <button onClick={onComplete} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700">
          Continue to Step 2: Bar Chart →
        </button>
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

  const dayToPixel = (day) => CHART_PADDING + day * PIXELS_PER_DAY;
  const pixelToDay = (pixel) => Math.max(MOB_DAYS + 1, Math.min(Math.round((pixel - CHART_PADDING) / PIXELS_PER_DAY), 140));

  const handleMouseDown = (barType, e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    setDragOffset((e.clientX - rect.left) - dayToPixel(barType === 'pipe' ? schedule.pipeStart : schedule.backStart));
    setDragging(barType);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const newDay = pixelToDay((e.clientX - rect.left) - dragOffset);
    onScheduleChange({ ...schedule, [dragging === 'pipe' ? 'pipeStart' : 'backStart']: newDay });
  }, [dragging, dragOffset, schedule, onScheduleChange]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', up); };
  }, [dragging, handleMouseMove]);

  const bars = [
    { id: 'mob', label: 'Mobilization', start: 1, end: MOB_DAYS, color: 'bg-gray-400', locked: true },
    { id: 'exc', label: 'Excavation', start: MOB_DAYS + 1, end: MOB_DAYS + DURATIONS.exc, color: 'bg-blue-500', locked: true },
    { id: 'pipe', label: 'Pipe Laying', start: schedule.pipeStart, end: schedule.pipeStart + DURATIONS.pipe - 1, color: 'bg-green-500', locked: false },
    { id: 'back', label: 'Backfill', start: schedule.backStart, end: schedule.backStart + DURATIONS.back - 1, color: 'bg-orange-500', locked: false }
  ];

  return (
    <div ref={chartRef} className="relative bg-gray-50 rounded-lg p-4" style={{ width: CHART_WIDTH, height: bars.length * (BAR_HEIGHT + BAR_GAP) + 60 }}>
      {[0,20,40,60,80,100,120,140].map(d => <div key={d} className="absolute top-0 bottom-8 w-px bg-gray-200" style={{ left: dayToPixel(d) }} />)}
      <div className="absolute bottom-2 flex text-xs text-gray-500">
        {[0,20,40,60,80,100,120,140].map(d => <span key={d} className="absolute" style={{ left: dayToPixel(d) - 10 }}>{d}</span>)}
      </div>
      {bars.map((bar, i) => (
        <React.Fragment key={bar.id}>
          <div className="absolute left-2 text-xs font-medium text-gray-600" style={{ top: i * (BAR_HEIGHT + BAR_GAP) + 20 }}>{bar.label}</div>
          <div className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold ${bar.locked ? 'cursor-not-allowed' : 'cursor-grab hover:shadow-lg'} ${dragging === bar.id ? 'ring-4 ring-yellow-300 z-10' : ''}`}
            style={{ left: dayToPixel(bar.start), width: (bar.end - bar.start + 1) * PIXELS_PER_DAY, height: BAR_HEIGHT, top: i * (BAR_HEIGHT + BAR_GAP) + 12 }}
            onMouseDown={bar.locked ? undefined : (e) => handleMouseDown(bar.id, e)}>
            {bar.locked && '🔒'} {bar.start}-{bar.end}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function SchedulerStep({ onComplete }) {
  const [schedule, setSchedule] = useState({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 });

  const fullSchedule = useMemo(() => ({
    excS: MOB_DAYS + 1, excE: MOB_DAYS + DURATIONS.exc,
    pipeS: schedule.pipeStart, pipeE: schedule.pipeStart + DURATIONS.pipe - 1,
    backS: schedule.backStart, backE: schedule.backStart + DURATIONS.back - 1,
    end: Math.max(MOB_DAYS + DURATIONS.exc, schedule.pipeStart + DURATIONS.pipe - 1, schedule.backStart + DURATIONS.back - 1)
  }), [schedule]);

  const conflict = useMemo(() => checkScheduleConflicts(fullSchedule), [fullSchedule]);

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="font-bold text-lg">🎮 Step 2: Bar Chart Scheduler</h3>
        <p className="text-sm text-gray-600">Drag the green and orange bars to create your schedule.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between mb-3">
          <h4 className="font-bold">📊 Drag the Bars</h4>
          <button onClick={() => setSchedule({ pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 })} className="px-3 py-1 text-sm bg-gray-200 rounded">🔄 Reset</button>
        </div>
        <DraggableBarChart schedule={schedule} onScheduleChange={setSchedule} conflictStatus={conflict} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-gray-100"><th className="p-2 border">Activity</th><th className="p-2 border">Start</th><th className="p-2 border">End</th></tr></thead>
          <tbody>
            <tr className="bg-blue-50"><td className="p-2 border">⛏️ Excavation 🔒</td><td className="p-2 border text-center">{fullSchedule.excS}</td><td className="p-2 border text-center">{fullSchedule.excE}</td></tr>
            <tr className="bg-green-50"><td className="p-2 border">🔧 Pipe Laying</td><td className="p-2 border text-center font-bold">{fullSchedule.pipeS}</td><td className="p-2 border text-center">{fullSchedule.pipeE}</td></tr>
            <tr className="bg-orange-50"><td className="p-2 border">🚜 Backfill</td><td className="p-2 border text-center font-bold">{fullSchedule.backS}</td><td className="p-2 border text-center">{fullSchedule.backE}</td></tr>
          </tbody>
        </table>
        <div className="mt-3 text-center">Duration: <span className="text-2xl font-bold text-blue-600">{fullSchedule.end} days</span></div>
      </div>

      <div className={`p-4 rounded-lg border-2 ${conflict.hasConflict ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
        {conflict.hasConflict ? (
          <><div className="font-bold text-yellow-800">⚠️ Conflict Detected!</div><p className="text-sm text-yellow-700">Proceed to R2 to learn how to fix this.</p></>
        ) : (
          <><div className="font-bold text-green-800">✅ No Conflicts!</div><p className="text-sm text-green-700">In R2, you'll learn WHY it works.</p></>
        )}
      </div>

      <button onClick={() => onComplete({ ...fullSchedule, hasConflict: conflict.hasConflict })}
        className={`w-full py-4 rounded-lg font-bold text-lg text-white ${conflict.hasConflict ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}>
        {conflict.hasConflict ? '⚠️ Proceed to R2 → Learn to Fix' : '✅ Complete R1 → Proceed to R2'}
      </button>
    </div>
  );
}

// ==================== R2 DRAGGABLE LOB ====================
function DraggableLOBChart({ schedule, onScheduleChange, conflictStatus }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const W = 520, H = 300, M = { t: 20, r: 20, b: 40, l: 55 };
  const IW = W - M.l - M.r, IH = H - M.t - M.b, maxDay = 140;

  const dayToX = d => M.l + (d / maxDay) * IW;
  const xToDay = x => Math.max(MOB_DAYS + 1, Math.min(Math.round(((x - M.l) / IW) * maxDay), 100));
  const distToY = dist => M.t + IH - (dist / PROJECT_LENGTH) * IH;

  const getLine = (s, dur) => ({ x1: dayToX(s), y1: distToY(0), x2: dayToX(s + dur - 1), y2: distToY(PROJECT_LENGTH) });

  const excL = getLine(schedule.excS, DURATIONS.exc);
  const pipeL = getLine(schedule.pipeS, DURATIONS.pipe);
  const backL = getLine(schedule.backS, DURATIONS.back);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const newStart = xToDay(e.clientX - rect.left);
    if (dragging === 'pipe') onScheduleChange({ ...schedule, pipeS: newStart, pipeE: newStart + DURATIONS.pipe - 1, end: Math.max(schedule.excE, newStart + DURATIONS.pipe - 1, schedule.backE) });
    else onScheduleChange({ ...schedule, backS: newStart, backE: newStart + DURATIONS.back - 1, end: Math.max(schedule.excE, schedule.pipeE, newStart + DURATIONS.back - 1) });
  }, [dragging, schedule, onScheduleChange]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', up); };
  }, [dragging, handleMouseMove]);

  return (
    <svg ref={chartRef} width={W} height={H} className="bg-gray-50 rounded border">
      {[0,20,40,60,80,100,120,140].map(d => <g key={d}><line x1={dayToX(d)} y1={M.t} x2={dayToX(d)} y2={M.t+IH} stroke="#e5e7eb"/><text x={dayToX(d)} y={H-8} textAnchor="middle" fontSize={9} fill="#6b7280">{d}</text></g>)}
      {[0,4000,8000,12000,PROJECT_LENGTH].map(d => <g key={d}><line x1={M.l} y1={distToY(d)} x2={M.l+IW} y2={distToY(d)} stroke="#e5e7eb"/><text x={M.l-5} y={distToY(d)+3} textAnchor="end" fontSize={9} fill="#6b7280">{(d/1000).toFixed(0)}k</text></g>)}
      
      <line {...excL} stroke="#3b82f6" strokeWidth={4}/><circle cx={excL.x1} cy={excL.y1} r={5} fill="#3b82f6"/><circle cx={excL.x2} cy={excL.y2} r={5} fill="#3b82f6"/>
      
      <line x1={pipeL.x1} y1={pipeL.y1} x2={pipeL.x2} y2={pipeL.y2} stroke={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'} strokeWidth={4} className="cursor-ew-resize" onMouseDown={() => setDragging('pipe')}/>
      <circle cx={pipeL.x1} cy={pipeL.y1} r={8} fill={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'} stroke="white" strokeWidth={2} className="cursor-ew-resize" onMouseDown={() => setDragging('pipe')}/>
      <circle cx={pipeL.x2} cy={pipeL.y2} r={5} fill={conflictStatus.type==='pipe-exc'?'#ef4444':'#22c55e'}/>
      
      <line x1={backL.x1} y1={backL.y1} x2={backL.x2} y2={backL.y2} stroke={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'} strokeWidth={4} className="cursor-ew-resize" onMouseDown={() => setDragging('back')}/>
      <circle cx={backL.x1} cy={backL.y1} r={8} fill={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'} stroke="white" strokeWidth={2} className="cursor-ew-resize" onMouseDown={() => setDragging('back')}/>
      <circle cx={backL.x2} cy={backL.y2} r={5} fill={conflictStatus.type==='back-pipe'?'#ef4444':'#f97316'}/>
      
      <g transform={`translate(${M.l+5},${M.t+5})`}>
        <rect width={120} height={55} fill="white" fillOpacity={0.9} rx={4} stroke="#e5e7eb"/>
        <circle cx={10} cy={12} r={4} fill="#3b82f6"/><text x={18} y={15} fontSize={9}>⛏️ Exc (fixed)</text>
        <circle cx={10} cy={28} r={4} fill="#22c55e"/><text x={18} y={31} fontSize={9}>🔧 Pipe (drag)</text>
        <circle cx={10} cy={44} r={4} fill="#f97316"/><text x={18} y={47} fontSize={9}>🚜 Back (drag)</text>
      </g>
    </svg>
  );
}

// ==================== R2 COMPONENT ====================
function Round2({ r1Schedule, onComplete }) {
  const [phase, setPhase] = useState(1);
  const [currentSchedule, setCurrentSchedule] = useState({ ...r1Schedule });

  const naiveSchedule = useMemo(() => ({
    excS: MOB_DAYS + 1, excE: MOB_DAYS + DURATIONS.exc,
    pipeS: MOB_DAYS + 1, pipeE: MOB_DAYS + DURATIONS.pipe,
    backS: MOB_DAYS + 1, backE: MOB_DAYS + DURATIONS.back,
    end: Math.max(MOB_DAYS + DURATIONS.exc, MOB_DAYS + DURATIONS.pipe, MOB_DAYS + DURATIONS.back)
  }), []);

  const optimalSchedule = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + DURATIONS.exc - 1;
    const pipeS = excS + DEFAULT_BUFFER, pipeE = pipeS + DURATIONS.pipe - 1;
    const backS = pipeE + DEFAULT_BUFFER - DURATIONS.back + 1, backE = backS + DURATIONS.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, []);

  const currentConflict = useMemo(() => checkScheduleConflicts(currentSchedule), [currentSchedule]);
  const currentBuffers = useMemo(() => calculateBuffers(currentSchedule), [currentSchedule]);
  const r1Conflict = useMemo(() => checkScheduleConflicts(r1Schedule), [r1Schedule]);
  const naiveConflict = useMemo(() => checkScheduleConflicts(naiveSchedule), [naiveSchedule]);

  const isOptimal = currentSchedule.pipeS === optimalSchedule.pipeS && currentSchedule.backS === optimalSchedule.backS && !currentConflict.hasConflict;
  const isValid = !currentConflict.hasConflict && currentBuffers.bufferExcPipe >= DEFAULT_BUFFER && currentBuffers.bufferPipeBack >= DEFAULT_BUFFER;

  // Phase 1: Naive Schedule
  if (phase === 1) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-bold text-lg">🤔 What if all crews started on Day {MOB_DAYS + 1}?</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={generateLOBData(naiveSchedule)} margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000)+'k'} />
              <Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={3} dot={false} />
              <Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={3} dot={false} />
              {naiveConflict.hasConflict && <ReferenceLine x={naiveConflict.firstConflictDay} stroke="#ef4444" strokeDasharray="5 5" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h4 className="font-bold text-red-800">❌ CONFLICT at Day {naiveConflict.firstConflictDay}!</h4>
          <p className="text-red-700 text-sm">Backfill catches up to Pipe Laying - impossible!</p>
        </div>
        <button onClick={() => setPhase(2)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">See Your R1 Schedule →</button>
      </div>
    );
  }

  // Phase 2: R1 Analysis
  if (phase === 2) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <h3 className="font-bold text-lg">📊 Your R1 Schedule</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={generateLOBData(r1Schedule)} margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000)+'k'} />
              <Line type="linear" dataKey="exc" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="linear" dataKey="pipe" stroke="#22c55e" strokeWidth={3} dot={false} />
              <Line type="linear" dataKey="back" stroke="#f97316" strokeWidth={3} dot={false} />
              {r1Conflict.hasConflict && <ReferenceLine x={r1Conflict.firstConflictDay} stroke="#ef4444" strokeDasharray="5 5" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold mb-2">Your R1</h4>
            <div className="text-sm space-y-1">
              <div>⛏️ Exc: {r1Schedule.excS}-{r1Schedule.excE}</div>
              <div>🔧 Pipe: {r1Schedule.pipeS}-{r1Schedule.pipeE}</div>
              <div>🚜 Back: {r1Schedule.backS}-{r1Schedule.backE}</div>
            </div>
            <div className="mt-2 font-bold">Duration: {r1Schedule.end} days</div>
          </div>
          <div className={`rounded-lg shadow p-4 ${r1Conflict.hasConflict ? 'bg-red-50' : 'bg-green-50'}`}>
            {r1Conflict.hasConflict ? <><h4 className="font-bold text-red-800">❌ CONFLICT!</h4><p className="text-sm">Day {r1Conflict.firstConflictDay}</p></>
              : <><h4 className="font-bold text-green-800">✅ NO CONFLICTS</h4><p className="text-sm">Optimal: {optimalSchedule.end}d</p></>}
          </div>
        </div>
        <button onClick={() => setPhase(3)} className={`w-full py-3 rounded-lg font-bold text-white ${r1Conflict.hasConflict ? 'bg-red-600' : 'bg-green-600'}`}>
          {r1Conflict.hasConflict ? 'Fix My Schedule →' : 'Optimize My Schedule →'}
        </button>
      </div>
    );
  }

  // Phase 3: Interactive LOB Editor
  if (phase === 3) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <h3 className="font-bold text-lg">🎮 LOB Editor - Drag the lines!</h3>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between mb-3">
            <h4 className="font-bold">Interactive LOB</h4>
            <button onClick={() => setCurrentSchedule({...r1Schedule})} className="px-3 py-1 text-sm bg-gray-200 rounded">🔄 Reset to R1</button>
          </div>
          <div className="flex justify-center">
            <DraggableLOBChart schedule={currentSchedule} onScheduleChange={setCurrentSchedule} conflictStatus={currentConflict} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold mb-2">Schedule</h4>
            <div className="text-sm space-y-1">
              <div className="bg-blue-50 p-1 rounded">⛏️ Exc: {currentSchedule.excS}-{currentSchedule.excE} 🔒</div>
              <div className="bg-green-50 p-1 rounded">🔧 Pipe: <strong>{currentSchedule.pipeS}</strong>-{currentSchedule.pipeE}</div>
              <div className="bg-orange-50 p-1 rounded">🚜 Back: <strong>{currentSchedule.backS}</strong>-{currentSchedule.backE}</div>
            </div>
            <div className="mt-2 p-2 bg-gray-100 rounded text-center">Duration: <span className={`text-xl font-bold ${currentSchedule.end === optimalSchedule.end ? 'text-green-600' : ''}`}>{currentSchedule.end}d</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-bold mb-2">Status</h4>
            <div className="space-y-2 text-sm">
              <div className={`p-2 rounded flex justify-between ${currentBuffers.bufferExcPipe >= 5 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span>Exc→Pipe:</span><span className="font-bold">{currentBuffers.bufferExcPipe}d {currentBuffers.bufferExcPipe >= 5 ? '✅' : '❌'}</span>
              </div>
              <div className={`p-2 rounded flex justify-between ${currentBuffers.bufferPipeBack >= 5 ? 'bg-green-50' : 'bg-red-50'}`}>
                <span>Pipe→Back:</span><span className="font-bold">{currentBuffers.bufferPipeBack}d {currentBuffers.bufferPipeBack >= 5 ? '✅' : '❌'}</span>
              </div>
              <div className={`p-2 rounded ${currentConflict.hasConflict ? 'bg-red-100' : 'bg-green-100'}`}>
                {currentConflict.hasConflict ? <span className="text-red-700 font-bold">❌ CONFLICT</span> : <span className="text-green-700 font-bold">✅ No Conflicts</span>}
              </div>
              {isOptimal && <div className="p-2 bg-yellow-100 rounded text-center">⭐ <span className="font-bold">OPTIMAL!</span></div>}
            </div>
          </div>
        </div>

        {isValid && <button onClick={() => setPhase(4)} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold">{isOptimal ? '⭐ See the Math →' : 'Compare with Optimal →'}</button>}
      </div>
    );
  }

  // Phase 4: Formulas
  if (phase === 4) {
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
          <h3 className="font-bold text-lg">🎓 The Math Behind LOB</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h5 className="font-bold text-green-800 mb-2">🔧 Pipe Laying</h5>
            <p className="text-sm">Pipe (180) is <strong>SLOWER</strong> than Exc (220)</p>
            <p className="text-sm">→ Buffer at <strong>START</strong></p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-sm">
              Start = PrevStart + Buffer<br/>
              <span className="text-green-700 font-bold">{optimalSchedule.pipeS} = {optimalSchedule.excS} + {DEFAULT_BUFFER}</span>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded border border-orange-200">
            <h5 className="font-bold text-orange-800 mb-2">🚜 Backfill</h5>
            <p className="text-sm">Backfill (250) is <strong>FASTER</strong> than Pipe (180)</p>
            <p className="text-sm">→ Buffer at <strong>END</strong></p>
            <div className="mt-2 p-2 bg-white rounded font-mono text-sm">
              Start = PrevEnd + Buffer - Dur + 1<br/>
              <span className="text-orange-700 font-bold">{optimalSchedule.backS} = {optimalSchedule.pipeE} + {DEFAULT_BUFFER} - {DURATIONS.back} + 1</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h4 className="font-bold text-blue-800 text-center mb-2">📌 KEY RULE</h4>
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div className="p-2 bg-white rounded">Following <strong>SLOWER?</strong> → Buffer at START</div>
            <div className="p-2 bg-white rounded">Following <strong>FASTER?</strong> → Buffer at END</div>
          </div>
        </div>

        <button onClick={() => onComplete(optimalSchedule)} className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg">
          Complete R2 → Proceed to R3 🎉
        </button>
      </div>
    );
  }

  return null;
}

// ==================== MAIN GAME ====================
export default function LOBGame() {
  const [round, setRound] = useState(0);
  const [name, setName] = useState('');
  const [r1Step, setR1Step] = useState(1);
  const [results, setResults] = useState({});
  const [r3Buffer, setR3Buffer] = useState(5);
  const [r4Eq, setR4Eq] = useState({ exc: 1, pipe: 0, back: 1 });
  const [r5Config, setR5Config] = useState({ exc: { small: 0, standard: 1, large: 0 }, pipe: { standard: 1, heavy: 0 }, back: { small: 0, standard: 1, large: 0 } });
  const [r5Buffer, setR5Buffer] = useState(5);

  const dur = { exc: DURATIONS.exc, pipe: DURATIONS.pipe, back: DURATIONS.back };

  const r2Correct = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + DEFAULT_BUFFER, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + DEFAULT_BUFFER - dur.back + 1, backE = backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
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
    const pipeS = pipe.rate < exc.rate ? excS + DEFAULT_BUFFER : excE + DEFAULT_BUFFER - pipeDur + 1, pipeE = pipeS + pipeDur - 1;
    const backS = back.rate < pipe.rate ? pipeS + DEFAULT_BUFFER : pipeE + DEFAULT_BUFFER - backDur + 1, backE = backS + backDur - 1;
    return { excS, excE, excDur, excCost: exc.cost, pipeS, pipeE, pipeDur, pipeCost: pipe.cost, backS, backE, backDur, backCost: back.cost, end: Math.max(excE, pipeE, backE) };
  }, [r4Eq]);

  const r4Cost = useMemo(() => {
    const excC = r4.excDur * r4.excCost, pipeC = r4.pipeDur * r4.pipeCost, backC = r4.backDur * r4.backCost;
    const direct = MOB_COST + excC + pipeC + backC, indirect = Math.round(direct * INDIRECT_RATE), profit = Math.round((direct + indirect) * PROFIT_RATE);
    return { total: direct + indirect + profit };
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
    const excDur = Math.ceil(PROJECT_LENGTH / r5Calc.exc.rate), pipeDur = Math.ceil(PROJECT_LENGTH / r5Calc.pipe.rate), backDur = Math.ceil(PROJECT_LENGTH / r5Calc.back.rate);
    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    const pipeS = r5Calc.pipe.rate < r5Calc.exc.rate ? excS + r5Buffer : excE + r5Buffer - pipeDur + 1, pipeE = pipeS + pipeDur - 1;
    const backS = r5Calc.back.rate < r5Calc.pipe.rate ? pipeS + r5Buffer : pipeE + r5Buffer - backDur + 1, backE = backS + backDur - 1;
    return { excDur, excCost: r5Calc.exc.cost, pipeDur, pipeCost: r5Calc.pipe.cost, backDur, backCost: r5Calc.back.cost, end: Math.max(excE, pipeE, backE) };
  }, [r5Calc, r5Buffer]);

  const r5Cost = useMemo(() => {
    const excC = r5.excDur * r5.excCost, pipeC = r5.pipeDur * r5.pipeCost, backC = r5.backDur * r5.backCost;
    const direct = MOB_COST + excC + pipeC + backC, indirect = Math.round(direct * INDIRECT_RATE), profit = Math.round((direct + indirect) * PROFIT_RATE);
    return { total: direct + indirect + profit };
  }, [r5]);

  const genLOB = (schedules) => {
    const data = [];
    const maxDay = Math.max(...schedules.map(s => s.end || 0), 100) + 10;
    for (let d = 0; d <= maxDay; d += 2) {
      const pt = { day: d };
      schedules.forEach((s, i) => {
        ['exc', 'pipe', 'back'].forEach(type => {
          const start = s[type + 'S'], end = s[type + 'E'];
          if (start > 0 && end > 0) pt[type + i] = d < start ? 0 : d > end ? PROJECT_LENGTH : ((d - start) / (end - start)) * PROJECT_LENGTH;
        });
      });
      data.push(pt);
    }
    return data;
  };

  // INTRO
  if (round === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center text-white mb-6">
            <h1 className="text-4xl font-bold">🎮 LOB SIMULATION GAME</h1>
            <p className="text-blue-200">5-Round Educational Simulation</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">📋 PROJECT</h2>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Project</div><div className="font-bold">Pipeline</div></div>
              <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Length</div><div className="font-bold">{PROJECT_LENGTH.toLocaleString()} ft</div></div>
              <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Mob</div><div className="font-bold">{MOB_DAYS} days</div></div>
              <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Target</div><div className="font-bold">≤{TARGET_DAYS}d, ≤${TARGET_COST/1000}K</div></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold border-b pb-2 mb-4">👷 CREWS</h2>
            <table className="w-full text-sm">
              <thead className="bg-blue-100"><tr><th className="p-2 text-left">Crew</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Cost</th></tr></thead>
              <tbody>
                <tr className="bg-blue-50"><td className="p-2">⛏️ Excavation</td><td className="p-2 text-right">{CREWS.exc.rate} ft/d</td><td className="p-2 text-right">${CREWS.exc.cost}/d</td></tr>
                <tr className="bg-green-50"><td className="p-2">🔧 Pipe Laying</td><td className="p-2 text-right">{CREWS.pipe.rate} ft/d</td><td className="p-2 text-right">${CREWS.pipe.cost}/d</td></tr>
                <tr className="bg-orange-50"><td className="p-2">🚜 Backfill</td><td className="p-2 text-right">{CREWS.back.rate} ft/d</td><td className="p-2 text-right">${CREWS.back.cost}/d</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl p-5">
            <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg" />
            <button onClick={() => name && setRound(1)} disabled={!name} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg disabled:bg-gray-300">Start Game →</button>
          </div>
        </div>
      </div>
    );
  }

  // FINAL
  if (round === 6) {
    const pass = results[5]?.pass;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl p-6 text-center">
          <div className="text-6xl mb-4">{pass ? '🏆' : '📊'}</div>
          <h1 className="text-3xl font-bold mb-2">Game Complete!</h1>
          <p className="text-gray-600 mb-4">Great job, {name}!</p>
          <div className={`p-4 rounded-lg mb-4 ${pass ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <div>Duration: <strong className={results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}>{results[5]?.end}d</strong> (target: ≤{TARGET_DAYS})</div>
            <div>Cost: <strong className={results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}>${results[5]?.cost?.toLocaleString()}</strong> (target: ≤${TARGET_COST.toLocaleString()})</div>
          </div>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">🔄 Play Again</button>
        </div>
      </div>
    );
  }

  const titles = { 1: 'Bar Chart', 2: 'LOB Analysis', 3: 'Buffer Analysis', 4: 'Rate Analysis', 5: 'Optimize' };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white py-2 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between">
          <span><span className="text-blue-300">Player:</span> <strong>{name}</strong></span>
          <span className="font-bold">Round {round}: {titles[round]}</span>
          <span className="text-sm">🎯≤{TARGET_DAYS}d | 💰≤${TARGET_COST/1000}K</span>
        </div>
      </div>
      <div className="bg-white border-b"><div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">{[1,2,3,4,5].map(r => <div key={r} className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`} />)}</div></div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* R1 */}
        {round === 1 && (<>
          <div className="bg-white rounded-lg shadow p-3 flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-sm ${r1Step === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{r1Step === 1 ? '1️⃣' : '✅'} Quiz</span>
            <span>→</span>
            <span className={`px-3 py-1 rounded-full text-sm ${r1Step === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>2️⃣ Scheduler</span>
          </div>
          {r1Step === 1 && <QuizStep dur={dur} onComplete={() => setR1Step(2)} />}
          {r1Step === 2 && <SchedulerStep onComplete={(s) => { setResults(p => ({...p, 1: s})); setRound(2); }} />}
        </>)}

        {/* R2 */}
        {round === 2 && results[1] && <Round2 r1Schedule={results[1]} onComplete={(s) => { setResults(p => ({...p, 2: s})); setRound(3); }} />}

        {/* R3 */}
        {round === 3 && (<>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><h3 className="font-bold">📋 R3: Buffer Analysis</h3></div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="15" value={r3Buffer} onChange={e => setR3Buffer(+e.target.value)} className="flex-1" /><span className="text-3xl font-bold text-green-600">{r3Buffer}</span><span>days</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="p-2 border">Activity</th><th className="p-2 border">Start</th><th className="p-2 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-blue-50"><td className="p-2 border">⛏️ Excavation</td><td className="p-2 border text-center">{r3.excS}</td><td className="p-2 border text-center">{r3.excE}</td></tr>
                <tr className="bg-green-50"><td className="p-2 border">🔧 Pipe Laying</td><td className="p-2 border text-center">{r3.pipeS}</td><td className="p-2 border text-center">{r3.pipeE}</td></tr>
                <tr className="bg-orange-50"><td className="p-2 border">🚜 Backfill</td><td className="p-2 border text-center">{r3.backS}</td><td className="p-2 border text-center">{r3.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Duration: <strong className="text-2xl text-green-600">{r3.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={genLOB([r2Correct, r3])} margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000)+'k'} /><Legend />
                <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} />
                <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} />
                <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} />
                <Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={3} name="Exc R3" dot={false} />
                <Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={3} name="Pipe R3" dot={false} />
                <Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={3} name="Back R3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-yellow-50 p-4 rounded"><strong>💡 Insight:</strong> Buffer ↑ = Duration ↑, but Cost stays the same!</div>
          <button onClick={() => { setResults(p => ({...p, 3: {...r3, buffer: r3Buffer}})); setRound(4); }} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold">Complete R3 → R4</button>
        </>)}

        {/* R4 */}
        {round === 4 && (<>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded"><h3 className="font-bold">📋 R4: Equipment Selection</h3></div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-3 gap-4">
              {['exc','pipe','back'].map(type => (
                <div key={type} className="border rounded p-3">
                  <h4 className={`font-bold mb-2 ${type==='exc'?'text-blue-700':type==='pipe'?'text-green-700':'text-orange-700'}`}>{type==='exc'?'Excavation':type==='pipe'?'Pipe Laying':'Backfill'}</h4>
                  {EQUIPMENT[type].map((eq,i) => (
                    <label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type]===i?'bg-blue-100 border-2 border-blue-500':'bg-gray-50'}`}>
                      <input type="radio" checked={r4Eq[type]===i} onChange={() => setR4Eq(p => ({...p,[type]:i}))} className="mr-2" />
                      {eq.name}<div className="text-xs text-gray-500 ml-5">{eq.rate} ft/d | ${eq.cost}/d</div>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div>Duration: <strong className="text-2xl text-orange-600">{r4.end} days</strong></div>
            <div>Cost: <strong className="text-xl">${r4Cost.total.toLocaleString()}</strong></div>
          </div>
          <button onClick={() => { setResults(p => ({...p, 4: {end: r4.end, cost: r4Cost.total}})); setRound(5); }} className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold">Complete R4 → R5</button>
        </>)}

        {/* R5 */}
        {round === 5 && (<>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"><h3 className="font-bold">📋 R5: Optimize (≤{TARGET_DAYS}d, ≤${TARGET_COST.toLocaleString()})</h3></div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-3 gap-4">
              {['exc','pipe','back'].map(type => (
                <div key={type} className={`border rounded p-3 ${type==='exc'?'bg-blue-50':type==='pipe'?'bg-green-50':'bg-orange-50'}`}>
                  <h4 className="font-bold mb-2">{type==='exc'?'Excavation':type==='pipe'?'Pipe Laying':'Backfill'}</h4>
                  {Object.keys(r5Config[type]).map(key => {
                    const eq = EQUIPMENT[type][type==='pipe'?(key==='standard'?0:1):(key==='small'?0:key==='standard'?1:2)];
                    return (
                      <div key={key} className="flex justify-between items-center bg-white p-2 rounded mb-1">
                        <div className="text-sm">{eq.name}<div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setR5Config(p => ({...p,[type]:{...p[type],[key]:Math.max(0,p[type][key]-1)}}))} className="w-6 h-6 bg-gray-200 rounded">-</button>
                          <span className="w-6 text-center font-bold">{r5Config[type][key]}</span>
                          <button onClick={() => setR5Config(p => ({...p,[type]:{...p[type],[key]:p[type][key]+1}}))} className="w-6 h-6 bg-blue-200 rounded">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1" /><span className="text-2xl font-bold text-purple-600">{r5Buffer}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg text-center ${r5.end <= TARGET_DAYS ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
              <div className="text-gray-600">Duration</div>
              <div className={`text-3xl font-bold ${r5.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{r5.end} days</div>
              <div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end <= TARGET_DAYS ? '✅' : '❌'}</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${r5Cost.total <= TARGET_COST ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
              <div className="text-gray-600">Cost</div>
              <div className={`text-3xl font-bold ${r5Cost.total <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${(r5Cost.total/1000).toFixed(0)}K</div>
              <div className="text-sm">Target: ≤${TARGET_COST/1000}K {r5Cost.total <= TARGET_COST ? '✅' : '❌'}</div>
            </div>
          </div>
          <button onClick={() => { setResults(p => ({...p, 5: {end: r5.end, cost: r5Cost.total, pass: r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST}})); setRound(6); }} className="w-full py-4 bg-purple-600 text-white rounded-lg font-bold text-lg">Finish Game 🏆</button>
        </>)}
      </div>
    </div>
  );
}
