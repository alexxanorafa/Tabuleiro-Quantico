// ===============================
// Tabuleiro Ouija · Motor + Cinematografia + Símbolos + Palavra desenhada
// ===============================
//
// Estados de UI:
// - idle      : tabuleiro à espera.
// - thinking  : pergunta enviada, pausa breve.
// - moving    : planchette em movimento “exploratório” (câmara lenta).
// - tracing   : planchette desenha uma palavra letra a letra.
// - reveal    : overlay de símbolo/princípio.
// - post      : pós-revelação.
//
// Requer no HTML:
// - #menuIcon, #menu, .menu-item
// - #board, #boardMap, #planchette
// - #question, #askButton
// - #resultOverlay, #symbolName, #symbolType, #symbolPrinciple, #symbolPrompt
// - #metricsToggle, #metricsOverlay, #metricsContent
//

// ===============================
// 1. MENU EXTERNO
// ===============================

const menuIcon = document.getElementById("menuIcon");
const menu = document.getElementById("menu");

if (menuIcon && menu) {
  menuIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("active");
    menuIcon.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
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

// ===============================
// 2. SELETORES PRINCIPAIS
// ===============================

const boardEl = document.getElementById("board");
const svgEl = document.getElementById("boardMap");
const planchetteEl = document.getElementById("planchette");
const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");

const resultOverlay = document.getElementById("resultOverlay");
const symbolNameEl = document.getElementById("symbolName");
const symbolTypeEl = document.getElementById("symbolType");
const symbolPrincipleEl = document.getElementById("symbolPrinciple");
const symbolPromptEl = document.getElementById("symbolPrompt");

const metricsToggle = document.getElementById("metricsToggle");
const metricsOverlay = document.getElementById("metricsOverlay");
const metricsContentEl = document.getElementById("metricsContent");

// ===============================
// 3. ESTADO GLOBAL
// ===============================

let uiState = "idle"; // idle | thinking | moving | tracing | reveal | post

let targets = [];     // { char, x, y }
let probDistrib = []; // { char, p }

let state = {
  x: 0.5,
  y: 0.5,
  vx: 0,
  vy: 0
};

let trajectory = [];
let startTime = null;
let animating = false;

let currentEnv = getEnvironmentContext();

// para fase de desenho da palavra
let tracingPath = [];      // array de alvos na sequência da palavra
let tracingIndex = 0;      // índice da letra atual
let tracingActive = false; // se estamos a desenhar palavra

// ===============================
// 4. CONTEXTO AMBIENTAL
// ===============================

function getEnvironmentContext() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeOfDay = hours + minutes / 60;
  const timeNorm = timeOfDay / 24;

  const dateStr = now.toISOString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

  return {
    timeNorm,
    dateStr,
    timezone: tz
  };
}

// ===============================
// 5. INICIALIZAÇÃO DO TABULEIRO
// ===============================

function initBoard() {
  if (!svgEl) return;

  const texts = svgEl.querySelectorAll("[data-char]");
  targets = Array.from(texts).map((el) => {
    const bbox = el.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    return {
      char: el.getAttribute("data-char"),
      x: cx / 100,
      y: cy / 100
    };
  });

  if (targets.length > 0) {
    const p0 = 1 / targets.length;
    probDistrib = targets.map((t) => ({ char: t.char, p: p0 }));
  }

  state.x = 0.5;
  state.y = 0.5;
  state.vx = 0;
  state.vy = 0;
  updatePlanchettePosition();
}

// ===============================
// 6. POSICIONAMENTO DA PLANCHETTE
// ===============================

function updatePlanchettePosition() {
  if (!boardEl || !planchetteEl) return;

  const rect = boardEl.getBoundingClientRect();
  const px = rect.left + state.x * rect.width;
  const py = rect.top + state.y * rect.height;

  planchetteEl.style.left = `${px}px`;
  planchetteEl.style.top = `${py}px`;
}

// ===============================
// 7. ESTADO DE UI
// ===============================

function setUIState(newState) {
  uiState = newState;
  document.body.setAttribute("data-ui-state", newState);

  switch (newState) {
    case "idle":
      hideResultOverlay();
      hideMetricsOverlay();
      break;
    case "thinking":
      hideResultOverlay();
      hideMetricsOverlay();
      break;
    case "moving":
      hideResultOverlay();
      break;
    case "tracing":
      hideResultOverlay();
      break;
    case "reveal":
      showResultOverlay();
      break;
    case "post":
      break;
  }
}

// ===============================
// 8. MODELO COGNITIVO: CAMPO DE ATIVAÇÃO
// ===============================

function buildActivationField(question, env) {
  const q = question.toLowerCase();
  const { timeNorm } = env;

  return targets.map((t) => {
    let w = 1;

    if (t.char.length === 1 && q.includes(t.char.toLowerCase())) {
      w += 2;
    }

    const isBinaryLike =
      q.includes("sim") ||
      q.includes("não") ||
      q.includes("nao") ||
      q.includes("devo") ||
      q.includes("deveria");

    if (isBinaryLike && (t.char === "SIM" || t.char === "NAO")) {
      w += 3;
    }

    const isNight = timeNorm < 0.25 || timeNorm > 0.75;
    if (isNight && t.y > 0.3 && t.y < 0.7) {
      w *= 1.1;
    }

    return { ...t, w };
  });
}

// ===============================
// 9. PROBABILIDADE DISCRETA
// ===============================

function normalizeProb(distrib) {
  const sum = distrib.reduce((acc, d) => acc + d.p, 0) || 1;
  return distrib.map((d) => ({ ...d, p: d.p / sum }));
}

function updateProbabilityFromField(field) {
  if (!probDistrib || probDistrib.length !== field.length) {
    probDistrib = field.map((f) => ({ char: f.char, p: 1 / field.length }));
  }

  const alpha = 0.25;
  const newDistrib = probDistrib.map((d) => {
    const f = field.find((f) => f.char === d.char);
    if (!f) return d;
    const targetP = f.w;
    return { ...d, p: d.p * (1 - alpha) + targetP * alpha };
  });

  probDistrib = normalizeProb(newDistrib);
}

// ===============================
// 10. MODELO FÍSICO: DINÂMICA ESTOCÁSTICA (CÂMARA LENTA)
// ===============================

function stepDynamics(currentState, field, env) {
  let fx = 0;
  let fy = 0;
  const eps = 1e-4;

  let k = 0.2;
  const { timeNorm } = env;
  if (timeNorm > 0.2 && timeNorm < 0.4) {
    k *= 1.1;
  }

  for (const target of field) {
    const dx = target.x - currentState.x;
    const dy = target.y - currentState.y;
    const dist2 = dx * dx + dy * dy + eps;
    const f = (k * target.w) / dist2;
    fx += f * dx;
    fy += f * dy;
  }

  const forceMag = Math.hypot(fx, fy);

  let noiseBase = 0.02;
  if (timeNorm > 0.4 && timeNorm < 0.7) {
    noiseBase *= 1.15;
  }

  const noiseAmp = noiseBase * (1 + 0.5 * Math.tanh(forceMag));

  fx += noiseAmp * (Math.random() - 0.5);
  fy += noiseAmp * (Math.random() - 0.5);

  const dt = 0.015; // câmara mais lenta
  const gamma = 0.93;

  let vx = gamma * (currentState.vx + fx * dt);
  let vy = gamma * (currentState.vy + fy * dt);
  let x = currentState.x + vx * dt;
  let y = currentState.y + vy * dt;

  x = Math.max(0.02, Math.min(0.98, x));
  y = Math.max(0.02, Math.min(0.98, y));

  return { x, y, vx, vy };
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

// ===============================
// 11. CAMADA SIMBÓLICA
// ===============================

const simbolos = {
  A: {
    tipo: "runa",
    nome: "ANSUZ",
    fullName: "Ansuz · Eco da Palavra",
    principio: "Clarifica a tua pergunta e escuta com atenção antes de agir.",
    prompt: "Que parte desta situação ainda não ouviste realmente?"
  },
  B: {
    tipo: "arcano",
    nome: "LOUCO",
    fullName: "O Louco · Primeiro Passo",
    principio: "Aceita que não sabes tudo e começa mesmo assim, com humildade.",
    prompt: "Que pequeno risco podes assumir sem trair os teus valores?"
  },
  C: {
    tipo: "virtude",
    nome: "CORAGEM",
    fullName: "Coragem Serena",
    principio: "Coragem é avançar apesar do medo, com responsabilidade.",
    prompt: "Onde podes agir hoje com coragem, mas sem impulsividade?"
  },
  D: {
    tipo: "virtude",
    nome: "DISCERNIR",
    fullName: "Discernimento",
    principio: "Separa o que controlas do que não controlas e foca-te no primeiro.",
    prompt: "O que depende de ti, concretamente, nesta questão?"
  },
  SIM: {
    tipo: "virtude",
    nome: "SIM",
    fullName: "Compromisso",
    principio: "Dizer 'sim' é assumir responsabilidade pelo que vem a seguir.",
    prompt: "Estás pronto para lidar com as consequências deste 'sim'?"
  },
  NAO: {
    tipo: "virtude",
    nome: "NAO",
    fullName: "Limites Saudáveis",
    principio: "Dizer 'não' é proteger tempo, energia e integridade.",
    prompt: "O que ganhas se disseres 'não' com honestidade?"
  },
  ADEUS: {
    tipo: "virtude",
    nome: "ADEUS",
    fullName: "Desapego",
    principio: "Saber terminar é tão importante quanto saber começar.",
    prompt: "O que já cumpriu o seu papel e pode ser deixado para trás?"
  }
};

function getSymbolForChar(char) {
  return simbolos[char] || {
    tipo: "reflexão",
    nome: "PAUSA",
    fullName: "Pausa",
    principio: "Talvez a questão precise de mais formulação antes de procurar resposta.",
    prompt: "Como reformularias a tua pergunta de forma mais clara?"
  };
}

// converte a palavra do símbolo em sequência de alvos
function getTracingPathForSymbol(symbol) {
  const word = (symbol.nome || "").toUpperCase();
  const chars = word.split("");
  const path = [];
  for (const ch of chars) {
    const t = targets.find((t) => t.char === ch);
    if (t) path.push(t);
  }
  return path;
}

// ===============================
// 12. HOOKS DE TEMA VISUAL (placeholders)
// ===============================

const temaHooks = {
  onStart: (question, field, env) => {},
  onStep: (state, nearest, field, prob) => {},
  onConverge: (finalTarget, metrics, symbolInfo) => {}
};

// ===============================
// 13. LOOP DE ANIMAÇÃO EXPLORATÓRIA (MOVING)
// ===============================

function animateExploration(field) {
  if (!animating) return;

  if (!startTime) {
    startTime = performance.now();
    trajectory = [];
  }

  state = stepDynamics(state, field, currentEnv);
  trajectory.push({
    t: performance.now() - startTime,
    x: state.x,
    y: state.y
  });

  updatePlanchettePosition();
  updateProbabilityFromField(field);

  const { target: nearest, d } = closestTarget(state);
  temaHooks.onStep(state, nearest, field, probDistrib);

  const minSteps = 180;  // mais longa, câmara lenta
  const threshold = 0.035;

  if (trajectory.length > minSteps && d < threshold) {
    animating = false;
    // ao invés de revelar já, entramos em fase de "tracing" da palavra
    startTracing(nearest);
    return;
  }

  requestAnimationFrame(() => animateExploration(field));
}

// ===============================
// 14. FASE DE DESENHO DA PALAVRA (TRACING)
// ===============================

function startTracing(finalTarget) {
  const symbol = getSymbolForChar(finalTarget.char);
  tracingPath = getTracingPathForSymbol(symbol);
  tracingIndex = 0;
  tracingActive = tracingPath.length > 0;

  if (!tracingActive) {
    // se não temos palavra, revelamos logo
    showResult(finalTarget);
    return;
  }

  setUIState("tracing");
  animating = true;
  startTime = null;
  trajectory = [];

  // usamos uma função específica de animação guiada por alvos da palavra
  requestAnimationFrame(() => animateTracing(finalTarget, symbol));
}

function animateTracing(finalTarget, symbol) {
  if (!animating || !tracingActive) {
    showResult(finalTarget);
    return;
  }

  if (tracingIndex >= tracingPath.length) {
    animating = false;
    tracingActive = false;
    showResult(finalTarget);
    return;
  }

  const currentTarget = tracingPath[tracingIndex];

  // campo de ativação focado na letra atual da palavra
  const field = targets.map((t) => {
    let w = 0.5;
    if (t.char === currentTarget.char) w = 6; // reforço forte
    return { ...t, w };
  });

  state = stepDynamics(state, field, currentEnv);
  updatePlanchettePosition();

  const d = Math.hypot(currentTarget.x - state.x, currentTarget.y - state.y);
  const closeThreshold = 0.03;

  if (d < closeThreshold) {
    tracingIndex += 1;
    // pequena pausa entre letras
    setTimeout(() => {
      requestAnimationFrame(() => animateTracing(finalTarget, symbol));
    }, 250);
  } else {
    requestAnimationFrame(() => animateTracing(finalTarget, symbol));
  }
}

// ===============================
// 15. OVERLAYS
// ===============================

function showResultOverlay() {
  if (resultOverlay) resultOverlay.classList.add("visible");
}

function hideResultOverlay() {
  if (resultOverlay) resultOverlay.classList.remove("visible");
}

function showMetricsOverlay() {
  if (metricsOverlay) metricsOverlay.classList.add("visible");
}

function hideMetricsOverlay() {
  if (metricsOverlay) metricsOverlay.classList.remove("visible");
}

// ===============================
// 16. APRESENTAÇÃO DO RESULTADO
// ===============================

function showResult(finalTarget) {
  const timeTotal = trajectory.length > 0 ? trajectory[trajectory.length - 1].t : 0;

  let length = 0;
  for (let i = 1; i < trajectory.length; i++) {
    const dx = trajectory[i].x - trajectory[i - 1].x;
    const dy = trajectory[i].y - trajectory[i - 1].y;
    length += Math.hypot(dx, dy);
  }

  const symbol = getSymbolForChar(finalTarget.char);

  if (symbolNameEl) symbolNameEl.textContent = symbol.fullName;
  if (symbolTypeEl) symbolTypeEl.textContent = symbol.tipo;
  if (symbolPrincipleEl) symbolPrincipleEl.textContent = symbol.principio;
  if (symbolPromptEl) symbolPromptEl.textContent = symbol.prompt;

  const metricsLines = [
    `Letra/campo final: ${finalTarget.char}`,
    `Símbolo: ${symbol.nome}`,
    `Tipo: ${symbol.tipo}`,
    "",
    `Tempo total (exploração): ${timeTotal.toFixed(0)} ms`,
    `Comprimento da trajetória: ${length.toFixed(3)} unidades normalizadas`,
    `Passos: ${trajectory.length}`,
    `Coordenadas finais: (${finalTarget.x.toFixed(3)}, ${finalTarget.y.toFixed(3)})`,
    `Data/hora: ${currentEnv.dateStr}`,
    `Timezone: ${currentEnv.timezone}`
  ];

  if (metricsContentEl) metricsContentEl.textContent = metricsLines.join("\n");

  setUIState("reveal");

  temaHooks.onConverge(
    finalTarget,
    {
      timeTotal,
      length,
      steps: trajectory.length
    },
    symbol
  );

  setTimeout(() => setUIState("post"), 800);
}

// ===============================
// 17. HANDLER DA PERGUNTA
// ===============================

function onAskClick() {
  const q = questionInput ? questionInput.value.trim() : "";
  if (!q) {
    if (metricsContentEl) {
      metricsContentEl.textContent =
        "Por favor, escreve uma pergunta para iniciar a experiência.";
    }
    showMetricsOverlay();
    return;
  }

  hideResultOverlay();
  hideMetricsOverlay();
  setUIState("thinking");

  animating = false;
  tracingActive = false;
  tracingPath = [];
  tracingIndex = 0;

  state.x = 0.5;
  state.y = 0.5;
  state.vx = 0;
  state.vy = 0;
  updatePlanchettePosition();

  currentEnv = getEnvironmentContext();
  const field = buildActivationField(q, currentEnv);

  trajectory = [];
  startTime = null;
  animating = true;

  temaHooks.onStart(q, field, currentEnv);

  setTimeout(() => {
    setUIState("moving");
    requestAnimationFrame(() => animateExploration(field));
  }, 500);
}

// ===============================
// 18. METRICS TOGGLE
// ===============================

if (metricsToggle && metricsOverlay) {
  metricsToggle.addEventListener("click", () => {
    if (metricsOverlay.classList.contains("visible")) {
      hideMetricsOverlay();
    } else {
      showMetricsOverlay();
    }
  });
}

// ===============================
// 19. RESPONSIVIDADE E BOOT
// ===============================

window.addEventListener("resize", () => {
  updatePlanchettePosition();
});

window.addEventListener("DOMContentLoaded", () => {
  initBoard();
  setUIState("idle");

  if (askButton) {
    askButton.addEventListener("click", onAskClick);
  }

  if (questionInput) {
    questionInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") onAskClick();
    });
  }

  if (metricsOverlay) {
    metricsOverlay.addEventListener("click", (e) => {
      if (e.target === metricsOverlay) hideMetricsOverlay();
    });
  }

  if (resultOverlay) {
    resultOverlay.addEventListener("click", (e) => {
      if (e.target === resultOverlay && uiState === "post") {
        hideResultOverlay();
        setUIState("idle");
      }
    });
  }
});