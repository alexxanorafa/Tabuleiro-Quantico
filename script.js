// Dicionário simplificado de palavras válidas
const dictionary = [
    "CATA", "DOG", "RATO", "LUA", "SOL", "GATO", "PATO", "QUANTICO"
  ];
  
  // Pontuação de cada letra no estilo Scrabble
  const letterPoints = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1,
    M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };
  
  // Estado do jogo
  let isGameStarted = false;
  let selectedWord = "";
  let totalPoints = 0;
  
  document.addEventListener("// JavaScript - Tabuleiro Quântico

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
resetButton.addEventListener("click", resetWord);DOMContentLoaded", () => {
    const startGameBtn = document.getElementById("start-game-btn");
    const resetGameBtn = document.getElementById("reset-game-btn");
    const quantumBoard = document.getElementById("quantum-board");  // Corrigido de ouija-board para quantum-board
    const gameMessage = document.getElementById("game-message");
    const wordDisplay = document.getElementById("word-display"); // Elemento para mostrar a palavra
    const scoreValue = document.getElementById("score-value");  // Elemento para mostrar a pontuação
  
    // Iniciar o jogo
    startGameBtn.addEventListener("click", () => {
      isGameStarted = true;
      quantumBoard.classList.remove("hidden");  // Torna o tabuleiro visível
      gameMessage.classList.remove("hidden");  // Torna a mensagem visível
      resetGameBtn.classList.remove("hidden"); // Torna o botão de reiniciar visível
      startGameBtn.classList.add("hidden");     // Esconde o botão de iniciar
      gameMessage.textContent = "Escolhe letras para formar uma palavra.";
    });
  
    // Reiniciar o jogo
    resetGameBtn.addEventListener("click", () => {
      isGameStarted = false;
      quantumBoard.classList.add("hidden");     // Oculta o tabuleiro
      gameMessage.classList.add("hidden");     // Oculta a mensagem
      resetGameBtn.classList.add("hidden");    // Oculta o botão de reiniciar
      startGameBtn.classList.remove("hidden"); // Torna o botão de iniciar visível
      selectedWord = "";
      totalPoints = 0;
      wordDisplay.textContent = "";            // Limpa a palavra exibida
      scoreValue.textContent = totalPoints;   // Reseta a pontuação
      updateGameMessage("Jogo reiniciado. Clique em Iniciar Jogo para começar.");
    });
  
    // Adicionar evento aos botões do tabuleiro
    quantumBoard.addEventListener("click", (event) => {
      if (!isGameStarted) return;
  
      const target = event.target;
      if (target.classList.contains("board-cell")) {
        const selectedValue = target.textContent.toUpperCase();  // Converte a letra para maiúscula
        if (!selectedWord.includes(selectedValue)) {  // Evita repetir letras
          selectedWord += selectedValue;
          totalPoints += letterPoints[selectedValue] || 0;
  
          // Atualiza a exibição da palavra e da pontuação
          wordDisplay.textContent = selectedWord;
          scoreValue.textContent = totalPoints;
          updateGameMessage(`Palavra atual: ${selectedWord} (Pontos: ${totalPoints})`);
        }
      }
    });
  
    // Finalizar a palavra (verificar se é válida)
    document.querySelectorAll(".special-cell").forEach((cell) => {
      cell.addEventListener("click", (event) => {
        const action = event.target.textContent;
  
        if (action === "Sim") {
          if (dictionary.includes(selectedWord.toUpperCase())) {  // Normaliza a palavra para maiúscula
            updateGameMessage(`Parabéns! Você formou: ${selectedWord}. Pontos ganhos: ${totalPoints}`);
          } else {
            updateGameMessage(`A palavra ${selectedWord} não é válida. Tente novamente.`);
          }
          selectedWord = "";
          totalPoints = 0;
          wordDisplay.textContent = "";   // Limpa a palavra
          scoreValue.textContent = 0;    // Limpa a pontuação
        } else if (action === "Não" || action === "Adeus") {
          updateGameMessage("Jogo encerrado. Reinicie para jogar novamente.");
          isGameStarted = false;
        }
      });
    });
  
    // Função de atualização da mensagem do jogo
    function updateGameMessage(message) {
      gameMessage.textContent = message;
    }
  });  
