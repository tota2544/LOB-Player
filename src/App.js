import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Constants
const PROJECT_LENGTH = 15840;
const MOB_DAYS = 14;
const MOB_COST = 25000;
const DEFAULT_BUFFER = 5;
const INDIRECT_RATE = 0.30;
const PROFIT_RATE = 0.05;
const TARGET_DAYS = 55;
const TARGET_COST = 550000;

const CREWS = {
  exc: { rate: 220, cost: 1600, name: 'Excavation' },
  pipe: { rate: 180, cost: 2500, name: 'Pipe Laying' },
  back: { rate: 250, cost: 2300, name: 'Backfill' },
};

const EQUIPMENT = {
  exc: [
    { name: 'Small Excavator', rate: 165, cost: 900 },
    { name: 'Standard Excavator', rate: 220, cost: 1200 },
    { name: 'Large Excavator', rate: 330, cost: 1800 },
  ],
  pipe: [
    { name: 'Standard Crane', rate: 180, cost: 1800 },
    { name: 'Heavy Crane', rate: 270, cost: 2800 },
  ],
  back: [
    { name: 'Small Backfill Set', rate: 180, cost: 1400 },
    { name: 'Standard Backfill Set', rate: 250, cost: 1800 },
    { name: 'Large Backfill Set', rate: 375, cost: 2600 },
  ],
};

export default function LOBGame() {
  const [round, setRound] = useState(0);
  const [name, setName] = useState('');
  
  // R1: Student inputs for schedule
  const [r1Input, setR1Input] = useState({
    excDur: '', excS: '', excE: '',
    pipeDur: '', pipeS: '', pipeE: '',
    backDur: '', backS: '', backE: '',
  });
  const [r1Submitted, setR1Submitted] = useState(false);
  
  // R2: Student inputs for LOB schedule
  const [r2Input, setR2Input] = useState({
    excS: '', excE: '',
    pipeS: '', pipeE: '',
    backS: '', backE: '',
  });
  const [r2Submitted, setR2Submitted] = useState(false);
  
  // R2: Student inputs for budget
  const [r2Budget, setR2Budget] = useState({
    excCost: '', pipeCost: '', backCost: '', direct: '',
    indirect: '', profit: '', total: '',
  });
  const [r2BudgetSubmitted, setR2BudgetSubmitted] = useState(false);
  
  // R3 buffer and student inputs
  const [r3Buffer, setR3Buffer] = useState(5);
  const [r3Input, setR3Input] = useState({
    excDur: '', excS: '', excE: '',
    pipeDur: '', pipeS: '', pipeE: '',
    backDur: '', backS: '', backE: '',
  });
  const [r3Submitted, setR3Submitted] = useState(false);
  
  // R4: Single equipment type selection
  const [r4Eq, setR4Eq] = useState({ exc: 1, pipe: 0, back: 1 });
  
  // R5: Multiple equipment
  const [r5Config, setR5Config] = useState({
    exc: { small: 0, standard: 1, large: 0 },
    pipe: { standard: 1, heavy: 0 },
    back: { small: 0, standard: 1, large: 0 },
  });
  const [r5Buffer, setR5Buffer] = useState(5);
  
  const [results, setResults] = useState({});

  // Correct answers
  const dur = useMemo(() => ({
    exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
    pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
    back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
  }), []);

  // R1 correct schedule
  const r1Correct = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + 2, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeS + 2, backE = backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [dur]);

  // R1 student schedule (for chart)
  const r1Student = useMemo(() => {
    const excS = parseInt(r1Input.excS) || MOB_DAYS + 1;
    const excE = parseInt(r1Input.excE) || excS + dur.exc - 1;
    const pipeS = parseInt(r1Input.pipeS) || excS + 2;
    const pipeE = parseInt(r1Input.pipeE) || pipeS + dur.pipe - 1;
    const backS = parseInt(r1Input.backS) || pipeS + 2;
    const backE = parseInt(r1Input.backE) || backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [r1Input, dur]);

  // R2 correct schedule (LOB with buffer)
  const r2Correct = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + DEFAULT_BUFFER, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + DEFAULT_BUFFER - dur.back + 1, backE = backS + dur.back - 1;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [dur]);

  // R2 student schedule (for chart)
  const r2Student = useMemo(() => {
    const excS = parseInt(r2Input.excS) || r2Correct.excS;
    const excE = parseInt(r2Input.excE) || r2Correct.excE;
    const pipeS = parseInt(r2Input.pipeS) || r2Correct.pipeS;
    const pipeE = parseInt(r2Input.pipeE) || r2Correct.pipeE;
    const backS = parseInt(r2Input.backS) || r2Correct.backS;
    const backE = parseInt(r2Input.backE) || r2Correct.backE;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [r2Input, r2Correct]);

  // R2 correct budget
  const r2CostCorrect = useMemo(() => {
    const excC = dur.exc * CREWS.exc.cost;
    const pipeC = dur.pipe * CREWS.pipe.cost;
    const backC = dur.back * CREWS.back.cost;
    const direct = MOB_COST + excC + pipeC + backC;
    const indirect = Math.round(direct * INDIRECT_RATE);
    const subtotal = direct + indirect;
    const profit = Math.round(subtotal * PROFIT_RATE);
    return { direct, indirect, subtotal, profit, total: subtotal + profit, excC, pipeC, backC };
  }, [dur]);

  // R3 correct schedule
  const r3Correct = useMemo(() => {
    const excS = MOB_DAYS + 1, excE = excS + dur.exc - 1;
    const pipeS = excS + r3Buffer, pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + r3Buffer - dur.back + 1, backE = backS + dur.back - 1;
    return { 
      excS, excE, excDur: dur.exc,
      pipeS, pipeE, pipeDur: dur.pipe,
      backS, backE, backDur: dur.back,
      end: Math.max(excE, pipeE, backE) 
    };
  }, [dur, r3Buffer]);

  // R3 student schedule
  const r3Student = useMemo(() => {
    const excS = parseInt(r3Input.excS) || r3Correct.excS;
    const excE = parseInt(r3Input.excE) || r3Correct.excE;
    const pipeS = parseInt(r3Input.pipeS) || r3Correct.pipeS;
    const pipeE = parseInt(r3Input.pipeE) || r3Correct.pipeE;
    const backS = parseInt(r3Input.backS) || r3Correct.backS;
    const backE = parseInt(r3Input.backE) || r3Correct.backE;
    return { excS, excE, pipeS, pipeE, backS, backE, end: Math.max(excE, pipeE, backE) };
  }, [r3Input, r3Correct]);

  // R4 schedule
  const r4 = useMemo(() => {
    const exc = EQUIPMENT.exc[r4Eq.exc];
    const pipe = EQUIPMENT.pipe[r4Eq.pipe];
    const back = EQUIPMENT.back[r4Eq.back];
    
    const excDur = Math.ceil(PROJECT_LENGTH / exc.rate);
    const pipeDur = Math.ceil(PROJECT_LENGTH / pipe.rate);
    const backDur = Math.ceil(PROJECT_LENGTH / back.rate);
    
    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    let pipeS = pipe.rate < exc.rate ? excS + DEFAULT_BUFFER : excE + DEFAULT_BUFFER - pipeDur + 1;
    const pipeE = pipeS + pipeDur - 1;
    let backS = back.rate < pipe.rate ? pipeS + DEFAULT_BUFFER : pipeE + DEFAULT_BUFFER - backDur + 1;
    const backE = backS + backDur - 1;
    
    return {
      excS, excE, excDur, excRate: exc.rate, excCost: exc.cost, excName: exc.name,
      pipeS, pipeE, pipeDur, pipeRate: pipe.rate, pipeCost: pipe.cost, pipeName: pipe.name,
      backS, backE, backDur, backRate: back.rate, backCost: back.cost, backName: back.name,
      end: Math.max(excE, pipeE, backE),
    };
  }, [r4Eq]);

  // R5 calculations
  const r5Calc = useMemo(() => {
    const excRate = r5Config.exc.small * EQUIPMENT.exc[0].rate + 
                    r5Config.exc.standard * EQUIPMENT.exc[1].rate + 
                    r5Config.exc.large * EQUIPMENT.exc[2].rate || 1;
    const excCost = r5Config.exc.small * EQUIPMENT.exc[0].cost + 
                    r5Config.exc.standard * EQUIPMENT.exc[1].cost + 
                    r5Config.exc.large * EQUIPMENT.exc[2].cost;
    const excCount = r5Config.exc.small + r5Config.exc.standard + r5Config.exc.large;

    const pipeRate = r5Config.pipe.standard * EQUIPMENT.pipe[0].rate + 
                     r5Config.pipe.heavy * EQUIPMENT.pipe[1].rate || 1;
    const pipeCost = r5Config.pipe.standard * EQUIPMENT.pipe[0].cost + 
                     r5Config.pipe.heavy * EQUIPMENT.pipe[1].cost;
    const pipeCount = r5Config.pipe.standard + r5Config.pipe.heavy;

    const backRate = r5Config.back.small * EQUIPMENT.back[0].rate + 
                     r5Config.back.standard * EQUIPMENT.back[1].rate + 
                     r5Config.back.large * EQUIPMENT.back[2].rate || 1;
    const backCost = r5Config.back.small * EQUIPMENT.back[0].cost + 
                     r5Config.back.standard * EQUIPMENT.back[1].cost + 
                     r5Config.back.large * EQUIPMENT.back[2].cost;
    const backCount = r5Config.back.small + r5Config.back.standard + r5Config.back.large;

    return {
      exc: { rate: excRate, cost: excCost, count: excCount },
      pipe: { rate: pipeRate, cost: pipeCost, count: pipeCount },
      back: { rate: backRate, cost: backCost, count: backCount },
    };
  }, [r5Config]);

  const r5 = useMemo(() => {
    const excDur = Math.ceil(PROJECT_LENGTH / r5Calc.exc.rate);
    const pipeDur = Math.ceil(PROJECT_LENGTH / r5Calc.pipe.rate);
    const backDur = Math.ceil(PROJECT_LENGTH / r5Calc.back.rate);
    
    const excS = MOB_DAYS + 1, excE = excS + excDur - 1;
    let pipeS = r5Calc.pipe.rate < r5Calc.exc.rate ? excS + r5Buffer : excE + r5Buffer - pipeDur + 1;
    const pipeE = pipeS + pipeDur - 1;
    let backS = r5Calc.back.rate < r5Calc.pipe.rate ? pipeS + r5Buffer : pipeE + r5Buffer - backDur + 1;
    const backE = backS + backDur - 1;
    
    return {
      excS, excE, excDur, excRate: r5Calc.exc.rate, excCost: r5Calc.exc.cost,
      pipeS, pipeE, pipeDur, pipeRate: r5Calc.pipe.rate, pipeCost: r5Calc.pipe.cost,
      backS, backE, backDur, backRate: r5Calc.back.rate, backCost: r5Calc.back.cost,
      end: Math.max(excE, pipeE, backE),
    };
  }, [r5Calc, r5Buffer]);

  const calcCost = (sch, useCustomCost = false) => {
    const excC = sch.excDur * (useCustomCost ? sch.excCost : CREWS.exc.cost);
    const pipeC = sch.pipeDur * (useCustomCost ? sch.pipeCost : CREWS.pipe.cost);
    const backC = sch.backDur * (useCustomCost ? sch.backCost : CREWS.back.cost);
    const direct = MOB_COST + excC + pipeC + backC;
    const indirect = Math.round(direct * INDIRECT_RATE);
    const subtotal = direct + indirect;
    const profit = Math.round(subtotal * PROFIT_RATE);
    return { direct, indirect, subtotal, profit, total: subtotal + profit, excC, pipeC, backC };
  };

  const r4Cost = useMemo(() => calcCost(r4, true), [r4]);
  const r5Cost = useMemo(() => calcCost(r5, true), [r5]);

  // LOB data generator
  const genLOB = (schedules) => {
    const data = [];
    let maxDay = Math.max(...schedules.map(s => s.end || 0)) + 10;
    for (let d = 0; d <= maxDay; d += 2) {
      const pt = { day: d };
      schedules.forEach((s, i) => {
        ['exc', 'pipe', 'back'].forEach(type => {
          const start = s[`${type}S`], end = s[`${type}E`];
          if (start && end) {
            if (d >= start && d <= end) pt[`${type}${i}`] = ((d - start) / (end - start)) * PROJECT_LENGTH;
            else if (d > end) pt[`${type}${i}`] = PROJECT_LENGTH;
            else pt[`${type}${i}`] = 0;
          }
        });
      });
      data.push(pt);
    }
    return data;
  };

  // Check R1 answers
  const checkR1 = () => {
    setR1Submitted(true);
  };

  // Check R2 schedule answers
  const checkR2Schedule = () => {
    setR2Submitted(true);
  };

  // Check R2 budget answers
  const checkR2Budget = () => {
    setR2BudgetSubmitted(true);
  };

  // Check R3 answers
  const checkR3 = () => {
    setR3Submitted(true);
  };

  const nextRound = () => {
    const res = { round };
    if (round === 1) { res.end = r1Student.end; }
    if (round === 2) { res.end = r2Student.end; res.cost = r2CostCorrect.total; }
    if (round === 3) { res.end = r3Student.end; res.cost = r2CostCorrect.total; res.buffer = r3Buffer; }
    if (round === 4) { res.end = r4.end; res.cost = r4Cost.total; }
    if (round === 5) { 
      res.end = r5.end; 
      res.cost = r5Cost.total; 
      res.buffer = r5Buffer; 
      res.pass = r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST; 
    }
    setResults(p => ({ ...p, [round]: res }));
    setRound(round + 1);
    // Reset states for next round
    if (round === 1) { setR1Submitted(false); }
    if (round === 2) { setR2Submitted(false); setR2BudgetSubmitted(false); }
    if (round === 3) { setR3Submitted(false); }
  };

  // Input field component
  const InputCell = ({ value, onChange, correct, submitted, width = "w-16" }) => {
    const isCorrect = submitted && parseInt(value) === correct;
    const isWrong = submitted && value !== '' && parseInt(value) !== correct;
    return (
      <input
        type="number"
        value={value}
        onChange={onChange}
        className={`${width} px-1 py-1 border rounded text-center text-sm
          ${isCorrect ? 'bg-green-100 border-green-500' : ''}
          ${isWrong ? 'bg-red-100 border-red-500' : ''}
          ${!submitted ? 'bg-yellow-50 border-yellow-400' : ''}`}
        disabled={submitted}
      />
    );
  };

  // ========== INTRO SCREEN ==========
  if (round === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center text-white mb-6">
            <h1 className="text-4xl font-bold">🎮 LOB SIMULATION GAME</h1>
            <p className="text-blue-200">5-Round Educational Simulation</p>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">📋 PROJECT OVERVIEW</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Project</div>
                <div className="font-bold">College Station Water Pipeline</div>
                <div className="text-xs text-gray-400">24" PCCP Installation</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Total Length</div>
                <div className="font-bold text-xl">{PROJECT_LENGTH.toLocaleString()} ft</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Mobilization</div>
                <div className="font-bold text-xl">{MOB_DAYS} days</div>
                <div className="text-xs text-gray-400">${MOB_COST.toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-gray-500">Default Buffer</div>
                <div className="font-bold text-xl">{DEFAULT_BUFFER} days</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">👷 CREW DEFINITIONS</h2>
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-3 py-2 text-left">Crew</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2 text-right">Daily Cost</th>
                  <th className="px-3 py-2 text-right">Rate (ft/day)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50 border-b">
                  <td className="px-3 py-2 font-bold text-blue-700">Crew A</td>
                  <td className="px-3 py-2">Excavation & Bedding</td>
                  <td className="px-3 py-2 text-right">${CREWS.exc.cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold">{CREWS.exc.rate}</td>
                </tr>
                <tr className="bg-green-50 border-b">
                  <td className="px-3 py-2 font-bold text-green-700">Crew B</td>
                  <td className="px-3 py-2">Pipe Laying & Alignment</td>
                  <td className="px-3 py-2 text-right">${CREWS.pipe.cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold">{CREWS.pipe.rate}</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-3 py-2 font-bold text-orange-700">Crew C</td>
                  <td className="px-3 py-2">Backfill & Compaction</td>
                  <td className="px-3 py-2 text-right">${CREWS.back.cost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold">{CREWS.back.rate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl p-5">
            <h2 className="text-xl font-bold text-blue-900 border-b pb-2 mb-4">💰 COST STRUCTURE</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded text-center">
                <div className="text-gray-600">Indirect Cost Rate</div>
                <div className="text-3xl font-bold text-yellow-600">{INDIRECT_RATE * 100}%</div>
                <div className="text-xs text-gray-400">of Direct Cost</div>
              </div>
              <div className="bg-green-50 p-4 rounded text-center">
                <div className="text-gray-600">Profit Rate</div>
                <div className="text-3xl font-bold text-green-600">{PROFIT_RATE * 100}%</div>
                <div className="text-xs text-gray-400">of (Direct + Indirect)</div>
              </div>
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
              onKeyDown={(e) => e.key === 'Enter' && name && setRound(1)}
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

  // ========== SUMMARY SCREEN ==========
  if (round === 6) {
    const pass = results[5]?.pass;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-6xl">{pass ? '🏆' : '📊'}</div>
            <h1 className="text-3xl font-bold text-blue-900">Game Complete!</h1>
            <p className="text-gray-600">Great job, {name}!</p>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${pass ? 'bg-green-100 border-2 border-green-500' : 'bg-yellow-100 border-2 border-yellow-500'}`}>
            <h3 className="font-bold">{pass ? '✅ Owner Constraints Met!' : '⚠️ Constraints Not Met'}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-gray-600">Duration: </span>
                <span className={`font-bold ${results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>
                  {results[5]?.end} days
                </span>
                <span className="text-gray-400 text-sm"> (≤{TARGET_DAYS})</span>
              </div>
              <div>
                <span className="text-gray-600">Cost: </span>
                <span className={`font-bold ${results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>
                  ${results[5]?.cost?.toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm"> (≤${TARGET_COST.toLocaleString()})</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <h3 className="font-bold mb-2">🎓 Key Learnings</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>R1:</strong> Gantt charts can hide spatial conflicts</li>
              <li>• <strong>R2:</strong> LOB reveals when faster crews catch slower ones</li>
              <li>• <strong>R3:</strong> Buffer ↑ = Duration ↑ (Cost unchanged)</li>
              <li>• <strong>R4:</strong> Equipment type affects rate and cost</li>
              <li>• <strong>R5:</strong> Multiple equipment units multiply rate AND cost</li>
            </ul>
          </div>

          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
            🔄 Play Again
          </button>
        </div>
      </div>
    );
  }

  // ========== GAME ROUNDS ==========
  const titles = { 1: 'Gantt Chart', 2: 'LOB Analysis', 3: 'Buffer Analysis', 4: 'Rate Analysis', 5: 'Optimization' };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-900 text-white py-2 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span><span className="text-blue-300">Player:</span> <strong>{name}</strong></span>
          <span className="font-bold">Round {round}: {titles[round]}</span>
          <div className="text-sm">🎯 ≤{TARGET_DAYS}d | 💰 ≤${TARGET_COST/1000}K</div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">
          {[1,2,3,4,5].map(r => (
            <div key={r} className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        
        {/* ===== ROUND 1: Student Input Gantt Chart ===== */}
        {round === 1 && (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Create a schedule using <strong>Gantt Chart</strong></h3>
              <p className="text-sm text-gray-600">Calculate Duration, then determine Start and End dates</p>
              <p className="text-sm text-gray-600">Formula: Duration = {PROJECT_LENGTH.toLocaleString()} ft ÷ Rate (round up)</p>
              <p className="text-sm text-gray-600">Use 2-day buffer between activity starts</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">📝 Fill in the Schedule Table</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border">Phase</th>
                    <th className="px-2 py-2 border">Rate (ft/day)</th>
                    <th className="px-2 py-2 border">Duration (days)</th>
                    <th className="px-2 py-2 border">Start (day)</th>
                    <th className="px-2 py-2 border">End (day)</th>
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
                  <tr>
                    <td className="px-2 py-2 border text-blue-700 font-medium">Excavation (A)</td>
                    <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.excDur} 
                        onChange={(e) => setR1Input({...r1Input, excDur: e.target.value})}
                        correct={dur.exc}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.excS} 
                        onChange={(e) => setR1Input({...r1Input, excS: e.target.value})}
                        correct={r1Correct.excS}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.excE} 
                        onChange={(e) => setR1Input({...r1Input, excE: e.target.value})}
                        correct={r1Correct.excE}
                        submitted={r1Submitted}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border text-green-700 font-medium">Pipe Laying (B)</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.pipeDur} 
                        onChange={(e) => setR1Input({...r1Input, pipeDur: e.target.value})}
                        correct={dur.pipe}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.pipeS} 
                        onChange={(e) => setR1Input({...r1Input, pipeS: e.target.value})}
                        correct={r1Correct.pipeS}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.pipeE} 
                        onChange={(e) => setR1Input({...r1Input, pipeE: e.target.value})}
                        correct={r1Correct.pipeE}
                        submitted={r1Submitted}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border text-orange-700 font-medium">Backfill (C)</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.backDur} 
                        onChange={(e) => setR1Input({...r1Input, backDur: e.target.value})}
                        correct={dur.back}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.backS} 
                        onChange={(e) => setR1Input({...r1Input, backS: e.target.value})}
                        correct={r1Correct.backS}
                        submitted={r1Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r1Input.backE} 
                        onChange={(e) => setR1Input({...r1Input, backE: e.target.value})}
                        correct={r1Correct.backE}
                        submitted={r1Submitted}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {!r1Submitted && (
                <button onClick={checkR1} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold">
                  ✓ Check Answers
                </button>
              )}
              
              {r1Submitted && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="font-bold">Correct Answers:</p>
                  <p className="text-sm">Excavation: Duration={dur.exc}, Start={r1Correct.excS}, End={r1Correct.excE}</p>
                  <p className="text-sm">Pipe Laying: Duration={dur.pipe}, Start={r1Correct.pipeS}, End={r1Correct.pipeE}</p>
                  <p className="text-sm">Backfill: Duration={dur.back}, Start={r1Correct.backS}, End={r1Correct.backE}</p>
                  <p className="font-bold mt-2">Project End: {r1Correct.end} days</p>
                </div>
              )}
            </div>

            {/* Gantt Chart based on student input */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">📊 Gantt Chart (Based on Your Input)</h3>
              <div className="mb-2 text-xs text-gray-500 text-center">Duration (day)</div>
              <div className="relative">
                <div className="absolute -left-1 top-0 bottom-0 w-20 flex flex-col justify-around text-xs text-gray-500">
                  <span>Activity</span>
                </div>
                <div className="ml-16 space-y-2">
                  {[
                    { name: 'Mobilization', s: 1, e: MOB_DAYS, c: 'bg-gray-400' },
                    { name: 'Excavation', s: parseInt(r1Input.excS) || 0, e: parseInt(r1Input.excE) || 0, c: 'bg-blue-500' },
                    { name: 'Pipe Laying', s: parseInt(r1Input.pipeS) || 0, e: parseInt(r1Input.pipeE) || 0, c: 'bg-green-500' },
                    { name: 'Backfill', s: parseInt(r1Input.backS) || 0, e: parseInt(r1Input.backE) || 0, c: 'bg-orange-500' },
                  ].map((bar, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-20 text-xs text-right pr-2">{bar.name}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded relative">
                        {bar.s > 0 && bar.e > 0 && (
                          <div
                            className={`absolute h-full ${bar.c} rounded text-white text-xs flex items-center justify-center`}
                            style={{ left: `${(bar.s / 120) * 100}%`, width: `${Math.max(((bar.e - bar.s + 1) / 120) * 100, 2)}%` }}
                          >
                            {bar.s}-{bar.e}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-16 mt-1 text-center text-xs text-gray-500">Duration (day)</div>
            </div>

            <button 
              onClick={nextRound} 
              disabled={!r1Submitted}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
            >
              Complete R1 → LOB Analysis
            </button>
          </>
        )}

        {/* ===== ROUND 2: LOB Analysis with Student Input ===== */}
        {round === 2 && (
          <>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Identify conflicts and revise using <strong>{DEFAULT_BUFFER}-day buffer</strong> with LOB</h3>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 1: R1 LOB Chart (Conflict Visible)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={genLOB([r1Correct])} margin={{ bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'bottom', offset: 0 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-sm">
                ⚠️ <strong>Conflict!</strong> Backfill ({CREWS.back.rate} ft/day) is faster than Pipe Laying ({CREWS.pipe.rate} ft/day)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 2: Buffer Formulas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Simple Buffer</strong> (slower follows faster):<br/>
                  Start = Prev Start + Buffer
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <strong>Delayed Buffer</strong> (faster follows slower):<br/>
                  Start = Prev End + Buffer - Duration + 1
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 3: 📝 Fill in the Revised Schedule (Apply {DEFAULT_BUFFER}-day Buffer)</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border">Phase</th>
                    <th className="px-2 py-2 border">Rate</th>
                    <th className="px-2 py-2 border">Duration</th>
                    <th className="px-2 py-2 border">Start</th>
                    <th className="px-2 py-2 border">End</th>
                    <th className="px-2 py-2 border">Buffer Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-blue-700">
                    <td className="px-2 py-2 border font-medium">Excavation</td>
                    <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.exc}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.excS} 
                        onChange={(e) => setR2Input({...r2Input, excS: e.target.value})}
                        correct={r2Correct.excS}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.excE} 
                        onChange={(e) => setR2Input({...r2Input, excE: e.target.value})}
                        correct={r2Correct.excE}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">-</td>
                  </tr>
                  <tr className="text-green-700">
                    <td className="px-2 py-2 border font-medium">Pipe Laying</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.pipe}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.pipeS} 
                        onChange={(e) => setR2Input({...r2Input, pipeS: e.target.value})}
                        correct={r2Correct.pipeS}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.pipeE} 
                        onChange={(e) => setR2Input({...r2Input, pipeE: e.target.value})}
                        correct={r2Correct.pipeE}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center text-blue-600">Simple</td>
                  </tr>
                  <tr className="text-orange-700">
                    <td className="px-2 py-2 border font-medium">Backfill</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.back}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.backS} 
                        onChange={(e) => setR2Input({...r2Input, backS: e.target.value})}
                        correct={r2Correct.backS}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r2Input.backE} 
                        onChange={(e) => setR2Input({...r2Input, backE: e.target.value})}
                        correct={r2Correct.backE}
                        submitted={r2Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center text-orange-600">Delayed</td>
                  </tr>
                </tbody>
              </table>
              
              {!r2Submitted && (
                <button onClick={checkR2Schedule} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold">
                  ✓ Check Schedule
                </button>
              )}
              
              {r2Submitted && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="font-bold">✅ Correct! Project End: {r2Correct.end} days</p>
                </div>
              )}
            </div>

            {r2Submitted && (
              <>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-bold mb-2">STEP 4: R2 LOB Chart (No Conflict)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={genLOB([r2Correct])} margin={{ bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'bottom', offset: 0 }} />
                      <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                      <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                      <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-2 p-2 bg-green-100 rounded text-green-700 text-sm">✅ No Conflict!</div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-bold mb-2">STEP 5: 📝 Calculate the Budget</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-bold mb-2">Direct Costs</h4>
                      <table className="w-full border">
                        <tbody>
                          <tr>
                            <td className="px-2 py-1 border">Mobilization</td>
                            <td className="px-2 py-1 border text-right">${MOB_COST.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 border">Excavation ({dur.exc}d × ${CREWS.exc.cost})</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.excCost} 
                                onChange={(e) => setR2Budget({...r2Budget, excCost: e.target.value})}
                                correct={r2CostCorrect.excC}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 border">Pipe Laying ({dur.pipe}d × ${CREWS.pipe.cost})</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.pipeCost} 
                                onChange={(e) => setR2Budget({...r2Budget, pipeCost: e.target.value})}
                                correct={r2CostCorrect.pipeC}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 border">Backfill ({dur.back}d × ${CREWS.back.cost})</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.backCost} 
                                onChange={(e) => setR2Budget({...r2Budget, backCost: e.target.value})}
                                correct={r2CostCorrect.backC}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                          <tr className="bg-gray-100 font-bold">
                            <td className="px-2 py-1 border">Direct Total</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.direct} 
                                onChange={(e) => setR2Budget({...r2Budget, direct: e.target.value})}
                                correct={r2CostCorrect.direct}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h4 className="font-bold mb-2">Total Cost</h4>
                      <table className="w-full border">
                        <tbody>
                          <tr>
                            <td className="px-2 py-1 border">Direct Cost</td>
                            <td className="px-2 py-1 border text-center">(from left)</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 border">Indirect ({INDIRECT_RATE*100}% of Direct)</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.indirect} 
                                onChange={(e) => setR2Budget({...r2Budget, indirect: e.target.value})}
                                correct={r2CostCorrect.indirect}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1 border">Profit ({PROFIT_RATE*100}% of Direct+Indirect)</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.profit} 
                                onChange={(e) => setR2Budget({...r2Budget, profit: e.target.value})}
                                correct={r2CostCorrect.profit}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                          <tr className="bg-green-100 font-bold text-lg">
                            <td className="px-2 py-1 border">TOTAL</td>
                            <td className="px-2 py-1 border text-center">
                              <InputCell 
                                value={r2Budget.total} 
                                onChange={(e) => setR2Budget({...r2Budget, total: e.target.value})}
                                correct={r2CostCorrect.total}
                                submitted={r2BudgetSubmitted}
                                width="w-24"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {!r2BudgetSubmitted && (
                    <button onClick={checkR2Budget} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold">
                      ✓ Check Budget
                    </button>
                  )}
                  
                  {r2BudgetSubmitted && (
                    <div className="mt-4 p-3 bg-green-50 rounded">
                      <p className="font-bold">✅ Correct! Total Cost: ${r2CostCorrect.total.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <button 
              onClick={nextRound} 
              disabled={!r2Submitted || !r2BudgetSubmitted}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
            >
              Complete R2 → Buffer Analysis
            </button>
          </>
        )}

        {/* ===== ROUND 3: Buffer Analysis with Student Input ===== */}
        {round === 3 && (
          <>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Experiment with different <strong>buffer values</strong></h3>
              <p className="text-sm text-gray-600">Adjust the buffer and recalculate the schedule</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 1: Change Buffer</h3>
              <div className="flex items-center gap-4">
                <span>Buffer:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  value={r3Buffer} 
                  onChange={e => {
                    setR3Buffer(+e.target.value);
                    setR3Submitted(false);
                    setR3Input({ excDur: '', excS: '', excE: '', pipeDur: '', pipeS: '', pipeE: '', backDur: '', backS: '', backE: '' });
                  }} 
                  className="flex-1" 
                />
                <span className="text-2xl font-bold text-green-600 w-12">{r3Buffer}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 2: 📝 Calculate R3 Schedule (Buffer = {r3Buffer} days)</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border">Phase</th>
                    <th className="px-2 py-2 border">Rate</th>
                    <th className="px-2 py-2 border">Duration</th>
                    <th className="px-2 py-2 border">Start</th>
                    <th className="px-2 py-2 border">End</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-blue-700">
                    <td className="px-2 py-2 border font-medium">Excavation</td>
                    <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.excDur} 
                        onChange={(e) => setR3Input({...r3Input, excDur: e.target.value})}
                        correct={dur.exc}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.excS} 
                        onChange={(e) => setR3Input({...r3Input, excS: e.target.value})}
                        correct={r3Correct.excS}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.excE} 
                        onChange={(e) => setR3Input({...r3Input, excE: e.target.value})}
                        correct={r3Correct.excE}
                        submitted={r3Submitted}
                      />
                    </td>
                  </tr>
                  <tr className="text-green-700">
                    <td className="px-2 py-2 border font-medium">Pipe Laying</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.pipeDur} 
                        onChange={(e) => setR3Input({...r3Input, pipeDur: e.target.value})}
                        correct={dur.pipe}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.pipeS} 
                        onChange={(e) => setR3Input({...r3Input, pipeS: e.target.value})}
                        correct={r3Correct.pipeS}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.pipeE} 
                        onChange={(e) => setR3Input({...r3Input, pipeE: e.target.value})}
                        correct={r3Correct.pipeE}
                        submitted={r3Submitted}
                      />
                    </td>
                  </tr>
                  <tr className="text-orange-700">
                    <td className="px-2 py-2 border font-medium">Backfill</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.backDur} 
                        onChange={(e) => setR3Input({...r3Input, backDur: e.target.value})}
                        correct={dur.back}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.backS} 
                        onChange={(e) => setR3Input({...r3Input, backS: e.target.value})}
                        correct={r3Correct.backS}
                        submitted={r3Submitted}
                      />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell 
                        value={r3Input.backE} 
                        onChange={(e) => setR3Input({...r3Input, backE: e.target.value})}
                        correct={r3Correct.backE}
                        submitted={r3Submitted}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {!r3Submitted && (
                <button onClick={checkR3} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold">
                  ✓ Check Answers
                </button>
              )}
              
              {r3Submitted && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="font-bold">✅ Correct! Project End: {r3Correct.end} days</p>
                  <p className="text-sm mt-1">💡 Buffer ↑ = Duration ↑, but Cost stays the same!</p>
                </div>
              )}
            </div>

            {r3Submitted && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold mb-2">STEP 3: R2 vs R3 Comparison</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={genLOB([r2Correct, r3Correct])} margin={{ bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'bottom', offset: 0 }} />
                    <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} />
                    <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} />
                    <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} />
                    <Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={2} name="Exc R3" dot={false} />
                    <Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={2} name="Pipe R3" dot={false} />
                    <Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={2} name="Back R3" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <button 
              onClick={nextRound} 
              disabled={!r3Submitted}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
            >
              Complete R3 → Rate Analysis
            </button>
          </>
        )}

        {/* ===== ROUND 4 ===== */}
        {round === 4 && (
          <>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Select equipment <strong>TYPE</strong> (1 unit each)</h3>
              <p className="text-sm text-gray-600">See how equipment choice affects rate and cost</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">Select Equipment Type</h3>
              <div className="grid grid-cols-3 gap-4">
                {['exc', 'pipe', 'back'].map((type) => (
                  <div key={type} className="border rounded p-3">
                    <h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>
                      {type === 'exc' ? '🚜 Excavation' : type === 'pipe' ? '🏗️ Pipe Laying' : '🚧 Backfill'}
                    </h4>
                    {EQUIPMENT[type].map((eq, i) => (
                      <label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type] === i ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
                        <input type="radio" checked={r4Eq[type] === i} onChange={() => setR4Eq(p => ({...p, [type]: i}))} className="mr-2" />
                        <span className="font-medium">{eq.name}</span>
                        <div className="text-xs text-gray-600 ml-5">{eq.rate} ft/day | ${eq.cost}/day</div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">R4 Schedule</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 border">Phase</th>
                    <th className="px-2 py-1 border">Equipment</th>
                    <th className="px-2 py-1 border">Rate</th>
                    <th className="px-2 py-1 border">Duration</th>
                    <th className="px-2 py-1 border">$/day</th>
                    <th className="px-2 py-1 border">Start</th>
                    <th className="px-2 py-1 border">End</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-blue-700">
                    <td className="px-2 py-1 border">Excavation</td>
                    <td className="px-2 py-1 border text-center">{r4.excName}</td>
                    <td className="px-2 py-1 border text-center">{r4.excRate}</td>
                    <td className="px-2 py-1 border text-center font-bold">{r4.excDur}</td>
                    <td className="px-2 py-1 border text-center">${r4.excCost}</td>
                    <td className="px-2 py-1 border text-center">{r4.excS}</td>
                    <td className="px-2 py-1 border text-center">{r4.excE}</td>
                  </tr>
                  <tr className="text-green-700">
                    <td className="px-2 py-1 border">Pipe Laying</td>
                    <td className="px-2 py-1 border text-center">{r4.pipeName}</td>
                    <td className="px-2 py-1 border text-center">{r4.pipeRate}</td>
                    <td className="px-2 py-1 border text-center font-bold">{r4.pipeDur}</td>
                    <td className="px-2 py-1 border text-center">${r4.pipeCost}</td>
                    <td className="px-2 py-1 border text-center">{r4.pipeS}</td>
                    <td className="px-2 py-1 border text-center">{r4.pipeE}</td>
                  </tr>
                  <tr className="text-orange-700">
                    <td className="px-2 py-1 border">Backfill</td>
                    <td className="px-2 py-1 border text-center">{r4.backName}</td>
                    <td className="px-2 py-1 border text-center">{r4.backRate}</td>
                    <td className="px-2 py-1 border text-center font-bold">{r4.backDur}</td>
                    <td className="px-2 py-1 border text-center">${r4.backCost}</td>
                    <td className="px-2 py-1 border text-center">{r4.backS}</td>
                    <td className="px-2 py-1 border text-center">{r4.backE}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-gray-600">Duration</div>
                  <div className="text-2xl font-bold text-orange-600">{r4.end} days</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-gray-600">Total Cost</div>
                  <div className="text-2xl font-bold text-orange-600">${r4Cost.total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">R4 LOB Chart</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={genLOB([r4])} margin={{ bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'bottom', offset: 0 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
              Complete R4 → Optimization
            </button>
          </>
        )}

        {/* ===== ROUND 5 ===== */}
        {round === 5 && (
          <>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Optimize to meet constraints</h3>
              <p className="text-sm">Targets: <strong>≤{TARGET_DAYS} days</strong> and <strong>≤${TARGET_COST.toLocaleString()}</strong></p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">Configure Equipment (Multiple Units)</h3>
              <div className="grid grid-cols-3 gap-4">
                {['exc', 'pipe', 'back'].map((type) => (
                  <div key={type} className={`border rounded p-3 ${type === 'exc' ? 'bg-blue-50' : type === 'pipe' ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>
                      {type === 'exc' ? '🚜 Excavation' : type === 'pipe' ? '🏗️ Pipe Laying' : '🚧 Backfill'}
                    </h4>
                    {Object.keys(r5Config[type]).map((key) => {
                      const eqIndex = type === 'pipe' ? (key === 'standard' ? 0 : 1) : (key === 'small' ? 0 : key === 'standard' ? 1 : 2);
                      const eq = EQUIPMENT[type][eqIndex];
                      return (
                        <div key={key} className="flex items-center justify-between bg-white p-2 rounded mb-1">
                          <div>
                            <div className="text-sm font-medium">{eq.name}</div>
                            <div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: Math.max(0, p[type][key] - 1)}}))} className="w-6 h-6 bg-gray-200 rounded">-</button>
                            <span className="w-6 text-center font-bold">{r5Config[type][key]}</span>
                            <button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: p[type][key] + 1}}))} className="w-6 h-6 bg-blue-200 rounded">+</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className={`mt-2 p-2 rounded text-sm ${type === 'exc' ? 'bg-blue-100' : type === 'pipe' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <strong>Total:</strong> {r5Calc[type].count} units | {r5Calc[type].rate} ft/d | ${r5Calc[type].cost}/d
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-purple-50 rounded">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-purple-700">Buffer:</span>
                  <input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1" />
                  <span className="text-2xl font-bold text-purple-600 w-12">{r5Buffer}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Constraints Check</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg text-center ${r5.end <= TARGET_DAYS ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                  <div className="text-gray-600">Duration</div>
                  <div className={`text-3xl font-bold ${r5.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{r5.end} days</div>
                  <div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end <= TARGET_DAYS ? '✅' : '❌'}</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${r5Cost.total <= TARGET_COST ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}>
                  <div className="text-gray-600">Total Cost</div>
                  <div className={`text-3xl font-bold ${r5Cost.total <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${(r5Cost.total/1000).toFixed(0)}K</div>
                  <div className="text-sm">Target: ≤${TARGET_COST/1000}K {r5Cost.total <= TARGET_COST ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">R5 LOB Chart</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={genLOB([r5])} margin={{ bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'bottom', offset: 0 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`p-4 rounded-lg text-center text-xl font-bold ${r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST ? '✅ CONSTRAINTS MET!' : '⚠️ Keep optimizing...'}
            </div>

            <button onClick={nextRound} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold">
              Finish Game 🏆
            </button>
          </>
        )}
      </div>
    </div>
  );
}
