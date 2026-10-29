// Fondos del espacio para las pantallas de historia y el cómic. Se dibujan con código (pixel art de 4x4 px),
// así que no hacen falta imágenes nuevas. Las texturas se crean una sola vez y se reutilizan.
const Espacio = {
  PIXEL: 4,
  COLOR_FONDO: '#050818',

  // Crea las texturas 'estrellas-lejos', 'estrellas-cerca' y 'planeta-tierra'
  texturas(scene) {
    const t = scene.textures;
    if (t.exists('planeta-tierra')) return;
    const px = this.PIXEL;

    // Dos capas de estrellas que se repiten en mosaico (para el efecto parallax)
    [['estrellas-lejos', 70, 0.45], ['estrellas-cerca', 28, 0.95]].forEach(([key, cuantas, brillo]) => {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      for (let i = 0; i < cuantas; i += 1) {
        const x = Phaser.Math.Between(0, 511 / px) * px;
        const y = Phaser.Math.Between(0, 539 / px) * px;
        g.fillStyle(0xffffff, Phaser.Math.FloatBetween(brillo * 0.5, brillo)).fillRect(x, y, px, px);
        if (brillo > 0.9 && i % 4 === 0) { // alguna estrella con forma de cruz
          g.fillStyle(0xbfd8ff, 0.5).fillRect(x - px, y, px, px).fillRect(x + px, y, px, px)
            .fillRect(x, y - px, px, px).fillRect(x, y + px, px, px);
        }
      }
      g.generateTexture(key, 512, 540);
      g.destroy();
    });

    // Un planeta en celdas de 4 px: "colorea(cx, cy)" devuelve el color de cada celda
    const planeta = (key, radio, colorea) => {
      const celdas = Math.ceil(radio * 2 / px);
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      for (let cy = 0; cy < celdas; cy += 1) {
        for (let cx = 0; cx < celdas; cx += 1) {
          const dx = (cx + 0.5) * px - radio;
          const dy = (cy + 0.5) * px - radio;
          if (dx * dx + dy * dy > radio * radio) continue;
          const sombra = (dx + dy * 0.4) / radio; // la luz viene de arriba a la izquierda
          g.fillStyle(colorea(cx, cy, sombra)).fillRect(cx * px, cy * px, px, px);
        }
      }
      g.generateTexture(key, celdas * px, celdas * px);
      g.destroy();
    };
    const ruido = (x, y) => Math.sin(x * 0.9 + Math.sin(y * 0.7) * 2) + Math.cos(y * 0.8 - x * 0.3) * 0.9;

    planeta('planeta-tierra', 80, (x, y, s) => {
      const tierra = ruido(x, y) > 0.55;
      if (s > 0.55) return tierra ? 0x24502a : 0x143a78;
      if (s > 0.15) return tierra ? 0x3a7d36 : 0x2358b0;
      return tierra ? 0x57a845 : 0x3b86e0;
    });
  },

  // Fondo completo de una pantalla fija (historia): cielo, estrellas que titilan y la Tierra
  fondoFijo(scene) {
    const { width, height } = scene.scale;
    this.texturas(scene);
    scene.cameras.main.setBackgroundColor(this.COLOR_FONDO);
    const lejos = scene.add.tileSprite(0, 0, width, height, 'estrellas-lejos').setOrigin(0, 0);
    const cerca = scene.add.tileSprite(0, 0, width, height, 'estrellas-cerca').setOrigin(0, 0);
    scene.tweens.add({ targets: cerca, alpha: 0.35, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.add.image(width - 150, height - 70, 'planeta-tierra').setAlpha(0.9);
    return { lejos, cerca };
  },
};
