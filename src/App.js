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
  
  // R1: Student inputs (free input - no fixed answer)
  const [r1Input, setR1Input] = useState({
    excDur: '', excS: '', excE: '',
    pipeDur: '', pipeS: '', pipeE: '',
    backDur: '', backS: '', backE: '',
  });
  
  // R2: Student inputs for revised schedule with buffer
  const [r2Input, setR2Input] = useState({
    excS: '', excE: '',
    pipeS: '', pipeE: '',
    backS: '', backE: '',
  });
  
  // R2 Budget inputs
  const [r2Budget, setR2Budget] = useState({
    excCost: '', pipeCost: '', backCost: '', direct: '',
    indirect: '', profit: '', total: '',
  });
  
  // R3 buffer
  const [r3Buffer, setR3Buffer] = useState(5);
  
  // R4: Equipment selection
  const [r4Eq, setR4Eq] = useState({ exc: 1, pipe: 0, back: 1 });
  
  // R5: Multiple equipment
  const [r5Config, setR5Config] = useState({
    exc: { small: 0, standard: 1, large: 0 },
    pipe: { standard: 1, heavy: 0 },
    back: { small: 0, standard: 1, large: 0 },
  });
  const [r5Buffer, setR5Buffer] = useState(5);
  
  // Results storage for summary
  const [results, setResults] = useState({});

  // Correct durations (calculated)
  const dur = useMemo(() => ({
    exc: Math.ceil(PROJECT_LENGTH / CREWS.exc.rate),
    pipe: Math.ceil(PROJECT_LENGTH / CREWS.pipe.rate),
    back: Math.ceil(PROJECT_LENGTH / CREWS.back.rate),
  }), []);

  // R1 Student schedule (from their inputs)
  const r1Student = useMemo(() => {
    const excS = parseInt(r1Input.excS) || 0;
    const excE = parseInt(r1Input.excE) || 0;
    const pipeS = parseInt(r1Input.pipeS) || 0;
    const pipeE = parseInt(r1Input.pipeE) || 0;
    const backS = parseInt(r1Input.backS) || 0;
    const backE = parseInt(r1Input.backE) || 0;
    return { 
      excS, excE, 
      pipeS, pipeE, 
      backS, backE, 
      end: Math.max(excE, pipeE, backE) 
    };
  }, [r1Input]);

  // R2 Student schedule (from their revised inputs)
  const r2Student = useMemo(() => {
    const excS = parseInt(r2Input.excS) || 0;
    const excE = parseInt(r2Input.excE) || 0;
    const pipeS = parseInt(r2Input.pipeS) || 0;
    const pipeE = parseInt(r2Input.pipeE) || 0;
    const backS = parseInt(r2Input.backS) || 0;
    const backE = parseInt(r2Input.backE) || 0;
    return { 
      excS, excE, 
      pipeS, pipeE, 
      backS, backE, 
      end: Math.max(excE, pipeE, backE) 
    };
  }, [r2Input]);

  // R2 correct budget (based on durations)
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

  // R3 schedule (based on R2 inputs + variable buffer)
  const r3 = useMemo(() => {
    // Use R2 excavation start as base, recalculate with new buffer
    const excS = parseInt(r2Input.excS) || (MOB_DAYS + 1);
    const excE = excS + dur.exc - 1;
    const pipeS = excS + r3Buffer;
    const pipeE = pipeS + dur.pipe - 1;
    const backS = pipeE + r3Buffer - dur.back + 1;
    const backE = backS + dur.back - 1;
    return { 
      excS, excE, excDur: dur.exc,
      pipeS, pipeE, pipeDur: dur.pipe,
      backS, backE, backDur: dur.back,
      end: Math.max(excE, pipeE, backE) 
    };
  }, [dur, r3Buffer, r2Input]);

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
    const excRate = r5Config.exc.small * EQUIPMENT.exc[0].rate + r5Config.exc.standard * EQUIPMENT.exc[1].rate + r5Config.exc.large * EQUIPMENT.exc[2].rate || 1;
    const excCost = r5Config.exc.small * EQUIPMENT.exc[0].cost + r5Config.exc.standard * EQUIPMENT.exc[1].cost + r5Config.exc.large * EQUIPMENT.exc[2].cost;
    const excCount = r5Config.exc.small + r5Config.exc.standard + r5Config.exc.large;
    const pipeRate = r5Config.pipe.standard * EQUIPMENT.pipe[0].rate + r5Config.pipe.heavy * EQUIPMENT.pipe[1].rate || 1;
    const pipeCost = r5Config.pipe.standard * EQUIPMENT.pipe[0].cost + r5Config.pipe.heavy * EQUIPMENT.pipe[1].cost;
    const pipeCount = r5Config.pipe.standard + r5Config.pipe.heavy;
    const backRate = r5Config.back.small * EQUIPMENT.back[0].rate + r5Config.back.standard * EQUIPMENT.back[1].rate + r5Config.back.large * EQUIPMENT.back[2].rate || 1;
    const backCost = r5Config.back.small * EQUIPMENT.back[0].cost + r5Config.back.standard * EQUIPMENT.back[1].cost + r5Config.back.large * EQUIPMENT.back[2].cost;
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
    let maxDay = Math.max(...schedules.map(s => s.end || 0), 100) + 10;
    for (let d = 0; d <= maxDay; d += 2) {
      const pt = { day: d };
      schedules.forEach((s, i) => {
        ['exc', 'pipe', 'back'].forEach(type => {
          const start = s[`${type}S`], end = s[`${type}E`];
          if (start && end && start > 0 && end > 0) {
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

  const nextRound = () => {
    const res = { round };
    if (round === 1) { 
      res.excS = r1Student.excS; res.excE = r1Student.excE;
      res.pipeS = r1Student.pipeS; res.pipeE = r1Student.pipeE;
      res.backS = r1Student.backS; res.backE = r1Student.backE;
      res.end = r1Student.end; 
    }
    if (round === 2) { 
      res.excS = r2Student.excS; res.excE = r2Student.excE;
      res.pipeS = r2Student.pipeS; res.pipeE = r2Student.pipeE;
      res.backS = r2Student.backS; res.backE = r2Student.backE;
      res.end = r2Student.end; 
      res.cost = r2CostCorrect.total; 
    }
    if (round === 3) { 
      res.buffer = r3Buffer;
      res.excS = r3.excS; res.excE = r3.excE;
      res.pipeS = r3.pipeS; res.pipeE = r3.pipeE;
      res.backS = r3.backS; res.backE = r3.backE;
      res.end = r3.end; 
      res.cost = r2CostCorrect.total; 
    }
    if (round === 4) { 
      res.end = r4.end; 
      res.cost = r4Cost.total; 
    }
    if (round === 5) { 
      res.end = r5.end; 
      res.cost = r5Cost.total; 
      res.buffer = r5Buffer; 
      res.pass = r5.end <= TARGET_DAYS && r5Cost.total <= TARGET_COST; 
    }
    setResults(p => ({ ...p, [round]: res }));
    setRound(round + 1);
  };

  // Input field component
  const InputCell = ({ value, onChange, width = "w-16" }) => (
    <input
      type="number"
      value={value}
      onChange={onChange}
      className={`${width} px-1 py-1 border rounded text-center text-sm bg-yellow-50 border-yellow-400 focus:border-blue-500 focus:outline-none`}
    />
  );

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
        <div className="max-w-4xl mx-auto bg-white rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-6xl">{pass ? '🏆' : '📊'}</div>
            <h1 className="text-3xl font-bold text-blue-900">Game Complete!</h1>
            <p className="text-gray-600">Great job, {name}!</p>
          </div>

          <div className={`p-4 rounded-lg mb-6 ${pass ? 'bg-green-100 border-2 border-green-500' : 'bg-yellow-100 border-2 border-yellow-500'}`}>
            <h3 className="font-bold text-lg">{pass ? '✅ Owner Constraints Met!' : '⚠️ Constraints Not Met'}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-gray-600">Final Duration: </span>
                <span className={`font-bold ${results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>
                  {results[5]?.end} days
                </span>
                <span className="text-gray-400 text-sm"> (Target: ≤{TARGET_DAYS})</span>
              </div>
              <div>
                <span className="text-gray-600">Final Cost: </span>
                <span className={`font-bold ${results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>
                  ${results[5]?.cost?.toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm"> (Target: ≤${TARGET_COST.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Round 1 Summary */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">📊 Round 1: Gantt Chart</h3>
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-2 py-1 text-left">Activity</th>
                  <th className="px-2 py-1 text-center">Start</th>
                  <th className="px-2 py-1 text-center">End</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-2 py-1">Excavation</td><td className="px-2 py-1 text-center">{results[1]?.excS || '-'}</td><td className="px-2 py-1 text-center">{results[1]?.excE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Pipe Laying</td><td className="px-2 py-1 text-center">{results[1]?.pipeS || '-'}</td><td className="px-2 py-1 text-center">{results[1]?.pipeE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Backfill</td><td className="px-2 py-1 text-center">{results[1]?.backS || '-'}</td><td className="px-2 py-1 text-center">{results[1]?.backE || '-'}</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm">Project End: <strong>{results[1]?.end || '-'} days</strong></p>
          </div>

          {/* Round 2 Summary */}
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">📈 Round 2: LOB Analysis (Buffer = {DEFAULT_BUFFER} days)</h3>
            <table className="w-full text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="px-2 py-1 text-left">Activity</th>
                  <th className="px-2 py-1 text-center">Start</th>
                  <th className="px-2 py-1 text-center">End</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-2 py-1">Excavation</td><td className="px-2 py-1 text-center">{results[2]?.excS || '-'}</td><td className="px-2 py-1 text-center">{results[2]?.excE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Pipe Laying</td><td className="px-2 py-1 text-center">{results[2]?.pipeS || '-'}</td><td className="px-2 py-1 text-center">{results[2]?.pipeE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Backfill</td><td className="px-2 py-1 text-center">{results[2]?.backS || '-'}</td><td className="px-2 py-1 text-center">{results[2]?.backE || '-'}</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm">Project End: <strong>{results[2]?.end || '-'} days</strong> | Cost: <strong>${results[2]?.cost?.toLocaleString() || '-'}</strong></p>
          </div>

          {/* Round 3 Summary */}
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">🔄 Round 3: Buffer Analysis (Buffer = {results[3]?.buffer || DEFAULT_BUFFER} days)</h3>
            <table className="w-full text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-2 py-1 text-left">Activity</th>
                  <th className="px-2 py-1 text-center">Start</th>
                  <th className="px-2 py-1 text-center">End</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-2 py-1">Excavation</td><td className="px-2 py-1 text-center">{results[3]?.excS || '-'}</td><td className="px-2 py-1 text-center">{results[3]?.excE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Pipe Laying</td><td className="px-2 py-1 text-center">{results[3]?.pipeS || '-'}</td><td className="px-2 py-1 text-center">{results[3]?.pipeE || '-'}</td></tr>
                <tr><td className="px-2 py-1">Backfill</td><td className="px-2 py-1 text-center">{results[3]?.backS || '-'}</td><td className="px-2 py-1 text-center">{results[3]?.backE || '-'}</td></tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm">Project End: <strong>{results[3]?.end || '-'} days</strong></p>
          </div>

          {/* Round 4 Summary */}
          <div className="mb-4 p-4 bg-orange-50 rounded-lg">
            <h3 className="font-bold text-orange-800 mb-2">🚜 Round 4: Rate Analysis</h3>
            <p className="text-sm">Project End: <strong>{results[4]?.end || '-'} days</strong> | Cost: <strong>${results[4]?.cost?.toLocaleString() || '-'}</strong></p>
          </div>

          {/* Round 5 Summary */}
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">🎯 Round 5: Optimization (Buffer = {results[5]?.buffer} days)</h3>
            <p className="text-sm">
              Project End: <strong className={results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}>{results[5]?.end} days</strong> | 
              Cost: <strong className={results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}>${results[5]?.cost?.toLocaleString()}</strong>
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded mb-4">
            <h3 className="font-bold mb-2">🎓 Key Learnings</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>R1:</strong> Gantt charts show schedule but can hide spatial conflicts</li>
              <li>• <strong>R2:</strong> LOB reveals when faster crews catch slower ones - use buffers!</li>
              <li>• <strong>R3:</strong> Buffer ↑ = Duration ↑ (but Cost stays the same)</li>
              <li>• <strong>R4:</strong> Equipment type affects both rate and cost per day</li>
              <li>• <strong>R5:</strong> Multiple equipment units multiply rate AND cost - optimize!</li>
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
        
        {/* ===== ROUND 1: Free Input Gantt Chart ===== */}
        {round === 1 && (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Create a schedule using <strong>Gantt Chart</strong></h3>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Step 1:</strong> Calculate Duration for each activity<br/>
                <strong>Step 2:</strong> Define Start day (you choose!)<br/>
                <strong>Step 3:</strong> Calculate End day using the formula
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">📐 Formulas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Duration:</strong><br/>
                  Duration = ⌈{PROJECT_LENGTH.toLocaleString()} ft ÷ Rate⌉<br/>
                  <span className="text-xs text-gray-500">(round up to nearest whole number)</span>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <strong>End Day:</strong><br/>
                  End = Start + Duration - 1
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">📝 Fill in the Schedule Table</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border">Phase</th>
                    <th className="px-2 py-2 border">Rate (ft/day)</th>
                    <th className="px-2 py-2 border bg-yellow-50">Duration (days)</th>
                    <th className="px-2 py-2 border bg-yellow-50">Start (day)</th>
                    <th className="px-2 py-2 border bg-yellow-50">End (day)</th>
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
                      <InputCell value={r1Input.excDur} onChange={(e) => setR1Input({...r1Input, excDur: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.excS} onChange={(e) => setR1Input({...r1Input, excS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.excE} onChange={(e) => setR1Input({...r1Input, excE: e.target.value})} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border text-green-700 font-medium">Pipe Laying (B)</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.pipeDur} onChange={(e) => setR1Input({...r1Input, pipeDur: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.pipeS} onChange={(e) => setR1Input({...r1Input, pipeS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.pipeE} onChange={(e) => setR1Input({...r1Input, pipeE: e.target.value})} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border text-orange-700 font-medium">Backfill (C)</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.backDur} onChange={(e) => setR1Input({...r1Input, backDur: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.backS} onChange={(e) => setR1Input({...r1Input, backS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r1Input.backE} onChange={(e) => setR1Input({...r1Input, backE: e.target.value})} />
                    </td>
                  </tr>
                </tbody>
              </table>
              {r1Student.end > 0 && (
                <div className="mt-3 text-center text-lg">
                  Project End: <strong className="text-blue-600 text-2xl">{r1Student.end} days</strong>
                </div>
              )}
            </div>

            {/* Gantt Chart */}
            {(r1Student.excS > 0 || r1Student.pipeS > 0 || r1Student.backS > 0) && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold mb-3">📊 Gantt Chart (Based on Your Input)</h3>
                <div className="relative">
                  <div className="flex">
                    <div className="w-24 text-xs text-gray-500 text-right pr-2 flex items-center justify-end">Activity</div>
                    <div className="flex-1 text-center text-xs text-gray-500 mb-1">Duration (day)</div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Mobilization', s: 1, e: MOB_DAYS, c: 'bg-gray-400' },
                      { name: 'Excavation', s: r1Student.excS, e: r1Student.excE, c: 'bg-blue-500' },
                      { name: 'Pipe Laying', s: r1Student.pipeS, e: r1Student.pipeE, c: 'bg-green-500' },
                      { name: 'Backfill', s: r1Student.backS, e: r1Student.backE, c: 'bg-orange-500' },
                    ].map((bar, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-24 text-xs text-right pr-2">{bar.name}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded relative">
                          {bar.s > 0 && bar.e > 0 && bar.e >= bar.s && (
                            <div
                              className={`absolute h-full ${bar.c} rounded text-white text-xs flex items-center justify-center`}
                              style={{ left: `${(bar.s / 150) * 100}%`, width: `${Math.max(((bar.e - bar.s + 1) / 150) * 100, 3)}%` }}
                            >
                              {bar.s}-{bar.e}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* X-axis labels */}
                  <div className="flex ml-24 mt-1">
                    <div className="flex-1 flex justify-between text-xs text-gray-400">
                      <span>0</span><span>30</span><span>60</span><span>90</span><span>120</span><span>150</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={nextRound} 
              disabled={!r1Student.excE || !r1Student.pipeE || !r1Student.backE}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
            >
              Complete R1 → LOB Analysis
            </button>
          </>
        )}

        {/* ===== ROUND 2: LOB Analysis ===== */}
        {round === 2 && (
          <>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: Analyze your R1 schedule with LOB and revise using <strong>{DEFAULT_BUFFER}-day buffer</strong></h3>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 1: Your R1 Schedule as LOB Chart</h3>
              <p className="text-sm text-gray-600 mb-2">Look for conflicts: Do any lines cross? Does a faster crew catch a slower one?</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={genLOB([r1Student])} margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -10 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-sm">
                ⚠️ <strong>Check for Conflict!</strong> Backfill ({CREWS.back.rate} ft/day) is faster than Pipe Laying ({CREWS.pipe.rate} ft/day). 
                If Backfill starts too early, it will catch up!
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 2: Buffer Formulas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <strong>Simple Buffer</strong> (slower follows faster):<br/>
                  <code className="bg-white px-1 rounded">Start = Prev Start + Buffer</code><br/>
                  <span className="text-xs text-gray-500">Use when following crew is SLOWER</span>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <strong>Delayed Buffer</strong> (faster follows slower):<br/>
                  <code className="bg-white px-1 rounded">Start = Prev End + Buffer - Duration + 1</code><br/>
                  <span className="text-xs text-gray-500">Use when following crew is FASTER</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">STEP 3: 📝 Revise Schedule (Apply {DEFAULT_BUFFER}-day Buffer)</h3>
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-2 border">Phase</th>
                    <th className="px-2 py-2 border">Rate</th>
                    <th className="px-2 py-2 border">Duration</th>
                    <th className="px-2 py-2 border bg-yellow-50">Start</th>
                    <th className="px-2 py-2 border bg-yellow-50">End</th>
                    <th className="px-2 py-2 border">Buffer Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-blue-700">
                    <td className="px-2 py-2 border font-medium">Excavation</td>
                    <td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.exc}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.excS} onChange={(e) => setR2Input({...r2Input, excS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.excE} onChange={(e) => setR2Input({...r2Input, excE: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center text-gray-400">-</td>
                  </tr>
                  <tr className="text-green-700">
                    <td className="px-2 py-2 border font-medium">Pipe Laying</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.pipe}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.pipeS} onChange={(e) => setR2Input({...r2Input, pipeS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.pipeE} onChange={(e) => setR2Input({...r2Input, pipeE: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center text-blue-600">Simple</td>
                  </tr>
                  <tr className="text-orange-700">
                    <td className="px-2 py-2 border font-medium">Backfill</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">{dur.back}</td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.backS} onChange={(e) => setR2Input({...r2Input, backS: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center">
                      <InputCell value={r2Input.backE} onChange={(e) => setR2Input({...r2Input, backE: e.target.value})} />
                    </td>
                    <td className="px-2 py-2 border text-center text-orange-600">Delayed</td>
                  </tr>
                </tbody>
              </table>
              {r2Student.end > 0 && (
                <div className="mt-3 text-center text-lg">
                  Project End: <strong className="text-yellow-600 text-2xl">{r2Student.end} days</strong>
                </div>
              )}
            </div>

            {/* R2 LOB Chart */}
            {(r2Student.excS > 0 && r2Student.pipeS > 0 && r2Student.backS > 0) && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold mb-2">STEP 4: Revised LOB Chart</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={genLOB([r2Student])} margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -10 }} />
                    <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                    <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                    <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 p-2 bg-green-100 rounded text-green-700 text-sm">
                  ✅ Check: Lines should NOT cross if buffer is applied correctly!
                </div>
              </div>
            )}

            {/* Budget Section */}
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
                          <InputCell value={r2Budget.excCost} onChange={(e) => setR2Budget({...r2Budget, excCost: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 border">Pipe Laying ({dur.pipe}d × ${CREWS.pipe.cost})</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.pipeCost} onChange={(e) => setR2Budget({...r2Budget, pipeCost: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 border">Backfill ({dur.back}d × ${CREWS.back.cost})</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.backCost} onChange={(e) => setR2Budget({...r2Budget, backCost: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-2 py-1 border">Direct Total</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.direct} onChange={(e) => setR2Budget({...r2Budget, direct: e.target.value})} width="w-24" />
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
                        <td className="px-2 py-1 border text-center text-gray-500">(from left)</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 border">Indirect ({INDIRECT_RATE*100}% of Direct)</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.indirect} onChange={(e) => setR2Budget({...r2Budget, indirect: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 border">Profit ({PROFIT_RATE*100}% of D+I)</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.profit} onChange={(e) => setR2Budget({...r2Budget, profit: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                      <tr className="bg-green-100 font-bold text-lg">
                        <td className="px-2 py-1 border">TOTAL</td>
                        <td className="px-2 py-1 border text-center">
                          <InputCell value={r2Budget.total} onChange={(e) => setR2Budget({...r2Budget, total: e.target.value})} width="w-24" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <button 
              onClick={nextRound} 
              disabled={!r2Student.excE || !r2Student.pipeE || !r2Student.backE}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
            >
              Complete R2 → Buffer Analysis
            </button>
          </>
        )}

        {/* ===== ROUND 3: Buffer Analysis (No Check, Just Demo) ===== */}
        {round === 3 && (
          <>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h3 className="font-bold">📋 Task: See how <strong>buffer values</strong> affect project duration</h3>
              <p className="text-sm text-gray-600">Adjust the slider and observe the changes in the schedule and LOB chart</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Adjust Buffer Value</h3>
              <div className="flex items-center gap-4">
                <span className="font-medium">Buffer:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  value={r3Buffer} 
                  onChange={e => setR3Buffer(+e.target.value)} 
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                />
                <span className="text-3xl font-bold text-green-600 w-16 text-center">{r3Buffer}</span>
                <span className="text-gray-500">days</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Schedule with Buffer = {r3Buffer} days</h3>
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
                    <td className="px-2 py-2 border text-center">{r3.excDur}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.excS}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.excE}</td>
                  </tr>
                  <tr className="text-green-700">
                    <td className="px-2 py-2 border font-medium">Pipe Laying</td>
                    <td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td>
                    <td className="px-2 py-2 border text-center">{r3.pipeDur}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.pipeS}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.pipeE}</td>
                  </tr>
                  <tr className="text-orange-700">
                    <td className="px-2 py-2 border font-medium">Backfill</td>
                    <td className="px-2 py-2 border text-center">{CREWS.back.rate}</td>
                    <td className="px-2 py-2 border text-center">{r3.backDur}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.backS}</td>
                    <td className="px-2 py-2 border text-center font-bold">{r3.backE}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 text-center text-lg">
                Project End: <strong className="text-green-600 text-2xl">{r3.end} days</strong>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">LOB Chart (Buffer = {r3Buffer} days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={genLOB([r3])} margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -10 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} />
                  <Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} />
                  <Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="font-bold text-yellow-800">💡 Key Insight</h4>
              <p className="text-sm">
                <strong>Buffer ↑ = Duration ↑</strong>, but <strong>Cost stays the same!</strong><br/>
                The buffer only affects timing, not the actual work duration or crew costs.
              </p>
            </div>

            <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
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
                      <label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type] === i ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}>
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
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={genLOB([r4])} margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -10 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
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
                            <button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: Math.max(0, p[type][key] - 1)}}))} className="w-6 h-6 bg-gray-200 rounded font-bold">-</button>
                            <span className="w-6 text-center font-bold">{r5Config[type][key]}</span>
                            <button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: p[type][key] + 1}}))} className="w-6 h-6 bg-blue-200 rounded font-bold">+</button>
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
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={genLOB([r5])} margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -10 }} />
                  <YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => `${(v/1000).toFixed(0)}k`} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
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
purple-50 rounded-lg">
            <h3 className="font-bold text-purple-800 mb-2">🎯 Round 5: Optimization (Buffer = {results[5]?.buffer} days)</h3>
            <p className="text-sm">Project End: <strong className={results[5]?.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}>{results[5]?.end} days</strong> | Cost: <strong className={results[5]?.cost <= TARGET_COST ? 'text-green-600' : 'text-red-600'}>${results[5]?.cost?.toLocaleString()}</strong></p>
          </div>

          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">🔄 Play Again</button>
        </div>
      </div>
    );
  }

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
      <div className="bg-white border-b"><div className="max-w-5xl mx-auto px-4 py-2 flex gap-1">{[1,2,3,4,5].map(r => (<div key={r} className={`flex-1 h-2 rounded ${r < round ? 'bg-green-500' : r === round ? 'bg-blue-500' : 'bg-gray-200'}`} />))}</div></div>
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        
        {round === 1 && (<>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><h3 className="font-bold">📋 Task: Create a schedule using Gantt Chart</h3><p className="text-sm text-gray-600">Enter Start day only. Duration and End are calculated automatically.</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📐 Formulas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded"><strong>Duration:</strong> ⌈{PROJECT_LENGTH.toLocaleString()} ft ÷ Rate⌉ (auto)</div>
              <div className="bg-green-50 p-3 rounded"><strong>End:</strong> Start + Duration - 1 (auto)</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">📝 Schedule Table</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-2 border">Phase</th><th className="px-2 py-2 border">Rate (ft/day)</th><th className="px-2 py-2 border">Duration (days)</th><th className="px-2 py-2 border bg-yellow-50">Start (day)</th><th className="px-2 py-2 border">End (day)</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-2 border font-medium">Mobilization</td><td className="px-2 py-2 border text-center">-</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td><td className="px-2 py-2 border text-center">1</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td></tr>
                <tr><td className="px-2 py-2 border text-blue-700 font-medium">Excavation (A)</td><td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td><td className="px-2 py-2 border text-center">{dur.exc}</td><td className="px-2 py-2 border text-center"><input type="number" value={r1Input.excS} onChange={(e) => setR1Input({...r1Input, excS: e.target.value})} className="w-16 px-1 py-1 border-2 rounded text-center text-sm bg-yellow-50 border-yellow-400" /></td><td className="px-2 py-2 border text-center font-bold">{r1Student.excE || '-'}</td></tr>
                <tr><td className="px-2 py-2 border text-green-700 font-medium">Pipe Laying (B)</td><td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td><td className="px-2 py-2 border text-center">{dur.pipe}</td><td className="px-2 py-2 border text-center"><input type="number" value={r1Input.pipeS} onChange={(e) => setR1Input({...r1Input, pipeS: e.target.value})} className="w-16 px-1 py-1 border-2 rounded text-center text-sm bg-yellow-50 border-yellow-400" /></td><td className="px-2 py-2 border text-center font-bold">{r1Student.pipeE || '-'}</td></tr>
                <tr><td className="px-2 py-2 border text-orange-700 font-medium">Backfill (C)</td><td className="px-2 py-2 border text-center">{CREWS.back.rate}</td><td className="px-2 py-2 border text-center">{dur.back}</td><td className="px-2 py-2 border text-center"><input type="number" value={r1Input.backS} onChange={(e) => setR1Input({...r1Input, backS: e.target.value})} className="w-16 px-1 py-1 border-2 rounded text-center text-sm bg-yellow-50 border-yellow-400" /></td><td className="px-2 py-2 border text-center font-bold">{r1Student.backE || '-'}</td></tr>
              </tbody>
            </table>
            {r1Student.end > 0 && <div className="mt-3 text-center">Project End: <strong className="text-2xl text-blue-600">{r1Student.end} days</strong></div>}
          </div>
          {(r1Student.excS > 0 || r1Student.pipeS > 0 || r1Student.backS > 0) && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">📊 Gantt Chart</h3>
              <div className="space-y-2">
                {[{ name: 'Mobilization', s: 1, e: MOB_DAYS, c: 'bg-gray-400' },{ name: 'Excavation', s: r1Student.excS, e: r1Student.excE, c: 'bg-blue-500' },{ name: 'Pipe Laying', s: r1Student.pipeS, e: r1Student.pipeE, c: 'bg-green-500' },{ name: 'Backfill', s: r1Student.backS, e: r1Student.backE, c: 'bg-orange-500' }].map((bar, i) => (<div key={i} className="flex items-center gap-2"><div className="w-24 text-xs text-right pr-2">{bar.name}</div><div className="flex-1 h-6 bg-gray-100 rounded relative">{bar.s > 0 && bar.e > 0 && (<div className={`absolute h-full ${bar.c} rounded text-white text-xs flex items-center justify-center`} style={{ left: `${(bar.s/150)*100}%`, width: `${Math.max(((bar.e-bar.s+1)/150)*100,3)}%` }}>{bar.s}-{bar.e}</div>)}</div></div>))}
              </div>
            </div>
          )}
          <button onClick={nextRound} disabled={!r1Student.excS || !r1Student.pipeS || !r1Student.backS} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300">Complete R1 → LOB Analysis</button>
        </>)}

        {round === 2 && (<>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded"><h3 className="font-bold">📋 Task: Analyze R1 with LOB and revise using {DEFAULT_BUFFER}-day buffer</h3><p className="text-sm text-gray-600">Enter correct Start and End values to proceed.</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Your R1 Schedule as LOB Chart</h3>
            <ResponsiveContainer width="100%" height={250}><LineChart data={genLOB([r1Student])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Buffer Formulas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded"><strong>Simple Buffer</strong> (slower follows faster):<br/><code>Start = Prev Start + Buffer</code></div>
              <div className="bg-orange-50 p-3 rounded"><strong>Delayed Buffer</strong> (faster follows slower):<br/><code>Start = Prev End + Buffer - Duration + 1</code></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">📝 Revise Schedule ({DEFAULT_BUFFER}-day Buffer)</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-2 border">Phase</th><th className="px-2 py-2 border">Rate (ft/day)</th><th className="px-2 py-2 border">Duration (days)</th><th className="px-2 py-2 border bg-yellow-50">Start (day)</th><th className="px-2 py-2 border bg-yellow-50">End (day)</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-2 border font-medium">Mobilization</td><td className="px-2 py-2 border text-center">-</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td><td className="px-2 py-2 border text-center">1</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-2 border font-medium">Excavation</td><td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td><td className="px-2 py-2 border text-center">{dur.exc}</td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.excS} onChange={(e) => setR2Input({...r2Input, excS: e.target.value})} correct={r2Correct.excS} submitted={r2Validated} /></td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.excE} onChange={(e) => setR2Input({...r2Input, excE: e.target.value})} correct={r2Correct.excE} submitted={r2Validated} /></td></tr>
                <tr className="text-green-700"><td className="px-2 py-2 border font-medium">Pipe Laying</td><td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td><td className="px-2 py-2 border text-center">{dur.pipe}</td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.pipeS} onChange={(e) => setR2Input({...r2Input, pipeS: e.target.value})} correct={r2Correct.pipeS} submitted={r2Validated} /></td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.pipeE} onChange={(e) => setR2Input({...r2Input, pipeE: e.target.value})} correct={r2Correct.pipeE} submitted={r2Validated} /></td></tr>
                <tr className="text-orange-700"><td className="px-2 py-2 border font-medium">Backfill</td><td className="px-2 py-2 border text-center">{CREWS.back.rate}</td><td className="px-2 py-2 border text-center">{dur.back}</td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.backS} onChange={(e) => setR2Input({...r2Input, backS: e.target.value})} correct={r2Correct.backS} submitted={r2Validated} /></td><td className="px-2 py-2 border text-center"><InputCell value={r2Input.backE} onChange={(e) => setR2Input({...r2Input, backE: e.target.value})} correct={r2Correct.backE} submitted={r2Validated} /></td></tr>
              </tbody>
            </table>
            <button onClick={() => setR2Validated(true)} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded font-bold">Check Answers</button>
            {r2Validated && !r2IsCorrect && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">❌ Some answers incorrect. Try again.</div>}
            {r2Validated && r2IsCorrect && <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-sm">✅ All correct!</div>}
          </div>
          {r2Student.excS > 0 && r2Student.pipeS > 0 && r2Student.backS > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">Revised LOB Chart</h3>
              <ResponsiveContainer width="100%" height={250}><LineChart data={genLOB([r2Student])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} /></LineChart></ResponsiveContainer>
            </div>
          )}
          {r2IsCorrect && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-2">💰 Budget (Auto-Calculated)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <table className="w-full border"><tbody>
                  <tr><td className="px-2 py-1 border">Mobilization</td><td className="px-2 py-1 border text-right">${MOB_COST.toLocaleString()}</td></tr>
                  <tr><td className="px-2 py-1 border">Excavation ({dur.exc}d × ${CREWS.exc.cost})</td><td className="px-2 py-1 border text-right">${r2Cost.excC.toLocaleString()}</td></tr>
                  <tr><td className="px-2 py-1 border">Pipe Laying ({dur.pipe}d × ${CREWS.pipe.cost})</td><td className="px-2 py-1 border text-right">${r2Cost.pipeC.toLocaleString()}</td></tr>
                  <tr><td className="px-2 py-1 border">Backfill ({dur.back}d × ${CREWS.back.cost})</td><td className="px-2 py-1 border text-right">${r2Cost.backC.toLocaleString()}</td></tr>
                  <tr className="bg-gray-100 font-bold"><td className="px-2 py-1 border">Direct Total</td><td className="px-2 py-1 border text-right">${r2Cost.direct.toLocaleString()}</td></tr>
                </tbody></table>
                <table className="w-full border"><tbody>
                  <tr><td className="px-2 py-1 border">Direct</td><td className="px-2 py-1 border text-right">${r2Cost.direct.toLocaleString()}</td></tr>
                  <tr><td className="px-2 py-1 border">Indirect (30%)</td><td className="px-2 py-1 border text-right">${r2Cost.indirect.toLocaleString()}</td></tr>
                  <tr><td className="px-2 py-1 border">Profit (5%)</td><td className="px-2 py-1 border text-right">${r2Cost.profit.toLocaleString()}</td></tr>
                  <tr className="bg-green-100 font-bold text-lg"><td className="px-2 py-1 border">TOTAL</td><td className="px-2 py-1 border text-right">${r2Cost.total.toLocaleString()}</td></tr>
                </tbody></table>
              </div>
            </div>
          )}
          <button onClick={nextRound} disabled={!r2IsCorrect} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-300">{r2IsCorrect ? 'Complete R2 → Buffer Analysis' : 'Answer correctly to proceed'}</button>
        </>)}

        {round === 3 && (<>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded"><h3 className="font-bold">📋 Task: See how buffer affects project duration</h3></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Adjust Buffer Value</h3>
            <div className="flex items-center gap-4"><span>Buffer:</span><input type="range" min="1" max="15" value={r3Buffer} onChange={e => setR3Buffer(+e.target.value)} className="flex-1" /><span className="text-3xl font-bold text-green-600 w-16 text-center">{r3Buffer}</span><span>days</span></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Schedule with Buffer = {r3Buffer} days</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-2 border">Phase</th><th className="px-2 py-2 border">Rate (ft/day)</th><th className="px-2 py-2 border">Duration (days)</th><th className="px-2 py-2 border">Start (day)</th><th className="px-2 py-2 border">End (day)</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-2 border font-medium">Mobilization</td><td className="px-2 py-2 border text-center">-</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td><td className="px-2 py-2 border text-center">1</td><td className="px-2 py-2 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-2 border font-medium">Excavation</td><td className="px-2 py-2 border text-center">{CREWS.exc.rate}</td><td className="px-2 py-2 border text-center">{dur.exc}</td><td className="px-2 py-2 border text-center">{r3.excS}</td><td className="px-2 py-2 border text-center">{r3.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-2 border font-medium">Pipe Laying</td><td className="px-2 py-2 border text-center">{CREWS.pipe.rate}</td><td className="px-2 py-2 border text-center">{dur.pipe}</td><td className="px-2 py-2 border text-center">{r3.pipeS}</td><td className="px-2 py-2 border text-center">{r3.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-2 border font-medium">Backfill</td><td className="px-2 py-2 border text-center">{CREWS.back.rate}</td><td className="px-2 py-2 border text-center">{dur.back}</td><td className="px-2 py-2 border text-center">{r3.backS}</td><td className="px-2 py-2 border text-center">{r3.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 text-center">Project End: <strong className="text-2xl text-green-600">{r3.end} days</strong></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 vs R3</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r3])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} /><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={2} name="Exc R3" dot={false} /><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={2} name="Pipe R3" dot={false} /><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={2} name="Back R3" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-yellow-50 p-4 rounded"><h4 className="font-bold text-yellow-800">💡 Key Insight</h4><p className="text-sm"><strong>Buffer ↑ = Duration ↑</strong>, but <strong>Cost stays the same!</strong></p></div>
          <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R3 → Rate Analysis</button>
        </>)}

        {round === 4 && (<>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded"><h3 className="font-bold">📋 Task: Select equipment TYPE (1 unit each)</h3></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Select Equipment</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc', 'pipe', 'back'].map((type) => (<div key={type} className="border rounded p-3"><h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>{type === 'exc' ? '🚜 Excavation' : type === 'pipe' ? '🏗️ Pipe Laying' : '🚧 Backfill'}</h4>{EQUIPMENT[type].map((eq, i) => (<label key={i} className={`block p-2 rounded mb-1 cursor-pointer ${r4Eq[type] === i ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}><input type="radio" checked={r4Eq[type] === i} onChange={() => setR4Eq(p => ({...p, [type]: i}))} className="mr-2" /><span className="font-medium">{eq.name}</span><div className="text-xs text-gray-600 ml-5">{eq.rate} ft/day | ${eq.cost}/day</div></label>))}</div>))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R4 Schedule</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Phase</th><th className="px-2 py-1 border">Equipment</th><th className="px-2 py-1 border">Rate (ft/day)</th><th className="px-2 py-1 border">Duration (days)</th><th className="px-2 py-1 border">Cost ($/day)</th><th className="px-2 py-1 border">Start (day)</th><th className="px-2 py-1 border">End (day)</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border font-medium">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation</td><td className="px-2 py-1 border text-center">{r4.excName}</td><td className="px-2 py-1 border text-center">{r4.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.excDur}</td><td className="px-2 py-1 border text-center">${r4.excCost}</td><td className="px-2 py-1 border text-center">{r4.excS}</td><td className="px-2 py-1 border text-center">{r4.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying</td><td className="px-2 py-1 border text-center">{r4.pipeName}</td><td className="px-2 py-1 border text-center">{r4.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.pipeDur}</td><td className="px-2 py-1 border text-center">${r4.pipeCost}</td><td className="px-2 py-1 border text-center">{r4.pipeS}</td><td className="px-2 py-1 border text-center">{r4.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill</td><td className="px-2 py-1 border text-center">{r4.backName}</td><td className="px-2 py-1 border text-center">{r4.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r4.backDur}</td><td className="px-2 py-1 border text-center">${r4.backCost}</td><td className="px-2 py-1 border text-center">{r4.backS}</td><td className="px-2 py-1 border text-center">{r4.backE}</td></tr>
              </tbody>
            </table>
            <div className="mt-3 grid grid-cols-2 gap-4 text-center">
              <div className="bg-orange-50 p-3 rounded"><div className="text-gray-600">Duration</div><div className="text-2xl font-bold text-orange-600">{r4.end} days</div></div>
              <div className="bg-orange-50 p-3 rounded"><div className="text-gray-600">Total Cost</div><div className="text-2xl font-bold text-orange-600">${r4Cost.total.toLocaleString()}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">LOB Comparison: R2 vs R4</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r2Correct, r4])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={1} strokeDasharray="5 5" name="Exc R2" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={1} strokeDasharray="5 5" name="Pipe R2" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={1} strokeDasharray="5 5" name="Back R2" dot={false} /><Line type="linear" dataKey="exc1" stroke="#2563eb" strokeWidth={2} name="Exc R4" dot={false} /><Line type="linear" dataKey="pipe1" stroke="#16a34a" strokeWidth={2} name="Pipe R4" dot={false} /><Line type="linear" dataKey="back1" stroke="#ea580c" strokeWidth={2} name="Back R4" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <button onClick={nextRound} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">Complete R4 → Optimization</button>
        </>)}

        {round === 5 && (<>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded"><h3 className="font-bold">📋 Task: Optimize to meet constraints</h3><p className="text-sm">Targets: ≤{TARGET_DAYS} days and ≤${TARGET_COST.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-3">Configure Equipment (Multiple Units)</h3>
            <div className="grid grid-cols-3 gap-4">
              {['exc', 'pipe', 'back'].map((type) => (<div key={type} className={`border rounded p-3 ${type === 'exc' ? 'bg-blue-50' : type === 'pipe' ? 'bg-green-50' : 'bg-orange-50'}`}><h4 className={`font-bold mb-2 ${type === 'exc' ? 'text-blue-700' : type === 'pipe' ? 'text-green-700' : 'text-orange-700'}`}>{type === 'exc' ? '🚜 Excavation' : type === 'pipe' ? '🏗️ Pipe Laying' : '🚧 Backfill'}</h4>{Object.keys(r5Config[type]).map((key) => { const eqIndex = type === 'pipe' ? (key === 'standard' ? 0 : 1) : (key === 'small' ? 0 : key === 'standard' ? 1 : 2); const eq = EQUIPMENT[type][eqIndex]; return (<div key={key} className="flex items-center justify-between bg-white p-2 rounded mb-1"><div><div className="text-sm font-medium">{eq.name}</div><div className="text-xs text-gray-500">{eq.rate} ft/d | ${eq.cost}/d</div></div><div className="flex items-center gap-2"><button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: Math.max(0, p[type][key] - 1)}}))} className="w-6 h-6 bg-gray-200 rounded font-bold">-</button><span className="w-6 text-center font-bold">{r5Config[type][key]}</span><button onClick={() => setR5Config(p => ({...p, [type]: {...p[type], [key]: p[type][key] + 1}}))} className="w-6 h-6 bg-blue-200 rounded font-bold">+</button></div></div>); })}<div className={`mt-2 p-2 rounded text-sm ${type === 'exc' ? 'bg-blue-100' : type === 'pipe' ? 'bg-green-100' : 'bg-orange-100'}`}><strong>Total:</strong> {r5Calc[type].count} units | {r5Calc[type].rate} ft/d | ${r5Calc[type].cost}/d</div></div>))}
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded"><div className="flex items-center gap-4"><span className="font-bold text-purple-700">Buffer:</span><input type="range" min="1" max="10" value={r5Buffer} onChange={e => setR5Buffer(+e.target.value)} className="flex-1" /><span className="text-2xl font-bold text-purple-600 w-12">{r5Buffer}</span></div></div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R5 Schedule</h3>
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr><th className="px-2 py-1 border">Phase</th><th className="px-2 py-1 border">Rate (ft/day)</th><th className="px-2 py-1 border">Duration (days)</th><th className="px-2 py-1 border">Cost ($/day)</th><th className="px-2 py-1 border">Start (day)</th><th className="px-2 py-1 border">End (day)</th></tr></thead>
              <tbody>
                <tr className="bg-gray-50"><td className="px-2 py-1 border font-medium">Mobilization</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td><td className="px-2 py-1 border text-center">-</td><td className="px-2 py-1 border text-center">1</td><td className="px-2 py-1 border text-center">{MOB_DAYS}</td></tr>
                <tr className="text-blue-700"><td className="px-2 py-1 border">Excavation</td><td className="px-2 py-1 border text-center">{r5.excRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.excDur}</td><td className="px-2 py-1 border text-center">${r5.excCost}</td><td className="px-2 py-1 border text-center">{r5.excS}</td><td className="px-2 py-1 border text-center">{r5.excE}</td></tr>
                <tr className="text-green-700"><td className="px-2 py-1 border">Pipe Laying</td><td className="px-2 py-1 border text-center">{r5.pipeRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.pipeDur}</td><td className="px-2 py-1 border text-center">${r5.pipeCost}</td><td className="px-2 py-1 border text-center">{r5.pipeS}</td><td className="px-2 py-1 border text-center">{r5.pipeE}</td></tr>
                <tr className="text-orange-700"><td className="px-2 py-1 border">Backfill</td><td className="px-2 py-1 border text-center">{r5.backRate}</td><td className="px-2 py-1 border text-center font-bold">{r5.backDur}</td><td className="px-2 py-1 border text-center">${r5.backCost}</td><td className="px-2 py-1 border text-center">{r5.backS}</td><td className="px-2 py-1 border text-center">{r5.backE}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">Constraints Check</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg text-center ${r5.end <= TARGET_DAYS ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Duration</div><div className={`text-3xl font-bold ${r5.end <= TARGET_DAYS ? 'text-green-600' : 'text-red-600'}`}>{r5.end} days</div><div className="text-sm">Target: ≤{TARGET_DAYS} {r5.end <= TARGET_DAYS ? '✅' : '❌'}</div></div>
              <div className={`p-4 rounded-lg text-center ${r5Cost.total <= TARGET_COST ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}`}><div className="text-gray-600">Total Cost</div><div className={`text-3xl font-bold ${r5Cost.total <= TARGET_COST ? 'text-green-600' : 'text-red-600'}`}>${(r5Cost.total/1000).toFixed(0)}K</div><div className="text-sm">Target: ≤${TARGET_COST/1000}K {r5Cost.total <= TARGET_COST ? '✅' : '❌'}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">R5 LOB Chart</h3>
            <ResponsiveContainer width="100%" height={280}><LineChart data={genLOB([r5])} margin={{ top: 10, right: 30, bottom: 30, left: 60 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" label={{ value: 'Duration (day)', position: 'insideBottom', offset: -5 }} /><YAxis domain={[0, PROJECT_LENGTH]} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Distance (ft)', angle: -90, position: 'insideLeft', offset: 10 }} /><Tooltip /><Legend verticalAlign="top" height={36} /><Line type="linear" dataKey="exc0" stroke="#2563eb" strokeWidth={2} name="Excavation" dot={false} /><Line type="linear" dataKey="pipe0" stroke="#16a34a" strokeWidth={2} name="Pipe Laying" dot={false} /><Line type="linear" dataKey="back0" stroke="#ea580c" strokeWidth={2} name="Backfill" dot={false} /></LineChart></ResponsiveContainer>
          </div>
          <button onClick={nextRound} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold">Finish Game 🏆</button>
        </>)}
      </div>
    </div>
  );
}
