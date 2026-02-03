import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

// ==================== R1: DRAGGABLE BAR CHART ====================
function DraggableBarChart({ schedule, onScheduleChange }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  const CHART_WIDTH = 700;
  const CHART_PADDING_LEFT = 180;
  const CHART_PADDING_RIGHT = 20;
  const MAX_DAY = 160;
  const USABLE_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
  const PIXELS_PER_DAY = USABLE_WIDTH / MAX_DAY;
  const BAR_HEIGHT = 36;
  const BAR_GAP = 12;
  const CHART_HEIGHT = 4 * (BAR_HEIGHT + BAR_GAP) + 60;

  const dayToPixel = (day) => CHART_PADDING_LEFT + day * PIXELS_PER_DAY;
  const pixelToDay = (pixel) => Math.max(1, Math.min(Math.round((pixel - CHART_PADDING_LEFT) / PIXELS_PER_DAY), MAX_DAY - 20));

  const handleMouseDown = (barType, e) => {
    e.preventDefault();
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let currentStart;
    if (barType === 'exc') currentStart = schedule.excStart;
    else if (barType === 'pipe') currentStart = schedule.pipeStart;
    else currentStart = schedule.backStart;
    setDragOffset(mouseX - dayToPixel(currentStart));
    setDragging(barType);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newDay = Math.max(MOB_DAYS + 1, pixelToDay(mouseX - dragOffset));
    
    if (dragging === 'exc') {
      onScheduleChange({ ...schedule, excStart: newDay });
    } else if (dragging === 'pipe') {
      onScheduleChange({ ...schedule, pipeStart: newDay });
    } else if (dragging === 'back') {
      onScheduleChange({ ...schedule, backStart: newDay });
    }
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
    { id: 'mob', label: 'Mobilization', start: 1, duration: MOB_DAYS, color: 'bg-gray-400', locked: true },
    { id: 'exc', label: 'Excavation & Bedding', start: schedule.excStart, duration: DURATIONS.exc, color: 'bg-blue-500', locked: false },
    { id: 'pipe', label: 'Pipe Laying & Alignment', start: schedule.pipeStart, duration: DURATIONS.pipe, color: 'bg-green-500', locked: false },
    { id: 'back', label: 'Backfill & Compaction', start: schedule.backStart, duration: DURATIONS.back, color: 'bg-orange-500', locked: false },
  ];

  const xTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160];

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm justify-center">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded"></div><span>Mobilization</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span>Excavation & Bedding</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Pipe Laying & Alignment</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded"></div><span>Backfill & Compaction</span></div>
      </div>

      {/* Chart */}
      <div
        ref={chartRef}
        className="relative bg-gray-50 rounded-lg border"
        style={{ width: CHART_WIDTH, height: CHART_HEIGHT, margin: '0 auto' }}
      >
        {/* Y-axis label */}
        <div 
          className="absolute text-sm font-medium text-gray-600"
          style={{ left: 8, top: '50%', transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left center' }}
        >
          Activity
        </div>

        {/* Grid lines */}
        {xTicks.map(day => (
          <div key={`grid-${day}`} className="absolute w-px bg-gray-200" style={{ left: dayToPixel(day), top: 10, bottom: 40 }} />
        ))}

        {/* Activity labels */}
        {bars.map((bar, index) => (
          <div key={`label-${bar.id}`} className="absolute text-sm text-gray-700 text-right pr-3"
            style={{ left: 20, width: CHART_PADDING_LEFT - 30, top: index * (BAR_HEIGHT + BAR_GAP) + 20 + BAR_HEIGHT / 2 - 10 }}>
            {bar.label}
          </div>
        ))}

        {/* Bars */}
        {bars.map((bar, index) => (
          <div
            key={bar.id}
            className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold shadow
              ${bar.locked ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-lg'}
              ${dragging === bar.id ? 'ring-4 ring-yellow-400 shadow-xl z-10' : ''}`}
            style={{
              left: dayToPixel(bar.start),
              width: Math.max(bar.duration * PIXELS_PER_DAY, 40),
              height: BAR_HEIGHT,
              top: index * (BAR_HEIGHT + BAR_GAP) + 20,
            }}
            onMouseDown={bar.locked ? undefined : (e) => handleMouseDown(bar.id, e)}
          >
            {bar.locked && <span className="mr-1">🔒</span>}
            {bar.start} - {bar.start + bar.duration - 1}
          </div>
        ))}

        {/* X-axis ticks and labels */}
        <div className="absolute bottom-0 left-0 right-0 h-10">
          {xTicks.map(day => (
            <div key={`tick-${day}`} className="absolute text-xs text-gray-500"
              style={{ left: dayToPixel(day), transform: 'translateX(-50%)', bottom: 20 }}>
              {day}
            </div>
          ))}
          <div className="absolute text-sm font-medium text-gray-600" style={{ left: '50%', transform: 'translateX(-50%)', bottom: 2 }}>
            Time (days)
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== R1 COMPONENT ====================
function Round1({ onComplete }) {
  const [schedule, setSchedule] = useState({
    excStart: MOB_DAYS + 1,
    pipeStart: MOB_DAYS + 1,
    backStart: MOB_DAYS + 1,
  });

  const fullSchedule = useMemo(() => ({
    excS: schedule.excStart,
    excE: schedule.excStart + DURATIONS.exc - 1,
    pipeS: schedule.pipeStart,
    pipeE: schedule.pipeStart + DURATIONS.pipe - 1,
    backS: schedule.backStart,
    backE: schedule.backStart + DURATIONS.back - 1,
    end: Math.max(
      schedule.excStart + DURATIONS.exc - 1,
      schedule.pipeStart + DURATIONS.pipe - 1,
      schedule.backStart + DURATIONS.back - 1
    ),
  }), [schedule]);

  const handleReset = () => {
    setSchedule({ excStart: MOB_DAYS + 1, pipeStart: MOB_DAYS + 1, backStart: MOB_DAYS + 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-xl text-blue-900">📋 Round 1: Create Your Schedule</h3>
        <p className="text-gray-600 mt-1">
          Schedule three crews to complete the pipeline.<br/>
          Crews can start working after mobilization (Day 15).
        </p>
      </div>

      {/* Crew Sequence */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-center items-center gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-3xl">⛏️</span>
            <span className="font-medium text-sm">Excavation &<br/>Bedding</span>
            <span className="text-blue-600 font-bold">{DURATIONS.exc} days</span>
          </div>
          <span className="text-2xl text-gray-400">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl">🔧</span>
            <span className="font-medium text-sm">Pipe Laying &<br/>Alignment</span>
            <span className="text-green-600 font-bold">{DURATIONS.pipe} days</span>
          </div>
          <span className="text-2xl text-gray-400">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl">🚜</span>
            <span className="font-medium text-sm">Backfill &<br/>Compaction</span>
            <span className="text-orange-600 font-bold">{DURATIONS.back} days</span>
          </div>
        </div>
      </div>

      {/* Duration Calculation Table */}
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold text-gray-700 mb-3">📐 How we calculated the durations:</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Activity</th>
                <th className="px-4 py-2 text-center">Project Length</th>
                <th className="px-4 py-2 text-center">÷</th>
                <th className="px-4 py-2 text-center">Rate</th>
                <th className="px-4 py-2 text-center">=</th>
                <th className="px-4 py-2 text-center">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium">⛏️ Excavation & Bedding</td>
                <td className="px-4 py-3 text-center">{PROJECT_LENGTH.toLocaleString()} ft</td>
                <td className="px-4 py-3 text-center">÷</td>
                <td className="px-4 py-3 text-center">{CREWS.exc.rate} ft/day</td>
                <td className="px-4 py-3 text-center">=</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">{DURATIONS.exc} days</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 font-medium">🔧 Pipe Laying & Alignment</td>
                <td className="px-4 py-3 text-center">{PROJECT_LENGTH.toLocaleString()} ft</td>
                <td className="px-4 py-3 text-center">÷</td>
                <td className="px-4 py-3 text-center">{CREWS.pipe.rate} ft/day</td>
                <td className="px-4 py-3 text-center">=</td>
                <td className="px-4 py-3 text-center font-bold text-green-600">{DURATIONS.pipe} days</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">🚜 Backfill & Compaction</td>
                <td className="px-4 py-3 text-center">{PROJECT_LENGTH.toLocaleString()} ft</td>
                <td className="px-4 py-3 text-center">÷</td>
                <td className="px-4 py-3 text-center">{CREWS.back.rate} ft/day</td>
                <td className="px-4 py-3 text-center">=</td>
                <td className="px-4 py-3 text-center font-bold text-orange-600">{DURATIONS.back} days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-700">📊 Drag the bars to set start days</h4>
          <button onClick={handleReset} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 transition">
            🔄 Reset
          </button>
        </div>
        <DraggableBarChart schedule={schedule} onScheduleChange={setSchedule} />
      </div>

      {/* Project Duration */}
      <div className="bg-white rounded-lg shadow p-5 text-center">
        <span className="text-gray-600">Project Duration:</span>
        <span className="ml-3 text-3xl font-bold text-blue-600">{fullSchedule.end} days</span>
      </div>

      {/* Complete Button */}
      <button
        onClick={() => onComplete(fullSchedule)}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition"
      >
        Complete R1 →
      </button>
    </div>
  );
}

// ==================== MAIN GAME COMPONENT ====================
export default function LOBGame() {
  const [round, setRound] = useState(0);
  const [name, setName] = useState('');
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

  const r2Cost = useMemo(() => {
    const excC = dur.exc * CREWS.exc.cost, pipeC = dur.pipe * CREWS.pipe.cost, backC = dur.back * CREWS.back.cost;
    const direct = MOB_COST + excC + pipeC + backC, indirect = Math.round(direct * INDIRECT_RATE), profit = Math.round((direct + indirect) * PROFIT_RATE);
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
    const pipeS = pipe.rate < exc.rate ? excS + DEFAULT_BUFFER : excE + DEFAULT_BUFFER - pipeDur + 1, pipeE = pipeS + pipeDur - 1;
    const backS = back.rate < pipe.rate ? pipeS + DEFAULT_BUFFER : pipeE + DEFAULT_BUFFER - backDur + 1, backE = backS + backDur - 1;
    return { excS, excE, excDur, excRate: exc.rate, excCost: exc.cost, excName: exc.name, pipeS, pipeE, pipeDur, pipeRate: pipe.rate, pipeCost: pipe.cost, pipeName: pipe.name, backS, backE, backDur, backRate: back.rate, backCost: back.cost, backName: back.name, end: Math.max(excE, pipeE, backE) };
  }, [r4Eq]);

  const r4Cost = useMemo(() => {
    const excC = r4.excDur * r4.excCost, pipeC = r4.pipeDur * r4.pipeCost, backC = r4.backDur * r4.backCost;
    const direct = MOB_COST + excC + pipeC + backC, indirect = Math.round(direct * INDIRECT_RATE), profit = Math.round((direct + indirect) * PROFIT_RATE);
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
    const excDur = Math.ceil(PROJECT_LENGTH / r5Calc.exc.rate), pipeDur = Math.ceil(PROJECT_LENGTH / r5Calc.pipe.rate), backDur = Math.ceil(PROJECT_LENGTH / r5Calc.back.rate);
    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    const pipeS = r5Calc.pipe.rate < r5Calc.exc.rate ? excS + r5Buffer : excE + r5Buffer - pipeDur + 1, pipeE = pipeS + pipeDur - 1;
    const backS = r5Calc.back.rate < r5Calc.pipe.rate ? pipeS + r5Buffer : pipeE + r5Buffer - backDur + 1, backE = backS + backDur - 1;
    return { excS, excE, excDur, excRate: r5Calc.exc.rate, excCost: r5Calc.exc.cost, pipeS, pipeE, pipeDur, pipeRate: r5Calc.pipe.rate, pipeCost: r5Calc.pipe.cost, backS, backE, backDur, backRate: r5Calc.back.rate, backCost: r5Calc.back.cost, end: Math.max(excE, pipeE, backE) };
  }, [r5Calc, r5Buffer]);

  const r5Cost = useMemo(() => {
    const excC = r5.excDur * r5.excCost, pipeC = r5.pipeDur * r5.pipeCost, backC = r5.backDur * r5.backCost;
    const direct = MOB_COST + excC + pipeC + backC, indirect = Math.round(direct * INDIRECT_RATE), profit = Math.round((direct + indirect) * PROFIT_RATE);
    return { direct, indirect, profit, total: direct + indirect + profit, excC, pipeC, backC };
  }, [r5]);

  const genLOB = (schedules) => {
    const data = [], maxDay = Math.max(...schedules.map(s => s.end || 0), 100) + 10;
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

  // ==================== INTRO SCREEN ====================
  if (round === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center text-white mb-6"><h1 className="text-4xl font-bold">🎮 LOB SIMULATION GAME</h1><p className="text-blue-200">5-Round Educational Simulation</p></div>
        <div className="bg-white rounded-xl p-5">
          <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">📋 PROJECT OVERVIEW</h2>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4"><p className="text-sm leading-relaxed text-blue-900">This simulation places you in the role of a construction planner responsible for scheduling a major water pipeline project.</p></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Project</div><div className="font-bold">Water Pipeline</div></div>
            <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Length</div><div className="font-bold text-xl">{PROJECT_LENGTH.toLocaleString()} ft</div></div>
            <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Mobilization</div><div className="font-bold">{MOB_DAYS} days — ${MOB_COST.toLocaleString()}</div></div>
            <div className="bg-blue-50 p-3 rounded"><div className="text-gray-500">Target</div><div className="font-bold">≤{TARGET_DAYS}d, ≤${TARGET_COST / 1000}K</div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5">
          <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">👷 CREW DEFINITIONS</h2>
          <table className="w-full text-sm"><thead className="bg-blue-100"><tr><th className="px-3 py-3 text-left">Crew</th><th className="px-3 py-3 text-left">Activity</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">Cost</th></tr></thead>
            <tbody>
              <tr className="bg-blue-50 border-b"><td className="px-3 py-3 text-blue-700">Crew A</td><td className="px-3 py-3">{CREWS.exc.name}</td><td className="px-3 py-3 text-right">{CREWS.exc.rate} ft/d</td><td className="px-3 py-3 text-right">${CREWS.exc.cost}/d</td></tr>
              <tr className="bg-green-50 border-b"><td className="px-3 py-3 text-green-700">Crew B</td><td className="px-3 py-3">{CREWS.pipe.name}</td><td className="px-3 py-3 text-right">{CREWS.pipe.rate} ft/d</td><td className="px-3 py-3 text-right">${CREWS.pipe.cost}/d</td></tr>
              <tr className="bg-orange-50"><td className="px-3 py-3 text-orange-700">Crew C</td><td className="px-3 py-3">{CREWS.back.name}</td><td className="px-3 py-3 text-right">{CREWS.back.rate} ft/d</td><td className="px-3 py-3 text-right">${CREWS.back.cost}/d</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl p-5">
          <h2 className="text-xl font-bold text-blue-900 mb-4">🚀 Ready to Play?</h2>
          <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg" />
          <button onClick={() => name && setRound(1)} disabled={!name} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300">Start Game →</button>
        </div>
      </div>
    </div>
  );

  // ==================== FINAL SCREEN ====================
  if (round === 6) {
    const pass = results[5]?.pass;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl p-6">
          <div className="text-center mb-6"><div className="text-6xl">{pass ? '🏆' : '📊'}</div><h1 className="text-3xl font-bold text-blue-900">Game Complete!</h1><p className="text-gray-600">Great job, {name}!</p></div>
          <div className={`p-4 rounded-lg mb-6 ${pass ? 'bg-green-100 border-2 border-green-500' : 'bg-yellow-100 border-2 border-yellow-500'}`}>
            <h3 className="font-bold text-lg">{pass ? '✅ Constraints Met!' : '⚠️ Constraints Not Met'}</h3>
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
      {/* Header */}
      <div className="bg-blue-900 text-white py-2 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span><span className="text-blue-300">Player:</span> <strong>{name}</strong></span>
          <span className="font-bold">Round {round}: {titles[round]}</span>
          <div className="text-sm">🎯 ≤{TARGET_DAYS}d | 💰 ≤${TARGET_COST / 1000}K</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b"><div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">{[1, 2, 3, 4, 5].map(r => <div key={r} className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`} />)}</div></div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* R1: NEW DESIGN */}
        {round === 1 && (
          <Round1 onComplete={(schedule) => { setResults(p => ({ ...p, 1: schedule })); setRound(2); }} />
        )}

        {/* R2: Placeholder */}
        {round === 2 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-2xl font-bold mb-4">🚧 Round 2: Coming Soon</h3>
            <p className="text-gray-600 mb-4">R2 will be designed next.</p>
            <button onClick={() => setRound(3)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold">Skip to R3 →</button>
          </div>
        )}
 (Multiple Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc', 'pipe', 'back'].map(type => (<div key={type} className={`border rounded p-3 ${type === 'exc' ? 'bg-blue-50' : type === 'pipe' ? 'bg-green-50' : 'bg-orange-50'}`}><h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>{type === 'exc' ? 'Excavation & Bedding' : type === 'pipe' ? 'Pipe Laying & Alignment' : 'Backfill & Compaction'}</h4>{Object.keys(r5Config[type]).map(key => { const eq = EQUIPMENT[type][type === 'pipe' ? (key === 'standard' ? 0 : 1) : (key === 'small' ? 0 : key === 'standard' ? 1 : 2)]; return (<div key={key} className="flex items-center justify-between bg-white p-2 rounded mb-1"><div className="text-sm">{eq.name}<div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div></div><div className="flex items-center gap-1"><button onClick={() => setR5Config(p => ({ ...p, [type]: { ...p[type], [key]: Math.max(0, p[type][key] - 1) } }))} className="w-6 h-6 bg-gray-200 rounded font-bold">-</button><span className="w-6 text-center font-bold">{r5Config[type][key]}</span><button onClick={() => setR5Config(p => ({ ...p, [type]: { ...p[type], [key]: p[type][key] + 1 } }))} className="w-6 h-6 bg-blue-200 rounded font-bold">+</button></div></div>); })}</div>))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded flex items-center gap-4"><span className="font-bold">Buffer:</span><input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1" /><span className="text-2xl font-bold text-purple-600 w-12">{r5Buffer}</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R5 Schedule</h3>
            <table className="w-full text-sm border"><thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Activity</th><th className="px-2 py-1 border">Rate</th><th className="px-2 py-1 border">Duration</th><th className="px-2 py-1 border">Cost/day</th><th className="px-2 py-1 border">Start</th><th className="px-2 py-1 border">End</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation & Bedding</td><td className="px-2 py-1 border text-center">{r5.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.excDur}</td><td className="px-2 py-1 border text-center">${r5.excCost}</td><td className="px-2 py-1 border text-center">{r5.excS}</td><td className="px-2 py-1 border text-center">{r5.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying & Alignment</td><td className="px-2 py-1 border text-center">{r5.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.pipeDur}</td><td className="px-2 py-1 border text-center">${r5.pipeCost}</td><td className="px-2 py-1 border text-center">{r5.pipeS}</td><td className="px-2 py-1 border text-center">{r5.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill & Compaction</td><td className="px-2 py-1 border text-center">{r5.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.backDur}</td><td className="px-2 py-1 border text-center">${r5.backCost}</td><td className="px-2 py-1 border text-center">{r5.backS}</td><td className="px-2 py-1 border text-center">{r5.backE}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📈 R5 Line of Balance (LOB)</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r5])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Time (days)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={3} name="Excavation & Bedding" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={3} name="Pipe Laying & Alignment" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={3} name="Backfill & Compaction" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Constraints Check</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${r5.end <= TARGET_DAYS ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Duration</div><div className={`text-3xl font-bold ${r5.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{r5.end} days</div><div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end <= TARGET_DAYS ? '✅' : '❌'}</div></div>
              <div className={`p-4 rounded-lg text-center ${r5Cost.total <= TARGET_COST ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Total Cost</div><div className={`text-3xl font-bold ${r5Cost.total <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${(r5Cost.total / 1000).toFixed(0)}K</div><div className="text-sm">Target: ≤${TARGET_COST / 1000}K {r5Cost.total <= TARGET_COST ? '✅' : '❌'}</div></div>
            </div>
            {(r5.end > TARGET_DAYS || r5Cost.total > TARGET_COST) && <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 font-bold text-center">⚠️ Keep optimizing...</div>}
          </div>
          <div className="bg-white rounded-lg shadow p-4"><h3 className="font-bold mb-2">💰 R5 Budget</h3><BudgetTable cost={r5Cost} durExc={r5.excDur} durPipe={r5.pipeDur} durBack={r5.backDur} costExc={r5.excCost} costPipe={r5.pipeCost} costBack={r5.backCost} /></div>
          <button onClick={() => { setResults(p => ({ ...p, 5: { end: r5.end, cost: r5Cost.total, buffer: r5Buffer, pass: r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST } })); setRound(6); }} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold">Finish Game 🏆</button>
        </>)}
      </div>
    </div>
  );
}
