class Sprite {
  constructor(images, speed = 6) {
    this.images = images.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    this.frame = 0;
    this.timer = 0;
    this.speed = speed;
  }

  draw(ctx, x, y, scale = 2) {
    const img = this.images[Math.floor(this.frame)];
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    this.timer++;
    if (this.timer > this.speed) {
      this.frame = (this.frame + 1) % this.images.length;
      this.timer = 0;
    }
  }
}
