/* =========================
   CANVAS SETUP
========================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 960;
canvas.height = 540;

ctx.imageSmoothingEnabled = false;

/* =========================
   INPUT
========================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* =========================
   GAME CONSTANTS
========================= */
const GRAVITY = 0.6;
const GROUND_Y = 420;

/* =========================
   PLAYER DATA
========================= */
const characters = [
  { name: "Gojo", color: "#7dd3fc" },
  { name: "Naruto", color: "#facc15" },
  { name: "Luffy", color: "#fb7185" },
  { name: "Tanjiro", color: "#34d399" },
  { name: "Sukuna", color: "#ef4444", locked: true }
];

let currentCharIndex = 0;

/* =========================
   PLAYER OBJECT
========================= */
const player = {
  x: 100,
  y: GROUND_Y,
  w: 40,
  h: 56,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpPower: 12,
  onGround: false,

  hp: 100,
  maxHp: 100,

  shield: false,
  shieldTimer: 0,
  shieldCooldown: 0,

  attackTimer: 0,
  attackType: null
};

/* =========================
   ENEMIES
========================= */
const enemies = [
  { x: 500, y: GROUND_Y, w: 40, h: 40, vx: -1.2, hp: 30 }
];

/* =========================
   BOSS (SUKUNA)
========================= */
const boss = {
  active: false,
  x: 760,
  y: GROUND_Y,
  w: 64,
  h: 72,
  hp: 200,
  phase: 1,
  attackTimer: 0
};

/* =========================
   UPDATE
========================= */
function update() {
  /* MOVEMENT */
  player.vx = 0;
  if (keys["a"]) player.vx = -player.speed;
  if (keys["d"]) player.vx = player.speed;

  if ((keys["w"] || keys[" "]) && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
  }

  /* ATTACKS */
  if (keys["j"] && player.attackTimer <= 0) {
    player.attackType = "basic";
    player.attackTimer = 20;
  }
  if (keys["k"] && player.attackTimer <= 0) {
    player.attackType = "ability1";
    player.attackTimer = 30;
  }
  if (keys["l"] && player.attackTimer <= 0) {
    player.attackType = "ability2";
    player.attackTimer = 40;
  }
  if (player.attackTimer > 0) player.attackTimer--;

  /* SHIELD */
  if (keys["e"] && !player.shield && player.shieldCooldown <= 0) {
    player.shield = true;
    player.shieldTimer = 600; // 10s
    player.shieldCooldown = 900; // 15s total
  }

  if (player.shield) {
    player.shieldTimer--;
    if (player.shieldTimer <= 0) player.shield = false;
  }
  if (player.shieldCooldown > 0) player.shieldCooldown--;

  /* CHARACTER SWITCH */
  for (let i = 1; i <= 5; i++) {
    if (keys[i]) {
      if (!characters[i - 1].locked) {
        currentCharIndex = i - 1;
      }
    }
  }

  /* ENEMIES */
  enemies.forEach(enemy => {
    enemy.x += enemy.vx;
    if (Math.abs(player.x - enemy.x) < 40) {
      if (!player.shield) damagePlayer(0.2);
    }
  });

  /* BOSS */
  if (boss.active) {
    boss.attackTimer++;
    if (boss.hp < 100) boss.phase = 2;

    if (boss.attackTimer > (boss.phase === 1 ? 120 : 60)) {
      boss.attackTimer = 0;
      if (!player.shield) damagePlayer(5);
      screenShake();
    }
  }
}

/* =========================
   DAMAGE
========================= */
function damagePlayer(amount) {
  player.hp -= amount;
  document.body.classList.add("damage");
  setTimeout(() => document.body.classList.remove("damage"), 100);
}

/* =========================
   EFFECTS
========================= */
let shakeTime = 0;
function screenShake() {
  shakeTime = 10;
}

/* =========================
   DRAW
========================= */
function draw() {
  ctx.save();

  if (shakeTime > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );
    shakeTime--;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* GROUND */
  ctx.fillStyle = "#111";
  ctx.fillRect(0, GROUND_Y + player.h, canvas.width, 80);

  /* PLAYER */
  ctx.fillStyle = characters[currentCharIndex].color;
  ctx.fillRect(player.x, player.y, player.w, player.h);

  /* SHIELD */
  if (player.shield) {
    ctx.strokeStyle = "#4da6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      player.x + player.w / 2,
      player.y + player.h / 2,
      40,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  /* ENEMIES */
  ctx.fillStyle = "#991b1b";
  enemies.forEach(e =>
    ctx.fillRect(e.x, e.y, e.w, e.h)
  );

  /* BOSS */
  if (boss.active) {
    document.body.classList.add("boss");
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
  } else {
    document.body.classList.remove("boss");
  }

  ctx.restore();

  /* UI */
  document.getElementById("playerHP").textContent =
    "HP: " + Math.max(0, Math.floor(player.hp));
  document.getElementById("shieldStatus").textContent =
    player.shield ? "Shield: ON" : "Shield: OFF";
  document.getElementById("characterName").textContent =
    characters[currentCharIndex].name;
}

/* =========================
   GAME LOOP
========================= */
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
