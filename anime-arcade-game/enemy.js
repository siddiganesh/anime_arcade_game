class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 70;
    this.h = 110;

    this.hp = 300;
    this.phase = 1;

    this.vx = -1.5;
    this.attackTimer = 0;
  }

  update(player) {
    this.x += this.vx;

    if (this.hp < 150) this.phase = 2;
    if (this.hp < 50) this.phase = 3;

    if (this.attackTimer > 0) this.attackTimer--;

    // simple AI
    if (Math.abs(player.x - this.x) < 100 && this.attackTimer === 0) {
      this.attackTimer = 60;
      player.hp -= 10;
      player.knockback = player.x < this.x ? -10 : 10;
    }
  }

  draw(ctx, camX) {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x - camX, this.y, this.w, this.h);
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
