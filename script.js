// Initialize the balls deck
// Bingo draw generator: returns strings like "B12", "I23", etc.
const allBalls = [];
// Track drawn codes for safety (shouldn't be needed because we pop from allBalls, but defensive)
const drawnSet = new Set();

// Build the 75 bingo balls grouped by letter ranges
function buildBalls() {
    const ranges = [
        { letter: 'B', start: 1, end: 15 },
        { letter: 'I', start: 16, end: 30 },
        { letter: 'N', start: 31, end: 45 },
        { letter: 'G', start: 46, end: 60 },
        { letter: 'O', start: 61, end: 75 }
    ];
    allBalls.length = 0; // clear
    for (const r of ranges) {
        for (let n = r.start; n <= r.end; n++) {
            allBalls.push({ code: `${r.letter}${n}`, number: n, letter: r.letter });
        }
    }
}

// Shuffle array in-place (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize the balls deck
buildBalls();
shuffle(allBalls);

function drawBall() {
    if (allBalls.length === 0) return null;
    // Pop to avoid repeats
    const b = allBalls.pop();
    if (b) drawnSet.add(b.code);
    return b;
}

function updateDisplay(ball){
    const numberDisplay = document.getElementById('numberDisplay');
    if (!numberDisplay) return;
    // Mostrar com hífen entre letra e número: ex. "B-12"
    numberDisplay.textContent = ball ? `${ball.letter}-${ball.number}` : '';
}

function updateHistory(ball){
    const history = document.getElementById('drawnNumbersList');
    if (!history) return;
    const listItem = document.createElement('li');
    listItem.textContent = ball ? ball.code : '';
    history.appendChild(listItem);
}

// Add the drawn number to the bingo panel at the correct index
function addToBingoPanel(ball){
    if (!ball) return;
    // Find the slot in the column that has this number and mark it
    const container = document.getElementById(`cells-${ball.letter}`);
    if (!container) return;
    const slots = Array.from(container.querySelectorAll('.bingo-cell'));
    const slot = slots.find(s => Number(s.dataset.number) === Number(ball.number));
    if (!slot) {
        // number not on this 5x5 card column (it may be absent) -> ignore
        return;
    }
    if (!slot.classList.contains('marked')){
        slot.classList.add('marked');
        // reveal number when marked
        slot.textContent = slot.dataset.number;
    }
}

function resetGame(){
    // Rebuild and reshuffle deck
    buildBalls();
    shuffle(allBalls);
    // Clear display and history
    updateDisplay(null);
    const history = document.getElementById('drawnNumbersList');
    if (history) history.innerHTML = '';
    // Clear bingo panel cells and classes
    const letters = ['B','I','N','G','O'];
    for (const L of letters) {
        const c = document.getElementById(`cells-${L}`);
        if (c) c.innerHTML = '';
    }
    const cols = document.querySelectorAll('.bingo-column');
    cols.forEach(col => col.classList.remove('column-complete'));
    const slots = document.querySelectorAll('.bingo-cell');
    slots.forEach(s => s.classList.remove('row-complete', 'marked'));
    document.body.classList.remove('cartela-completa');
    // Recreate grid slots
    initBingoGrid();
}

// Hook up buttons (assumes elements exist in HTML)
const drawBtn = document.getElementById('drawButton');
if (drawBtn) {
    drawBtn.addEventListener('click', function(){
        // Draw until we find the first ball that matches an unmarked slot on the card
        let ball = null;
        let matchedBall = null;
        while (true){
            ball = drawBall();
            if (!ball) break; // deck empty
            const container = document.getElementById(`cells-${ball.letter}`);
            const slot = container ? Array.from(container.querySelectorAll('.bingo-cell')).find(s => Number(s.dataset.number) === ball.number) : null;
            if (slot && !slot.classList.contains('marked')){
                matchedBall = ball;
                break;
            }
            // else ignore this ball and continue drawing until match or deck exhaust
        }

        if (!matchedBall){
            alert('Nenhum número restante do cartão foi encontrado nas bolas restantes. Reiniciando o jogo.');
            resetGame();
            return;
        }

        // Reveal only the matched ball
        updateDisplay(matchedBall);
        updateHistory(matchedBall);
        addToBingoPanel(matchedBall);
        // After adding, check completions
        checkColumnComplete(matchedBall.letter);
        checkRowComplete();
        checkCartelaComplete();
        console.log('Sorteado (revelado):', matchedBall.code);
    });
}

// Optional: expose reset button if exists
const resetBtn = document.getElementById('resetButton');
if (resetBtn) {
    resetBtn.addEventListener('click', function(){
        resetGame();
    });
}

// Inicializa 15 slots por coluna (15x5 grid)
function shuffleArray(arr){
    for (let i = arr.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// Inicializa cartão 5x5: para cada coluna pega 5 números únicos da faixa e cria 5 slots
function initBingoGrid(){
    const ranges = {
        'B': { start: 1, end: 15 },
        'I': { start: 16, end: 30 },
        'N': { start: 31, end: 45 },
        'G': { start: 46, end: 60 },
        'O': { start: 61, end: 75 }
    };
    const letters = Object.keys(ranges);
    for (const L of letters) {
        const container = document.getElementById(`cells-${L}`);
        if (!container) continue;
        container.innerHTML = '';
        // build array of possible numbers for the column
        const nums = [];
        for (let n = ranges[L].start; n <= ranges[L].end; n++) nums.push(n);
        shuffleArray(nums);
        const chosen = nums.slice(0,5); // 5 numbers for this column
        // sort chosen if you want them ordered in the column (optional)
        // chosen.sort((a,b)=>a-b);
        for (let i = 0; i < 5; i++){
            const slot = document.createElement('div');
            slot.className = 'bingo-cell';
            slot.dataset.number = chosen[i];
            // number hidden initially; reveal when marked
            slot.textContent = '';
            container.appendChild(slot);
        }
    }
}

// Run init on load
initBingoGrid();

// Checa se uma coluna foi completada (15 marcados)
function checkColumnComplete(letter){
    const container = document.getElementById(`cells-${letter}`);
    if (!container) return;
    // Consider only slots that actually have a data-number (defensive: ignore placeholders)
    const slots = Array.from(container.querySelectorAll('.bingo-cell')).filter(s => s.dataset && s.dataset.number);
    if (slots.length === 0) return;
    const markedCount = slots.filter(s => s.classList.contains('marked')).length;
    const colEl = document.getElementById(`col-${letter}`);
    // Mark column complete only when all available slots in the column are marked
    if (markedCount === slots.length) {
        if (colEl && !colEl.classList.contains('column-complete')) {
            colEl.classList.add('column-complete');
            console.log(`Coluna ${letter} marcada completa (marked=${markedCount}/${slots.length})`);
        }
    }
}

// Checa linhas horizontais (cada linha index 0..14). Uma linha é completa quando as 5 colunas têm that row marked.
function checkRowComplete(){
    const letters = ['B','I','N','G','O'];
    // 5 rows (0..4)
    for (let row = 0; row < 5; row++){
        let count = 0;
        const slotsInRow = [];
        for (const L of letters){
            const container = document.getElementById(`cells-${L}`);
            if (!container) continue;
            const slots = Array.from(container.querySelectorAll('.bingo-cell'));
            const slot = slots[row];
            if (!slot) continue;
            slotsInRow.push(slot);
            if (slot.classList.contains('marked')) count++;
        }
        if (count >= 5){
            // Mark the row
            slotsInRow.forEach(s => s.classList.add('row-complete'));
           
            // We can stop after first found to avoid multiple alerts for same row
            return;
        }
    }
}

// Checa se todas as 75 células estão marcadas
function checkCartelaComplete(){
    const allSlots = document.querySelectorAll('.bingo-cell');
    const marked = Array.from(allSlots).filter(s => s.classList.contains('marked')).length;
    if (marked >= 25){
        if (!document.body.classList.contains('cartela-completa')){
            document.body.classList.add('cartela-completa');
            // Disparar efeito de fogos (overlay)
            showFireworks();
        }
    }
}

// Efeito simples de fogos: cria um overlay com animação CSS e remove após alguns segundos
function showFireworks(){
    // Previne múltiplas instâncias
    if (document.getElementById('fireworks-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fireworks-overlay';
    overlay.className = 'fireworks-overlay';

    // Cria conteúdo com várias 'bursts'
    for (let i = 0; i < 12; i++){
        const burst = document.createElement('div');
        burst.className = 'firework-burst';
        // posição aleatória
        burst.style.left = (10 + Math.random() * 80) + '%';
        burst.style.top = (10 + Math.random() * 60) + '%';
        burst.style.backgroundColor = `hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`;
        overlay.appendChild(burst);
    }

    document.body.appendChild(overlay);

    // Remover após 4s
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 1000);
    }, 4000);
}

