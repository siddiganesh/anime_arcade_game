const WALL_SLIDE_SPEED = 1.2;
const WALL_JUMP_X = 8;
/* ================= INPUT ================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* ================= SHIELD IMAGE ================= */
const shieldImg = new Image();
shieldImg.src = "sprites/shield/honeycomb_shield.png"; 
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= GAME STATE ================= */
let gameStarted = false;
let currentLevel = Number(localStorage.getItem("level")) || 0;

/* ================= CAMERA ================= */
let cameraX = 0;
let shakeTime = 0;

/* ================= LOAD FRAMES ================= */
function loadFrames(path, count) {
  return Array.from({ length: count }, (_, i) => {
    const img = new Image();
    img.src = `${path}_${i + 1}.png`;
    return img;
  });
}

const runFrames  = loadFrames("sprites/gojo/run/gojo_run", 6);
const jumpFrames = loadFrames("sprites/gojo/jump/gojo_jump", 6);
const atkJ = loadFrames("sprites/gojo/attack/j/gojo_attackj", 4);
const atkK = loadFrames("sprites/gojo/attack/k/gojo_attackk", 4);

/* ================= PLAYER ================= */
const player = {
  x: 100, y: 280, w: 60, h: 90,
  vx: 0, vy: 0,
  speed: 6,
  jumpPower: -12,
  gravity: 0.6,
  groundY: 280,

  onGround: true,
  onWall: false,
  wallDir: 0,

  jumpCount: 0,
  maxJumps: 2,
  jumpPressed: false,

  wallSlideSpeed: 1.2,
  wallClimbSpeed: 2.2,
  wallStickTime: 0,

  shieldActive: false,
  shieldTimer: 0,
  shieldCooldown: 0,

  attacking: false,
  attackType: null,
  attackTimer: 0,
  attackPressed: false,

  frame: 0,
  timer: 0,
  delay: 6,

  facing: "right",

  hp: 100,
  maxHp: 100,
  invincible: 0
};

/* ================= LEVEL DATA ================= */
const levels = [
  {
    length: 1600,
    walls: [
      { x: 400, y: 220, w: 40, h: 200 },
      { x: 700, y: 180, w: 40, h: 240 }
    ],
    enemies: [
      { x: 600, y: 300 },
      { x: 1000, y: 300 }
    ]
  },
  {
    length: 2000,
    walls: [
      { x: 300, y: 200, w: 40, h: 260 },
      { x: 900, y: 150, w: 40, h: 310 },
      { x: 1400, y: 220, w: 40, h: 200 }
    ],
    enemies: [
      { x: 500, y: 300 },
      { x: 1100, y: 300 },
      { x: 1600, y: 300 }
    ]
  }
];

let walls = [];
let enemies = [];

/* ================= LOAD LEVEL ================= */
function loadLevel(index) {
  currentLevel = index;
  localStorage.setItem("level", index);

  player.x = 100;
  player.y = player.groundY;
  cameraX = 0;

  walls = levels[index].walls;
  enemies = levels[index].enemies.map(e => ({
    x: e.x, y: e.y, w: 60, h: 80,
    vx: -1, hp: 50, maxHp: 50, cooldown: 0
  }));
}

/* ================= COLLISION ================= */
function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function getAttackHitbox() {
  let box = { x: 0, y: player.y, w: 0, h: player.h };

  const dir = player.facing === "right" ? 1 : -1;

  if (player.attackType === "j") box.w = 80;
  if (player.attackType === "k") box.w = 140;
  if (player.attackType === "l") {
    box.w = 300;
    box.h = 80;
    box.y = player.groundY;
  }
  if (player.attackType === "i") {
    box.w = levels[currentLevel].length;
    box.h = 120;
    box.x = 0;
    box.y = player.groundY - 20;
    return box;
  }

  box.x = dir === 1 ? player.x + player.w : player.x - box.w;
  return box;
}

/* ================= START SCREEN ================= */
window.addEventListener("keydown", e => {
  if (e.key === "Enter" && !gameStarted) {
    gameStarted = true;
    loadLevel(currentLevel);
  }
});

/* ================= BACKGROUND (PARALLAX) ================= */
function drawBackground() {
  ctx.fillStyle = "#0b132b";
  ctx.fillRect(cameraX * 0.2, 0, levels[currentLevel].length, canvas.height);

  ctx.fillStyle = "#1c2541";
  ctx.fillRect(cameraX * 0.5, 200, levels[currentLevel].length, 300);

  ctx.fillStyle = "#3a5a40";
  ctx.fillRect(cameraX, 370, levels[currentLevel].length, 80);
}

/* ================= ATTACK ================= */
function startAttack(type) {
  if (player.attacking) return;
  player.attacking = true;
  player.attackType = type;
  player.attackTimer = 18;
  player.frame = 0;
}

/* ================= UPDATE PLAYER ================= */
function updatePlayer() {
  // Movement
  if (keys["d"] || keys["arrowright"]) {
    player.vx = player.speed;
    player.facing = "right";
  } else if (keys["a"] || keys["arrowleft"]) {
    player.vx = -player.speed;
    player.facing = "left";
  } else player.vx = 0;

  // Jump / double / wall
  if ((keys[" "] || keys["w"] || keys["arrowup"]) && !player.jumpPressed) {
    if (player.onGround || player.onWall || player.jumpCount < player.maxJumps) {
      player.vy = player.jumpPower;
      player.jumpCount++;
    }
    player.jumpPressed = true;
  }
  if (!keys[" "] && !keys["w"] && !keys["arrowup"]) player.jumpPressed = false;

  // Attack input
  if (!player.attacking && !player.attackPressed) {
    if (keys["j"]) startAttack("j");
    else if (keys["k"]) startAttack("k");
    else if (keys["l"]) startAttack("l");
    else if (keys["i"]) startAttack("i");
    if (keys["j"]||keys["k"]||keys["l"]||keys["i"]) player.attackPressed = true;
  }
  if (!keys["j"]&&!keys["k"]&&!keys["l"]&&!keys["i"]) player.attackPressed = false;

  // Physics
  player.vy += player.gravity;
  player.x += player.vx;
  player.y += player.vy;

  // Ground
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.vy = 0;
    player.onGround = true;
    player.jumpCount = 0;
  } else player.onGround = false;

// ---------- WALL STICK / STAND ----------
player.onWall = false;

walls.forEach(w => {
  if (!hit(player, w)) return;

  const touchingLeft  = player.x < w.x + w.w && player.vx < 0;
  const touchingRight = player.x + player.w > w.x && player.vx > 0;

  if (touchingLeft) {
    player.x = w.x + w.w;
    player.wallDir = -1;
  } 
  else if (touchingRight) {
    player.x = w.x - player.w;
    player.wallDir = 1;
  } 
  else return;

  player.onWall = true;
  player.jumpCount = 0; // 🔁 reset jumps always

  // 🧲 WALL STICK — only when FALLING
  if (player.vy > 0) {
    player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
  }

  // 🧍 STAND on wall (no movement)
  if (player.vy === 0) {
    player.vx = 0;
  }
});

  // Shield activation
  if (keys["e"] && !player.shieldActive && player.shieldCooldown === 0) {
    player.shieldActive = true;
    player.shieldTimer = 600; // 10s (60fps)
  }

  if (player.shieldActive) {
    player.shieldTimer--;
    if (player.shieldTimer <= 0) {
      player.shieldActive = false;
      player.shieldCooldown = 300; // 5s
    }
  }

  if (player.shieldCooldown > 0) player.shieldCooldown--;

  // Animation
  player.timer++;
  if (player.timer >= player.delay) {
    player.timer = 0;
    if (player.attacking) player.frame++;
    else if (!player.onGround) player.frame = (player.frame + 1) % jumpFrames.length;
    else if (Math.abs(player.vx) > 0) player.frame = (player.frame + 1) % runFrames.length;
    else player.frame = 0;
  }

  if (player.attacking && --player.attackTimer <= 0) {
    player.attacking = false;
    player.attackType = null;
  }

  cameraX = Math.max(0, player.x - canvas.width / 2);

  // Level complete
  if (player.x > levels[currentLevel].length - 100) {
    if (currentLevel + 1 < levels.length) {
      loadLevel(currentLevel + 1);
    } else {
      alert("GAME COMPLETE!");
    }
  }
}
if (player.invincible > 0) player.invincible--;
/* ================= UPDATE ENEMIES ================= */
function updateEnemies() {
  enemies.forEach(e => {
    e.x += e.vx;

    // Enemy attack
if (hit(player, e) && e.cooldown === 0 && player.invincible === 0 && !player.shield) {
      if (!player.shieldActive) {
        player.hp -= 10;
        player.vx = player.facing === "right" ? -10 : 10;
        player.invincible = 30;
        shakeTime = 10;
      }
      e.cooldown = 40;
    }

    // Player attack hit
    if (player.attacking) {
      const box = getAttackHitbox();
      if (hit(box, e)) {
        e.hp -= 8;
        e.x += player.facing === "right" ? 25 : -25;
      }
    }

    if (e.cooldown > 0) e.cooldown--;
  });

  enemies = enemies.filter(e => e.hp > 0);
}
/* ================= DRAW ================= */
function drawPlayer() {
  let img = runFrames[player.frame % runFrames.length];
  if (!player.onGround) img = jumpFrames[player.frame % jumpFrames.length];
  if (player.attackType === "j") img = atkJ[player.frame % atkJ.length];
  if (player.attackType === "k") img = atkK[player.frame % atkK.length];

  ctx.save();
  if (player.facing === "left") {
    ctx.scale(-1,1);
    ctx.drawImage(img, -player.x-player.w, player.y, player.w, player.h);
  } else ctx.drawImage(img, player.x, player.y, player.w, player.h);
  ctx.restore();
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });}

function drawWalls() {
  ctx.fillStyle = "#888";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
}

function drawUI() {
  ctx.fillStyle = "red";
  ctx.fillRect(20,20,200,14);
  ctx.fillStyle = "lime";
  ctx.fillRect(20,20,200*(player.hp/player.maxHp),14);
  }
function drawShield() {
  if (!player.shieldActive) return;   // ✅ correct variable
  if (!shieldImg.complete) return;

  const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.05;

  const shieldW = player.w * 2.2;
  const shieldH = player.h * 2.2;

  const x = player.x + player.w / 2 - shieldW / 2;
  const y = player.y + player.h / 2 - shieldH / 2;

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    shieldImg,
    x,
    y,
    shieldW * pulse,
    shieldH * pulse
  );
  ctx.restore();
}
function loop() {
  if (!gameStarted) {
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#fff";
    ctx.font="30px Arial";
    ctx.textAlign="center";
    ctx.fillText("PRESS ENTER TO START",canvas.width/2,250);
    requestAnimationFrame(loop);
    return;
  }

  ctx.save();
  if (shakeTime-- > 0) ctx.translate(Math.random()*6-3,Math.random()*6-3);
  ctx.translate(-cameraX,0);

  drawBackground();
  updatePlayer();
  updateEnemies();
  drawWalls();
  drawEnemies();
  drawPlayer();
  drawShield();

  ctx.restore();
  drawUI();

  requestAnimationFrame(loop);
}

loop();
