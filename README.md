# 🎮 LOB Simulation Game v2.0 - Student Version

Interactive educational game for learning Line of Balance (LOB) scheduling.

## ✨ What's New in v2.0

### Improved R1 → R2 Flow
- **R1 now allows proceeding WITH conflicts** - Students can see the consequences of their decisions in R2
- **R1 schedule is passed to R2** - Personalized learning experience

### New R2 Design (4 Phases)

| Phase | Duration | What Students Do |
|-------|----------|------------------|
| 1. Naive Schedule | 30 sec | See what happens when all crews start on Day 15 |
| 2. Your R1 Analysis | 30-60 sec | See their R1 schedule as LOB - with or without conflicts |
| 3. Interactive LOB Editor | 3-5 min | **DRAG the lines** to fix/optimize schedule |
| 4. Formula Reveal | 1 min | Learn the math behind the optimal schedule |

### Key Feature: Draggable LOB Chart
- Students drag the Pipe Laying and Backfill lines directly on the LOB chart
- Real-time conflict detection and buffer calculation
- Visual feedback (lines turn red when conflicts occur)
- Reset button to return to R1 schedule

## 🚀 Deployment

### Deploy to Vercel
1. Push this folder to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Click "Deploy"
4. Share the URL with students

### Local Development
```bash
npm install
npm start
```

## 📁 Project Structure

```
lob-game/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── index.js
    └── App.js        # All game logic (789 lines)
```

## 🎯 Learning Objectives

### R1: Bar Chart Scheduling
- Understand activity sequencing (Excavation → Pipe → Backfill)
- Create a schedule by dragging bars
- Experience trial-and-error approach

### R2: LOB Analysis (NEW & IMPROVED!)
- **WHY**: See how LOB reveals spatial conflicts that bar charts hide
- **HOW**: Learn buffer formulas through direct manipulation
- Key insight: "Following crew SLOWER → Buffer at START, FASTER → Buffer at END"

### R3: Buffer Sensitivity
- Adjust buffer size (1-15 days)
- See impact on total duration
- Insight: "Bigger buffer = Longer duration, same cost"

### R4: Equipment Selection
- Select different equipment types
- See how production rates affect schedule

### R5: Optimization Challenge
- Combine multiple equipment units
- Meet dual constraints: ≤55 days AND ≤$550,000

## ⚙️ Customization

Edit constants at the top of `src/App.js`:

```javascript
const PROJECT_LENGTH = 15840;    // Total length (ft)
const MOB_DAYS = 14;             // Mobilization days
const DEFAULT_BUFFER = 5;        // Default buffer (days)
const TARGET_DAYS = 55;          // Target duration
const TARGET_COST = 550000;      // Target cost
```

## 📊 Data Flow

```
R1: Student creates schedule (may have conflicts)
    ↓ passes r1Schedule
R2: Show R1 as LOB → Fix/Optimize with draggable LOB → Learn formulas
    ↓ passes optimalSchedule
R3-R5: Further analysis and optimization
```

---

Created for Construction Scheduling Education
