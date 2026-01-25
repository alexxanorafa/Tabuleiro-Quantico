// ============ SISTEMA DE MENU ============

const menuIcon = document.getElementById("menuIcon");
const menu = document.getElementById("menu");

if (menuIcon && menu) {
  menuIcon.addEventListener("click", function (e) {
    e.stopPropagation();
    menu.classList.toggle("active");
    menuIcon.classList.toggle("active");
  });

  document.addEventListener("click", function (e) {
    if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
      menu.classList.remove("active");
      menuIcon.classList.remove("active");
    }
  });

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-3px)";
    });
    item.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });
}

// ============ SELETORES PRINCIPAIS ============

const boardEl = document.querySelector(".ouija-board");   // container visual do tabuleiro
const planchetteEl = document.querySelector(".planchette");
const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");
const responseDisplay = document.getElementById("response");

// ============ ESTADO DA PLANCHETTE ============
//
// state.x, state.y ∈ [0,1] são coordenadas normalizadas dentro da área do tabuleiro.

let state = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
let animating = false;
let trajectory = [];
let startTime = null;

// ============ SÍMBOLOS / PRINCÍPIOS ============
//
// Biblioteca mais rica, letra / campo → nome + princípio.

const simbolos = {
  A: {
    nome: "Ansuz · Eco da Palavra",
    principio: "Clarifica a tua pergunta e escuta com atenção antes de agir."
  },
  B: {
    nome: "O Louco · Primeiro Passo",
    principio: "Aceita que não sabes tudo e começa mesmo assim, com humildade."
  },
  C: {
    nome: "Coragem Serena",
    principio: "Coragem é avançar apesar do medo, com responsabilidade."
  },
  D: {
    nome: "Discernimento",
    principio: "Separa o que controlas do que não controlas e foca-te no primeiro."
  },
  E: {
    nome: "Escuta Interior",
    principio: "Antes de escolher, ouve o que sentes e o que sabes em silêncio."
  },
  F: {
    nome: "Foco",
    principio: "Reduz o ruído: escolhe uma prioridade real e age sobre ela."
  },
  G: {
    nome: "Gratidão",
    principio: "Reconhecer o que já tens muda a forma como decides o que vem a seguir."
  },
  H: {
    nome: "Honestidade",
    principio: "Decisões sólidas nascem quando não mentimos a nós próprios."
  },
  I: {
    nome: "Intuição",
    principio: "Usa a intuição como hipótese a testar, não como sentença final."
  },
  J: {
    nome: "Justiça",
    principio: "Considera também o impacto da tua escolha nos outros."
  },
  K: {
    nome: "Kairos",
    principio: "Há momentos certos: nem sempre 'já' é a melhor resposta."
  },
  L: {
    nome: "Limite",
    principio: "Dizer 'basta' é proteger o que é essencial em ti."
  },
  M: {
    nome: "Mudança",
    principio: "Resistir ao que já mudou só prolonga o desconforto."
  },
  N: {
    nome: "Núcleo",
    principio: "Volta ao que é realmente importante, corta o acessório."
  },
  O: {
    nome: "Oportunidade",
    principio: "Nem toda possibilidade é boa, mas toda escolha abre portas."
  },
  P: {
    nome: "Paciência Ativa",
    principio: "Esperar não é parar: é preparar melhor o movimento."
  },
  Q: {
    nome: "Questão",
    principio: "Perguntas melhores levam a respostas mais úteis."
  },
  R: {
    nome: "Risco Calculado",
    principio: "Aceita o risco, mas mede o que estás disposto a perder."
  },
  S: {
    nome: "Sinceridade",
    principio: "Se tiveres de esconder a resposta, talvez não seja a certa."
  },
  T: {
    nome: "Tempo",
    principio: "Nem tudo exige urgência; escolhe o ritmo que te mantém inteiro."
  },
  U: {
    nome: "União",
    principio: "Alinha a tua escolha com quem caminha contigo."
  },
  V: {
    nome: "Vulnerabilidade",
    principio: "Mostrar fragilidade também é forma de coragem."
  },
  W: {
    nome: "Wander",
    principio: "Explorar sem mapa às vezes é a única forma de encontrar caminho."
  },
  X: {
    nome: "Incógnita",
    principio: "Aceita que há fatores desconhecidos; decide com o que tens."
  },
  Y: {
    nome: "Yin / Yang",
    principio: "Equilibra impulso e calma, ação e descanso."
  },
  Z: {
    nome: "Zénite",
    principio: "Aponta para o melhor de ti, mesmo em decisões pequenas."
  },
  SIM: {
    nome: "Compromisso",
    principio: "Dizer 'sim' é assumir responsabilidade pelo que vem a seguir."
  },
  NAO: {
    nome: "Limites Saudáveis",
    principio: "Dizer 'não' é proteger tempo, energia e integridade."
  },
  ADEUS: {
    nome: "Desapego",
    principio: "Saber terminar é tão importante quanto saber começar."
  }
};

function getSymbolForChar(char) {
  return simbolos[char] || {
    nome: "Pausa",
    principio: "Talvez a questão precise de mais formulação antes de procurar resposta."
  };
}

// ============ MAPA DE ALVOS (TABULEIRO HTML) ============
//
// Posições aproximadas das letras / campos dentro da ouija-board, em percentagens.

const targets = [
  // Letras linha superior
  { char: "A", x: 0.05, y: 0.20 },
  { char: "B", x: 0.12, y: 0.20 },
  { char: "C", x: 0.19, y: 0.20 },
  { char: "D", x: 0.26, y: 0.20 },
  { char: "E", x: 0.33, y: 0.20 },
  { char: "F", x: 0.40, y: 0.20 },
  { char: "G", x: 0.47, y: 0.20 },
  { char: "H", x: 0.54, y: 0.20 },
  { char: "I", x: 0.61, y: 0.20 },
  { char: "J", x: 0.68, y: 0.20 },
  { char: "K", x: 0.75, y: 0.20 },
  { char: "L", x: 0.82, y: 0.20 },
  { char: "M", x: 0.89, y: 0.20 },
  // Letras linha inferior
  { char: "N", x: 0.10, y: 0.33 },
  { char: "O", x: 0.17, y: 0.33 },
  { char: "P", x: 0.24, y: 0.33 },
  { char: "Q", x: 0.31, y: 0.33 },
  { char: "R", x: 0.38, y: 0.33 },
  { char: "S", x: 0.45, y: 0.33 },
  { char: "T", x: 0.52, y: 0.33 },
  { char: "U", x: 0.59, y: 0.33 },
  { char: "V", x: 0.66, y: 0.33 },
  { char: "W", x: 0.73, y: 0.33 },
  { char: "X", x: 0.80, y: 0.33 },
  { char: "Y", x: 0.87, y: 0.33 },
  { char: "Z", x: 0.94, y: 0.33 },
  // Números (linha única)
  { char: "1", x: 0.10, y: 0.50 },
  { char: "2", x: 0.20, y: 0.50 },
  { char: "3", x: 0.30, y: 0.50 },
  { char: "4", x: 0.40, y: 0.50 },
  { char: "5", x: 0.50, y: 0.50 },
  { char: "6", x: 0.60, y: 0.50 },
  { char: "7", x: 0.70, y: 0.50 },
  { char: "8", x: 0.80, y: 0.50 },
  { char: "9", x: 0.90, y: 0.50 },
  { char: "0", x: 0.50, y: 0.58 },
  // SIM / NÃO / ADEUS
  { char: "SIM", x: 0.18, y: 0.75 },
  { char: "NAO", x: 0.82, y: 0.75 },
  { char: "ADEUS", x: 0.50, y: 0.88 }
];

// ============ FUNÇÕES DE SUPORTE ============

function resetStateToCenter() {
  state.x = 0.5;
  state.y = 0.5;
  state.vx = 0;
  state.vy = 0;
  updatePlanchettePosition(true);
}

// Atualizar posição visual da lente, sempre alinhada ao centro do tabuleiro
function updatePlanchettePosition(forceCenter = false) {
  if (!boardEl || !planchetteEl) return;

  const rect = boardEl.getBoundingClientRect();
  const nx = forceCenter ? 0.5 : state.x;
  const ny = forceCenter ? 0.5 : state.y;

  const px = rect.left + nx * rect.width;
  const py = rect.top + ny * rect.height;

  planchetteEl.style.position = "fixed";
  planchetteEl.style.left = `${px}px`;
  planchetteEl.style.top = `${py}px`;
  planchetteEl.style.transform = "translate(-50%, -50%)";
}

// Campo de ativação simples: letras presentes na pergunta e SIM/NAO para perguntas binárias
function buildActivationField(question) {
  const q = (question || "").toLowerCase();
  return targets.map((t) => {
    let w = 1;
    if (t.char.length === 1 && q.includes(t.char.toLowerCase())) w += 2;
    const isBinaryLike =
      q.includes("sim") || q.includes("não") || q.includes("nao") ||
      q.includes("devo") || q.includes("deveria");
    if (isBinaryLike && (t.char === "SIM" || t.char === "NAO")) w += 3;
    return { ...t, w };
  });
}

function closestTarget(currentState) {
  return targets.reduce(
    (best, t) => {
      const d = Math.hypot(t.x - currentState.x, t.y - currentState.y);
      if (d < best.d) return { target: t, d };
      return best;
    },
    { target: targets[0], d: Infinity }
  );
}

// Passo de física: câmara lenta, campo + leve atração ao centro, ruído
function stepDynamics(currentState, field) {
  let fx = 0;
  let fy = 0;
  const eps = 1e-4;
  const k = 0.2;

  for (const target of field) {
    const dx = target.x - currentState.x;
    const dy = target.y - currentState.y;
    const dist2 = dx * dx + dy * dy + eps;
    const f = (k * target.w) / dist2;
    fx += f * dx;
    fy += f * dy;
  }

  // força suave para o centro do tabuleiro
  const kCenter = 0.03;
  fx += kCenter * (0.5 - currentState.x);
  fy += kCenter * (0.5 - currentState.y);

  const forceMag = Math.hypot(fx, fy);

  let noiseBase = 0.02;
  const noiseAmp = noiseBase * (1 + 0.5 * Math.tanh(forceMag));
  fx += noiseAmp * (Math.random() - 0.5);
  fy += noiseAmp * (Math.random() - 0.5);

  const dt = 0.012;   // lento mas fluido
  const gamma = 0.94; // atrito moderado

  let vx = gamma * (currentState.vx + fx * dt);
  let vy = gamma * (currentState.vy + fy * dt);
  let x = currentState.x + vx * dt;
  let y = currentState.y + vy * dt;

  // limites: quase todo o tabuleiro
  x = Math.max(0.02, Math.min(0.98, x));
  y = Math.max(0.02, Math.min(0.98, y));

  return { x, y, vx, vy };
}

// ============ ANIMAÇÃO EXPLORATÓRIA ============

function animateExploration(field, question) {
  if (!animating) return;

  if (!startTime) {
    startTime = performance.now();
    trajectory = [];
  }

  state = stepDynamics(state, field);
  trajectory.push({
    t: performance.now() - startTime,
    x: state.x,
    y: state.y
  });

  updatePlanchettePosition();

  const { target: nearest, d } = closestTarget(state);

  const minSteps = 220;
  const threshold = 0.03;

  if (trajectory.length > minSteps && d < threshold) {
    animating = false;
    showResult(nearest, question);
    return;
  }

  requestAnimationFrame(() => animateExploration(field, question));
}

// ============ MOSTRAR RESULTADO NO #response ============

function showResult(finalTarget, question) {
  const symbol = getSymbolForChar(finalTarget.char);
  if (!responseDisplay) return;

  responseDisplay.innerHTML = `
    <div style="margin-bottom:8px;font-weight:bold;">${symbol.nome}</div>
    <div style="font-size:0.95rem;margin-bottom:6px;">${symbol.principio}</div>
    <div style="font-size:0.8rem;opacity:0.8;">Letra/campo: ${finalTarget.char}</div>
  `;
}

// ============ HANDLER DO BOTÃO ============

function onAskClick() {
  const q = questionInput ? questionInput.value.trim() : "";
  if (!q) {
    if (responseDisplay) {
      responseDisplay.textContent = "Por favor, escreve uma pergunta.";
    }
    return;
  }

  animating = false;
  resetStateToCenter();
  if (responseDisplay) responseDisplay.textContent = "…";

  const field = buildActivationField(q);

  trajectory = [];
  startTime = null;
  animating = true;

  // pequena pausa para suspense antes do movimento
  setTimeout(() => {
    requestAnimationFrame(() => animateExploration(field, q));
  }, 400);
}

// ============ BOOTSTRAP ============

window.addEventListener("resize", () => {
  // manter a lente alinhada ao centro do tabuleiro quando o layout muda
  updatePlanchettePosition(true);
});

window.addEventListener("DOMContentLoaded", () => {
  resetStateToCenter();

  if (askButton) askButton.addEventListener("click", onAskClick);
  if (questionInput) {
    questionInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") onAskClick();
    });
  }
});
