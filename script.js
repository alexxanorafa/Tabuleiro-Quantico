// JavaScript - Tabuleiro Quântico

// Elementos do DOM
const gameBoard = document.getElementById("game-board");
const currentWordDisplay = document.getElementById("current-word");
const submitButton = document.getElementById("submit-word");
const deleteButton = document.getElementById("delete-last");
const resetButton = document.getElementById("reset-word");
const scoreDisplay = document.getElementById("score-display");

// Variáveis de controle
let currentWord = "";
let score = 0;
const letters = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

// Função para criar o tabuleiro
document.addEventListener("DOMContentLoaded", () => {
  generateBoard();
});

function generateBoard() {
  gameBoard.innerHTML = ""; // Limpar tabuleiro

  letters.forEach((letter) => {
    const cell = document.createElement("div");
    cell.classList.add("board-cell");
    cell.textContent = letter;
    cell.setAttribute("data-letter", letter);

    // Adicionar evento de clique
    cell.addEventListener("click", () => {
      addLetter(letter);
      cell.classList.add("selected");
    });

    gameBoard.appendChild(cell);
  });
}

// Funções de controle da palavra
function addLetter(letter) {
  currentWord += letter;
  updateWordDisplay();
}

function deleteLastLetter() {
  if (currentWord.length > 0) {
    currentWord = currentWord.slice(0, -1);
    updateWordDisplay();
    updateBoardHighlight();
  }
}

function resetWord() {
  currentWord = "";
  updateWordDisplay();
  updateBoardHighlight();
}

function submitWord() {
  if (currentWord.length > 0) {
    alert(`Palavra enviada: ${currentWord}`);
    updateScore(currentWord.length);
    resetWord();
  } else {
    alert("Nenhuma palavra formada!");
  }
}

// Atualizar pontuação
function updateScore(points) {
  score += points;
  scoreDisplay.textContent = `Pontuação: ${score}`;
}

// Atualizar exibição da palavra
function updateWordDisplay() {
  currentWordDisplay.textContent = currentWord;
}

// Remover seleção das células
function updateBoardHighlight() {
  const cells = document.querySelectorAll(".board-cell");
  cells.forEach((cell) => {
    if (currentWord.includes(cell.getAttribute("data-letter"))) {
      cell.classList.add("selected");
    } else {
      cell.classList.remove("selected");
    }
  });
}

// Eventos dos botões
submitButton.addEventListener("click", submitWord);
deleteButton.addEventListener("click", deleteLastLetter);
resetButton.addEventListener("click", resetWord);
