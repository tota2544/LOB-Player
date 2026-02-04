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
const CORRECT_DURATIONS = {
  exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
  pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
  back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
};

function DraggableBarChart({ schedule, durations, onScheduleChange }) {
  const chartRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  const CHART_WIDTH = 700;
  const CHART_PADDING_LEFT = 180;
  const MAX_DAY = 160;
  const USABLE_WIDTH = CHART_WIDTH - CHART_PADDING_LEFT - 20;
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
    let currentStart = barType === 'exc' ? schedule.excStart : barType === 'pipe' ? schedule.pipeStart : schedule.backStart;
    if (!currentStart || currentStart < 1) currentStart = 1;
    setDragOffset(mouseX - dayToPixel(currentStart));
    setDragging(barType);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const newDay = pixelToDay(e.clientX - rect.left - dragOffset);
    if (dragging === 'exc') onScheduleChange({ ...schedule, excStart: newDay });
    else if (dragging === 'pipe') onScheduleChange({ ...schedule, pipeStart: newDay });
    else if (dragging === 'back') onScheduleChange({ ...schedule, backStart: newDay });
  }, [dragging, dragOffset, schedule, onScheduleChange]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Only show bars if duration is valid
  const excDur = durations.exc > 0 ? durations.exc : 0;
  const pipeDur = durations.pipe > 0 ? durations.pipe : 0;
  const backDur = durations.back > 0 ? durations.back : 0;

  const bars = [
    { id: 'mob', label: 'Mobilization', start: 1, duration: MOB_DAYS, color: 'bg-gray-400', locked: true, show: true },
    { id: 'exc', label: 'Excavation & Bedding', start: schedule.excStart || 0, duration: excDur, color: 'bg-blue-500', locked: false, show: excDur > 0 && schedule.excStart > 0 },
    { id: 'pipe', label: 'Pipe Laying & Alignment', start: schedule.pipeStart || 0, duration: pipeDur, color: 'bg-green-500', locked: false, show: pipeDur > 0 && schedule.pipeStart > 0 },
    { id: 'back', label: 'Backfill & Compaction', start: schedule.backStart || 0, duration: backDur, color: 'bg-orange-500', locked: false, show: backDur > 0 && schedule.backStart > 0 },
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
      <div ref={chartRef} className="relative bg-gray-50 rounded-lg border overflow-hidden" style={{ width: CHART_WIDTH, height: CHART_HEIGHT, margin: '0 auto' }}>
        {/* Y-axis label */}
        <div className="absolute text-sm font-medium text-gray-600" style={{ left: 8, top: '50%', transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left center' }}>Activity</div>

        {/* Grid lines */}
        {xTicks.map(day => (
          <div key={`grid-${day}`} className="absolute w-px bg-gray-200" style={{ left: dayToPixel(day), top: 10, bottom: 40 }} />
        ))}

        {/* Activity labels */}
        {bars.map((bar, index) => (
          <div key={`label-${bar.id}`} className="absolute text-sm text-gray-700 text-right pr-3" style={{ left: 20, width: CHART_PADDING_LEFT - 30, top: index * (BAR_HEIGHT + BAR_GAP) + 20 + BAR_HEIGHT / 2 - 10 }}>{bar.label}</div>
        ))}

        {/* Bars */}
        {bars.map((bar, index) => (
          bar.show ? (
            <div
              key={bar.id}
              className={`absolute ${bar.color} rounded flex items-center justify-center text-white text-xs font-bold shadow ${bar.locked ? 'cursor-not-allowed opacity-80' : 'cursor-grab active:cursor-grabbing hover:shadow-lg'} ${dragging === bar.id ? 'ring-4 ring-yellow-400 shadow-xl z-10' : ''}`}
              style={{ left: dayToPixel(bar.start), width: Math.max(bar.duration * PIXELS_PER_DAY, 40), height: BAR_HEIGHT, top: index * (BAR_HEIGHT + BAR_GAP) + 20 }}
              onMouseDown={bar.locked ? undefined : (e) => handleMouseDown(bar.id, e)}>
              {bar.locked && <span className="mr-1">🔒</span>}{bar.start} - {bar.start + bar.duration - 1}
            </div>
          ) : (
            <div
              key={bar.id}
              className="absolute bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-300"
              style={{ left: CHART_PADDING_LEFT, width: 100, height: BAR_HEIGHT, top: index * (BAR_HEIGHT + BAR_GAP) + 20 }}>
              Enter schedule below
            </div>
          )
        ))}

        {/* X-axis ticks and labels */}
        <div className="absolute bottom-0 left-0 right-0 h-10">
          {xTicks.map(day => (
            <div key={`tick-${day}`} className="absolute text-xs text-gray-500" style={{ left: dayToPixel(day), transform: 'translateX(-50%)', bottom: 20 }}>{day}</div>
          ))}
          <div className="absolute text-sm font-medium text-gray-600" style={{ left: '50%', transform: 'translateX(-50%)', bottom: 2 }}>Time (days)</div>
        </div>
      </div>
    </div>
  );
}

function Round1({ onComplete }) {
  // Duration inputs (student calculates)
  const [durInput, setDurInput] = useState({ exc: '', pipe: '', back: '' });
  const [durValidated, setDurValidated] = useState(false);
  
  // Schedule inputs (student inputs start and end)
  const [scheduleInput, setScheduleInput] = useState({ 
    excS: '', excE: '', 
    pipeS: '', pipeE: '', 
    backS: '', backE: '' 
  });

  // Parse durations
  const durations = useMemo(() => ({
    exc: parseInt(durInput.exc) || 0,
    pipe: parseInt(durInput.pipe) || 0,
    back: parseInt(durInput.back) || 0,
  }), [durInput]);

  // Check if durations are correct
  const durCorrect = {
    exc: durations.exc === CORRECT_DURATIONS.exc,
    pipe: durations.pipe === CORRECT_DURATIONS.pipe,
    back: durations.back === CORRECT_DURATIONS.back,
  };
  const allDurationsCorrect = durCorrect.exc && durCorrect.pipe && durCorrect.back;

  // Parse schedule
  const fullSchedule = useMemo(() => {
    const excS = parseInt(scheduleInput.excS) || 0;
    const excE = parseInt(scheduleInput.excE) || 0;
    const pipeS = parseInt(scheduleInput.pipeS) || 0;
    const pipeE = parseInt(scheduleInput.pipeE) || 0;
    const backS = parseInt(scheduleInput.backS) || 0;
    const backE = parseInt(scheduleInput.backE) || 0;
    
    const projectEnd = Math.max(excE, pipeE, backE, MOB_DAYS);
    
    return { excS, excE, pipeS, pipeE, backS, backE, end: projectEnd };
  }, [scheduleInput]);

  // Handle bar drag - updates schedule inputs
  const handleBarDrag = useCallback((newSchedule) => {
    if (newSchedule.excStart > 0) {
      const newEnd = newSchedule.excStart + CORRECT_DURATIONS.exc - 1;
      setScheduleInput(prev => ({ ...prev, excS: String(newSchedule.excStart), excE: String(newEnd) }));
    }
    if (newSchedule.pipeStart > 0 && newSchedule.pipeStart !== (parseInt(scheduleInput.pipeS) || 0)) {
      const newEnd = newSchedule.pipeStart + CORRECT_DURATIONS.pipe - 1;
      setScheduleInput(prev => ({ ...prev, pipeS: String(newSchedule.pipeStart), pipeE: String(newEnd) }));
    }
    if (newSchedule.backStart > 0 && newSchedule.backStart !== (parseInt(scheduleInput.backS) || 0)) {
      const newEnd = newSchedule.backStart + CORRECT_DURATIONS.back - 1;
      setScheduleInput(prev => ({ ...prev, backS: String(newSchedule.backStart), backE: String(newEnd) }));
    }
  }, [scheduleInput]);

  // Check if all schedule inputs are filled
  const allScheduleFilled = fullSchedule.excS > 0 && fullSchedule.excE > 0 && 
                            fullSchedule.pipeS > 0 && fullSchedule.pipeE > 0 && 
                            fullSchedule.backS > 0 && fullSchedule.backE > 0;

  // InputCell component for consistent styling (like R2)
  const InputCell = ({ value, onChange, disabled }) => {
    return (
      <input
        type="number"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-16 px-1 py-1 border-2 rounded text-center text-sm font-bold
          ${disabled ? 'bg-gray-100 border-gray-300 text-gray-400' : 'bg-yellow-50 border-yellow-400'}`}
        placeholder="?"
      />
    );
  };

  // DurationInputCell with validation styling
  const DurationInputCell = ({ value, onChange, isCorrect, submitted }) => {
    let className = "w-20 px-2 py-1 border-2 rounded text-center font-bold ";
    if (!submitted) {
      className += "bg-yellow-50 border-yellow-400";
    } else if (isCorrect) {
      className += "bg-green-100 border-green-500 text-green-700";
    } else {
      className += "bg-red-100 border-red-500 text-red-700";
    }
    
    return (
      <input
        type="number"
        value={value}
        onChange={onChange}
        disabled={submitted && isCorrect}
        className={className}
        placeholder="?"
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-bold text-xl text-blue-900">📋 Round 1: Create Your Schedule</h3>
        <p className="text-gray-600 mt-1">
          In this round, you will create a bar chart schedule for the pipeline project. 
          First calculate each activity's duration, then input start and end days to build your schedule.
        </p>
      </div>

      {/* Section 1: Activity Sequence & Duration Calculation */}
      <div className="bg-white rounded-lg shadow p-5">
        <h4 className="font-bold text-gray-700 mb-4">📐 Activity Sequence & Duration Calculation</h4>
        
        {/* Sequence Visual */}
        <div className="flex justify-center items-center gap-4 text-center mb-6">
          <div className="flex flex-col items-center">
            <span className="text-3xl">⛏️</span>
            <span className="font-medium text-sm">Excavation &<br/>Bedding</span>
          </div>
          <span className="text-2xl text-gray-400">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl">🔧</span>
            <span className="font-medium text-sm">Pipe Laying &<br/>Alignment</span>
          </div>
          <span className="text-2xl text-gray-400">→</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl">🚜</span>
            <span className="font-medium text-sm">Backfill &<br/>Compaction</span>
          </div>
        </div>

        {/* Formula Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="font-bold text-yellow-800 mb-2">Formula: Duration = ROUNDUP(Project Length ÷ Rate)</div>
        </div>

        {/* Example Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="text-sm text-blue-800">
            <strong>Example:</strong> Excavation has rate {CREWS.exc.rate} ft/day<br/>
            Duration = {PROJECT_LENGTH.toLocaleString()} ft ÷ {CREWS.exc.rate} ft/day = <strong>{CORRECT_DURATIONS.exc} days</strong>
          </div>
        </div>

        {/* Duration Calculation Table */}
        <p className="text-sm text-gray-600 mb-3">Calculate the duration for each activity (Project Length = {PROJECT_LENGTH.toLocaleString()} ft):</p>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 border text-left">Activity</th>
              <th className="px-2 py-2 border text-center">Rate (ft/day)</th>
              <th className="px-2 py-2 border text-center bg-yellow-50">Duration (days)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-blue-700">
              <td className="px-2 py-2 border">Excavation & Bedding</td>
              <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
              <td className="px-2 py-2 border text-center">
                <DurationInputCell 
                  value={durInput.exc} 
                  onChange={(e) => setDurInput({ ...durInput, exc: e.target.value })}
                  isCorrect={durCorrect.exc}
                  submitted={durValidated}
                />
              </td>
            </tr>
            <tr className="text-green-700">
              <td className="px-2 py-2 border">Pipe Laying & Alignment</td>
              <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
              <td className="px-2 py-2 border text-center">
                <DurationInputCell 
                  value={durInput.pipe} 
                  onChange={(e) => setDurInput({ ...durInput, pipe: e.target.value })}
                  isCorrect={durCorrect.pipe}
                  submitted={durValidated}
                />
              </td>
            </tr>
            <tr className="text-orange-700">
              <td className="px-2 py-2 border">Backfill & Compaction</td>
              <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
              <td className="px-2 py-2 border text-center">
                <DurationInputCell 
                  value={durInput.back} 
                  onChange={(e) => setDurInput({ ...durInput, back: e.target.value })}
                  isCorrect={durCorrect.back}
                  submitted={durValidated}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Check Answer Button */}
        <div className="mt-4">
          <button 
            onClick={() => setDurValidated(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
          >
            Check Answers
          </button>
          
          {durValidated && !allDurationsCorrect && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
              ❌ Some durations are incorrect. Please fix them and check again.
            </div>
          )}
          {durValidated && allDurationsCorrect && (
            <div className="mt-2 p-2 bg-green-100 text-green-700 rounded">
              ✅ All durations are correct! Now build your schedule below.
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Schedule Table - Only show after durations are correct */}
      {durValidated && allDurationsCorrect && (
        <div className="bg-white rounded-lg shadow p-5">
          <h4 className="font-bold text-gray-700 mb-4">📝 Build Your Schedule</h4>
          
          {/* Formula Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="font-bold text-yellow-800 mb-2">Formula: End = Start + Duration - 1</div>
          </div>

          {/* Example Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-blue-800">
              <strong>Example:</strong> Excavation starts Day 15, duration {CORRECT_DURATIONS.exc} days<br/>
              End = 15 + {CORRECT_DURATIONS.exc} - 1 = <strong>Day {15 + CORRECT_DURATIONS.exc - 1}</strong>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">Input the Start and End day for each activity:</p>
          
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 border text-left">Activity</th>
                <th className="px-2 py-2 border text-center">Rate (ft/day)</th>
                <th className="px-2 py-2 border text-center">Duration (days)</th>
                <th className="px-2 py-2 border text-center bg-yellow-50">Start</th>
                <th className="px-2 py-2 border text-center bg-yellow-50">End</th>
              </tr>
            </thead>
            <tbody>
              {/* Mobilization - Fixed */}
              <tr className="bg-gray-50">
                <td className="px-2 py-2 border">Mobilization</td>
                <td className="px-2 py-2 border text-center">-</td>
                <td className="px-2 py-2 border text-center">{MOB_DAYS}</td>
                <td className="px-2 py-2 border text-center">1</td>
                <td className="px-2 py-2 border text-center">{MOB_DAYS}</td>
              </tr>
              
              {/* Excavation */}
              <tr className="text-blue-700">
                <td className="px-2 py-2 border">Excavation & Bedding</td>
                <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                <td className="px-2 py-2 border text-center">{CORRECT_DURATIONS.exc}</td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.excS} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, excS: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.excE} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, excE: e.target.value })}
                  />
                </td>
              </tr>
              
              {/* Pipe Laying */}
              <tr className="text-green-700">
                <td className="px-2 py-2 border">Pipe Laying & Alignment</td>
                <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                <td className="px-2 py-2 border text-center">{CORRECT_DURATIONS.pipe}</td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.pipeS} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, pipeS: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.pipeE} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, pipeE: e.target.value })}
                  />
                </td>
              </tr>
              
              {/* Backfill */}
              <tr className="text-orange-700">
                <td className="px-2 py-2 border">Backfill & Compaction</td>
                <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                <td className="px-2 py-2 border text-center">{CORRECT_DURATIONS.back}</td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.backS} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, backS: e.target.value })}
                  />
                </td>
                <td className="px-2 py-2 border text-center">
                  <InputCell 
                    value={scheduleInput.backE} 
                    onChange={(e) => setScheduleInput({ ...scheduleInput, backE: e.target.value })}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Project Duration */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
            <span className="text-gray-600">Project Duration:</span>
            <span className="ml-3 text-2xl font-bold text-blue-600">
              {allScheduleFilled ? `${fullSchedule.end} days` : '- days'}
            </span>
          </div>
        </div>
      )}

      {/* Section 3: Bar Chart - Only show after durations are correct */}
      {durValidated && allDurationsCorrect && (
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-gray-700">📊 Bar Chart Schedule</h4>
              <p className="text-sm text-gray-500">Generated from your schedule above. You can also drag the bars to adjust.</p>
            </div>
            <button 
              onClick={() => {
                setScheduleInput({ excS: '', excE: '', pipeS: '', pipeE: '', backS: '', backE: '' });
              }} 
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              🔄 Reset Schedule
            </button>
          </div>
          
          <DraggableBarChart 
            schedule={{
              excStart: fullSchedule.excS,
              pipeStart: fullSchedule.pipeS,
              backStart: fullSchedule.backS,
            }}
            durations={{
              exc: CORRECT_DURATIONS.exc,
              pipe: CORRECT_DURATIONS.pipe,
              back: CORRECT_DURATIONS.back,
            }}
            onScheduleChange={handleBarDrag}
          />
        </div>
      )}

      {/* Complete Button */}
      <button 
        onClick={() => onComplete(fullSchedule)} 
        disabled={!allScheduleFilled || !allDurationsCorrect}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {!durValidated || !allDurationsCorrect 
          ? 'Complete Duration Calculation First' 
          : !allScheduleFilled 
            ? 'Fill in Schedule to Continue' 
            : 'Complete R1 →'}
      </button>
    </div>
  );
}
// -------------------- END R1 DRAG SCHEDULER --------------------

export default function LOBGame() {
  const [round, setRound] = useState(0);
  const [name, setName] = useState('');

  // R1 state - simplified for new design
  const [r1Schedule, setR1Schedule] = useState(null);

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

  // R1 student schedule from new design
  const r1Student = useMemo(() => {
    if (!r1Schedule) return { excS: 0, excE: 0, pipeS: 0, pipeE: 0, backS: 0, backE: 0, end: 0 };
    return r1Schedule;
  }, [r1Schedule]);

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
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm leading-relaxed text-blue-900">
                  This project uses three sequential pipeline crews—Excavation, Pipe Laying, and Backfill—each with its
                  own productivity and equipment. Understanding their roles helps you plan start times, avoid overlap,
                  and create a conflict-free Line of Balance (LOB) schedule.
                </p>
              </div>
              
              <div className="space-y-3">
                <details className="group rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <summary className="flex cursor-pointer items-center justify-between list-none">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">⛏️</div>
                      <div>
                        <div className="font-bold text-blue-900">Crew A — Excavation & Bedding</div>
                        <div className="text-xs text-blue-800/70">Uses Excavator</div>
                      </div>
                    </div>
                    <span className="text-blue-900/70 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-blue-900">
                    Crew A uses an <strong>Excavator</strong> to dig the trench and prepare the bedding.
                    As the first crew in sequence, it sets the pace for all other crews and must stay ahead
                    to avoid delaying pipeline installation.
                  </p>
                </details>
                
                <details className="group rounded-lg border border-green-200 bg-green-50 p-4">
                  <summary className="flex cursor-pointer items-center justify-between list-none">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">🔧</div>
                      <div>
                        <div className="font-bold text-green-900">Crew B — Pipe Laying & Alignment</div>
                        <div className="text-xs text-green-800/70">Uses Mobile Crane</div>
                      </div>
                    </div>
                    <span className="text-green-900/70 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-green-900">
                    Crew B uses a <strong>Mobile Crane</strong> to lift and align pipe sections in the trench prepared by Crew A.
                    They progress more slowly, so maintaining proper spacing helps prevent bottlenecks in the workflow.
                  </p>
                </details>
                
                <details className="group rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <summary className="flex cursor-pointer items-center justify-between list-none">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700">🚜</div>
                      <div>
                        <div className="font-bold text-orange-900">Crew C — Backfill & Compaction</div>
                        <div className="text-xs text-orange-800/70">Uses Backfill Set</div>
                      </div>
                    </div>
                    <span className="text-orange-900/70 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-orange-900">
                    Crew C uses a <strong>Backfill Set</strong> (Excavator + Compactor) to place and compact soil over installed pipes.
                    They often work faster than pipe laying, so proper spacing prevents them from catching up and causing conflicts.
                  </p>
                </details>
              </div>
              
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
        {/* R1: NEW SIMPLIFIED DESIGN */}
        {round === 1 && (
          <Round1 onComplete={(fullSchedule) => {
            setR1Schedule(fullSchedule);
            setResults(p => ({ ...p, 1: { round: 1, ...fullSchedule } }));
            setRound(2);
          }} />
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
