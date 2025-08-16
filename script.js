// 1️⃣ First Page navigation
const firstPage = document.getElementById("firstPage");
const gamePage = document.getElementById("gamePage");

document.getElementById("buildBtn").addEventListener("click", () => {
    firstPage.style.display = "none";
    gamePage.style.display = "flex"; // so your CSS flex layout works
});


document.getElementById("playBtn").addEventListener("click", () => {
    alert("Play DFA will be implemented later!");
});

// Modes
let transitionMode = false;
let deleteMode = false;
let selectedState = null;
let transitions = [];
let deleteTransitionMode = false;
let setStartMode = false;
let toggleFinalMode = false;


const addTransitionBtn = document.getElementById("addTransitionBtn");
const deleteStateBtn = document.getElementById("deleteStateBtn");
const deleteTransitionBtn = document.getElementById("deleteTransitionBtn");

//---Get Alphabet from User ---
let alphabet = new Set();

function setAlphabet() {
    // Show existing alphabet if present, else empty
    const current = [...alphabet].join(",");
    const input = prompt(
        "Enter DFA alphabet symbols separated by commas (e.g., a,b,c):",
        current // <-- pre-fill with existing symbols
    );
    if (!input) return;

    alphabet = new Set(
        input
            .split(",")
            .map(s => s.trim())
            .filter(s => s.length > 0)
    );
    alert(`✅ DFA alphabet set to: ${[...alphabet].join(", ")}`);
}

// Button
document.getElementById("setAlphabetBtn").addEventListener("click", setAlphabet);


// Transition mode toggle
addTransitionBtn.addEventListener("click", () => {
    transitionMode = !transitionMode;

    // Turn off other modes
    if (transitionMode) {
        deleteMode = false;
        deleteTransitionMode = false;
        toggleFinalMode = false;

        deleteStateBtn.classList.remove("active");
        deleteTransitionBtn.classList.remove("active");
        toggleFinalBtn.classList.remove("active");
        addTransitionBtn.classList.add("active");
    } else {
        addTransitionBtn.classList.remove("active");
    }
});

// ---------- Delete State Mode Toggle ----------
deleteStateBtn.addEventListener("click", () => {
    deleteMode = !deleteMode;

    // Turn off other modes
    if (deleteMode) {
        transitionMode = false;
        deleteTransitionMode = false;
        toggleFinalMode = false;

        addTransitionBtn.classList.remove("active");
        deleteTransitionBtn.classList.remove("active");
        toggleFinalBtn.classList.remove("active");
        deleteStateBtn.classList.add("active");
    } else {
        deleteStateBtn.classList.remove("active");
    }
});

// ---------- Delete Transition Mode Toggle ----------
deleteTransitionBtn.addEventListener("click", () => {
    deleteTransitionMode = !deleteTransitionMode;

    // Turn off other modes
    if (deleteTransitionMode) {
        transitionMode = false;
        deleteMode = false;
        toggleFinalMode = false;

        addTransitionBtn.classList.remove("active");
        deleteStateBtn.classList.remove("active");
        toggleFinalBtn.classList.remove("active");
        deleteTransitionBtn.classList.add("active");
    } else {
        deleteTransitionBtn.classList.remove("active");
    }
});

// 2️⃣ Canvas setup
const canvas = document.getElementById("dfaCanvas");
const ctx = canvas.getContext("2d");

let states = [];
let stateCount = 0;
let draggingState = null;
let offsetX, offsetY;
const textOffset = 10; // Distance between label and line/curve
const curveGap = 30; // Base gap for reverse curve stacking

// Draw all transitions and states together
function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTransitions();
    drawStates();
}

// Draw states
function drawStates() {
    states.forEach(state => {
        ctx.beginPath();
        ctx.arc(state.x, state.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = "#222";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(state.name, state.x, state.y);
        // Start state arrow (before circle)
        if (state.isStart) {
            ctx.strokeStyle = "green";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(state.x - 50, state.y);
            ctx.lineTo(state.x - 30, state.y);
            ctx.stroke();
            // Little arrow head
            ctx.beginPath();
            ctx.moveTo(state.x - 30, state.y);
            ctx.lineTo(state.x - 35, state.y - 5);
            ctx.lineTo(state.x - 35, state.y + 5);
            ctx.closePath();
            ctx.fillStyle = "green";
            ctx.fill();
        }

        // Final state double circle
        if (state.isFinal) {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(state.x, state.y, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

    });
}

// Draw transitions with proper reverse handling
function drawTransitions() {
    transitions.forEach(tr => {
        const from = tr.from;
        const to = tr.to;
        const symbol = tr.symbol;

        if (from === to) {
            // === Self-loop ===
            const radius = 20;
            const loopOffsetY = 40;

            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(from.x, from.y - loopOffsetY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Arrowhead for self-loop
            const angle = Math.PI / 4;
            const arrowTipX = from.x + radius * Math.cos(angle);
            const arrowTipY = from.y - loopOffsetY + radius * Math.sin(angle);
            const dx = from.x - arrowTipX;
            const dy = from.y - arrowTipY;
            const arrowAngle = Math.atan2(dy, dx);
            const arrowLength = 10;

            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.moveTo(arrowTipX, arrowTipY);
            ctx.lineTo(
                arrowTipX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
                arrowTipY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
            );
            ctx.lineTo(
                arrowTipX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
                arrowTipY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // Label for self-loop
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText(symbol, from.x, from.y - loopOffsetY - radius - 10);
        }
        else {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angle = Math.atan2(dy, dx);

            const startX = from.x + 30 * Math.cos(angle);
            const startY = from.y + 30 * Math.sin(angle);
            const endX = to.x - 30 * Math.cos(angle);
            const endY = to.y - 30 * Math.sin(angle);

            // Reverse transition detection
            let reverseCount = transitions.filter(t => t.from === to && t.to === from).length;

            if (reverseCount > 0) {
                // === Curved line for reverse transition ===
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                const perpX = -(endY - startY);
                const perpY = endX - startX;
                const length = Math.sqrt(perpX * perpX + perpY * perpY);
                const normX = (perpX / length) * curveGap * reverseCount;
                const normY = (perpY / length) * curveGap * reverseCount;

                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(midX + normX, midY + normY, endX, endY);
                ctx.stroke();

                // Arrowhead for curve
                const arrowAngle = Math.atan2(endY - (midY + normY), endX - (midX + normX));
                const arrowLength = 10;
                ctx.fillStyle = "yellow";
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
                    endY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
                );
                ctx.lineTo(
                    endX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
                    endY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();

                // === Label spacing fix ===
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.font = "16px Arial";

                const labelYOffsetAbove = -2;  // space for above curves
                const labelYOffsetBelow = 1;  // extra space for below curves

                // Decide curve direction
                if (from.x < to.x || (from.x === to.x && from.y < to.y)) {
                    // Curve below
                    ctx.fillText(symbol, midX + normX, midY + normY + labelYOffsetBelow);
                } else {
                    // Curve above
                    ctx.fillText(symbol, midX + normX, midY + normY - labelYOffsetAbove);
                }
            }
            else {
                // === Straight line ===
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Arrowhead
                const arrowLength = 10;
                ctx.fillStyle = "yellow";
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle - Math.PI / 6),
                    endY - arrowLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + Math.PI / 6),
                    endY - arrowLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();

                // Label
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.font = "16px Arial";
                const textOffset = 10;
                ctx.fillText(symbol, (startX + endX) / 2, (startY + endY) / 2 - textOffset);
            }
        }
    });
}


// Add state
function addState() {
    const x = Math.random() * (canvas.width - 60) + 30;
    const y = Math.random() * (canvas.height - 60) + 30;
    const stateName = `q${stateCount}`;
    states.push({ name: stateName, x, y, isStart: false, isFinal: false });
    stateCount++;
    drawAll();
}

// Buttons
document.getElementById("addStateBtn").addEventListener("click", addState);
document.getElementById("clearBtn").addEventListener("click", () => {
    states = [];
    transitions = [];
    stateCount = 0;
    drawAll();

    // reset modes + button glow (optional but nice)
    transitionMode = false;
    deleteMode = false;
    toggleFinalMode = false;

    toggleFinalBtn.classList.remove("active");
    addTransitionBtn.classList.remove("active");
    deleteStateBtn.classList.remove("active");
    selectedState = null;
});

//Set Start State
setStartBtn.addEventListener("click", () => {
    setStartMode = !setStartMode;

    if (setStartMode) {
        // Turn off other modes
        transitionMode = false;
        deleteMode = false;
        deleteTransitionMode = false;
        toggleFinalMode = false;

        addTransitionBtn.classList.remove("active");
        deleteStateBtn.classList.remove("active");
        deleteTransitionBtn.classList.remove("active");
        toggleFinalBtn.classList.remove("active");
        setStartBtn.classList.add("active");
    } else {
        setStartBtn.classList.remove("active");
    }
});

//Set Final States
toggleFinalBtn.addEventListener("click", () => {
    toggleFinalMode = !toggleFinalMode;

    if (toggleFinalMode) {
        // Turn off other modes
        transitionMode = false;
        deleteMode = false;
        deleteTransitionMode = false;
        setStartMode = false;

        addTransitionBtn.classList.remove("active");
        deleteStateBtn.classList.remove("active");
        deleteTransitionBtn.classList.remove("active");
        setStartBtn.classList.remove("active");
        toggleFinalBtn.classList.add("active");
    } else {
        toggleFinalBtn.classList.remove("active");
    }
});

// Mouse events
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Transition mode
    if (transitionMode) {
        let clickedState = null;
        for (let state of states) {
            const dx = mouseX - state.x;
            const dy = mouseY - state.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                clickedState = state;
                break;
            }
        }
        if (!clickedState) return;

        if (!selectedState) {
            selectedState = clickedState;
            return;
        } else {
            let symbol = prompt(`Enter symbol for transition ${selectedState.name} → ${clickedState.name}:`);
            if (!symbol) {
                selectedState = null;
                return;
            }

            // --- NEW: Alphabet Validation ---
            if (!alphabet.has(symbol)) {
                alert(`❌ Error: '${symbol}' is not in the DFA alphabet!`);
                selectedState = null; // reset selection
                return; // do not add invalid transition
            }

            // Add transition (merge if existing)
            const existing = transitions.find(t => t.from === selectedState && t.to === clickedState);
            if (existing) {
                existing.symbol += `,${symbol}`;
            } else {
                transitions.push({ from: selectedState, to: clickedState, symbol });
            }

            selectedState = null;
            drawAll();
        }
        return;
    }


    // Delete mode
    if (deleteMode) {
        for (let i = 0; i < states.length; i++) {
            const state = states[i];
            const dx = mouseX - state.x;
            const dy = mouseY - state.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                // Remove the clicked state
                const doomed = states[i];
                states.splice(i, 1);

                // Remove any transitions that involved it
                transitions = transitions.filter(tr => tr.from !== doomed && tr.to !== doomed);

                drawAll();

                // IMPORTANT: stay in delete mode so user can keep deleting
                // (no deleteMode = false; here)
                return; // done handling this click
            }
        }
        return; // click wasn't on a state; still stay in delete mode
    }

    //for deleting transitions
    if (deleteTransitionMode) {
        for (let i = 0; i < transitions.length; i++) {
            const tr = transitions[i];
            const from = tr.from;
            const to = tr.to;

            let startX, startY, endX, endY, midX, midY;

            if (from === to) { // self-loop
                const loopOffsetY = 40;
                const radius = 20;
                const dx = mouseX - from.x;
                const dy = mouseY - (from.y - loopOffsetY);
                if (Math.sqrt(dx * dx + dy * dy) < radius + 5) {
                    // Prompt to edit symbols
                    const input = prompt(
                        `Edit symbols for self-loop on ${from.name} (comma separated):`,
                        tr.symbol
                    );
                    if (input === null) return;
                    const symbolsArray = input.split(",").map(s => s.trim()).filter(s => s.length > 0);

                    // Validate symbols against alphabet
                    const invalidSymbols = symbolsArray.filter(s => !alphabet.has(s));
                    if (invalidSymbols.length > 0) {
                        alert(`❌ Invalid symbol(s): ${invalidSymbols.join(", ")}\nUse only DFA alphabet: ${[...alphabet].join(", ")}`);
                        return;
                    }

                    if (symbolsArray.length > 0) {
                        tr.symbol = symbolsArray.join(",");
                    } else {
                        transitions.splice(i, 1); // remove transition if blank
                    }

                    drawAll();
                    return;
                }
            } else { // normal transition
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                startX = from.x + 30 * Math.cos(angle);
                startY = from.y + 30 * Math.sin(angle);
                endX = to.x - 30 * Math.cos(angle);
                endY = to.y - 30 * Math.sin(angle);

                const reverseCount = transitions.filter(t => t.from === to && t.to === from).length;
                midX = (startX + endX) / 2;
                midY = (startY + endY) / 2;

                if (reverseCount > 0) {
                    const perpX = -(endY - startY);
                    const perpY = endX - startX;
                    const length = Math.sqrt(perpX * perpX + perpY * perpY);
                    midX += (perpX / length) * curveGap * reverseCount;
                    midY += (perpY / length) * curveGap * reverseCount;
                }

                const dist = Math.sqrt((mouseX - midX) ** 2 + (mouseY - midY) ** 2);
                if (dist < 15) {
                    // Prompt to edit symbols
                    const input = prompt(
                        `Edit symbols for transition ${from.name} → ${to.name} (comma separated):`,
                        tr.symbol
                    );
                    if (input === null) return;

                    const symbolsArray = input.split(",").map(s => s.trim()).filter(s => s.length > 0);

                    const invalidSymbols = symbolsArray.filter(s => !alphabet.has(s));
                    if (invalidSymbols.length > 0) {
                        alert(`❌ Invalid symbol(s): ${invalidSymbols.join(", ")}\nUse only DFA alphabet: ${[...alphabet].join(", ")}`);
                        return;
                    }

                    if (symbolsArray.length > 0) {
                        tr.symbol = symbolsArray.join(",");
                    } else {
                        transitions.splice(i, 1); // remove if empty
                    }

                    drawAll();
                    return;
                }
            }
        }
        return;
    }

    // Set start state mode
    if (setStartMode) {
        for (let state of states) {
            const dx = mouseX - state.x;
            const dy = mouseY - state.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                states.forEach(s => s.isStart = false); // only one start
                state.isStart = true;
                setStartMode = false;
                setStartBtn.classList.remove("active"); // turn off highlight
                drawAll();
                return;
            }
        }
    }

    // Toggle final state mode
    if (toggleFinalMode) {
        for (let state of states) {
            const dx = mouseX - state.x;
            const dy = mouseY - state.y;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                state.isFinal = !state.isFinal;
                drawAll();
                return;
            }
        }
    }


    // Dragging
    for (let state of states) {
        const dx = mouseX - state.x;
        const dy = mouseY - state.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            draggingState = state;
            offsetX = dx;
            offsetY = dy;
            break;
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (draggingState) {
        const rect = canvas.getBoundingClientRect();
        draggingState.x = e.clientX - rect.left - offsetX;
        draggingState.y = e.clientY - rect.top - offsetY;
        drawAll();
    }
});

canvas.addEventListener("mouseup", () => draggingState = null);
canvas.addEventListener("mouseleave", () => draggingState = null);

//Save & Load DFA functionality
const loadDropdown = document.getElementById("loadDFADropdown");

//Initial Population
let savedDFAs = JSON.parse(localStorage.getItem("dfas") || "{}");
updateLoadDropdown();

//Update Load button
function updateLoadDropdown() {
    loadDropdown.innerHTML = '<option value="" disabled selected>Load DFA</option>';
    for (const name in savedDFAs) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        loadDropdown.appendChild(option);
    }
}

//For changing count in states
function recomputeStateCountFromNames() {
    // look for trailing digits in each state's name (q0, q12, S3, whatever)
    const nums = states.map(s => {
        const m = /(\d+)$/.exec(s.name);
        return m ? parseInt(m[1], 10) : -1;  // -1 if no trailing number
    });
    const maxNum = nums.reduce((acc, n) => Math.max(acc, n), -1);
    stateCount = maxNum + 1; // next index
}


//New Dfa
document.getElementById("newDFABtn").addEventListener("click", () => {
    states = [];
    transitions = [];
    stateCount = 0;
    selectedState = null;

    // Clear dropdown selection so no DFA is currently selected
    loadDropdown.value = "";

    drawAll();
});


// --- Load DFA ---
loadDropdown.addEventListener("change", () => {
    const selectedName = loadDropdown.value;
    if (!savedDFAs[selectedName]) return;

    const mode = confirm("Press OK to edit this DFA, Cancel to load as new DFA") ? "edit" : "new";
    const dfaCopy = JSON.parse(JSON.stringify(savedDFAs[selectedName]));

    if (mode === "edit") {
        // Use original objects (edit in-place)
        states = dfaCopy.states.map(s => ({ ...s, isStart: !!s.isStart, isFinal: !!s.isFinal }));
        transitions = dfaCopy.transitions.map(t => ({
            from: states.find(s => s.name === t.from.name),
            to: states.find(s => s.name === t.to.name),
            symbol: t.symbol
        }));
        alphabet = new Set(dfaCopy.alphabet || []);
    } else {
        // Load as new DFA (clone so original stays untouched)
        states = dfaCopy.states.map(s => ({ ...s, isStart: !!s.isStart, isFinal: !!s.isFinal }));
        transitions = dfaCopy.transitions.map(t => ({
            from: states.find(s => s.name === t.from.name),
            to: states.find(s => s.name === t.to.name),
            symbol: t.symbol
        }));
        alphabet = new Set(dfaCopy.alphabet || []);
        recomputeStateCountFromNames(); // ensure new states continue from the highest index
    }

    drawAll();
});

// Save DFA
document.getElementById("saveDFABtn").addEventListener("click", () => {
    let name = prompt("Enter name for this DFA:");
    if (!name) return;

    // Check if this name already exists
    if (savedDFAs[name]) {
        if (!confirm(`DFA "${name}" already exists. Overwrite?`)) return;
    }

    savedDFAs[name] = {
        states: states.map(s => ({ ...s })),
        transitions: transitions.map(t => ({ ...t })),
        alphabet: [...alphabet] // save current alphabet
    };

    // Save to localStorage
    localStorage.setItem("dfas", JSON.stringify(savedDFAs));

    updateLoadDropdown();

    // Optional: select this DFA in dropdown
    loadDropdown.value = name;
});

// Delete DFA
document.getElementById("deleteDFABtn").addEventListener("click", () => {
    const selectedName = loadDropdown.value;
    if (!selectedName) return;

    if (confirm(`Are you sure you want to delete DFA "${selectedName}"?`)) {
        delete savedDFAs[selectedName];
        localStorage.setItem("dfas", JSON.stringify(savedDFAs));
        updateLoadDropdown();

        // Clear selection
        loadDropdown.value = "";

        // Clear the canvas (states, transitions, etc.)
        states = [];
        transitions = [];
        stateCount = 0;
        selectedState = null;
        drawAll();
    }
});



// Initial draw
drawAll();
//yo