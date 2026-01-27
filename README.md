# 🎮 LOB Simulation Game - Student Version

Interactive educational game for learning Line of Balance (LOB) scheduling.

## 📋 Features

- **Round 1**: Create a Gantt Chart schedule (students input Duration, Start, End)
- **Round 2**: LOB Analysis with buffer rules (students apply formulas)
- **Round 3**: Buffer Analysis (students recalculate with different buffers)
- **Round 4**: Equipment Rate Analysis
- **Round 5**: Optimization Challenge

## 🎯 Learning Objectives

- Understand construction scheduling basics
- Learn LOB concepts and conflict identification
- Practice buffer calculations
- Optimize resources to meet constraints

## 🚀 Deployment

This repo is ready to deploy on Vercel:

1. Import this repository on [vercel.com](https://vercel.com)
2. Click "Deploy"
3. Done! Share the URL with students

## 📁 Project Structure

```
LOB-Student/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── index.js
    └── App.js
```

## ⚙️ Customization

Edit constants at the top of `src/App.js`:

```javascript
const PROJECT_LENGTH = 15840;    // Total length (ft)
const MOB_DAYS = 14;             // Mobilization days
const TARGET_DAYS = 55;          // Target duration
const TARGET_COST = 550000;      // Target cost
```

---

Created for Construction Scheduling Education
