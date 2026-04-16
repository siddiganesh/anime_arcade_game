class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 60;
    this.h = 100;

    this.vx = 0;
    this.vy = 0;

    this.hp = 100;
    this.energy = 0;

    this.comboStep = 0;
    this.comboTimer = 0;

    this.hitCooldown = 0;
    this.knockback = 0;

    this.animations = {};
    this.state = "idle";
    this.frame = 0;
    this.frameTick = 0;
  }

  loadAnimation(name, frames) {
    this.animations[name] = frames.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  attack(type) {
    if (type === "J") {
      this.comboStep++;
      this.comboTimer = 20;
      this.state = "attackJ";
    }
    if (type === "K") {
      this.state = "attackK";
    }
    if (type === "L" && this.energy >= 100) {
      this.energy = 0;
      this.state = "attackL";
    }
    this.frame = 0;
  }

  getHitbox() {
    return {
      x: this.x + 40,
      y: this.y + 20,
      w: 50,
      h: 40
    };
  }

  update() {
    this.x += this.vx + this.knockback;
    this.y += this.vy;

    this.vy += 0.6;
    if (this.y > 380) {
      this.y = 380;
      this.vy = 0;
    }

    this.knockback *= 0.8;
    if (this.hitCooldown > 0) this.hitCooldown--;

    if (this.comboTimer > 0) this.comboTimer--;
    else this.comboStep = 0;

    this.frameTick++;
    if (this.frameTick > 6) {
      this.frame++;
      this.frameTick = 0;
    }
  }

  draw(ctx, camX) {
    const anim = this.animations[this.state];
    if (!anim) return;

    const img = anim[this.frame % anim.length];
    ctx.drawImage(img, this.x - camX, this.y, this.w, this.h);
  }
}
