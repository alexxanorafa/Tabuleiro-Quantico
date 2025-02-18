    // ============ SISTEMA DE MENU ============
    const menuIcon = document.getElementById("menuIcon");
    const menu = document.getElementById("menu");

    menuIcon.addEventListener("click", function(e) {
        e.stopPropagation();
        menu.classList.toggle("active");
        menuIcon.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
            menu.classList.remove("active");
            menuIcon.classList.remove("active");
        }
    });

    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("mouseenter", function() {
            this.style.transform = "translateY(-3px)";
        });
        item.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
        });
    });

// Configurações e Variáveis Globais
let timer = 30; // Tempo inicial em segundos
let intervalId = null;
let currentWord = "";
let score = 0;

const validWords = ["TEST", "GAME", "CODE", "WORD", "PLAY"];
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterScores = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Elementos do DOM
let gameBoard, currentWordDisplay, scoreDisplay, timerDisplay, digitalClock;

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar elementos do DOM
  gameBoard = document.getElementById("game-board");
  currentWordDisplay = document.getElementById("current-word");
  scoreDisplay = document.getElementById("score-display");
  timerDisplay = document.getElementById("timer");
  digitalClock = document.getElementById("digital-clock");

  // Configurar eventos
  document.getElementById("start-game").addEventListener("click", startGame);
  document.getElementById("pause-game").addEventListener("click", pauseGame);
  document.getElementById("reset-game").addEventListener("click", resetGame);
  document.getElementById("submit-word").addEventListener("click", submitWord);
  document.getElementById("reset-word").addEventListener("click", resetWord);

  // Inicializar tabuleiro
  generateBoard();

  // Atualizar relógio digital
  updateDigitalClock();
});

function startGame() {
  resetGame();
  intervalId = setInterval(updateTimer, 1000);
}

function pauseGame() {
  clearInterval(intervalId);
}

function resetGame() {
  clearInterval(intervalId);
  timer = 30;
  score = 0;
  if (timerDisplay) timerDisplay.textContent = formatTime(timer);
  if (scoreDisplay) scoreDisplay.textContent = "Pontuação: 0";
  resetWord();
  updateBoardHighlight();
}

function updateTimer() {
  if (timer > 0) {
    timer--;
    if (timerDisplay) timerDisplay.textContent = formatTime(timer);

    // Atualizar animação do relógio com base no tempo restante
    animateClock("left-clock", true, timer);
    animateClock("right-clock", false, timer);
  } else {
    clearInterval(intervalId);
    alert("⏰ Tempo esgotado!");
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function generateBoard() {
  if (!gameBoard) return;

  gameBoard.innerHTML = "";
  letters.forEach((letter) => {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    cell.textContent = letter;
    cell.dataset.letter = letter;

    if (Math.random() < 0.1) {
      cell.classList.add("bonus");
      cell.dataset.bonus = "2x";
    }

    cell.addEventListener("click", () => {
      addLetter(letter);
      cell.classList.add("selected");
    });

    gameBoard.appendChild(cell);
  });
}

function addLetter(letter) {
  currentWord += letter;
  updateWordDisplay();
}

function resetWord() {
  currentWord = "";
  updateWordDisplay();
  updateBoardHighlight();
}

function updateWordDisplay() {
  if (currentWordDisplay) currentWordDisplay.textContent = currentWord || "_";
}

function updateBoardHighlight() {
  document.querySelectorAll(".board-cell").forEach((cell) => {
    cell.classList.remove("selected");
  });
}

function submitWord() {
  if (!currentWord) {
    alert("Nenhuma palavra formada!");
    return;
  }

  // Aceitar todas as palavras sem validação
  updateScore(currentWord);
  resetWord();
}

function updateScore(word) {
  let points = 0;
  word.split("").forEach((letter) => {
    points += letterScores[letter.toUpperCase()] || 0;
  });

  document.querySelectorAll(".selected").forEach((cell) => {
    if (cell.dataset.bonus === "2x") {
      points *= 2;
    }
  });

  score += points;
  if (scoreDisplay) scoreDisplay.textContent = `Pontuação: ${score}`;
}

function animateClock(clockId, highlightCurrentHour, remainingTime) {
  const clock = document.getElementById(clockId);
  if (!clock) {
    console.warn(`Elemento #${clockId} não encontrado.`);
    return;
  }

  const hourHand = clock.querySelector(".hour-hand");
  const minuteHand = clock.querySelector(".minute-hand");

  if (!hourHand || !minuteHand) return;

  const totalSeconds = 30;
  const elapsedTime = totalSeconds - remainingTime;
  const percentageElapsed = elapsedTime / totalSeconds;

  const minuteAngle = 360 * percentageElapsed;
  const hourAngle = minuteAngle / 12;

  minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
  hourHand.style.transform = `rotate(${hourAngle}deg)`;
}

// Função corrigida para atualizar o relógio digital
function updateDigitalClock() {
  if (!digitalClock) return;

  const currentDate = new Date();

  // Ajustar para o fuso horário desejado
  const timeZoneOffset = 1; // GMT+1, altere conforme necessário
  currentDate.setHours(currentDate.getHours() + timeZoneOffset);

  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();

  digitalClock.textContent = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // Atualiza o relógio a cada minuto
  setTimeout(updateDigitalClock, 60000);
}
