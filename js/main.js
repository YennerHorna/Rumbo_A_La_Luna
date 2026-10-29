const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true, // mantiene los píxeles nítidos al escalar
  audio: { noAudio: true }, // el sonido lo gestiona js/audio.js (un único contexto de audio)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false, // ponlo a true para ver las cajas de colisión
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Portada (1 jugador, 2 jugadores u online) → [online: sala] → identificación del tripulante (una por jugador
  // del mismo ordenador) → cómic → [online: espera al compañero] → Nivel 1 → portada
  scene: [TitleScene, LobbyScene, RegistroScene, ComicScene, EsperaScene, HistoriaScene, GameScene],
};

// Espera a la fuente de los textos (normal y negrita); si no carga, arranca igual con otra
// (Lexend es la letra de la pantalla dividida: ver PANTALLA_DIVIDIDA.font en GameScene.js)
Promise.all(['16px "Rubik"', '700 16px "Rubik"', '800 16px "Rubik"', '500 16px "Lexend"', '700 16px "Lexend"', '800 16px "Lexend"']
  .map((f) => document.fonts.load(f)))
  .finally(() => new Phaser.Game(config));
