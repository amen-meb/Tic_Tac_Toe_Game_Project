/* Game State and initialization of game elements */
let gridSize = 3;
let board =[];
let winConditions =[];
let currentPlayer = "X";
let gameMode = null; 
let aiLevel = "medium";
let isGameActive = false;
let scores = { X: 0, O: 0, Draw: 0 };

let playerNames = {
    X: "Player X",
    O: "Player O"
};

/* DOM Elements 
        for screens, inputs, buttons,  */

const mainMenuScreen = document.getElementById("main-menu-screen");
const configScreen = document.getElementById("config-screen");
const rulesScreen = document.getElementById("rules-screen");
const gameScreen = document.getElementById("game-screen");
const resultOverlay = document.getElementById("result-overlay");

const soloBtn = document.getElementById("soloBtn");
const duoBtn = document.getElementById("duoBtn");
const rulesBtn = document.getElementById("rulesBtn");
const backFromConfigBtn = document.getElementById("backFromConfigBtn");
const backFromRulesBtn = document.getElementById("backFromRulesBtn");
const startGameBtn = document.getElementById("startGameBtn");

const playerXInput = document.getElementById("playerXName");
const playerOInput = document.getElementById("playerOName");
const gridSizeSelect = document.getElementById("gridSize");
const difficultySelectionDiv = document.getElementById("difficulty-selection");
const aiDifficultySelect = document.getElementById("aiDifficulty");

const gameBoardContainer = document.getElementById("game-board");
const turnIndicator = document.getElementById("turn-indicator");
const resultMessage = document.getElementById("result-message");

const scoreXDisplay = document.getElementById("scoreX");
const scoreODisplay = document.getElementById("scoreO");
const scoreDrawDisplay = document.getElementById("scoreDraw");
const labelX = document.getElementById("labelX");
const labelO = document.getElementById("labelO");
const restartRoundBtn = document.getElementById("restartRoundBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

/* Screen Navigation Logic
   Using An event listener */

soloBtn.addEventListener("click", () => openConfigMode("single"));
duoBtn.addEventListener("click", () => openConfigMode("two"));
rulesBtn.addEventListener("click", () => {
    mainMenuScreen.classList.add("hidden");
    rulesScreen.classList.remove("hidden");
});

backFromRulesBtn.addEventListener("click", () => {
    rulesScreen.classList.add("hidden");
    mainMenuScreen.classList.remove("hidden");
});

backFromConfigBtn.addEventListener("click", () => {
    configScreen.classList.add("hidden");
    mainMenuScreen.classList.remove("hidden");
});

function openConfigMode(mode) {
    gameMode = mode;
    mainMenuScreen.classList.add("hidden");
    configScreen.classList.remove("hidden");
    
    if (mode === "single") {
        playerOInput.value = "Computer 🤖";
        playerOInput.disabled = true;
        difficultySelectionDiv.classList.remove("hidden");
    } else {
        playerOInput.value = "";
        playerOInput.disabled = false;
        playerOInput.placeholder = "Enter Player O Name";
        difficultySelectionDiv.classList.add("hidden");
    }
}

/* 
    Start Game function
     Initializes game state based on configuration, 
     generates board and win conditions, and transitions to game screen. 
    */
startGameBtn.addEventListener("click", startGame);

function startGame() {
    gridSize = parseInt(gridSizeSelect.value);
    aiLevel = aiDifficultySelect.value; 
    
    playerNames.X = playerXInput.value.trim() || "Player X";
    playerNames.O = playerOInput.value.trim() || (gameMode === "single" ? "Computer" : "Player O");

    labelX.textContent = playerNames.X;
    labelO.textContent = playerNames.O;

    configScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    restartRound();
}

/* Dynamic Board & Rules Generation
    */
function generateBoard() {
    gameBoardContainer.innerHTML = "";
    gameBoardContainer.style.setProperty("--grid-size", gridSize);
    board = new Array(gridSize * gridSize).fill("");

    for (let i = 0; i < board.length; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.setAttribute("data-index", i);
        cell.addEventListener("click", handleCellClick);
        gameBoardContainer.appendChild(cell);
    }
}

function generateWinConditions() {
    winConditions =[];
    for (let r = 0; r < gridSize; r++) {
        let row =[];
        for (let c = 0; c < gridSize; c++) { row.push(r * gridSize + c); }
        winConditions.push(row);
    }
    for (let c = 0; c < gridSize; c++) {
        let col =[];
        for (let r = 0; r < gridSize; r++) { col.push(r * gridSize + c); }
        winConditions.push(col);
    }
    let diag1 =[], diag2 =[];
    for (let i = 0; i < gridSize; i++) {
        diag1.push(i * gridSize + i);
        diag2.push(i * gridSize + (gridSize - 1 - i));
    }
    winConditions.push(diag1);
    winConditions.push(diag2);
}

/* Core Game parts
    Handling cell clicks, placing marks, switching turns, and checking for wins/draws.
    */
function handleCellClick(e) {
    const clickedCell = e.target;
    const cellIndex = parseInt(clickedCell.getAttribute("data-index"));

    if (board[cellIndex] !== "" || !isGameActive) {
        clickedCell.classList.add("invalid-flash");
        setTimeout(() => clickedCell.classList.remove("invalid-flash"), 300);
        return;
    }
    placeMark(cellIndex, currentPlayer);
}

function placeMark(index, symbol) {
    board[index] = symbol;
    updateCellUI(index, symbol);
    checkResult();
}

function switchTurn() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    turnIndicator.textContent = `${playerNames[currentPlayer]}'s Turn`;

    if (gameMode === "single" && currentPlayer === "O" && isGameActive) {
        turnIndicator.textContent = "Computer is thinking...";
        setTimeout(makeComputerMove, 600);
    }
}

function checkResult() {
    let roundWon = false;
    let winningCells =[];

    for (let i = 0; i < winConditions.length; i++) {
        const condition = winConditions[i];
        const firstCell = board[condition[0]];

        if (firstCell === "") continue;

        let isMatch = true;
        for (let j = 1; j < condition.length; j++) {
            if (board[condition[j]] !== firstCell) {
                isMatch = false; break;
            }
        }

        if (isMatch) {
            roundWon = true; winningCells = condition; break;
        }
    }

    if (roundWon) { endGame(currentPlayer, winningCells); return; }
    if (!board.includes("")) { endGame("Draw"); return; }
    
    switchTurn();
}

/*  AI Logic or computer move logic based on selected difficulty level.
    */
function makeComputerMove() {
    if (!isGameActive) return;
    let moveIndex = -1;

    if (aiLevel === "easy") {
        moveIndex = getRandomMove(board);
    } else if (aiLevel === "medium") {
        if (Math.random() < 0.30) { moveIndex = getRandomMove(board); } 
        else {
            moveIndex = findWinningMove(board, "O");
            if (moveIndex === -1) moveIndex = findBlockingMove(board, "X");
            if (moveIndex === -1) moveIndex = getRandomMove(board);
        }
    } else if (aiLevel === "hard") {
        moveIndex = findWinningMove(board, "O");
        if (moveIndex === -1) moveIndex = findBlockingMove(board, "X");
        if (moveIndex === -1) moveIndex = getRandomMove(board);
    } else if (aiLevel === "extra-hard") {
        moveIndex = findWinningMove(board, "O");
        if (moveIndex === -1) moveIndex = findBlockingMove(board, "X");
        if (moveIndex === -1) moveIndex = getBestMove(board);
    }

    if (moveIndex === -1) moveIndex = getRandomMove(board);

    const cell = document.querySelector(`.cell[data-index="${moveIndex}"]`);
    cell.classList.add("ai-thinking");
    setTimeout(() => {
        cell.classList.remove("ai-thinking");
        placeMark(moveIndex, "O");
    }, 200);
}

function getRandomMove(currentBoard) {
    let emptyCells =[];
    for (let i = 0; i < currentBoard.length; i++) { if (currentBoard[i] === "") emptyCells.push(i); }
    if (emptyCells.length === 0) return -1;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function findWinningMove(currentBoard, symbol) {
    for (let i = 0; i < winConditions.length; i++) {
        const condition = winConditions[i];
        let symbolCount = 0, emptyCount = 0, emptyIndex = -1;

        for (let j = 0; j < condition.length; j++) {
            let val = currentBoard[condition[j]];
            if (val === symbol) symbolCount++;
            else if (val === "") { emptyCount++; emptyIndex = condition[j]; }
        }
        if (symbolCount === gridSize - 1 && emptyCount === 1) return emptyIndex;
    }
    return -1;
}

function findBlockingMove(currentBoard, playerSymbol) { return findWinningMove(currentBoard, playerSymbol); }

function getBestMove(currentBoard) {
    let emptyCells =[];
    for (let i = 0; i < currentBoard.length; i++) { if (currentBoard[i] === "") emptyCells.push(i); }
    if (emptyCells.length === 0) return -1;

    const center = Math.floor((gridSize * gridSize) / 2);
    if (emptyCells.includes(center)) return center;

    const corners =[0, gridSize - 1, gridSize * (gridSize - 1), (gridSize * gridSize) - 1];
    for (let i = 0; i < corners.length; i++) { if (emptyCells.includes(corners[i])) return corners[i]; }

    return getRandomMove(currentBoard);
}

/* Game Cycle Functions
    Handling game ending, restarting round, and resetting entire game.
    */
function updateCellUI(index, symbol) {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = symbol;
    cell.setAttribute("data-player", symbol);
    cell.classList.add("taken");
}

function endGame(winner, winningCells =[]) {
    isGameActive = false;

    if (winner === "Draw") {
        scores.Draw++;
        scoreDrawDisplay.textContent = scores.Draw;
        resultMessage.textContent = "It's a Draw! 🤝";
    } else {
        scores[winner]++;
        winner === "X" ? scoreXDisplay.textContent = scores.X : scoreODisplay.textContent = scores.O;
        resultMessage.textContent = `${playerNames[winner]} Wins! ✨`;
        winningCells.forEach(index => { document.querySelector(`.cell[data-index="${index}"]`).classList.add("win-highlight"); });
    }

    setTimeout(() => { resultOverlay.classList.remove("hidden"); }, 500);
}

function restartRound() {
    generateWinConditions();
    generateBoard();
    currentPlayer = "X";
    isGameActive = true;
    turnIndicator.textContent = `${playerNames.X}'s Turn`;
    resultOverlay.classList.add("hidden");
}

function resetEntireGame() {
    scores = { X: 0, O: 0, Draw: 0 };
    scoreXDisplay.textContent = "0";
    scoreODisplay.textContent = "0";
    scoreDrawDisplay.textContent = "0";
    
    gameScreen.classList.add("hidden");
    mainMenuScreen.classList.remove("hidden");
    
    playerXInput.value = "";
    playerOInput.value = "";
}

restartRoundBtn.addEventListener("click", restartRound);
resetGameBtn.addEventListener("click", resetEntireGame);
playAgainBtn.addEventListener("click", restartRound);

/*  Dark Mode Logic
        Toggling dark mode class on body, saving preference in localStorage, and updating toggle button icon.
    */
const themeToggleBtn = document.getElementById("themeToggleBtn");
const body = document.body;

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    themeToggleBtn.textContent = "☀️";
}

themeToggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeToggleBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeToggleBtn.textContent = "🌙";
    }
});