// ============ SISTEMA DE MENU ============
const menuIcon = document.getElementById("menuIcon");
const menu = document.getElementById("menu");
let isMenuOpen = false; // Controle de estado para pausar física

if (menuIcon && menu) {
  menuIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    isMenuOpen = !isMenuOpen; // Toggle estado
    
    menu.classList.toggle("active");
    menuIcon.classList.toggle("active");
  });

  // Fechar ao clicar num link
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      isMenuOpen = false;
      menu.classList.remove("active");
      menuIcon.classList.remove("active");
    });
  });
}

// ============ CONFIGURAÇÃO & SELETORES ============
const boardEl = document.querySelector(".ouija-board");
const planchetteEl = document.querySelector(".planchette");
const questionInput = document.getElementById("question");
const askButton = document.getElementById("askButton");
const responseDisplay = document.getElementById("response");
const canvas = document.getElementById("trajectoryCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

// ============ ESTADO FÍSICO ============
let state = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
let animating = false;
let animationId = null;
let trajectory = [];
let bioInput = { x: 0, y: 0 }; 

// Listener Mouse
document.addEventListener("mousemove", (e) => {
  if (!animating || isMenuOpen) return; // Se menu aberto, ignora input
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  bioInput.x = (e.clientX - cx) / cx; 
  bioInput.y = (e.clientY - cy) / cy;
});

// Listener Giroscópio
window.addEventListener("deviceorientation", (e) => {
  if (!animating || isMenuOpen) return;
  const tx = e.gamma ? Math.max(-45, Math.min(45, e.gamma)) / 45 : 0;
  const ty = e.beta ? Math.max(-45, Math.min(45, e.beta)) / 45 : 0;
  bioInput.x = tx; 
  bioInput.y = ty;
});

// ============ ARQUÉTIPOS & LÓGICA ============
// (Mantive os simbolos e targets iguais, só vou omitir para brevidade, 
// o código abaixo assume que as variáveis 'simbolos', 'keywords' e 'targets' 
// estão definidas tal como na versão anterior)

const keywords = {
  "medo": ["C", "F"], "ansiedade": ["R", "T"], "amor": ["U", "V"],
  "raiva": ["J", "P"], "tristeza": ["M", "A"], "devo": ["SIM", "NAO"],
  "posso": ["O", "R"], "futuro": ["X", "I"], "passado": ["ADEUS", "G"],
  "dinheiro": ["T", "E"]
};

const simbolos = {
  A: { nome: "Ansuz (Sinais)", desc: "A resposta já foi dada. Presta atenção às coincidências." },
  B: { nome: "O Louco", desc: "Dá o primeiro passo sem garantias." },
  C: { nome: "Coragem", desc: "O medo indica importância. Faz a tremer." },
  D: { nome: "Discernimento", desc: "Separa factos de imaginação." },
  E: { nome: "Escuta", desc: "A tua primeira impressão estava correta." },
  F: { nome: "Foco", desc: "Escolhe uma prioridade e ignora o resto." },
  G: { nome: "Gratidão", desc: "Muda a frequência, muda o resultado." },
  H: { nome: "Honestidade", desc: "A verdade é libertadora, ainda que doa." },
  I: { nome: "Intuição", desc: "Segue o instinto visceral, não a lógica." },
  J: { nome: "Justiça", desc: "O que decidires terá um eco igual." },
  K: { nome: "Kairos", desc: "O momento oportuno é agora." },
  L: { nome: "Limites", desc: "Protege a tua energia." },
  M: { nome: "Mudança", desc: "A resistência causa a dor. Flui." },
  N: { nome: "Núcleo", desc: "O essencial é simples." },
  O: { nome: "Oportunidade", desc: "Atravessa a porta aberta." },
  P: { nome: "Paciência", desc: "Não desenterres a semente." },
  Q: { nome: "Questão", desc: "Pergunta 'como' em vez de 'porquê'." },
  R: { nome: "Risco", desc: "O maior risco é não arriscar." },
  S: { nome: "Sinceridade", desc: "A vulnerabilidade atrai força." },
  T: { nome: "Tempo", desc: "Tudo tem o seu ritmo." },
  U: { nome: "União", desc: "Não faças isto sozinho." },
  V: { nome: "Vulnerabilidade", desc: "Não endureças o coração." },
  W: { nome: "Wander", desc: "Perder-se é forma de se encontrar." },
  X: { nome: "Incógnita", desc: "Falta informação. Aguarda." },
  Y: { nome: "Yin/Yang", desc: "Procura o oposto do que estás a fazer." },
  Z: { nome: "Zénite", desc: "Aponta para o ideal mais alto." },
  SIM: { nome: "Confirmação", desc: "O caminho está aberto." },
  NAO: { nome: "Bloqueio", desc: "Não é o momento. Recua." },
  ADEUS: { nome: "Encerramento", desc: "Deixa ir. Ciclo fechado." }
};

const targets = [
  { char: "A", x: 0.05, y: 0.20 }, { char: "B", x: 0.12, y: 0.20 },
  { char: "C", x: 0.19, y: 0.20 }, { char: "D", x: 0.26, y: 0.20 },
  { char: "E", x: 0.33, y: 0.20 }, { char: "F", x: 0.40, y: 0.20 },
  { char: "G", x: 0.47, y: 0.20 }, { char: "H", x: 0.54, y: 0.20 },
  { char: "I", x: 0.61, y: 0.20 }, { char: "J", x: 0.68, y: 0.20 },
  { char: "K", x: 0.75, y: 0.20 }, { char: "L", x: 0.82, y: 0.20 },
  { char: "M", x: 0.89, y: 0.20 },
  { char: "N", x: 0.10, y: 0.33 }, { char: "O", x: 0.17, y: 0.33 },
  { char: "P", x: 0.24, y: 0.33 }, { char: "Q", x: 0.31, y: 0.33 },
  { char: "R", x: 0.38, y: 0.33 }, { char: "S", x: 0.45, y: 0.33 },
  { char: "T", x: 0.52, y: 0.33 }, { char: "U", x: 0.59, y: 0.33 },
  { char: "V", x: 0.66, y: 0.33 }, { char: "W", x: 0.73, y: 0.33 },
  { char: "X", x: 0.80, y: 0.33 }, { char: "Y", x: 0.87, y: 0.33 },
  { char: "Z", x: 0.94, y: 0.33 },
  { char: "1", x: 0.10, y: 0.50 }, { char: "2", x: 0.20, y: 0.50 },
  { char: "3", x: 0.30, y: 0.50 }, { char: "4", x: 0.40, y: 0.50 },
  { char: "5", x: 0.50, y: 0.50 }, { char: "6", x: 0.60, y: 0.50 },
  { char: "7", x: 0.70, y: 0.50 }, { char: "8", x: 0.80, y: 0.50 },
  { char: "9", x: 0.90, y: 0.50 }, { char: "0", x: 0.50, y: 0.58 },
  { char: "SIM", x: 0.18, y: 0.75 }, { char: "NAO", x: 0.82, y: 0.75 },
  { char: "ADEUS", x: 0.50, y: 0.88 }
];

// ============ FÍSICA & RENDER ============

function updatePlanchettePosition(forceCenter = false) {
  if (!boardEl || !planchetteEl) return;
  const rect = boardEl.getBoundingClientRect();
  const nx = forceCenter ? 0.5 : state.x;
  const ny = forceCenter ? 0.5 : state.y;
  
  planchetteEl.style.left = `${rect.left + nx * rect.width}px`;
  planchetteEl.style.top = `${rect.top + ny * rect.height}px`;
}

function buildActivationField(question) {
  const qClean = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const field = targets.map(t => ({ ...t, w: 1 }));

  field.forEach(t => {
    if (t.char.length === 1 && qClean.includes(t.char.toLowerCase())) {
      t.w += 2.5; 
    }
  });

  Object.keys(keywords).forEach(key => {
    if (qClean.includes(key)) {
      const associatedChars = keywords[key];
      associatedChars.forEach(char => {
        const target = field.find(t => t.char === char);
        if (target) target.w += 5.0; 
      });
    }
  });
  return field;
}

function stepDynamics(current, field) {
  let fx = 0, fy = 0;
  
  for (const t of field) {
    const dx = t.x - current.x;
    const dy = t.y - current.y;
    const distSq = dx*dx + dy*dy + 0.0001;
    const force = (0.25 * t.w) / distSq; 
    fx += force * dx;
    fy += force * dy;
  }

  fx += 0.05 * (0.5 - current.x);
  fy += 0.05 * (0.5 - current.y);

  // Biofeedback
  const bioSensitivity = 0.8; 
  fx += bioInput.x * bioSensitivity;
  fy += bioInput.y * bioSensitivity;

  fx += (Math.random() - 0.5) * 0.05;
  fy += (Math.random() - 0.5) * 0.05;

  const dt = 0.016;
  const friction = 0.92;

  let vx = friction * (current.vx + fx * dt);
  let vy = friction * (current.vy + fy * dt);
  let x = current.x + vx * dt;
  let y = current.y + vy * dt;

  x = Math.max(0.02, Math.min(0.98, x));
  y = Math.max(0.02, Math.min(0.98, y));

  return { x, y, vx, vy };
}

function drawTrajectory() {
  if (!ctx || trajectory.length < 2) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.strokeStyle = "rgba(246, 212, 156, 0.4)";
  ctx.lineWidth = 1;
  ctx.moveTo(trajectory[0].x * w, trajectory[0].y * h);
  for (let i = 1; i < trajectory.length; i++) {
    const p = trajectory[i];
    ctx.lineTo(p.x * w + (Math.random()-0.5)*1, p.y * h + (Math.random()-0.5)*1);
  }
  ctx.stroke();
  const last = trajectory[trajectory.length-1];
  ctx.fillStyle = "rgba(246, 212, 156, 0.8)";
  ctx.beginPath();
  ctx.arc(last.x * w, last.y * h, 3, 0, Math.PI*2);
  ctx.fill();
}

function animate(field, questionClean) {
  if (!animating) return;

  // Pausa se menu estiver aberto
  if (isMenuOpen) {
    animationId = requestAnimationFrame(() => animate(field, questionClean));
    return; 
  }

  state = stepDynamics(state, field);
  trajectory.push({ x: state.x, y: state.y });
  updatePlanchettePosition();

  const velocity = Math.hypot(state.vx, state.vy);
  const nearest = targets.reduce((best, t) => {
    const d = Math.hypot(t.x - state.x, t.y - state.y);
    return d < best.d ? { t, d } : best;
  }, { t: null, d: Infinity });

  if (trajectory.length > 200 && velocity < 0.15 && nearest.d < 0.04) {
    finishSession(nearest.t);
  } else if (trajectory.length > 600) {
    finishSession(nearest.t);
  } else {
    animationId = requestAnimationFrame(() => animate(field, questionClean));
  }
}

function finishSession(target) {
  animating = false;
  if (animationId) cancelAnimationFrame(animationId);
  drawTrajectory();
  
  const symbol = simbolos[target.char] || { nome: "Silêncio", desc: "Sem resposta clara." };
  
  responseDisplay.innerHTML = `
    <div style="font-weight:bold; color:#f6d49c; margin-bottom:4px; font-size:1.1rem;">${symbol.nome}</div>
    <div style="font-size:0.9rem; line-height:1.4;">${symbol.desc}</div>
    <div style="font-size:0.75rem; opacity:0.6; margin-top:8px;">Letra: ${target.char}</div>
  `;
}

function onAsk() {
  const q = questionInput.value.trim();
  if (!q) {
    responseDisplay.textContent = "Escreve algo para iniciar a conexão.";
    return;
  }
  animating = false;
  if (animationId) cancelAnimationFrame(animationId);
  state = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
  trajectory = [];
  updatePlanchettePosition(true);
  
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  responseDisplay.innerHTML = "<span style='opacity:0.7'>A conectar...</span>";

  setTimeout(() => {
    animating = true;
    const field = buildActivationField(q);
    animate(field, q);
  }, 500);
}

function resizeCanvas() {
  if (!boardEl || !canvas) return;
  const rect = boardEl.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

window.addEventListener("resize", () => {
  resizeCanvas();
  updatePlanchettePosition(true);
});

window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  updatePlanchettePosition(true);
  
  if(askButton) askButton.addEventListener("click", onAsk);
  if(questionInput) questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onAsk();
  });
});