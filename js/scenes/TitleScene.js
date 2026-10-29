// Pantalla de inicio de "Rumbo a la Luna", ambientada en el alunizaje del Apolo 11
// (20 de julio de 1969). El fondo es pixel art de 320x180 dibujado al triple, como el resto del juego.
const TITLE = {
  titulo: 'RUMBO A LA LUNA',
  subtitulo: 'APOLO 11 · 20 DE JULIO DE 1969',
  frase: '"UN PEQUEÑO PASO PARA EL HOMBRE,\nUN GRAN SALTO PARA LA HUMANIDAD"',
  autor: '- NEIL ARMSTRONG',
  // Modos de juego: ← → (o 1 / 2 / 3) para elegir, ENTER o clic para empezar
  modos: [
    { jugadores: 1, modo: 'local', texto: '1 JUGADOR' },
    { jugadores: 2, modo: 'local', texto: '2 JUGADORES' },
    { jugadores: 2, modo: 'online', texto: 'ONLINE' },
  ],
  separacionModos: 250, // distancia entre opciones (quedan centradas bajo el título)
  font: '"Rubik", sans-serif',
  scale: 3,
  shootingStarEvery: [900, 1900], // ms entre estrellas fugaces (al azar dentro del rango)
};

class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  preload() {
    this.load.image('fondo-luna', 'assets/images/inicio/fondo-luna.png');
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(0, 0, 'fondo-luna').setOrigin(0, 0).setScale(TITLE.scale);

    Sonido.musica('menu'); // suena en cuanto el navegador permite audio (tras el primer clic o tecla)
    this.createStars(width);
    this.createTexts(width, height);
    this.scheduleShootingStar(width);
    botonAjustes(this, width - 34, 34);

    Red.cerrar(); // si se vuelve de una partida online, se corta la conexión

    // ← → o 1 / 2 / 3 eligen el modo; ENTER, ESPACIO o un clic empiezan (un clic en el engranaje abre los ajustes)
    this.started = false;
    const ultimo = TITLE.modos.length - 1;
    this.input.keyboard.on('keydown-LEFT', () => this.selectMode(Math.max(0, this.mode - 1)));
    this.input.keyboard.on('keydown-RIGHT', () => this.selectMode(Math.min(ultimo, this.mode + 1)));
    ['ONE', 'TWO', 'THREE'].forEach((tecla, i) => this.input.keyboard.on(`keydown-${tecla}`, () => this.selectMode(i)));
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.on('pointerdown', (pointer, over) => {
      if (!over.length) this.startGame();
    });
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  // Estrellas que titilan (además de las fijas del fondo)
  createStars(width) {
    const size = TITLE.scale;
    for (let i = 0; i < 45; i += 1) {
      const x = Phaser.Math.Between(0, width / size - 1) * size;
      const y = Phaser.Math.Between(0, 105) * size;
      const star = this.add.rectangle(x, y, size, size, 0xffffff).setOrigin(0, 0);
      this.tweens.add({
        targets: star,
        alpha: { from: 1, to: 0.15 },
        duration: Phaser.Math.Between(500, 1600),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // Lanza una estrella fugaz y programa la siguiente
  scheduleShootingStar(width) {
    this.time.delayedCall(Phaser.Math.Between(...TITLE.shootingStarEvery), () => {
      this.shootingStar(width);
      this.scheduleShootingStar(width);
    });
  }

  shootingStar(width) {
    const size = TITLE.scale;
    const x = Phaser.Math.Between(width * 0.1, width * 0.6);
    const y = Phaser.Math.Between(20, 140);
    const trail = [0, 1, 2, 3].map((i) => this.add.rectangle(x - i * size * 2, y - i * size, size * 2, size, 0xffffff)
      .setOrigin(0, 0).setAlpha(1 - i * 0.25));
    this.tweens.add({
      targets: trail,
      x: `+=${size * 60}`,
      y: `+=${size * 30}`,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => trail.forEach((t) => t.destroy()),
    });
  }

  createTexts(width, height) {
    const text = (x, y, str, size, color, extra = {}) => this.add.text(x, y, str, {
      fontFamily: TITLE.font,
      fontSize: `${size}px`,
      color,
      align: 'center',
      lineSpacing: 4,
      ...extra,
    }).setOrigin(0.5).setShadow(size >= 20 ? 4 : 2, size >= 20 ? 4 : 2, '#000000', 0, false, true);

    const title = text(width / 2 - 70, 92, TITLE.titulo, 64, '#f2fbff', { fontStyle: '800' });
    title.setShadow(6, 6, '#3b6fd0', 0, false, true);
    text(width / 2 - 70, 152, TITLE.subtitulo, 20, '#f3c623');

    // El título baja flotando muy despacio
    this.tweens.add({ targets: title, y: title.y + 6, duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    // Opciones de 1 o 2 jugadores, centradas bajo el título: la elegida va en dorado, con flechas a los
    // lados, y parpadea
    this.modeTexts = TITLE.modos.map((modo, i) => {
      const x = width / 2 - 70 + (i - (TITLE.modos.length - 1) / 2) * TITLE.separacionModos;
      const t = text(x, 236, modo.texto, 24, '#f2fbff', { fontStyle: 'bold' })
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.selectMode(i));
      t.on('pointerdown', () => {
        this.selectMode(i);
        this.startGame();
      });
      return t;
    });
    const anterior = TITLE.modos.findIndex((m) => m.jugadores === Partida.jugadores && m.modo === Partida.modo);
    this.selectMode(Math.max(0, anterior));

    // Frase de Armstrong sobre el suelo lunar, en una franja oscura para que se lea
    this.add.rectangle(0, height - 66, width, 66, 0x03040a, 0.55).setOrigin(0, 0);
    text(width / 2, height - 36, TITLE.frase, 18, '#f2fbff');
    text(width - 110, height - 14, TITLE.autor, 14, '#f3c623');
  }

  selectMode(i) {
    if (this.started) return;
    if (this.mode !== undefined && this.mode !== i) Sonido.efecto('clic');
    this.mode = i;
    this.modeTexts.forEach((t, j) => {
      this.tweens.killTweensOf(t);
      t.setAlpha(1).setText(j === i ? `▶ ${TITLE.modos[j].texto} ◀` : TITLE.modos[j].texto)
        .setColor(j === i ? '#f3c623' : '#8d90a2');
      if (j === i) this.tweens.add({ targets: t, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });
    });
  }

  startGame() {
    if (this.started || PanelAjustes.recienCerrado) return;
    this.started = true;
    const { jugadores, modo } = TITLE.modos[this.mode];
    Partida.jugadores = jugadores;
    Partida.modo = modo;
    if (modo === 'online') Partida.jugador2 = null; // llegará por la red
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (modo === 'online') this.scene.start('Lobby');
      else this.scene.start('Registro', { jugador: 1 });
    });
  }
}
