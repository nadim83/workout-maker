import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh71e8jXZymGo3T-C2KegF9jfKHISe44s",
  authDomain: "workout-maker-c3953.firebaseapp.com",
  projectId: "workout-maker-c3953",
  storageBucket: "workout-maker-c3953.firebasestorage.app",
  messagingSenderId: "315761632794",
  appId: "1:315761632794:web:d4ba51ed996e43948e53a3",
  measurementId: "G-FXE9HY2Y77"
};

// Initialize Firebase & Firestore Cloud Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements Selection
const btnHypertrophy = document.getElementById('btnHypertrophy');
const btnStrength = document.getElementById('btnStrength');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const presetBtnText = document.getElementById('presetBtnText');

const exDaySelect = document.getElementById('exDay');
const exSplitSelect = document.getElementById('exSplit');
const workoutForm = document.getElementById('workoutForm');
const workoutList = document.getElementById('workoutList');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAll');
const countBadge = document.getElementById('countBadge');

const generateProgramBtn = document.getElementById('generateProgramBtn');
const programModal = document.getElementById('programModal');
const closeModal = document.getElementById('closeModal');
const modalProgramContent = document.getElementById('modalProgramContent');
const pdfClientDisplay = document.getElementById('pdfClientDisplay');
const pdfModeDisplay = document.getElementById('pdfModeDisplay');
const pdfDate = document.getElementById('pdfDate');
const downloadPdfBtn = document.getElementById('downloadPdf');

const analyticsClientList = document.getElementById('analyticsClientList');
const analyticsCount = document.getElementById('analyticsCount');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataInput = document.getElementById('importDataInput');

let currentMode = 'hypertrophy';

const splitOptions = {
    hypertrophy: [
        "Push: Chest, Shoulder & Triceps",
        "Pull: Back, Rear Delt & Biceps",
        "Legs & Abs"
    ],
    strength: [
        "Squat Day + Accessories",
        "Bench Press Day + Accessories",
        "Deadlift Day + Accessories"
    ]
};

// Preset Templates
const presetTemplates = {
    hypertrophy: [
        { mode: 'hypertrophy', day: 'Day 1', split: 'Push: Chest, Shoulder & Triceps', name: 'Barbell Bench Press', weight: 60, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 1', split: 'Push: Chest, Shoulder & Triceps', name: 'Overhead Shoulder Press', weight: 40, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 1', split: 'Push: Chest, Shoulder & Triceps', name: 'Triceps Rope Pushdown', weight: 25, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 2', split: 'Pull: Back, Rear Delt & Biceps', name: 'Lat Pulldown', weight: 50, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 2', split: 'Pull: Back, Rear Delt & Biceps', name: 'Barbell Bent Over Row', weight: 45, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 2', split: 'Pull: Back, Rear Delt & Biceps', name: 'Biceps Barbell Curl', weight: 20, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 3', split: 'Legs & Abs', name: 'Leg Press', weight: 100, sets: 4 },
        { mode: 'hypertrophy', day: 'Day 3', split: 'Legs & Abs', name: 'Romanian Deadlift', weight: 70, sets: 3 },
        { mode: 'hypertrophy', day: 'Day 3', split: 'Legs & Abs', name: 'Hanging Leg Raise', weight: 0, sets: 3 }
    ],
    strength: [
        { mode: 'strength', day: 'Day 1', split: 'Squat Day + Accessories', name: 'Competition Barbell Squat', weight: 100, sets: 4 },
        { mode: 'strength', day: 'Day 1', split: 'Squat Day + Accessories', name: 'Pause Squat', weight: 80, sets: 3 },
        { mode: 'strength', day: 'Day 1', split: 'Squat Day + Accessories', name: 'Bulgarian Split Squat', weight: 20, sets: 3 },
        { mode: 'strength', day: 'Day 2', split: 'Bench Press Day + Accessories', name: 'Competition Bench Press', weight: 80, sets: 4 },
        { mode: 'strength', day: 'Day 2', split: 'Bench Press Day + Accessories', name: 'Close Grip Bench Press', weight: 65, sets: 3 },
        { mode: 'strength', day: 'Day 2', split: 'Bench Press Day + Accessories', name: 'Dumbbell Incline Press', weight: 24, sets: 3 },
        { mode: 'strength', day: 'Day 3', split: 'Deadlift Day + Accessories', name: 'Competition Deadlift', weight: 120, sets: 3 },
        { mode: 'strength', day: 'Day 3', split: 'Deadlift Day + Accessories', name: 'Deficit Deadlift', weight: 95, sets: 3 },
        { mode: 'strength', day: 'Day 3', split: 'Deadlift Day + Accessories', name: 'Barbell Shrugs', weight: 60, sets: 3 }
    ]
};

let customWorkouts = JSON.parse(localStorage.getItem('day_split_workouts_v7')) || [];
let savedClientAnalytics = [];

function populateSplitOptions() {
    const currentSelectedSplit = exSplitSelect.value;
    exSplitSelect.innerHTML = '';
    splitOptions[currentMode].forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        exSplitSelect.appendChild(opt);
    });
    if (currentSelectedSplit && splitOptions[currentMode].includes(currentSelectedSplit)) {
        exSplitSelect.value = currentSelectedSplit;
    }
}

btnHypertrophy.addEventListener('click', () => {
    currentMode = 'hypertrophy';
    btnHypertrophy.className = "mode-tab active-tab text-xs py-2.5 rounded-xl font-bold border transition flex items-center justify-center space-x-2";
    btnStrength.className = "mode-tab inactive-tab text-xs py-2.5 rounded-xl font-bold border transition flex items-center justify-center space-x-2";
    presetBtnText.textContent = "Load 1-Click PPL Preset Template";
    populateSplitOptions();
});

btnStrength.addEventListener('click', () => {
    currentMode = 'strength';
    btnStrength.className = "mode-tab active-tab text-xs py-2.5 rounded-xl font-bold border transition flex items-center justify-center space-x-2";
    btnHypertrophy.className = "mode-tab inactive-tab text-xs py-2.5 rounded-xl font-bold border transition flex items-center justify-center space-x-2";
    presetBtnText.textContent = "Load 1-Click SBD Preset Template";
    populateSplitOptions();
});

// Load Preset Template
loadPresetBtn.addEventListener('click', () => {
    const templateData = presetTemplates[currentMode];
    if (templateData && templateData.length > 0) {
        customWorkouts = JSON.parse(JSON.stringify(templateData));
        localStorage.setItem('day_split_workouts_v7', JSON.stringify(customWorkouts));
        renderWorkouts();
    }
});

// Render Workouts Grouped inside single Day Cards
function renderWorkouts() {
    workoutList.innerHTML = '';
    
    if (!customWorkouts || customWorkouts.length === 0) {
        emptyState.classList.remove('hidden');
        clearAllBtn.classList.add('hidden');
        countBadge.textContent = '0';
        return;
    } else {
        emptyState.classList.add('hidden');
        clearAllBtn.classList.remove('hidden');
    }

    const groupedMap = {};
    customWorkouts.forEach((item, globalIndex) => {
        const key = `${item.day} - ${item.split}`;
        if (!groupedMap[key]) {
            groupedMap[key] = { day: item.day, split: item.split, items: [] };
        }
        groupedMap[key].items.push({ ...item, globalIndex });
    });

    const groupKeys = Object.keys(groupedMap).sort();
    countBadge.textContent = groupKeys.length;

    groupKeys.forEach(key => {
        const group = groupedMap[key];
        const dayCard = document.createElement('div');
        dayCard.className = "bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-md";

        let exercisesHtml = '';
        group.items.forEach(ex => {
            exercisesHtml += `
                <div class="flex justify-between items-center bg-slate-950/70 border border-slate-800/60 px-3 py-2 rounded-lg">
                    <div>
                        <h5 class="font-semibold text-slate-100 text-xs">${ex.name}</h5>
                        <p class="text-[10px] text-slate-400">${ex.sets} Sets | Base Load: <strong class="text-emerald-400">${ex.weight} kg</strong></p>
                    </div>
                    <button onclick="deleteWorkout(${ex.globalIndex})" class="text-slate-600 hover:text-rose-400 p-1.5 transition">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            `;
        });

        dayCard.innerHTML = `
            <div class="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span class="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">${group.day}</span>
                <span class="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/80">${group.split}</span>
            </div>
            <div class="space-y-1.5">
                ${exercisesHtml}
            </div>
        `;

        workoutList.appendChild(dayCard);
    });
}

// Form Submit Handler
workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedDay = exDaySelect.value;
    const selectedSplit = exSplitSelect.value;

    const name = document.getElementById('exName').value;
    const weight = parseFloat(document.getElementById('exWeight').value);
    const sets = document.getElementById('exSets').value;

    customWorkouts.push({ mode: currentMode, day: selectedDay, split: selectedSplit, name, weight, sets });
    localStorage.setItem('day_split_workouts_v7', JSON.stringify(customWorkouts));

    document.getElementById('exName').value = '';
    document.getElementById('exWeight').value = '';
    document.getElementById('exSets').value = '';

    exDaySelect.value = selectedDay;
    exSplitSelect.value = selectedSplit;

    renderWorkouts();
});

window.deleteWorkout = function(index) {
    customWorkouts.splice(index, 1);
    localStorage.setItem('day_split_workouts_v7', JSON.stringify(customWorkouts));
    renderWorkouts();
}

clearAllBtn.addEventListener('click', () => {
    if(confirm("Clear all added exercises?")) {
        customWorkouts = [];
        localStorage.removeItem('day_split_workouts_v7');
        renderWorkouts();
    }
});

// Build 5-Week Routine HTML
function generateRoutineHTML(clientName, mode, workoutData) {
    const weeksConfig = [
        { week: 1, title: 'Week 1: Base Line', repTarget: 8, note: 'Technique & Baseline Load' },
        { week: 2, title: 'Week 2: Progression 1', repTarget: 9, note: '+5kg Squat/DL, +2.5kg Others | 9 Reps' },
        { week: 3, title: 'Week 3: Progression 2', repTarget: 10, note: '+5kg Squat/DL, +2.5kg Others | 10 Reps' },
        { week: 4, title: 'Week 4: Peak Overload', repTarget: 12, note: 'Max Intent Peak | 12 Reps' },
        { week: 5, title: 'Week 5: Deload Recovery', repTarget: 8, note: 'Deload: -40% Weight Reduction' }
    ];

    let fullHtml = '';

    weeksConfig.forEach(w => {
        const groupedDays = {};
        workoutData.forEach(ex => {
            const key = `${ex.day} - ${ex.split}`;
            if (!groupedDays[key]) {
                groupedDays[key] = [];
            }
            groupedDays[key].push(ex);
        });

        let daysHtml = '';
        for (const [dayTitle, items] of Object.entries(groupedDays)) {
            let exerciseRowsHtml = '';
            
            items.forEach(ex => {
                const exNameLower = ex.name.toLowerCase();
                const isHeavyLift = exNameLower.includes('squat') || exNameLower.includes('deadlift');
                const increment = isHeavyLift ? 5.0 : 2.5;

                let currentWeight = 0;
                if (w.week === 5) {
                    currentWeight = (ex.weight * 0.6).toFixed(1);
                } else {
                    currentWeight = (ex.weight + (w.week - 1) * increment).toFixed(1);
                }

                exerciseRowsHtml += `
                    <div class="flex justify-between items-center text-[10px] py-0.5">
                        <span class="text-slate-300 font-medium">• ${ex.name}</span>
                        <span class="text-right font-mono text-slate-400">
                            ${ex.sets} Sets × ${w.repTarget} @ <strong class="text-emerald-400">${currentWeight}kg</strong>
                        </span>
                    </div>
                `;
            });

            daysHtml += `
                <div class="mt-2 pt-1.5 border-t border-slate-800/80">
                    <div class="flex items-center space-x-1.5 mb-1">
                        <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">${dayTitle}</span>
                    </div>
                    <div class="pl-1 space-y-0.5">
                        ${exerciseRowsHtml}
                    </div>
                </div>
            `;
        }

        fullHtml += `
            <div class="border rounded-xl p-3 ${w.week === 5 ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-900/90 border-slate-800'}">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-bold text-xs ${w.week === 5 ? 'text-amber-400' : 'text-emerald-400'}">${w.title}</span>
                    <span class="text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">${w.repTarget} Reps Target</span>
                </div>
                <p class="text-[9px] text-slate-400 italic mb-1">${w.note}</p>
                ${daysHtml}
            </div>
        `;
    });

    return fullHtml;
}

// FIREBASE CLOUD SAVE: Generate & Save to Firestore
generateProgramBtn.addEventListener('click', async () => {
    if(customWorkouts.length === 0) {
        alert("Please add at least one exercise!");
        return;
    }

    const clientName = document.getElementById('clientName').value.trim() || 'ATHLETE';
    const coachName = document.getElementById('coachName').value.trim() || 'MD. Nadim Khan';
    const dateStr = new Date().toLocaleDateString();

    pdfClientDisplay.textContent = `${clientName.toUpperCase()} - 5 WEEK PLAN`;
    pdfModeDisplay.textContent = `Mode: ${currentMode.toUpperCase()} | Coach: ${coachName}`;
    pdfDate.textContent = dateStr;

    modalProgramContent.innerHTML = generateRoutineHTML(clientName, currentMode, customWorkouts);

    const newRecord = {
        name: clientName,
        coach: coachName,
        date: dateStr,
        mode: currentMode,
        workouts: [...customWorkouts],
        createdAt: Date.now()
    };

    try {
        await addDoc(collection(db, "client_analytics"), newRecord);
    } catch (e) {
        console.error("Error adding document to Firebase: ", e);
    }

    programModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    programModal.classList.add('hidden');
});

// FIREBASE REAL-TIME SYNC: Fetch Client Analytics List from Firestore
const q = query(collection(db, "client_analytics"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    savedClientAnalytics = [];
    snapshot.forEach((docSnap) => {
        savedClientAnalytics.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderAnalyticsList();
});

function renderAnalyticsList() {
    analyticsClientList.innerHTML = '';
    analyticsCount.textContent = `${savedClientAnalytics.length} Saved`;

    if (savedClientAnalytics.length === 0) {
        analyticsClientList.innerHTML = `<p class="text-[11px] text-slate-600 italic">No saved client routines found in Cloud.</p>`;
        return;
    }

    savedClientAnalytics.forEach((client) => {
        const item = document.createElement('div');
        item.className = "bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-2.5 rounded-xl flex justify-between items-center cursor-pointer transition";
        item.innerHTML = `
            <div>
                <h4 class="font-bold text-slate-200 text-xs flex items-center">
                    <i class="fa-solid fa-cloud text-emerald-400 mr-1.5 text-[10px]"></i> ${client.name}
                </h4>
                <p class="text-[9px] text-slate-500">${client.date} | Coach: ${client.coach || 'MD. Nadim Khan'}</p>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">View Routine</span>
                <button onclick="deleteAnalyticsRecord(event, '${client.id}')" class="text-slate-600 hover:text-rose-400 p-1">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;

        item.addEventListener('click', () => {
            pdfClientDisplay.textContent = `${client.name.toUpperCase()} - 5 WEEK PLAN`;
            pdfModeDisplay.textContent = `Mode: ${client.mode.toUpperCase()} | Coach: ${client.coach || 'MD. Nadim Khan'}`;
            pdfDate.textContent = client.date;
            modalProgramContent.innerHTML = generateRoutineHTML(client.name, client.mode, client.workouts);
            programModal.classList.remove('hidden');
        });

        analyticsClientList.appendChild(item);
    });
}

// Delete Record from Firebase Firestore
window.deleteAnalyticsRecord = async function(event, docId) {
    event.stopPropagation();
    if(confirm("Delete this client routine record permanently from Cloud?")) {
        try {
            await deleteDoc(doc(db, "client_analytics", docId));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    }
}

// EXPORT BACKUP DATA (JSON)
exportDataBtn.addEventListener('click', () => {
    if (savedClientAnalytics.length === 0) {
        alert("No client analytics data to export!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedClientAnalytics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Coach_Nadim_Client_Analytics_Backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// IMPORT BACKUP DATA (JSON)
importDataInput.addEventListener('change', (e) => {
    const fileReader = new FileReader();
    if (e.target.files.length === 0) return;

    fileReader.onload = async (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                for (const item of importedData) {
                    delete item.id;
                    await addDoc(collection(db, "client_analytics"), { ...item, createdAt: Date.now() });
                }
                alert("Client analytics data imported to Firebase successfully!");
            } else {
                alert("Invalid JSON format.");
            }
        } catch (err) {
            alert("Error importing to Firebase.");
        }
    };
    fileReader.readAsText(e.target.files[0]);
});

// Multi-Page PDF Export
downloadPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('pdfContent');
    const clientName = document.getElementById('clientName').value.trim() || 'Client';
    const coachName = document.getElementById('coachName').value.trim() || 'MD. Nadim Khan';

    const originalStyle = element.getAttribute('style') || '';
    
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#0f172a';
    element.style.padding = '20px';

    const coachHeaderHtml = `
        <div id="tempPdfHeader" class="border-b-2 border-emerald-500 pb-3 mb-4 flex justify-between items-center">
            <div>
                <h1 class="text-lg font-extrabold text-slate-900 tracking-wide">${clientName.toUpperCase()} - WORKOUT BLOCK</h1>
                <p class="text-xs font-semibold text-emerald-600">Head Coach: ${coachName} (Certified Fitness Specialist)</p>
            </div>
            <div class="text-right">
                <span class="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-300">${currentMode.toUpperCase()}</span>
                <p class="text-[10px] text-slate-500 mt-1">${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;

    element.insertAdjacentHTML('afterbegin', coachHeaderHtml);

    const cards = element.querySelectorAll('#modalProgramContent > div');
    cards.forEach(card => {
        card.style.backgroundColor = '#f8fafc';
        card.style.borderColor = '#cbd5e1';
        card.style.color = '#0f172a';
        card.style.marginBottom = '15px';
        card.style.pageBreakInside = 'avoid';
    });

    const textElements = element.querySelectorAll('.text-slate-300, .text-slate-400, .text-slate-200');
    textElements.forEach(el => {
        el.style.color = '#334155';
    });

    const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `${clientName}_5Week_Program_Coach_${coachName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, backgroundColor: '#ffffff', useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    downloadPdfBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Generating PDF...</span>`;

    html2pdf().set(opt).from(element).save().then(() => {
        const tempHeader = document.getElementById('tempPdfHeader');
        if (tempHeader) tempHeader.remove();

        element.setAttribute('style', originalStyle);
        cards.forEach(card => card.removeAttribute('style'));
        textElements.forEach(el => el.removeAttribute('style'));
        downloadPdfBtn.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> <span>Download 5-Week Program PDF</span>`;
    }).catch(err => {
        console.error(err);
        const tempHeader = document.getElementById('tempPdfHeader');
        if (tempHeader) tempHeader.remove();

        element.setAttribute('style', originalStyle);
        cards.forEach(card => card.removeAttribute('style'));
        textElements.forEach(el => el.removeAttribute('style'));
        downloadPdfBtn.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> <span>Download 5-Week Program PDF</span>`;
    });
});

populateSplitOptions();
renderWorkouts();