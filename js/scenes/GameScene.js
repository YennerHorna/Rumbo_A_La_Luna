// Capas del fondo, de la más lejana a la más cercana.
//   bottom: dónde queda el borde inferior de la capa (en píxeles desde arriba)
//   speed:  cuánto se mueve respecto a la cámara; las capas cercanas van más rápido (parallax)
const BACKGROUND_LAYERS = [
  { key: 'cielo',      file: 'assets/images/fondo/capa1-cielo.png',      height: 540, bottom: 380, speed: 0.05 },
  { key: 'montanas',   file: 'assets/images/fondo/capa2-montanas.png',   height: 250, bottom: 465, speed: 0.2 },
  { key: 'vegetacion', file: 'assets/images/fondo/capa4-vegetacion.png', height: 150, bottom: 468, speed: 0.6 },
];

// Suelo: bloques de 16x16 dibujados al triple de tamaño (48x48 en pantalla)
const GROUND_SCALE = 3;
const TILE = 16 * GROUND_SCALE;
const GROUND_TOP = 444;      // línea donde empieza el pasto
const GRASS_TOP = 4 * GROUND_SCALE; // las 4 primeras filas del pasto son matas: se pisa por debajo

const WATER_DROP = 24;       // la superficie del agua queda a la altura del borde del pasto

// Personaje: se dibuja al doble (no al triple como el suelo) para que quede algo más pequeño.
// Las velocidades van en píxeles por segundo.
const PLAYER_SCALE = 2;
const PLAYER = {
  walkSpeed: 170,
  runSpeed: 270,      // con Shift
  crouchSpeed: 80,
  jumpSpeed: 450,     // alcanza algo más de 2 bloques de alto
  // Caja de colisión en píxeles del fotograma (48x40); los pies están en la fila 38
  body:       { w: 10, h: 24, x: 20, y: 15 },
  bodyCrouch: { w: 10, h: 17, x: 20, y: 22 },
  // Golpe (J o X): cuánto dura y, dentro de ese tiempo, cuándo alcanza lo que tiene delante
  attackTime: 430,
  hitFrom: 90,
  hitTo: 330,
  hitReach: 40,       // alcance por delante del cuerpo, en píxeles de pantalla
};

// Vida: cada cono, enemigo o caída al agua quita un punto. Al llegar a 0 el personaje pierde una de sus
// vidas (el número que se ve en el corazón) y reaparece en la entrada con la barra llena.
// Sin vidas, la partida termina y se puede volver a intentar.
const HEALTH = {
  max: 5,
  vidas: 3,
  respawnDelay: 1600, // ms que dura la animación de muerte antes de reaparecer
};

// Barra de vida (arriba a la izquierda), dibujada en píxeles de 3x3 como el resto del juego
const HUD_PIXEL = 3;
const HUD_MARGIN = 16;
const HUD_TOP = 40;              // distancia desde el borde superior de la pantalla
const HUD_BAR = { w: 60, h: 5 }; // tamaño del relleno, en píxeles de la barra
const HUD_LIVES_W = 4;           // hueco para el número de vidas, a la izquierda del corazón
const HUD_COLORS = {
  outline: 0x112021,
  panel: 0x0e2038,
  empty: 0x394968,
  heart: 0xe8341c,
  shine: 0xf2fbff,
  // El relleno pasa de verde (llena) a amarillo (mitad) y a rojo (vacía)
  full: 0x6fae25,
  half: 0xe5d920,
  low: 0xcf4f1f,
};
const HEART_PIXELS = [
  '.OO.OO.',
  'OWRORRO',
  'ORRRRRO',
  '.ORRRO.',
  '..ORO..',
  '...O...',
];

// Piezas del traje que sueltan cajas y enemigos (ver "objetos" en js/nivel1.js).
// Sus iconos son assets/images/objetos/<nombre>.png (16x16).
const ITEMS = {
  scale: 2,            // tamaño en el mundo (32 px)
  hudScale: 2,         // tamaño del icono bajo la barra de vida (baja a 1 si no caben)
  hudTop: 78,          // fila de iconos, en píxeles desde arriba
  // (el tamaño de letra del contador está en LETRA_NORMAL / PANTALLA_DIVIDIDA.letra)
  missing: 0x394968,   // color de la silueta de las piezas que faltan
  textColor: 0xf2fbff,
  doneColor: 0xadc917, // contador cuando ya está completa
};

// Teclas de cada acción. "solo" es la partida de 1 jugador; j1 y j2, los dos jugadores de la pantalla dividida
// (comparten teclado: el 1 a la izquierda con WASD y el 2 a la derecha con las flechas).
const MANDOS = {
  solo: { izquierda: ['LEFT', 'A'], derecha: ['RIGHT', 'D'], abajo: ['DOWN', 'S'], saltar: ['UP', 'W', 'SPACE'], golpear: ['J', 'X'], correr: ['SHIFT'] },
  j1: { izquierda: ['A'], derecha: ['D'], abajo: ['S'], saltar: ['W'], golpear: ['F'], correr: ['G'] },
  j2: { izquierda: ['LEFT'], derecha: ['RIGHT'], abajo: ['DOWN'], saltar: ['UP'], golpear: ['M'], correr: ['SHIFT'] },
};

// Pantalla dividida (2 jugadores): arriba el jugador 1 y abajo el 2. Cada mitad es como la pantalla
// del juego en pequeño: el mundo se dibuja a "zoom" (0.7 = al 70 %) y su cámara sigue al personaje
// también en vertical. Cada personaje solo aparece en su mitad.
const PANTALLA_DIVIDIDA = {
  zoom: 0.8,
  zoomHud: 0.8,  // el HUD se reduce algo menos, para que sus textos se sigan leyendo
  limite: 500,   // la cámara no baja de aquí (así no se ve tanta tierra bajo el suelo)
  // Letra de todos los textos del nivel con la pantalla dividida: Lexend está pensada para leerse bien
  // (letras anchas, abiertas y con mucho espacio entre ellas), también en tamaños pequeños
  font: '"Lexend", "Rubik", sans-serif',
  // Tamaños de letra (px) con la pantalla dividida. El HUD se dibuja a zoomHud y el bocadillo a zoom,
  // así que en pantalla se ven algo más pequeños que estos números. Ver LETRA_NORMAL para 1 jugador.
  letra: {
    vidas: 17, piezas: 17, nombre: 17, teclaVoz: 17,
    controles: 16, controlesLinea: 21, controlesColumna: 112, controlesAncho: 200,
    avisoTitulo: 22, avisoTexto: 17, avisoAncho: 560,
    bocadilloNombre: 18, bocadilloTexto: 22,
  },
};

// Tamaños de letra (px) con 1 jugador (los de siempre)
const LETRA_NORMAL = {
  vidas: 14, piezas: 15, nombre: 14, teclaVoz: 14,
  controles: 12, controlesLinea: 16, controlesColumna: 92, controlesAncho: 0, // 0 = el ancho de la barra de vida
  avisoTitulo: 16, avisoTexto: 13, avisoAncho: 440,
  bocadilloNombre: 13, bocadilloTexto: 16,
};

// Controles básicos que se muestran debajo de las piezas del traje: [teclas, acción, códigos de tecla].
// Cada fila desaparece la primera vez que se usa esa acción (con cualquiera de sus teclas);
// cuando ya se han usado todas, el panel se va. Hay una lista por mando (ver MANDOS).
// 'FLECHAS' y 'FLECHA_ARRIBA' se dibujan en píxeles (la fuente dibuja los símbolos de flecha demasiado pequeños).
const CONTROLES = {
  listas: {
    solo: [
      ['FLECHAS', 'Mover', ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']],
      ['ESPACIO', 'Saltar', ['Space', 'KeyW', 'ArrowUp']],
      ['X', 'Golpear', ['KeyX', 'KeyJ']],
    ],
    j1: [
      ['A / D', 'Mover', ['KeyA', 'KeyD']],
      ['W', 'Saltar', ['KeyW']],
      ['F', 'Golpear', ['KeyF']],
    ],
    j2: [
      ['FLECHAS', 'Mover', ['ArrowLeft', 'ArrowRight']],
      ['FLECHA_ARRIBA', 'Saltar', ['ArrowUp']],
      ['M', 'Golpear', ['KeyM']],
    ],
  },
  hueco: 6,           // separación con el panel de las piezas
  // (el tamaño de letra, el alto de cada fila y dónde empieza la acción están en LETRA_NORMAL / PANTALLA_DIVIDIDA.letra)
  flecha: ['..X....', '.XXXXXX', 'XXXXXXX', '.XXXXXX', '..X....'], // flecha izquierda; la derecha es su reflejo
  flechaPixel: 2,
};

// Voz: mantén V (o pulsa el micrófono) y habla; el personaje lo repite con la voz que
// corresponde al sexo del DNI (ver js/voz.js). El engranaje o Esc abren los ajustes.
const SPEECH = {
  font: '"Rubik", sans-serif',
  maxWidth: 240,       // ancho máximo del texto del bocadillo
  hideAfter: 2500,     // ms que se queda el bocadillo si no se repite en voz alta
  colors: { text: '#112021', name: '#3b6fd0', listening: '#6c707e', error: '#cf4f1f' },
};

// Enemigos: sprites de 16x16 al triple, como los obstáculos.
// body: caja de colisión en píxeles del sprite. vida: golpes que aguantan.
const ENEMIES = {
  robot: {
    body: { w: 11, h: 14, x: 3, y: 2 },
    vida: 2,
    knockback: 50,       // retroceso al recibir un golpe
    stun: 300,           // ms que se queda parado tras el golpe
    debris: [0x797e95, 0x515c7a, 0xf08a3c],
    // Disparo: si ve al personaje delante y a su altura, se para, carga y dispara un láser.
    // El láser sale a la altura del pecho: agachándose se esquiva.
    shotRange: 340,      // distancia máxima en horizontal
    shotHeight: 50,      // diferencia de altura máxima para verlo
    shotWindup: 400,     // ms que carga antes de disparar (brilla)
    shotCooldown: 2200,  // ms entre disparos
    shotSpeed: 280,
    shotY: -14,          // altura del láser respecto al centro del robot
  },
  dron: {
    body: { w: 12, h: 11, x: 2, y: 3 },
    vida: 1,
    alto: 3,             // bloques sobre el suelo a los que vuela normalmente
    bob: 6,              // cuánto sube y baja mientras vuela alto
    bobSpeed: 0.004,
    chaseRange: 220,     // si el personaje se acerca a esta distancia, lo sigue
    chaseBoost: 1.4,     // y va así de más rápido
    // Picada: cada cierto tiempo baja (a por el personaje si está cerca) y vuelve a subir
    diveEvery: [2200, 3400], // ms entre picadas (al azar dentro del rango)
    diveDown: 650,       // ms que tarda en bajar
    diveHold: 250,       // ms abajo
    diveUp: 900,         // ms que tarda en volver a subir
    diveLow: 54,         // si no hay nadie cerca, baja hasta esta altura sobre el suelo (px)
    debris: [0xa9aec2, 0x5a7fa8, 0xe8341c],
  },
};

// Sprites de los obstáculos (16 px de alto salvo las plataformas, de 8 px)
const OBSTACLE_IMAGES = [
  'caja', 'caja-rompible', 'cono', 'barrera',
  'plataforma', 'plataforma-pata', 'plataforma-movil',
];

// Partida online (ver js/red.js): este ordenador manda la posición de su personaje cada "envioCada" ms y
// el compañero se dibuja en la mitad de abajo con lo que llega. Si salta más de "salto" px (al reaparecer,
// por ejemplo) se coloca de golpe; si no, se acerca suavemente ("suavizado", de 0 a 1).
const ONLINE = {
  envioCada: 66,
  salto: 200,
  suavizado: 0.35,
};

// Copia del nivel con las piezas del traje repartidas al azar: se juntan todas las que el diseño
// reparte entre cajas rompibles, robots y drones, y se esconden de nuevo en sitios elegidos al azar.
// Cada jugador tiene su propio juego de piezas, repartido por separado (un sitio puede guardar una
// pieza de cada uno). En cada sitio queda "objetos": [{ key, owner }], owner = número de jugador (0 o 1).
function repartirPiezas(nivel, jugadores) {
  const copia = (lista) => lista.map((o) => ({ ...o, objeto: undefined, objetos: [] }));
  const n = {
    ...nivel,
    cajasRompibles: copia(nivel.cajasRompibles),
    robots: copia(nivel.robots),
    drones: copia(nivel.drones),
  };
  const piezas = [...nivel.cajasRompibles, ...nivel.robots, ...nivel.drones]
    .map((o) => o.objeto)
    .filter(Boolean);
  for (let owner = 0; owner < jugadores; owner += 1) {
    const sitios = Phaser.Utils.Array.Shuffle([...n.cajasRompibles, ...n.robots, ...n.drones]);
    piezas.forEach((key, i) => sitios[i].objetos.push({ key, owner }));
  }
  return n;
}

// Piezas nuevas solo para el jugador "owner" (al reiniciar su parte): por cada sitio, la lista de sus piezas
function repartirJugador(nivel, owner) {
  const reparto = exportarReparto(repartirPiezas(nivel, 1));
  Object.keys(reparto).forEach((tipo) => {
    reparto[tipo] = reparto[tipo].map((lista) => lista.map(({ key }) => ({ key, owner })));
  });
  return reparto;
}

// En online el anfitrión reparte las piezas de los dos y se lo manda al compañero: solo viajan los
// "objetos" de cada sitio
function exportarReparto(n) {
  return {
    cajasRompibles: n.cajasRompibles.map((o) => o.objetos),
    robots: n.robots.map((o) => o.objetos),
    drones: n.drones.map((o) => o.objetos),
  };
}

// Copia del nivel con un reparto recibido. Con "intercambiar" (el que se unió a la sala) las piezas del
// anfitrión pasan a ser del jugador 1 y las suyas del 0: cada uno es siempre el jugador 0 en su ordenador.
function aplicarReparto(nivel, reparto, intercambiar) {
  const pon = (lista, objetos) => lista.map((o, i) => ({
    ...o,
    objeto: undefined,
    objetos: objetos[i].map(({ key, owner }) => ({ key, owner: intercambiar ? 1 - owner : owner })),
  }));
  return {
    ...nivel,
    cajasRompibles: pon(nivel.cajasRompibles, reparto.cajasRompibles),
    robots: pon(nivel.robots, reparto.robots),
    drones: pon(nivel.drones, reparto.drones),
  };
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  // Recibe { nivel: 1 } (ver js/nivel1.js). Sin datos, empieza el Nivel 1.
  // Con Partida.jugadores = 2 (y el segundo tripulante identificado) la pantalla se divide en dos.
  // En online recibe también { reparto } (las piezas de los dos, ver EsperaScene) y el jugador 2 es el
  // compañero del otro ordenador.
  init(data) {
    this.online = Partida.modo === 'online';
    this.dosJugadores = Partida.jugadores === 2 && Boolean(Partida.jugador2);
    this.font = this.dosJugadores ? PANTALLA_DIVIDIDA.font : SPEECH.font; // letra de los textos del nivel
    this.letra = this.dosJugadores ? PANTALLA_DIVIDIDA.letra : LETRA_NORMAL; // y sus tamaños
    const base = NIVELES[(data && data.nivel) || 1] || NIVEL_1;
    // { solo }: la partida online sigue en solitario porque el compañero se fue (ver continueSolo)
    this.continuar = (data && data.solo) || null;
    if (this.continuar) this.nivel = aplicarReparto(base, this.continuar.reparto, false);
    else if (this.online && data && data.reparto) this.nivel = aplicarReparto(base, data.reparto, !Red.esAnfitrion);
    else this.nivel = repartirPiezas(base, this.dosJugadores ? 2 : 1);
    this.tripulantes = [{ nombre: Voz.ajustes.nombre, sexo: Voz.ajustes.sexo }];
    if (this.dosJugadores) this.tripulantes.push(Partida.jugador2);
    // Personaje de cada uno según el sexo de su DNI: M = masculino, F = femenino
    this.variantes = this.tripulantes.map((t) => PERSONAJE.variantes[t.sexo] || PERSONAJE.variantes.M);
    this.completado = false;
    this.perdido = false;
    this.leaving = false;
  }

  preload() {
    BACKGROUND_LAYERS.forEach((layer) => this.load.image(layer.key, layer.file));
    this.load.image('suelo-pasto', 'assets/images/terreno/suelo-pasto.png');
    this.load.image('suelo-base', 'assets/images/terreno/suelo-base.png');
    this.load.image('suelo-pasto-orilla', 'assets/images/terreno/suelo-pasto-orilla.png');
    this.load.image('suelo-base-orilla', 'assets/images/terreno/suelo-base-orilla.png');
    this.load.image('agua-superficie', 'assets/images/terreno/agua-superficie.png');
    this.load.image('agua-profunda', 'assets/images/terreno/agua-profunda.png');
    OBSTACLE_IMAGES.forEach((key) => this.load.image(key, `assets/images/obstaculos/${key}.png`));
    this.load.spritesheet('robot', 'assets/images/enemigos/robot.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('dron', 'assets/images/enemigos/dron.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('laser', 'assets/images/enemigos/laser.png');
    this.nivel.objetos.forEach((key) => this.load.image(`objeto-${key}`, `assets/images/objetos/${key}.png`));
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
    this.load.image('icono-microfono', 'assets/images/ui/icono-microfono.png');
    this.variantes.forEach((pj) => this.load.spritesheet(pj.key, pj.file, {
      frameWidth: PERSONAJE.frameWidth,
      frameHeight: PERSONAJE.frameHeight,
    }));
  }

  create() {
    const { width, height } = this.scale;
    const worldWidth = this.nivel.ancho * TILE;

    this.createViews(worldWidth, height);
    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.createBackground(worldWidth);

    // Grupos de colisión:
    //   ground:     suelo y escalones          solids:   cajas y barreras (bloquean)
    //   hazards:    conos (hacen daño)
    //   platforms:  plataformas fijas y móviles, solo se pisan desde arriba
    //   water:      charcos
    // Lo que se puede romper o destruir va en un "mundo" por jugador (con 2 jugadores, cada uno rompe lo
    // suyo sin que cambie en la pantalla del otro). Cada mundo tiene:
    //   breakables: cajas rompibles          robots / drones / lasers: enemigos y sus disparos
    // y solo contiene las piezas del traje de su jugador.
    this.ground = this.physics.add.staticGroup();
    this.water = this.physics.add.staticGroup();
    this.solids = this.physics.add.staticGroup();
    this.mundos = this.tripulantes.map((t, index) => ({ index, breakables: this.physics.add.staticGroup() }));
    this.hazards = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = [];

    this.createGround(height);
    this.createSteps();
    this.createWater(height);
    this.createObstacles();
    this.createEnemies();
    this.createCharacterAnimations();
    this.createItems();
    this.players = this.tripulantes.map((t, i) => this.createPlayer(i));
    // Con pantalla dividida, cada personaje solo se ve en su mitad
    this.players.forEach((p) => this.views.forEach((cam) => {
      if (cam !== p.cam) cam.ignore(p.sprite);
    }));
    this.createHud();
    this.asHud('arriba', () => this.createNotice()); // el aviso de arriba sale una sola vez, en la mitad de arriba

    // Cada cámara sigue a su personaje: el fondo (parallax) solo se desplaza cuando él se mueve
    this.players.forEach((p) => p.cam.startFollow(p.sprite, true, 0.12, 0.12));
    this.setupOnline();
    if (this.continuar) {
      this.restoreSolo(this.continuar);
      return;
    }
    this.allCameras().forEach((cam) => cam.fadeIn(600, 0, 0, 0));

    Sonido.musica(this.nivel.musica); // música del nivel; si ya suena esa, no se repite
    this.showNotice(`NIVEL ${this.nivel.numero} · ${this.nivel.nombre}`, this.nivel.objetivo, 4500);
  }

  // Una cámara por jugador. Con 1 jugador, la de siempre a pantalla completa. Con 2, la pantalla se parte
  // en horizontal (arriba el jugador 1, abajo el 2) y cada mitad tiene dos cámaras: la del mundo (views)
  // y otra encima para su HUD (hudCams), ambas a PANTALLA_DIVIDIDA.zoom.
  // El HUD se coloca como si la pantalla midiera hudWidth de ancho (el ancho que cabe a ese zoom).
  createViews(worldWidth, height) {
    const { width } = this.scale;
    const main = this.cameras.main;
    this.views = [main];
    this.hudCams = [];
    this.hudWidth = width;
    this.viewWidth = width; // ancho del mundo que se ve en cada vista
    main.setBounds(0, 0, worldWidth, height);
    if (!this.dosJugadores) return;

    const { zoom, zoomHud } = PANTALLA_DIVIDIDA;
    const mitad = height / 2;
    this.hudWidth = width / zoomHud;
    this.viewWidth = width / zoom;
    this.views.push(this.cameras.add(0, mitad, width, mitad));
    this.views.forEach((cam, i) => {
      if (i === 0) cam.setViewport(0, 0, width, mitad);
      cam.setZoom(zoom).setBounds(0, 0, worldWidth, PANTALLA_DIVIDIDA.limite);
    });
    // Cámaras del HUD: quietas, con el zoom aplicado desde la esquina de arriba a la izquierda
    this.hudCams = [0, mitad].map((y) => this.cameras.add(0, y, width, mitad).setZoom(zoomHud).setOrigin(0, 0));

    // Cada objeto nuevo solo lo ven sus cámaras: lo del mundo, las dos vistas; el HUD de un jugador, la
    // cámara de HUD de su mitad; lo marcado como 'arriba', solo el HUD de arriba; y 'panel', ninguna
    // (lo enseña una cámara propia, ver showGameOver)
    this.hudOwner = null;
    this.events.on('addedtoscene', (obj) => {
      const owner = this.hudOwner;
      if (!owner) {
        this.hudCams.forEach((cam) => cam.ignore(obj));
        return;
      }
      this.views.forEach((cam) => cam.ignore(obj));
      this.hudCams.forEach((cam, i) => {
        const suyo = owner === 'arriba' ? i === 0 : owner !== 'panel' && owner.index === i;
        if (!suyo) cam.ignore(obj);
      });
    });
  }

  // Crea con "crear" objetos del HUD de "owner" (un jugador, 'arriba' o 'panel'); ver createViews
  asHud(owner, crear) {
    const antes = this.hudOwner;
    this.hudOwner = this.dosJugadores ? owner : null;
    const resultado = crear();
    this.hudOwner = antes;
    return resultado;
  }

  // Fondo del nivel: cielo, montañas y vegetación. Cada capa se desplaza más despacio que el mundo
  // (scrollFactor = speed), así el parallax funciona igual en cualquier cámara.
  createBackground(worldWidth) {
    const width = this.viewWidth;
    // Con zoom, al principio del nivel la cámara mira un poco a la izquierda del 0: las capas empiezan un
    // ancho de vista antes (y desplazan su imagen lo mismo, para que el dibujo quede donde estaba)
    const antes = this.dosJugadores ? width : 0;
    // Mismo celeste que el borde inferior del cielo, para rellenar debajo de él
    this.views.forEach((cam) => cam.setBackgroundColor('#85dcfc'));
    BACKGROUND_LAYERS.forEach((layer) => {
      const w = antes + width + Math.ceil((worldWidth - width) * layer.speed) + 2; // lo justo para cubrir todo el nivel
      const capa = this.add.tileSprite(-antes, layer.bottom, w, layer.height, layer.key)
        .setOrigin(0, 1)
        .setScrollFactor(layer.speed, 1);
      capa.tilePositionX = -antes;
    });
  }

  // Todas las cámaras (vistas de los jugadores y, al perder, la del panel)
  allCameras() {
    return this.cameras.cameras;
  }

  // Funde a negro todas las cámaras y luego llama a "alTerminar"
  fadeOutAll(duration, alTerminar) {
    this.allCameras().forEach((cam) => cam.fadeOut(duration, 0, 0, 0));
    this.cameras.main.once('camerafadeoutcomplete', alTerminar);
  }

  // Altura del pecho del personaje (el compañero online no tiene caja de colisión: se calcula con su dibujo)
  chestY(p) {
    return p.remoto ? p.sprite.y + 6 : p.sprite.body.center.y;
  }

  // Personaje al que atacan los enemigos del mundo m (el suyo), o null si está muerto o sin vidas
  targetOf(m) {
    const p = this.players[m.index];
    return p && !p.dead && !p.out ? p : null;
  }

  // Con pantalla dividida, "obj" solo se ve en la mitad del mundo m
  onlyIn(m, obj) {
    this.views.forEach((cam, i) => {
      if (i !== m.index) cam.ignore(obj);
    });
    return obj;
  }

  // Las piezas del mundo m que guarda un sitio (caja o enemigo)
  piecesOf(m, sitio) {
    return sitio.objetos.filter((o) => o.owner === m.index);
  }

  // Animación del personaje: cada variante (M / F) tiene las suyas, con su clave delante
  playAnim(p, name, ignoreIfPlaying = false) {
    p.sprite.play(`${p.pj.key}-${name}`, ignoreIfPlaying);
  }

  // Crea el personaje del jugador i (0 o 1) y devuelve su estado: sprite, cámara, teclas, vida...
  createPlayer(i) {
    const pj = this.variantes[i];
    const p = {
      index: i,
      pj,
      nombre: this.tripulantes[i].nombre,
      cam: this.views[i],
      // En online cada uno juega en su teclado con los controles de 1 jugador
      mando: this.dosJugadores && !this.online ? `j${i + 1}` : 'solo',
      remoto: this.online && i === 1, // el compañero online: lo mueve la red, no el teclado
      spawn: { x: (2 + i) * TILE, y: this.floorY() - 60 },
      wasOnGround: false,
      hurtUntil: 0,
      invulnerableUntil: 0,
      attackStart: -Infinity,
      attackLanded: false,
      health: HEALTH.max,
      lives: HEALTH.vidas,
      dead: false,
      out: false, // sin vidas (con 2 jugadores, el otro puede seguir)
      wasCrouching: false,
      itemCount: Object.fromEntries(this.nivel.objetos.map((key) => [key, 0])), // piezas que lleva
    };
    const sprite = this.physics.add.sprite(p.spawn.x, p.spawn.y, pj.key)
      .setScale(PLAYER_SCALE)
      .setCollideWorldBounds(true);
    p.sprite = sprite;
    this.playAnim(p, 'idle');
    this.setPlayerBody(p, PLAYER.body);

    this.physics.add.collider(sprite, this.ground);
    this.physics.add.collider(sprite, this.solids);
    const m = this.mundos[i];
    this.physics.add.collider(sprite, m.breakables);
    this.physics.add.collider(sprite, this.platforms);
    this.physics.add.collider(sprite, this.movingPlatforms);
    this.physics.add.overlap(sprite, this.hazards, (s, cone) => this.hurtPlayer(p, cone));
    this.physics.add.overlap(sprite, this.water, () => this.respawnPlayer(p));
    this.physics.add.overlap(sprite, m.robots, (s, enemy) => this.hurtPlayer(p, enemy));
    this.physics.add.overlap(sprite, m.drones, (s, enemy) => this.hurtPlayer(p, enemy));
    this.physics.add.overlap(sprite, this.items, (s, item) => this.collectItem(p, item));
    this.physics.add.overlap(sprite, m.lasers, (s, laser) => {
      this.hurtPlayer(p, laser);
      this.destroyLaser(laser);
    });

    // El compañero online no choca con nada aquí: su posición llega por la red (ver updateRemote)
    if (p.remoto) {
      sprite.body.enable = false;
      return p;
    }
    // Teclas de cada acción (ver MANDOS)
    p.keys = {};
    Object.entries(MANDOS[p.mando]).forEach(([accion, teclas]) => {
      p.keys[accion] = teclas.map((t) => this.input.keyboard.addKey(t));
    });
    return p;
  }

  // HUD de cada jugador: vida, sus piezas del traje y controles; el 1 lleva además
  // el micrófono y el engranaje. Con pantalla dividida, cada cámara solo ve el HUD de su jugador.
  createHud() {
    const [p1, p2] = this.players;
    this.asHud(p1, () => {
      this.createHealthBar(p1);
      this.createItemsHud(p1);
      this.createControlsHud(p1);
      this.createVoiceControls();
      if (p2) this.createNameTag(p1);
    });
    if (!p2) return;
    this.asHud(p2, () => {
      this.createHealthBar(p2);
      this.createItemsHud(p2);
      if (!p2.remoto) this.createControlsHud(p2);
      this.createNameTag(p2);
      // Línea que separa las dos mitades (arriba de la mitad de abajo)
      this.add.rectangle(0, 0, this.hudWidth, 8, HUD_COLORS.outline).setOrigin(0, 0).setScrollFactor(0).setDepth(140);
    });
  }

  // Con 2 jugadores, en el hueco de encima de la barra de vida: "J1 · NOMBRE"
  createNameTag(p) {
    const u = HUD_PIXEL;
    const bottom = HUD_TOP - 2 * u - 3; // justo encima del panel de la vida
    const texto = this.add.text(HUD_MARGIN, bottom - u, `J${p.index + 1} · ${(p.nombre || 'Tripulante').toUpperCase()}`, {
      fontFamily: this.font, fontSize: `${this.letra.nombre}px`, fontStyle: '800', color: '#f3c623',
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(101).setShadow(1, 1, '#112021', 0, false, true);
    this.add.graphics().setScrollFactor(0).setDepth(100)
      .fillStyle(HUD_COLORS.panel, 0.65)
      .fillRect(HUD_MARGIN - 2 * u, bottom - texto.height - 2 * u, texto.width + 4 * u, texto.height + 2 * u);
  }

  // Barra de vida fija en pantalla: un corazón con las vidas que quedan y la barra de vida
  createHealthBar(p) {
    p.healthBar = this.add.graphics().setScrollFactor(0).setDepth(100);
    p.shownHealth = p.health; // la barra baja poco a poco hasta la vida real
    this.drawHealthBar(p);
    // Número de vidas a la izquierda del corazón
    const u = HUD_PIXEL;
    const cx = HUD_MARGIN + (HUD_LIVES_W / 2 - 0.5) * u;
    const cy = HUD_TOP + this.healthBarHeight() / 2;
    p.livesText = this.add.text(cx, cy, String(p.lives), {
      fontFamily: this.font, fontSize: `${this.letra.vidas}px`, fontStyle: '800', color: '#f2fbff',
      stroke: '#112021', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  updateLives(p) {
    this.sendLife(p);
    p.livesText.setText(String(p.lives));
    this.tweens.add({ targets: p.livesText, scale: 1.6, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }

  // Anima la barra desde lo que muestra ahora hasta la vida actual
  updateHealthBar(p) {
    this.sendLife(p);
    this.tweens.killTweensOf(p);
    this.tweens.add({
      targets: p,
      shownHealth: p.health,
      duration: 350,
      ease: 'Quad.easeOut',
      onUpdate: () => this.drawHealthBar(p),
    });
  }

  // Color del relleno según la vida que quede: verde → amarillo → rojo
  healthColor(ratio) {
    const { Color } = Phaser.Display;
    const [from, to, t] = ratio > 0.5
      ? [HUD_COLORS.half, HUD_COLORS.full, (ratio - 0.5) * 2]
      : [HUD_COLORS.low, HUD_COLORS.half, ratio * 2];
    const c = Color.Interpolate.ColorWithColor(
      Color.IntegerToColor(from), Color.IntegerToColor(to), 100, Math.round(t * 100));
    return Color.GetColor(c.r, c.g, c.b);
  }

  // Versión más clara de un color, para la fila de brillo de la barra
  lighten(color, amount) {
    const c = Phaser.Display.Color.IntegerToColor(color);
    const mix = (v) => Math.round(v + (255 - v) * amount);
    return Phaser.Display.Color.GetColor(mix(c.red), mix(c.green), mix(c.blue));
  }

  drawHealthBar(p) {
    const g = p.healthBar.clear();
    const u = HUD_PIXEL;
    const barW = HUD_BAR.w + 2; // relleno más el marco
    const barH = HUD_BAR.h + 2;
    const heartW = HEART_PIXELS[0].length;
    const totalW = heartW + 2 + HUD_LIVES_W + barW;
    const totalH = Math.max(HEART_PIXELS.length, barH);
    const px = (x, y, w, h, color, alpha = 1) => {
      g.fillStyle(color, alpha).fillRect(HUD_MARGIN + x * u, HUD_TOP + y * u, w * u, h * u);
    };

    // Panel oscuro detrás para que se lea sobre el cielo
    px(-2, -2, totalW + 4, totalH + 4, HUD_COLORS.panel, 0.65);

    const heartColors = { O: HUD_COLORS.outline, R: HUD_COLORS.heart, W: HUD_COLORS.shine };
    HEART_PIXELS.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (heartColors[c]) px(HUD_LIVES_W + x, y, 1, 1, heartColors[c]);
      });
    });

    const ratio = Phaser.Math.Clamp(p.shownHealth / HEALTH.max, 0, 1);
    const fillW = Math.round(HUD_BAR.w * ratio);
    const fill = this.healthColor(ratio);

    const bx = heartW + 2 + HUD_LIVES_W;
    const by = Math.floor((totalH - barH) / 2);
    px(bx, by, barW, barH, HUD_COLORS.outline);
    px(bx + 1, by + 1, HUD_BAR.w, HUD_BAR.h, HUD_COLORS.empty);
    if (fillW > 0) {
      px(bx + 1, by + 1, fillW, HUD_BAR.h, fill);
      px(bx + 1, by + 1, fillW, 1, this.lighten(fill, 0.4));
      px(bx + 1, by + HUD_BAR.h, fillW, 1, Phaser.Display.Color.ValueToColor(fill).darken(25).color);
    }
  }

  // Resta vida y actualiza la barra. Devuelve true si el personaje ha muerto.
  damagePlayer(p, amount) {
    p.health = Math.max(0, p.health - amount);
    this.updateHealthBar(p);
    this.tweens.add({ targets: p.healthBar, x: 4, duration: 40, yoyo: true, repeat: 3 });
    if (p.health > 0) return false;
    this.killPlayer(p);
    return true;
  }

  killPlayer(p) {
    p.dead = true;
    p.lives = Math.max(0, p.lives - 1);
    this.updateLives(p);
    this.tweens.killTweensOf(p.sprite);
    p.sprite.setAlpha(1);
    this.playAnim(p, 'death');
    this.time.delayedCall(HEALTH.respawnDelay, () => {
      if (p.lives === 0) {
        this.playerOut(p);
        return;
      }
      p.dead = false;
      p.health = HEALTH.max;
      this.updateHealthBar(p);
      p.sprite.body.reset(p.spawn.x, p.spawn.y);
      p.wasCrouching = false;
      this.playAnim(p, 'idle');
    });
  }

  // En online, la vida del personaje de este ordenador se le cuenta al compañero
  sendLife(p) {
    if (this.online && !p.remoto) Red.enviar({ t: 'vida', health: p.health, lives: p.lives });
  }

  // Sin vidas. Si ya no queda nadie, se acaba la partida; con 2 jugadores, el que queda sigue solo
  // y la vista del eliminado pasa a seguir a su compañero.
  // aviso = false: sin el mensaje de "se quedó sin vidas" (por ejemplo, si el compañero online se fue)
  // Con 1 jugador se acaba la partida. Con 2, solo el que perdió puede reiniciar su parte (panel en su mitad)
  // y, mientras, su mitad sigue al compañero, que juega sin interrupción.
  // aviso = false: sin el mensaje de "se quedó sin vidas" (por ejemplo, si el compañero online se fue)
  playerOut(p, aviso = true) {
    p.out = true;
    if (this.online && !p.remoto) Red.enviar({ t: 'fuera' });
    if (!this.dosJugadores) {
      this.showGameOver();
      return;
    }
    p.sprite.setVisible(false);
    p.sprite.body.enable = false;
    const vivo = this.players.find((o) => !o.out);
    if (vivo) {
      vivo.sprite.cameraFilter &= ~p.cam.id; // ahora su mitad también lo ve
      p.cam.startFollow(vivo.sprite, true, 0.12, 0.12);
    }
    if (!p.remoto && !p.desconectado) this.showRestartPanel(p);
    this.checkComplete(); // por si el que queda ya tenía su traje completo y el otro se fue
    if (!aviso || !vivo) return;
    const nombre = (n, i) => (n || `Jugador ${i + 1}`).toUpperCase();
    this.showNotice(`${nombre(p.nombre, p.index)} SE QUEDÓ SIN VIDAS`,
      `¡${nombre(vivo.nombre, vivo.index)} sigue la misión!`, 4000);
  }

  // Panel en la mitad del jugador p para que reinicie su parte (con el ratón o con su tecla de golpear)
  showRestartPanel(p) {
    const tecla = MANDOS[p.mando].golpear.slice(-1)[0]; // la que sale en su panel de controles
    const mitad = this.scale.height / 2 / PANTALLA_DIVIDIDA.zoomHud; // alto de una mitad en coordenadas del HUD
    p.restartPanel = this.asHud(p, () => {
      const w = 520;
      const h = 190;
      const capa = this.add.container(this.hudWidth / 2, mitad / 2).setScrollFactor(0).setDepth(130).setAlpha(0);
      const g = this.add.graphics()
        .fillStyle(HUD_COLORS.outline).fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8)
        .fillStyle(0x3b6fd0).fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4)
        .fillStyle(HUD_COLORS.panel, 0.97).fillRect(-w / 2, -h / 2, w, h);
      const titulo = this.add.text(0, -h / 2 + 18, '¡TE QUEDASTE SIN VIDAS!', {
        fontFamily: this.font, fontSize: '28px', fontStyle: '800', color: '#e8341c',
      }).setOrigin(0.5, 0).setShadow(3, 3, '#112021', 0, false, true);
      const texto = this.add.text(0, -h / 2 + 62, `Vuelve a empezar tu parte (pulsa ${tecla} o el botón).\nTu compañero sigue jugando.`, {
        fontFamily: this.font, fontSize: '17px', color: '#f2fbff', align: 'center', lineSpacing: 4,
      }).setOrigin(0.5, 0);
      const boton = this.gameOverButton(0, h / 2 - 36, 'REINICIAR', 0xf3c623, () => this.restartPlayer(p));
      capa.add([g, titulo, texto, boton]);
      this.tweens.add({ targets: capa, alpha: 1, duration: 400 });
      return capa;
    });
  }

  // El jugador p vuelve a empezar su parte: 3 vidas, en la entrada, con su mundo y sus piezas de cero.
  // "reparto": sus piezas nuevas (en online, las del compañero llegan por la red; si no, se reparten aquí).
  restartPlayer(p, reparto = repartirJugador(this.nivel, p.index)) {
    if (!p.out || this.completado) return;
    if (p.restartPanel) {
      p.restartPanel.destroy();
      p.restartPanel = null;
      Sonido.efecto('clic');
    }
    if (this.online && !p.remoto) {
      // Al compañero se le mandan las piezas con su número de jugador de allí (este ordenador es el 1)
      const suyo = {};
      Object.keys(reparto).forEach((tipo) => {
        suyo[tipo] = reparto[tipo].map((lista) => lista.map(({ key }) => ({ key, owner: 1 })));
      });
      Red.enviar({ t: 'reinicio', reparto: suyo });
    }
    this.rebuildWorld(this.mundos[p.index], reparto);
    p.out = false;
    p.dead = false;
    p.lives = HEALTH.vidas;
    p.health = HEALTH.max;
    p.hurtUntil = 0;
    p.invulnerableUntil = 0;
    p.wasCrouching = false;
    Object.keys(p.itemCount).forEach((key) => { p.itemCount[key] = 0; });
    this.drawItemsHud(p);
    this.updateLives(p);
    this.updateHealthBar(p);
    p.sprite.setVisible(true).setAlpha(1);
    if (p.remoto) {
      p.sprite.setPosition(p.spawn.x, p.spawn.y);
      p.objetivo = null;
    } else {
      p.sprite.body.enable = true;
      p.sprite.body.reset(p.spawn.x, p.spawn.y);
    }
    this.playAnim(p, 'idle');
    // Su mitad vuelve a ser solo suya
    this.players.forEach((o) => {
      if (o !== p) o.sprite.cameraFilter |= p.cam.id;
    });
    p.cam.startFollow(p.sprite, true, 0.12, 0.12);
    p.cam.flash(300, 255, 255, 255);
  }

  // Golpe: alcanza a un enemigo o rompe una caja rompible que esté justo delante.
  // Devuelve true si ha dado a algo (cada golpe alcanza solo una cosa).
  checkAttackHit(p) {
    const body = p.sprite.body;
    const facing = p.sprite.flipX ? -1 : 1;
    const x = facing > 0 ? body.right : body.left - PLAYER.hitReach;
    const area = new Phaser.Geom.Rectangle(x, body.top + 6, PLAYER.hitReach, body.height - 12);

    const m = this.mundos[p.index];
    const enemy = [...m.robots.getChildren(), ...m.drones.getChildren()].find((e) => {
      const b = e.body;
      return Phaser.Geom.Intersects.RectangleToRectangle(area, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height));
    });
    if (enemy) {
      this.hitEnemy(enemy, facing);
      return true;
    }

    const hits = this.physics.overlapRect(area.x, area.y, area.width, area.height, false, true);
    const crate = hits.find((hit) => m.breakables.contains(hit.gameObject));
    if (crate) this.breakCrate(crate.gameObject);
    return Boolean(crate);
  }

  breakCrate(zone) {
    const m = zone.mundo;
    const image = zone.image;
    const cx = zone.x + zone.width / 2;
    const cy = zone.y + zone.height / 2;
    m.breakables.remove(zone, true, true);
    image.destroy();
    if (this.online && m.index === 0) Red.enviar({ t: 'caja', i: zone.indice });

    this.spawnDebris(m, cx, cy, [0xcf4f1f, 0x8c2a14]);
    zone.objetos.forEach((pieza) => this.spawnItem(pieza, cx, cy));

    // Las cajas apiladas encima caen un bloque
    [this.solids, m.breakables].forEach((group) => {
      group.getChildren()
        .filter((other) => other.x === zone.x && other.y < zone.y)
        .forEach((other) => this.dropObstacle(other));
    });
    this.views[m.index].shake(80, 0.003);
  }

  // Trocitos que salen volando al romper una caja o destruir un enemigo (solo en la mitad del mundo m)
  spawnDebris(m, x, y, colors, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const chip = this.onlyIn(m, this.add.rectangle(x, y, 2 * GROUND_SCALE, 2 * GROUND_SCALE, colors[i % colors.length]));
      this.tweens.add({
        targets: chip,
        x: x + Phaser.Math.Between(-60, 60),
        y: y + Phaser.Math.Between(-70, 10),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: 450,
        ease: 'Quad.easeOut',
        onComplete: () => chip.destroy(),
      });
    }
  }

  // ---------- Voz ----------

  // Engranaje de ajustes y micrófono arriba a la derecha: igual de altos que la barra de vida
  // y en la misma línea, con un panel de fondo como el suyo. También el bocadillo del personaje.
  createVoiceControls() {
    const width = this.hudWidth;
    const u = HUD_PIXEL;
    const size = this.healthBarHeight();
    this.micSize = size;
    const y = HUD_TOP + size / 2;
    const gearX = width - HUD_MARGIN - size / 2;
    const keyX = gearX - size / 2 - 14;        // la "V" de hablar, entre los dos iconos
    const micX = keyX - 8 - size / 2;

    this.add.graphics().setScrollFactor(0).setDepth(100)
      .fillStyle(HUD_COLORS.panel, 0.65)
      .fillRect(micX - size / 2 - 2 * u, HUD_TOP - 2 * u, gearX - micX + size + 4 * u, size + 4 * u);
    botonAjustes(this, gearX, y, size);

    suavizarIcono(this, 'icono-microfono');
    this.mic = this.add.image(micX, y, 'icono-microfono')
      .setDisplaySize(size, size).setScrollFactor(0).setDepth(110)
      .setInteractive({ useHandCursor: true });
    this.mic.on('pointerdown', () => (Voz.escuchando ? Voz.detener() : this.startListening()));
    this.add.text(keyX, y, 'V', { fontFamily: this.font, fontSize: `${this.letra.teclaVoz}px`, fontStyle: '700', color: '#f3c623' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(111).setShadow(1, 1, '#112021', 0, false, true);

    // Mantener V para hablar: al soltarla deja de escuchar y llega la frase completa
    this.input.keyboard.on('keydown-V', (e) => {
      if (!e.repeat) this.startListening(); // al mantenerla, el navegador repite la pulsación
    });
    this.input.keyboard.on('keyup-V', () => Voz.detener());
    this.input.keyboard.on('keydown-ESC', () => abrirAjustes(this));
    // Al abrir los ajustes se corta lo que estuviera escuchando o diciendo
    const alAbrirAjustes = () => {
      Voz.detener();
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      this.hideBubble();
    };
    this.events.on('ajustes-abiertos', alAbrirAjustes);
    this.events.once('shutdown', () => this.events.off('ajustes-abiertos', alAbrirAjustes));

    // El bocadillo está en el mundo (sobre el personaje 1), no en el HUD: solo lo ve la vista de arriba
    this.asHud(null, () => {
      this.bubble = this.add.container(0, 0).setDepth(60).setVisible(false);
      this.bubbleBg = this.add.graphics();
      const style = { fontFamily: this.font, align: 'center', wordWrap: { width: SPEECH.maxWidth } };
      this.bubbleName = this.add.text(0, 0, '', { ...style, fontSize: `${this.letra.bocadilloNombre}px`, fontStyle: '700', color: SPEECH.colors.name })
        .setOrigin(0.5, 1);
      this.bubbleText = this.add.text(0, 0, '', { ...style, fontSize: `${this.letra.bocadilloTexto}px` }).setOrigin(0.5, 1);
      this.bubble.add([this.bubbleBg, this.bubbleName, this.bubbleText]);
    });
    this.views.slice(1).forEach((cam) => cam.ignore(this.bubble));
  }

  // La voz es del jugador 1 (la que se configuró en el registro y en los ajustes)
  startListening() {
    if (Voz.escuchando || this.players[0].dead) return;
    const heard = { final: false };
    this.showBubble('...', 'listening');
    const ok = Voz.escuchar({
      onParcial: (texto) => this.showBubble(`${texto}...`, 'listening'),
      onFinal: (texto) => {
        heard.final = true;
        this.showBubble(texto, 'said');
        // Lo repite con la voz que toca según el sexo del DNI
        if (Voz.ajustes.repetir) Voz.hablar(texto, { alTerminar: () => this.hideBubbleLater(800) });
        else this.hideBubbleLater(SPEECH.hideAfter);
      },
      onError: (codigo) => {
        heard.final = true;
        this.showBubble(Voz.mensajeError(codigo), 'error');
        this.hideBubbleLater(SPEECH.hideAfter);
      },
      onFin: () => {
        this.setMicListening(false);
        if (!heard.final) this.hideBubble();
      },
    });
    if (ok) this.setMicListening(true);
  }

  // El micrófono se pone rojo y late mientras escucha
  setMicListening(on) {
    if (this.micPulse) this.micPulse.stop();
    this.mic.setDisplaySize(this.micSize, this.micSize);
    if (on) {
      this.mic.setTint(0xe8341c);
      this.micPulse = this.tweens.add({ targets: this.mic, scale: this.mic.scale * 1.15, duration: 300, yoyo: true, repeat: -1 });
    } else {
      this.mic.clearTint();
    }
  }

  // Bocadillo sobre el personaje: el nombre del jugador (o "TÚ") y lo que ha dicho
  showBubble(texto, kind) {
    if (this.bubbleTimer) this.bubbleTimer.remove();
    const color = { listening: SPEECH.colors.listening, error: SPEECH.colors.error }[kind] || SPEECH.colors.text;
    this.bubbleText.setText(texto).setColor(color);
    this.bubbleName.setText((Voz.ajustes.nombre || 'Tú').toUpperCase());

    const pad = 10;
    const tail = 10;
    const w = Math.max(this.bubbleText.width, this.bubbleName.width) + pad * 2;
    const h = this.bubbleText.height + this.bubbleName.height + pad * 2;
    this.bubbleText.setPosition(0, -tail - pad);
    this.bubbleName.setPosition(0, -tail - pad - this.bubbleText.height);
    this.bubbleW = w;

    const g = this.bubbleBg.clear();
    const top = -tail - h;
    g.fillStyle(HUD_COLORS.outline).fillRect(-w / 2 - 3, top - 3, w + 6, h + 6);
    g.fillStyle(0xf2fbff).fillRect(-w / 2, top, w, h);
    g.fillStyle(0xb9c6d8).fillRect(-w / 2, top + h - 3, w, 3); // sombra inferior
    // Pico del bocadillo, en escalones de 3 px
    for (let i = 0; i < 4; i += 1) {
      g.fillStyle(HUD_COLORS.outline).fillRect(-9 + i * 3, -tail + i * 3 - 1, 18 - i * 6, 4);
      if (i < 3) g.fillStyle(0xf2fbff).fillRect(-6 + i * 3, -tail + i * 3 - 1, 12 - i * 6, 3);
    }
    this.bubble.setVisible(true);
    this.updateBubble();
  }

  hideBubbleLater(delay) {
    if (this.bubbleTimer) this.bubbleTimer.remove();
    this.bubbleTimer = this.time.delayedCall(delay, () => this.hideBubble());
  }

  hideBubble() {
    if (this.bubbleTimer) this.bubbleTimer.remove();
    this.bubble.setVisible(false);
  }

  // El bocadillo sigue al personaje sin salirse de la pantalla
  updateBubble() {
    if (!this.bubble.visible) return;
    const { sprite, cam } = this.players[0];
    const half = this.bubbleW / 2 + 8;
    const view = cam.worldView;
    const x = Phaser.Math.Clamp(sprite.x, view.x + half, view.right - half);
    this.bubble.setPosition(Math.round(x), Math.round(sprite.body.top - 4));
  }

  // ---------- Piezas del traje ----------

  createItems() {
    this.items = this.physics.add.group({ allowGravity: false });
    // Cuántas hay de cada una para cada jugador (normalmente 1); lo que lleva cada uno va en p.itemCount
    const piezas = [...this.nivel.cajasRompibles, ...this.nivel.robots, ...this.nivel.drones]
      .flatMap((s) => s.objetos)
      .filter((o) => o.owner === 0);
    this.itemTotals = {};
    this.nivel.objetos.forEach((key) => {
      this.itemTotals[key] = piezas.filter((o) => o.key === key).length;
    });
  }

  // ¿Tiene p todas las piezas de su traje?
  hasAllItems(p) {
    return this.nivel.objetos.every((key) => p.itemCount[key] >= this.itemTotals[key]);
  }

  // Bloque donde puede quedar una pieza: si cae sobre el agua se mueve a la orilla más cercana.
  // Devuelve la columna y la altura del terreno (escalones) en ella.
  surfaceAt(tile) {
    const inWater = (t) => this.nivel.agua.some((p) => t >= p.start && t < p.start + p.width);
    let t = Phaser.Math.Clamp(tile, 0, this.nivel.ancho - 1);
    for (let d = 1; inWater(t); d += 1) {
      if (!inWater(t - d) && t - d >= 0) t -= d;
      else if (!inWater(t + d) && t + d < this.nivel.ancho) t += d;
    }
    const alto = this.nivel.escalones
      .filter((s) => t >= s.start && t < s.start + s.width)
      .reduce((max, s) => Math.max(max, s.alto), 0);
    return { tile: t, alto };
  }

  // La pieza salta desde la caja o el enemigo y se posa en el suelo, flotando.
  // Solo la ve (y la puede coger) su dueño.
  spawnItem({ key, owner }, x, y) {
    const spot = this.surfaceAt(Math.floor(x / TILE));
    const restX = spot.tile * TILE + TILE / 2;
    const restY = this.floorY(spot.alto) - 8 * ITEMS.scale - 6;
    const item = this.items.create(x, y, `objeto-${key}`).setScale(ITEMS.scale).setDepth(5);
    item.key = key;
    item.owner = owner;
    item.body.setSize(12, 12).setOffset(2, 2);
    this.views.forEach((cam, i) => {
      if (i !== owner) cam.ignore(item);
    });

    item.motion = this.tweens.chain({
      targets: item,
      tweens: [
        { y: y - 50, duration: 250, ease: 'Quad.easeOut' },
        { x: restX, y: restY, duration: 550, ease: 'Bounce.easeOut' },
        { y: restY - 6, duration: 600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
      ],
    });
  }

  collectItem(p, item) {
    if (item.collected || item.owner !== p.index) return;
    if (this.online && !p.remoto) Red.enviar({ t: 'pieza', key: item.key });
    item.collected = true;
    Sonido.efecto('recolectar');
    item.motion.stop();
    item.body.enable = false;
    p.itemCount[item.key] += 1;
    this.drawItemsHud(p);
    this.spawnDebris(this.mundos[p.index], item.x, item.y, [0xf2fbff, 0xf3fb3e, 0xadc917], 10);
    this.tweens.add({
      targets: item, scale: ITEMS.scale * 1.8, alpha: 0, y: item.y - 30, duration: 350,
      onComplete: () => item.destroy(),
    });
    // El icono de la pieza en el HUD da un saltito
    const icon = p.itemHud[item.key].icon;
    this.tweens.add({ targets: icon, scale: p.itemHudScale * 1.4, duration: 120, yoyo: true });
    if (this.dosJugadores && this.hasAllItems(p)) {
      this.showNotice(`¡${(p.nombre || `Jugador ${p.index + 1}`).toUpperCase()} TIENE SU TRAJE COMPLETO!`,
        'Falta que el otro tripulante complete el suyo.', 3500);
    }
    this.checkComplete();
  }

  // El Nivel 1 termina cuando todos los que siguen en juego tienen su traje completo
  // Con 2 jugadores el que perdió sus vidas puede reiniciar, así que también tiene que completar su traje
  // (salvo que el compañero online se haya ido)
  checkComplete() {
    const enJuego = this.players.filter((p) => (this.dosJugadores ? !p.desconectado : !p.out));
    if (enJuego.length && enJuego.every((p) => this.hasAllItems(p))) {
      this.completeLevel(this.dosJugadores ? '¡EQUIPOS COMPLETOS!' : '¡EQUIPO COMPLETO!',
        'Todo listo para el lanzamiento del Apolo 11.');
    }
  }

  // Ancho y alto del bloque de la barra de vida (corazón + barra), en píxeles de pantalla
  healthBarWidth() {
    return (HEART_PIXELS[0].length + 2 + HUD_LIVES_W + HUD_BAR.w + 2) * HUD_PIXEL;
  }

  healthBarHeight() {
    return Math.max(HEART_PIXELS.length, HUD_BAR.h + 2) * HUD_PIXEL;
  }

  // Fila de piezas bajo la barra de vida: cada icono con su contador "0/1" debajo.
  // Las columnas se reparten para ocupar justo el ancho de la barra, sin pasarse.
  createItemsHud(p) {
    p.itemPanel = this.add.graphics().setScrollFactor(0).setDepth(100);
    p.itemHud = {};
    const keys = this.nivel.objetos;
    const width = this.healthBarWidth();
    let scale = ITEMS.hudScale;
    while (scale > 1 && keys.length * 16 * scale > width) scale -= 1;
    p.itemHudScale = scale;
    const iconSize = 16 * scale;
    const step = keys.length > 1 ? (width - iconSize) / (keys.length - 1) : 0;
    keys.forEach((key, i) => {
      const cx = Math.round(HUD_MARGIN + iconSize / 2 + i * step);
      const icon = this.add.image(cx, ITEMS.hudTop + iconSize / 2, `objeto-${key}`)
        .setScale(scale).setScrollFactor(0).setDepth(101);
      const count = this.add.text(cx, ITEMS.hudTop + iconSize + 2, '', {
        fontFamily: this.font, fontSize: `${this.letra.piezas}px`, fontStyle: '700',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101)
        .setShadow(2, 2, '#112021', 0, false, true);
      p.itemHud[key] = { icon, count };
    });
    this.drawItemsHud(p);
  }

  // Panel con los controles básicos del jugador p, debajo del de las piezas. Con pantalla dividida va a la
  // derecha, bajo el engranaje, porque a la izquierda taparía al personaje. Cada fila se borra al usar su acción.
  createControlsHud(p) {
    const u = HUD_PIXEL;
    const c = CONTROLES;
    if (this.dosJugadores) {
      p.controlsW = this.letra.controlesAncho;
      p.controlsX = this.hudWidth - HUD_MARGIN - p.controlsW;
      p.controlsTop = HUD_TOP + this.healthBarHeight() + 2 * u + c.hueco;
    } else {
      const itemsH = this.nivel.objetos.length ? 16 * p.itemHudScale + 2 + this.letra.piezas + 2 + 4 * u : 0;
      p.controlsW = this.healthBarWidth();
      p.controlsX = HUD_MARGIN;
      p.controlsTop = ITEMS.hudTop - 2 * u + itemsH + c.hueco; // borde superior del panel
    }
    p.controlsPanel = this.add.graphics().setScrollFactor(0).setDepth(100);
    p.controlRows = c.listas[p.mando].map(([teclas, accion, codigos]) => {
      const estilo = { fontFamily: this.font, fontSize: `${this.letra.controles}px` };
      const tecla = teclas.startsWith('FLECHA')
        ? this.drawArrowKeys(teclas, p.controlsX)
        : this.add.text(p.controlsX, 0, teclas, { ...estilo, fontStyle: '800', color: '#f3c623' })
          .setShadow(1, 1, '#112021', 0, false, true);
      const textos = [
        tecla,
        this.add.text(p.controlsX + this.letra.controlesColumna, 0, accion, { ...estilo, fontStyle: '500', color: '#f2fbff' })
          .setShadow(1, 1, '#112021', 0, false, true),
      ];
      textos.forEach((t) => t.setScrollFactor(0).setDepth(101));
      return { textos, codigos };
    });
    this.layoutControlsHud(p, false);

    this.input.keyboard.on('keydown', (event) => {
      const fila = p.controlRows.find((f) => f.codigos.includes(event.code));
      if (fila) this.removeControlRow(p, fila);
    });
  }

  // Flechas en píxeles, doradas y con sombra, del alto de una línea de texto:
  // 'FLECHAS' = izquierda y derecha, 'FLECHA_ARRIBA' = hacia arriba
  drawArrowKeys(tipo, x) {
    const { flecha } = CONTROLES;
    const textSize = this.letra.controles;
    const p = this.dosJugadores ? CONTROLES.flechaPixel + 1 : CONTROLES.flechaPixel; // más gruesas con la letra grande
    const g = this.add.graphics({ x });
    const w = flecha[0].length;
    // Cada flecha es una lista de celdas [x, y] dentro de su dibujo
    const celdas = [];
    flecha.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') celdas.push([x, y]); }));
    const formas = tipo === 'FLECHA_ARRIBA'
      ? [celdas.map(([x, y]) => [y, x])] // la izquierda girada: la punta queda arriba
      : [celdas, celdas.map(([x, y]) => [w + 3 + (w - 1 - x), y])];
    const alto = Math.max(...formas[0].map(([, y]) => y)) + 1;
    const top = Math.round((textSize + 3 - alto * p) / 2);
    // Cada fila de celdas seguidas se pinta como un solo rectángulo: así, al reducir el HUD, no se ven rayas
    const tramos = (forma) => {
      const filas = {};
      forma.forEach(([x, y]) => (filas[y] = filas[y] || []).push(x));
      return Object.entries(filas).flatMap(([y, xs]) => {
        xs.sort((a, b) => a - b);
        const lista = [];
        xs.forEach((x) => {
          const ultimo = lista[lista.length - 1];
          if (ultimo && x === ultimo.x + ultimo.w) ultimo.w += 1;
          else lista.push({ x, y: Number(y), w: 1 });
        });
        return lista;
      });
    };
    formas.forEach((forma) => {
      const filas = tramos(forma);
      [[0x112021, 1], [0xf3c623, 0]].forEach(([color, sombra]) => {
        filas.forEach(({ x, y, w }) => g.fillStyle(color).fillRect(x * p + sombra, top + y * p + sombra, w * p, p));
      });
    });
    return g;
  }

  // Coloca las filas que quedan, una debajo de otra, y ajusta el alto del panel
  layoutControlsHud(p, animar = true) {
    const u = HUD_PIXEL;
    const c = CONTROLES;
    p.controlRows.forEach((fila, i) => {
      const y = p.controlsTop + 2 * u + i * this.letra.controlesLinea;
      fila.textos.forEach((t) => {
        if (animar) this.tweens.add({ targets: t, y, duration: 200, ease: 'Quad.easeOut' });
        else t.y = y;
      });
    });
    p.controlsPanel.clear();
    if (!p.controlRows.length) return;
    p.controlsPanel.fillStyle(HUD_COLORS.panel, 0.65)
      .fillRect(p.controlsX - 2 * u, p.controlsTop, p.controlsW + 4 * u, p.controlRows.length * this.letra.controlesLinea + 4 * u);
  }

  removeControlRow(p, fila) {
    p.controlRows = p.controlRows.filter((f) => f !== fila);
    fila.textos.forEach((t) => {
      this.tweens.add({ targets: t, alpha: 0, x: t.x - 12, duration: 200, onComplete: () => t.destroy() });
    });
    this.time.delayedCall(180, () => this.layoutControlsHud(p));
  }

  drawItemsHud(p) {
    if (!this.nivel.objetos.length) return;
    const u = HUD_PIXEL;
    const iconSize = 16 * p.itemHudScale;
    const height = iconSize + 2 + this.letra.piezas + 2;
    p.itemPanel.clear()
      .fillStyle(HUD_COLORS.panel, 0.65)
      .fillRect(HUD_MARGIN - 2 * u, ITEMS.hudTop - 2 * u, this.healthBarWidth() + 4 * u, height + 4 * u);
    this.nivel.objetos.forEach((key) => {
      const { icon, count } = p.itemHud[key];
      const done = p.itemCount[key] >= this.itemTotals[key];
      // Las piezas que aún no tienes se ven como una silueta oscura
      if (p.itemCount[key] > 0) icon.clearTint();
      else icon.setTintFill(ITEMS.missing);
      const color = done ? ITEMS.doneColor : ITEMS.textColor;
      count.setText(`${p.itemCount[key]}/${this.itemTotals[key]}`)
        .setColor(`#${color.toString(16).padStart(6, '0')}`);
    });
  }

  // ---------- Avisos y fin de nivel ----------

  // Aviso arriba en el centro: un título dorado y un texto. Sirve para el nombre del nivel
  // y el fin del nivel.
  createNotice() {
    const width = this.hudWidth;
    this.notice = this.add.container(width / 2, 14).setScrollFactor(0).setDepth(120).setAlpha(0);
    this.noticeBg = this.add.graphics();
    this.noticeTitle = this.add.text(0, 9, '', {
      fontFamily: this.font, fontSize: `${this.letra.avisoTitulo}px`, fontStyle: '800', color: '#f3c623', align: 'center',
    }).setOrigin(0.5, 0).setShadow(2, 2, '#112021', 0, false, true);
    this.noticeText = this.add.text(0, this.letra.avisoTitulo + 16, '', {
      fontFamily: this.font, fontSize: `${this.letra.avisoTexto}px`, color: '#f2fbff', align: 'center',
      wordWrap: { width: this.letra.avisoAncho }, lineSpacing: 2,
    }).setOrigin(0.5, 0);
    this.notice.add([this.noticeBg, this.noticeTitle, this.noticeText]);
  }

  showNotice(title, text, duration = 5000) {
    this.noticeTitle.setText(title);
    this.noticeText.setText(text);
    const w = Math.max(this.noticeText.width, this.noticeTitle.width) + 36;
    const h = this.noticeText.y + this.noticeText.height + 10;
    this.noticeBg.clear()
      .fillStyle(HUD_COLORS.outline).fillRect(-w / 2 - 3, -3, w + 6, h + 6)
      .fillStyle(0x3b6fd0).fillRect(-w / 2 - 1, -1, w + 2, h + 2)
      .fillStyle(HUD_COLORS.panel, 0.95).fillRect(-w / 2, 0, w, h);
    this.tweens.killTweensOf(this.notice);
    if (this.noticeTimer) this.noticeTimer.remove();
    this.notice.setAlpha(0);
    this.tweens.add({ targets: this.notice, alpha: 1, duration: 250 });
    this.noticeTimer = this.time.delayedCall(duration, () => {
      this.tweens.add({ targets: this.notice, alpha: 0, duration: 400 });
    });
  }

  // Sin vidas: se para el nivel y aparece un panel para volver a intentarlo (con las piezas en otros sitios)
  // o volver a la portada. ENTER también reintenta.
  showGameOver() {
    if (this.perdido) return;
    this.perdido = true;
    this.asHud('panel', () => this.createGameOverPanel());
  }

  createGameOverPanel() {
    Voz.detener();
    this.hideBubble();
    this.physics.pause();
    Sonido.musica(null);
    const { width, height } = this.scale;
    const w = 460;
    const h = 210;
    const capa = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(130).setAlpha(0);
    const fondo = this.add.rectangle(0, 0, width, height, 0x03040a, 0.6);
    const g = this.add.graphics()
      .fillStyle(HUD_COLORS.outline).fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8)
      .fillStyle(0x3b6fd0).fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4)
      .fillStyle(HUD_COLORS.panel, 0.97).fillRect(-w / 2, -h / 2, w, h);
    const titulo = this.add.text(0, -h / 2 + 22, '¡TE QUEDASTE SIN VIDAS!', {
      fontFamily: this.font, fontSize: '28px', fontStyle: '800', color: '#e8341c',
    }).setOrigin(0.5, 0).setShadow(3, 3, '#112021', 0, false, true);
    const texto = this.add.text(0, -h / 2 + 70, 'No te rindas: los astronautas del Apolo 11 también\nentrenaron una y otra vez. ¿Lo intentas de nuevo?', {
      fontFamily: this.font, fontSize: '16px', color: '#f2fbff', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0);
    const reintentar = this.gameOverButton(-100, h / 2 - 40, 'REINTENTAR', 0xf3c623, () => this.retry());
    this.retryLabel = reintentar.list[1]; // en online cambia a "ESPERANDO..." mientras el compañero acepta
    const salir = this.gameOverButton(110, h / 2 - 40, 'IR AL INICIO', 0xc4cbe0, () => this.exitToTitle());
    capa.add([fondo, g, titulo, texto, reintentar, salir]);
    // Con la pantalla dividida, el panel va en una cámara propia a pantalla completa, encima de las dos mitades
    if (this.dosJugadores) {
      const encima = this.cameras.add(0, 0, width, height);
      encima.ignore(this.children.list.filter((o) => o !== capa));
    }
    this.tweens.add({ targets: capa, alpha: 1, duration: 400 });
    this.input.keyboard.once('keydown-ENTER', () => this.retry());
  }

  gameOverButton(x, y, label, color, onClick) {
    const text = this.add.text(0, 0, label, {
      fontFamily: this.font, fontSize: '18px', fontStyle: '800', color: '#112021',
    }).setOrigin(0.5);
    const w = text.width + 40;
    const h = 40;
    const g = this.add.graphics();
    const draw = (fill) => g.clear()
      .fillStyle(0x000000, 0.4).fillRect(-w / 2 + 4, -h / 2 + 4, w, h)
      .fillStyle(HUD_COLORS.outline).fillRect(-w / 2, -h / 2, w, h)
      .fillStyle(fill).fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
    draw(color);
    const button = this.add.container(x, y, [g, text]).setSize(w, h).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => draw(0xf3fb3e));
    button.on('pointerout', () => draw(color));
    button.on('pointerdown', onClick);
    return button;
  }

  retry() {
    if (this.leaving) return;
    // Online: el anfitrión reparte otra vez las piezas y empiezan los dos; el otro se lo pide
    if (this.online && Red.conectado) {
      Sonido.efecto('clic');
      if (!Red.esAnfitrion) {
        Red.enviar({ t: 'reintentar' });
        if (this.retryLabel) this.retryLabel.setText('ESPERANDO...');
        return;
      }
      const reparto = exportarReparto(repartirPiezas(NIVELES[this.nivel.numero] || NIVEL_1, 2));
      Red.enviar({ t: 'inicio', reparto });
      this.restartOnline(reparto);
      return;
    }
    if (this.online) {
      this.exitToTitle(); // sin compañero no se puede repetir la partida online
      return;
    }
    this.leaving = true;
    Sonido.efecto('clic');
    this.fadeOutAll(400, () => this.scene.restart({ nivel: this.nivel.numero }));
  }

  exitToTitle() {
    if (this.leaving) return;
    this.leaving = true;
    Sonido.efecto('clic');
    this.fadeOutAll(400, () => this.scene.start('Title'));
  }

  // Fin de nivel: mensaje, fanfarria y vuelta a la portada (el Nivel 2 aún no existe)
  completeLevel(title, text) {
    if (this.completado) return;
    this.completado = true;
    if (this.online) Red.silenciar(); // los dos vuelven al inicio: no hace falta avisar de que el otro se va
    Voz.detener();
    this.showNotice(title, text, 3500);
    Sonido.efecto('logro');
    this.players.filter((p) => !p.out).forEach((p) => {
      p.sprite.body.setVelocityX(0);
      this.playAnim(p, 'idle', true);
    });
    this.time.delayedCall(3200, () => this.fadeOutAll(700, () => this.scene.start('Title')));
  }

  // ---------- Enemigos ----------

  createEnemies() {
    if (!this.anims.exists('robot-walk')) {
      this.anims.create({
        key: 'robot-walk',
        frames: this.anims.generateFrameNumbers('robot', { start: 0, end: 1 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists('dron-fly')) {
      this.anims.create({
        key: 'dron-fly',
        frames: this.anims.generateFrameNumbers('dron', { start: 0, end: 1 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Cada mundo tiene sus propios enemigos (con las piezas de su jugador)
    this.mundos.forEach((m) => {
      m.robots = this.physics.add.group();
      m.drones = this.physics.add.group({ allowGravity: false });
      m.lasers = this.physics.add.group({ allowGravity: false });
      this.createWorldEnemies(m);

      this.physics.add.collider(m.robots, this.ground);
      this.physics.add.collider(m.robots, this.solids);
      this.physics.add.collider(m.robots, m.breakables);
      // Los láseres se deshacen al chocar con el terreno, cajas o barreras
      [this.ground, this.solids, m.breakables].forEach((group) => {
        this.physics.add.collider(m.lasers, group, (laser) => this.destroyLaser(laser));
      });
    });
  }

  // Cajas rompibles del mundo m: solo se ven en su mitad y guardan las piezas de su jugador
  createWorldCrates(m) {
    this.nivel.cajasRompibles.forEach((c, indice) => {
      const zone = this.placeObstacle(m.breakables, 'caja-rompible', c.tile, c.alto);
      zone.mundo = m;
      zone.indice = indice; // para decir por la red cuál se ha roto
      zone.objetos = this.piecesOf(m, c);
      this.onlyIn(m, zone.image);
    });
  }

  createWorldEnemies(m) {
    this.nivel.robots.forEach((r, i) => { this.createRobot(m, r).indice = i; });
    this.nivel.drones.forEach((d, i) => { this.createDrone(m, d).indice = i; });
  }

  // Vuelve a montar el mundo m desde cero (cajas, enemigos y piezas) con el reparto de piezas "reparto"
  // (ver repartirJugador). El mundo del otro jugador no se toca.
  rebuildWorld(m, reparto) {
    m.breakables.getChildren().forEach((zone) => zone.image.destroy());
    m.breakables.clear(true, true);
    [m.robots, m.drones, m.lasers].forEach((grupo) => grupo.clear(true, true));
    this.items.getChildren().filter((it) => it.owner === m.index).forEach((it) => {
      if (it.motion) it.motion.stop();
      it.destroy();
    });
    // Las piezas de este jugador en cada sitio pasan a ser las del nuevo reparto
    Object.keys(reparto).forEach((tipo) => this.nivel[tipo].forEach((sitio, i) => {
      sitio.objetos = sitio.objetos.filter((o) => o.owner !== m.index).concat(reparto[tipo][i]);
    }));
    this.createWorldCrates(m);
    this.createWorldEnemies(m);
  }

  // Prepara lo común a todos los enemigos: tamaño, caja de colisión, vida y recorrido
  setupEnemy(m, enemy, type, data) {
    const { desde, hasta, velocidad } = data;
    const cfg = ENEMIES[type];
    enemy.mundo = m;
    enemy.objetos = this.piecesOf(m, data);
    this.onlyIn(m, enemy);
    enemy.setScale(GROUND_SCALE);
    enemy.body.setSize(cfg.body.w, cfg.body.h, false).setOffset(cfg.body.x, cfg.body.y);
    enemy.type = type;
    enemy.vida = cfg.vida;
    enemy.speed = velocidad;
    enemy.dir = 1;
    enemy.minX = desde * TILE + TILE / 2;
    enemy.maxX = (hasta + 1) * TILE - TILE / 2;
    enemy.stunnedUntil = 0;
  }

  createRobot(m, data) {
    const robot = m.robots.create(data.desde * TILE + TILE / 2, this.floorY(data.alto) - TILE / 2, 'robot');
    this.setupEnemy(m, robot, 'robot', data);
    robot.play('robot-walk');
    robot.nextShot = Phaser.Math.Between(500, ENEMIES.robot.shotCooldown);
    robot.shootAt = 0;
    return robot;
  }

  createDrone(m, data) {
    const x = data.desde * TILE + TILE / 2;
    const drone = m.drones.create(x, 0, 'dron');
    this.setupEnemy(m, drone, 'dron', data);
    drone.baseY = this.floorY(ENEMIES.dron.alto) - TILE / 2;
    drone.y = drone.baseY;
    drone.phase = Phaser.Math.FloatBetween(0, Math.PI * 2); // para que no suban y bajen a la vez
    drone.diveStart = -Infinity;
    drone.nextDive = Phaser.Math.Between(...ENEMIES.dron.diveEvery);
    drone.play('dron-fly');
    return drone;
  }

  // Altura del dron: vuela alto balanceándose y, durante una picada, baja y vuelve a subir
  droneY(drone, time) {
    const cfg = ENEMIES.dron;
    const cruise = drone.baseY + Math.sin(time * cfg.bobSpeed + drone.phase) * cfg.bob;
    const t = time - drone.diveStart;
    const { Easing } = Phaser.Math;
    if (t < cfg.diveDown) {
      return Phaser.Math.Linear(cruise, drone.diveY, Easing.Quadratic.In(t / cfg.diveDown));
    }
    if (t < cfg.diveDown + cfg.diveHold) return drone.diveY;
    const up = t - cfg.diveDown - cfg.diveHold;
    if (up < cfg.diveUp) {
      return Phaser.Math.Linear(drone.diveY, cruise, Easing.Quadratic.Out(up / cfg.diveUp));
    }
    return cruise;
  }

  // target: el personaje al que persigue (o null si no hay nadie cerca)
  startDive(drone, time, target) {
    const cfg = ENEMIES.dron;
    // Baja hasta la altura del pecho del personaje, o hasta diveLow si no hay nadie cerca
    const lowest = this.floorY() - cfg.diveLow;
    drone.diveY = target ? Math.min(this.chestY(target) - 6, lowest) : lowest;
    drone.diveStart = time;
    drone.nextDive = time + cfg.diveDown + cfg.diveHold + cfg.diveUp + Phaser.Math.Between(...cfg.diveEvery);
  }

  // El robot se para, brilla mientras carga y dispara hacia donde mira
  fireLaser(robot) {
    const cfg = ENEMIES.robot;
    const laser = robot.mundo.lasers.create(robot.x + robot.dir * TILE / 2, robot.y + cfg.shotY, 'laser')
      .setScale(GROUND_SCALE)
      .setFlipX(robot.dir < 0);
    laser.mundo = robot.mundo;
    this.onlyIn(robot.mundo, laser);
    laser.body.setSize(6, 1, false).setOffset(1, 1);
    laser.body.setVelocityX(robot.dir * cfg.shotSpeed);
    this.time.delayedCall(2500, () => this.destroyLaser(laser));
  }

  destroyLaser(laser) {
    if (!laser.active) return;
    this.spawnDebris(laser.mundo, laser.x, laser.y, [0xf08a3c, 0xf3fb3e], 4);
    laser.destroy();
  }

  hitEnemy(enemy, facing) {
    if (this.online && enemy.mundo.index === 0) Red.enviar({ t: 'golpe', tipo: enemy.type, i: enemy.indice, f: facing });
    enemy.vida -= 1;
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(80, () => enemy.active && enemy.clearTint());

    if (enemy.vida <= 0) {
      this.spawnDebris(enemy.mundo, enemy.x, enemy.y, ENEMIES[enemy.type].debris, 12);
      this.views[enemy.mundo.index].shake(100, 0.004);
      enemy.objetos.forEach((pieza) => this.spawnItem(pieza, enemy.x, enemy.y));
      enemy.destroy();
      return;
    }
    // Sigue vivo: retrocede y se queda parado un momento (si estaba cargando, pierde el disparo)
    if (enemy.shootAt) {
      enemy.shootAt = 0;
      enemy.nextShot = this.time.now + ENEMIES.robot.shotCooldown;
      enemy.anims.resume();
    }
    enemy.stunnedUntil = this.time.now + ENEMIES[enemy.type].stun;
    enemy.body.setVelocityX(facing * ENEMIES[enemy.type].knockback);
  }

  updateEnemies(time) {
    this.mundos.forEach((m) => this.updateWorldEnemies(m, time));
  }

  // Los enemigos del mundo m solo van a por su jugador
  updateWorldEnemies(m, time) {
    const rcfg = ENEMIES.robot;
    const target = this.targetOf(m);
    m.robots.getChildren().forEach((robot) => {
      if (time < robot.stunnedUntil) return;
      const b = robot.body;

      // Cargando un disparo: quieto hasta que sale el láser
      if (robot.shootAt) {
        b.setVelocityX(0);
        if (time >= robot.shootAt) {
          this.fireLaser(robot);
          robot.shootAt = 0;
          robot.nextShot = time + rcfg.shotCooldown;
          robot.clearTint();
          robot.anims.resume();
        }
        return;
      }

      // ¿Ve a su personaje? Se gira hacia él y empieza a cargar
      const dx = target ? target.sprite.x - robot.x : Infinity;
      const dy = target ? Math.abs(this.chestY(target) - b.center.y) : Infinity;
      if (target && time >= robot.nextShot && Math.abs(dx) < rcfg.shotRange && dy < rcfg.shotHeight) {
        robot.dir = dx < 0 ? -1 : 1;
        robot.setFlipX(robot.dir < 0);
        robot.shootAt = time + rcfg.shotWindup;
        robot.setTint(0xffc080);
        robot.anims.pause();
        b.setVelocityX(0);
        return;
      }

      if (robot.x >= robot.maxX || b.blocked.right) robot.dir = -1;
      else if (robot.x <= robot.minX || b.blocked.left) robot.dir = 1;
      b.setVelocityX(robot.dir * robot.speed);
      robot.setFlipX(robot.dir < 0);
    });

    const cfg = ENEMIES.dron;
    m.drones.getChildren().forEach((drone) => {
      // Patrulla, pero si su personaje está cerca va hacia él (sin salirse de su zona)
      const dx = target ? target.sprite.x - drone.x : Infinity;
      const chasing = Boolean(target) && Math.abs(dx) < cfg.chaseRange
        && target.sprite.x > drone.minX - TILE && target.sprite.x < drone.maxX + TILE;
      let vx;
      if (chasing) {
        vx = Math.abs(dx) < 4 ? 0 : Math.sign(dx) * drone.speed * cfg.chaseBoost;
      } else {
        if (drone.x >= drone.maxX) drone.dir = -1;
        else if (drone.x <= drone.minX) drone.dir = 1;
        vx = drone.dir * drone.speed;
      }
      if ((drone.x >= drone.maxX && vx > 0) || (drone.x <= drone.minX && vx < 0)) vx = 0;
      drone.body.setVelocityX(vx);
      if (time >= drone.nextDive) this.startDive(drone, time, chasing ? target : null);
      drone.y = this.droneY(drone, time);
    });
  }

  dropObstacle(zone) {
    this.tweens.add({
      targets: [zone, zone.image],
      y: `+=${TILE}`,
      duration: 180,
      ease: 'Quad.easeIn',
      onUpdate: () => zone.body.updateFromGameObject(),
    });
  }

  setPlayerBody(p, box) {
    p.sprite.body.setSize(box.w, box.h, false).setOffset(box.x, box.y);
  }

  // Al tocar un cono o un enemigo: retroceso, animación de daño y un momento de invulnerabilidad
  hurtPlayer(p, source) {
    const now = this.time.now;
    if (p.dead || p.out || now < p.invulnerableUntil) return;
    const dir = p.sprite.x < source.x ? -1 : 1;
    p.sprite.body.setVelocity(dir * 200, -300);
    p.invulnerableUntil = now + 1200;
    if (this.damagePlayer(p, 1)) return;
    this.playAnim(p, 'hurt');
    p.hurtUntil = now + 450;
    this.tweens.add({
      targets: p.sprite, alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => p.sprite.setAlpha(1),
    });
  }

  // Al caer al agua pierde un punto de vida y vuelve a la entrada del nivel
  respawnPlayer(p) {
    if (p.dead || p.out || this.damagePlayer(p, 1)) return;
    p.sprite.body.reset(p.spawn.x, p.spawn.y);
    p.cam.flash(250, 255, 255, 255);
  }

  // Crea un tramo de terreno entre dos bloques: una fila de pasto que empieza en "top"
  // y debajo tierra con piedras hasta "bottom".
  // edges indica si el tramo termina en una orilla (con pilar de piedra) a la izquierda o derecha.
  addGroundSegment(fromTile, toTile, top, bottom, edges) {
    const baseH = bottom - top - TILE;
    const drawTiles = (col, cols, pasto, base, flip = false) => {
      const x = col * TILE;
      const w = cols * TILE;
      this.add.tileSprite(x, top, w, TILE, pasto)
        .setOrigin(0, 0).setTileScale(GROUND_SCALE).setFlipX(flip);
      this.add.tileSprite(x, top + TILE, w, baseH, base)
        .setOrigin(0, 0).setTileScale(GROUND_SCALE).setFlipX(flip);
    };

    let first = fromTile;
    let last = toTile;
    if (edges.left) drawTiles(first++, 1, 'suelo-pasto-orilla', 'suelo-base-orilla');
    if (edges.right) drawTiles(--last, 1, 'suelo-pasto-orilla', 'suelo-base-orilla', true);
    drawTiles(first, last - first, 'suelo-pasto', 'suelo-base');

    // Caja de colisión del tramo; empieza donde termina la hierba
    const x = fromTile * TILE;
    const w = (toTile - fromTile) * TILE;
    const bodyTop = top + GRASS_TOP;
    this.ground.add(this.add.zone(x, bodyTop, w, bottom - bodyTop).setOrigin(0, 0));
  }

  createGround(height) {
    // El suelo va de un charco a otro, dejando los huecos para el agua
    let from = 0;
    this.nivel.agua.forEach((pool) => {
      this.addGroundSegment(from, pool.start, GROUND_TOP, height, { left: from > 0, right: true });
      from = pool.start + pool.width;
    });
    this.addGroundSegment(from, this.nivel.ancho, GROUND_TOP, height, { left: from > 0, right: false });
  }

  // Terreno elevado: tapa la fila de pasto del suelo y se apoya sobre su tierra.
  // No lleva orilla en el lado donde se junta con un escalón igual o más alto.
  createSteps() {
    const steps = this.nivel.escalones;
    steps.forEach((step) => {
      const end = step.start + step.width;
      const touches = (tile, side) => steps.some((other) =>
        other.alto >= step.alto
        && (side === 'left' ? other.start + other.width === tile : other.start === tile));

      this.addGroundSegment(step.start, end, GROUND_TOP - step.alto * TILE, GROUND_TOP + TILE, {
        left: step.start > 0 && !touches(step.start, 'left'),
        right: end < this.nivel.ancho && !touches(end, 'right'),
      });
    });
  }

  createWater(height) {
    const top = GROUND_TOP + WATER_DROP;
    this.waterSurfaces = [];

    this.nivel.agua.forEach((pool) => {
      const x = pool.start * TILE;
      const w = pool.width * TILE;

      const surface = this.add.tileSprite(x, top, w, TILE, 'agua-superficie')
        .setOrigin(0, 0)
        .setTileScale(GROUND_SCALE);
      this.add.tileSprite(x, top + TILE, w, height - top - TILE, 'agua-profunda')
        .setOrigin(0, 0)
        .setTileScale(GROUND_SCALE);
      this.waterSurfaces.push(surface);

      // Zona del agua: si el personaje la toca, cae al agua
      this.water.add(this.add.zone(x, top + 8, w, height - top - 8).setOrigin(0, 0));
    });
  }

  // Altura (en píxeles) donde se apoya un objeto que está "alto" bloques sobre el suelo
  floorY(alto = 0) {
    return GROUND_TOP + GRASS_TOP - alto * TILE;
  }

  // Dibuja un sprite apoyado en (tile, alto) y añade su caja de colisión al grupo.
  // hitbox recorta la caja: { x, y, w, h } en píxeles del sprite original (16 px).
  placeObstacle(group, key, tile, alto, hitbox) {
    const x = tile * TILE;
    const bottom = this.floorY(alto);
    const image = this.add.image(x, bottom, key).setOrigin(0, 1).setScale(GROUND_SCALE);

    const box = hitbox || { x: 0, y: 0, w: image.width, h: image.height };
    const top = bottom - image.displayHeight;
    const zone = this.add.zone(
      x + box.x * GROUND_SCALE,
      top + box.y * GROUND_SCALE,
      box.w * GROUND_SCALE,
      box.h * GROUND_SCALE,
    ).setOrigin(0, 0);
    zone.image = image; // para poder romperla o moverla junto con su dibujo
    group.add(zone);
    return zone;
  }

  createObstacles() {
    this.nivel.cajas.forEach((c) => this.placeObstacle(this.solids, 'caja', c.tile, c.alto));
    // Cajas rompibles: una copia por mundo, que solo se ve en su mitad y guarda las piezas de su jugador
    this.mundos.forEach((m) => this.createWorldCrates(m));
    // Los conos solo hacen daño en su parte central, para que no sea injusto
    this.nivel.conos.forEach((c) => this.placeObstacle(this.hazards, 'cono', c.tile, c.alto, { x: 3, y: 3, w: 10, h: 13 }));
    this.nivel.barreras.forEach((b) => this.placeObstacle(this.solids, 'barrera', b.tile, b.alto, { x: 0, y: 1, w: 32, h: 15 }));

    this.nivel.plataformas.forEach((p) => this.createPlatform(p));
    this.nivel.plataformasMoviles.forEach((p) => this.createMovingPlatform(p));
  }

  // Registra las animaciones de js/personaje.js para cada variante en juego, como "<variante>-<animación>"
  // (por ejemplo "personaje-f-idle"), así dos jugadores con personajes distintos tienen cada uno las suyas
  createCharacterAnimations() {
    [...new Set(this.variantes)].forEach((pj) => {
      Object.entries(PERSONAJE.animaciones).forEach(([name, anim]) => {
        const key = `${pj.key}-${name}`;
        if (this.anims.exists(key)) return; // son globales: ya existen de otra partida
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(pj.key, { start: anim.start, end: anim.end }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      });
    });
  }

  // Plataforma metálica fija sobre dos patas de celosía
  createPlatform({ start, width, alto }) {
    const x = start * TILE;
    const w = width * TILE;
    const top = this.floorY(alto);
    const deckH = 8 * GROUND_SCALE;

    // Patas en los extremos, desde la plataforma hasta el suelo
    const legH = this.floorY() - top;
    [x, x + w - TILE].forEach((legX) => {
      this.add.tileSprite(legX, top, TILE, legH, 'plataforma-pata')
        .setOrigin(0, 0).setTileScale(GROUND_SCALE);
    });
    this.add.tileSprite(x, top, w, deckH, 'plataforma')
      .setOrigin(0, 0).setTileScale(GROUND_SCALE);

    this.platforms.add(this.makeOneWay(this.add.zone(x, top, w, deckH).setOrigin(0, 0)));
  }

  // Plataforma que va y viene en horizontal sobre el agua
  createMovingPlatform({ start, width, alto = 0, distancia, velocidad }) {
    const x = start * TILE;
    const deckH = 8 * GROUND_SCALE;
    const platform = this.add.tileSprite(x, this.floorY(alto), width * TILE, deckH, 'plataforma-movil')
      .setOrigin(0, 0).setTileScale(GROUND_SCALE);

    this.physics.add.existing(platform);
    platform.body.setAllowGravity(false).setImmovable(true);
    platform.body.setVelocityX(velocidad);
    this.makeOneWay(platform);

    platform.minX = x;
    platform.maxX = x + distancia * TILE;
    platform.speed = velocidad;
    this.movingPlatforms.push(platform);
  }

  // Solo choca por arriba: el jugador podrá atravesarla saltando desde abajo
  makeOneWay(object) {
    const body = object.body || this.physics.add.existing(object, true).body;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
    return object;
  }

  update(time, delta) {
    // Movimiento suave de las olas
    this.waterSurfaces.forEach((surface) => {
      surface.tilePositionX += 0.01 * delta;
    });

    // Las plataformas móviles dan la vuelta al llegar a cada extremo de su recorrido
    this.movingPlatforms.forEach((platform) => {
      if (platform.x >= platform.maxX) platform.body.setVelocityX(-platform.speed);
      else if (platform.x <= platform.minX) platform.body.setVelocityX(platform.speed);
    });

    this.updateEnemies(time);
    this.players.forEach((p) => (p.remoto ? this.updateRemote(p) : this.updatePlayer(p, time)));
    this.updateBubble();
    this.sendPosition(time);
  }

  // ---------- Online ----------

  // Qué hacer con cada mensaje del compañero. Todo lo suyo pasa en el mundo 1 (la mitad de abajo).
  setupOnline() {
    if (!this.online) return;
    const companero = this.players[1];
    const m = this.mundos[1];
    this.nextSend = 0;
    Red.on('pos', (msg) => { companero.objetivo = msg; });
    Red.on('caja', ({ i }) => {
      const zone = m.breakables.getChildren().find((z) => z.indice === i);
      if (zone) this.breakCrate(zone);
    });
    Red.on('golpe', ({ tipo, i, f }) => {
      const enemy = (tipo === 'robot' ? m.robots : m.drones).getChildren().find((e) => e.indice === i);
      if (enemy) this.hitEnemy(enemy, f);
    });
    Red.on('pieza', ({ key }) => {
      const item = this.items.getChildren().find((it) => it.owner === 1 && it.key === key && !it.collected);
      if (item) {
        this.collectItem(companero, item);
        return;
      }
      companero.itemCount[key] += 1; // la pieza aún no había salido aquí: solo se cuenta
      this.drawItemsHud(companero);
      this.checkComplete();
    });
    Red.on('vida', ({ health, lives }) => {
      companero.health = health;
      if (lives !== companero.lives) {
        companero.lives = lives;
        this.updateLives(companero);
      }
      this.updateHealthBar(companero);
    });
    Red.on('fuera', () => {
      if (!companero.out) this.playerOut(companero);
    });
    // Al perder, cualquiera de los dos puede pedir otra partida; el anfitrión reparte y empiezan los dos
    Red.on('reintentar', () => {
      if (Red.esAnfitrion && this.perdido) this.retry();
    });
    Red.on('inicio', ({ reparto }) => {
      if (this.perdido) this.restartOnline(reparto);
    });
    // El aviso de que salió o perdió la conexión lo pone js/red.js; aquí el compañero deja de jugar
    // El compañero reinició su parte: su mundo (la mitad de abajo) vuelve a empezar con sus piezas nuevas
    Red.on('reinicio', ({ reparto }) => this.restartPlayer(companero, reparto));
    // y la partida pasa a ser de 1 jugador, a pantalla completa (continueSolo)
    Red.on('desconectado', () => {
      if (this.retryLabel && this.perdido) this.retryLabel.setText('REINTENTAR');
      companero.desconectado = true;
      if (this.completado || this.perdido) return;
      this.continueSolo();
    });
    this.events.once('shutdown', () => {
      ['pos', 'caja', 'golpe', 'pieza', 'vida', 'fuera', 'reinicio', 'reintentar', 'inicio', 'desconectado'].forEach((t) => Red.off(t));
    });
  }

  // Cada poco se manda dónde está el personaje de este ordenador y qué animación hace
  sendPosition(time) {
    if (!this.online || time < this.nextSend) return;
    this.nextSend = time + ONLINE.envioCada;
    const p = this.players[0];
    const anim = p.sprite.anims.currentAnim;
    Red.enviar({
      t: 'pos',
      x: Math.round(p.sprite.x),
      y: Math.round(p.sprite.y),
      f: p.sprite.flipX,
      a: anim ? anim.key.slice(p.pj.key.length + 1) : 'idle',
    });
  }

  // El compañero va hacia la última posición recibida, con su animación
  updateRemote(p) {
    const o = p.objetivo;
    if (!o || p.out) return;
    const s = p.sprite;
    if (Phaser.Math.Distance.Between(s.x, s.y, o.x, o.y) > ONLINE.salto) {
      s.setPosition(o.x, o.y);
    } else {
      s.setPosition(Phaser.Math.Linear(s.x, o.x, ONLINE.suavizado), Phaser.Math.Linear(s.y, o.y, ONLINE.suavizado));
    }
    s.setFlipX(o.f);
    if (PERSONAJE.animaciones[o.a]) this.playAnim(p, o.a, true);
  }

  // El compañero online se fue: se vuelve a montar el nivel para 1 jugador (sin pantalla dividida) con todo
  // lo que llevaba este jugador: posición, vida, vidas, piezas, cajas rotas, enemigos y piezas en el suelo
  continueSolo() {
    if (this.leaving) return;
    this.leaving = true;
    const p = this.players[0];
    const m = this.mundos[0];
    const estado = {
      // Solo sus piezas (owner 0) en cada sitio
      reparto: Object.fromEntries(['cajasRompibles', 'robots', 'drones']
        .map((tipo) => [tipo, this.nivel[tipo].map((sitio) => sitio.objetos.filter((o) => o.owner === 0))])),
      jugador: {
        x: p.sprite.x, y: p.sprite.y, flip: p.sprite.flipX,
        health: p.health, lives: p.lives, out: p.out, itemCount: { ...p.itemCount },
      },
      cajas: m.breakables.getChildren().map((z) => ({ i: z.indice, y: z.y, imgY: z.image.y })),
      enemigos: [...m.robots.getChildren(), ...m.drones.getChildren()]
        .map((e) => ({ tipo: e.type, i: e.indice, x: e.x, y: e.y, vida: e.vida, dir: e.dir })),
      piezas: this.items.getChildren().filter((it) => it.owner === 0 && !it.collected)
        .map((it) => ({ key: it.key, x: it.x, y: it.y })),
    };
    Partida.modo = 'local';
    Partida.jugadores = 1;
    Partida.jugador2 = null;
    this.scene.restart({ nivel: this.nivel.numero, solo: estado });
  }

  // Deja el nivel recién creado como estaba la partida online (ver continueSolo)
  restoreSolo(estado) {
    const p = this.players[0];
    const m = this.mundos[0];
    const cajas = new Map(estado.cajas.map((c) => [c.i, c]));
    m.breakables.getChildren().slice().forEach((zone) => {
      const c = cajas.get(zone.indice);
      if (!c) { // ya estaba rota
        zone.image.destroy();
        m.breakables.remove(zone, true, true);
        return;
      }
      zone.y = c.y; // las que estaban encima de una rota ya habían caído
      zone.image.y = c.imgY;
      zone.body.updateFromGameObject();
    });
    const enemigos = new Map(estado.enemigos.map((e) => [`${e.tipo}-${e.i}`, e]));
    [...m.robots.getChildren(), ...m.drones.getChildren()].forEach((enemy) => {
      const e = enemigos.get(`${enemy.type}-${enemy.indice}`);
      if (!e) {
        enemy.destroy();
        return;
      }
      enemy.body.reset(e.x, e.y);
      enemy.vida = e.vida;
      enemy.dir = e.dir;
    });
    estado.piezas.forEach(({ key, x, y }) => this.spawnItem({ key, owner: 0 }, x, y));

    const j = estado.jugador;
    Object.assign(p.itemCount, j.itemCount);
    this.drawItemsHud(p);
    p.health = j.health;
    p.shownHealth = j.health;
    p.lives = j.lives;
    this.drawHealthBar(p);
    p.livesText.setText(String(p.lives));
    p.sprite.body.reset(j.x, j.y);
    p.sprite.setFlipX(j.flip);
    p.cam.centerOn(j.x, j.y); // la cámara aparece ya sobre el personaje, sin desplazarse desde el principio
    if (j.out) {
      p.out = true;
      p.sprite.setVisible(false);
      p.sprite.body.enable = false;
      this.showGameOver();
      return;
    }
    this.checkComplete();
  }

  restartOnline(reparto) {
    if (this.leaving) return;
    this.leaving = true;
    this.fadeOutAll(400, () => this.scene.restart({ nivel: this.nivel.numero, reparto }));
  }

  updatePlayer(p, time) {
    if (p.out) {
      // Sin vidas: su tecla de golpear reinicia su parte
      if (p.restartPanel && p.keys.golpear.filter((k) => Phaser.Input.Keyboard.JustDown(k)).length) this.restartPlayer(p);
      return;
    }
    const player = p.sprite;
    const body = player.body;
    const onGround = body.blocked.down || body.touching.down;
    const justLanded = onGround && !p.wasOnGround;
    p.wasOnGround = onGround;

    // Nivel terminado: el personaje se queda quieto mientras se lee el mensaje
    if (this.completado) {
      if (onGround) body.setVelocityX(0);
      return;
    }
    // Muerto o recibiendo un golpe no se controla al personaje
    if (p.dead) {
      if (onGround) body.setVelocityX(0);
      return;
    }
    if (time < p.hurtUntil) return;

    // Teclas de su mando: pulsada (mantener) o recién pulsada (una vez)
    const pulsada = (accion) => p.keys[accion].some((k) => k.isDown);
    const recien = (accion) => p.keys[accion].filter((k) => Phaser.Input.Keyboard.JustDown(k)).length > 0;
    const left = pulsada('izquierda');
    const right = pulsada('derecha');
    const down = pulsada('abajo');
    const jump = recien('saltar');
    const running = pulsada('correr');
    const attack = recien('golpear');

    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    const crouching = onGround && down;
    // El sonido de agacharse suena solo al empezar a agacharse, no mientras se mantiene
    if (crouching && !p.wasCrouching) Sonido.efecto('agacharse');
    p.wasCrouching = crouching;

    // Golpe: en el suelo se queda quieto mientras pega; en el aire sigue su trayectoria
    if (attack && time - p.attackStart > PLAYER.attackTime) {
      p.attackStart = time;
      p.attackLanded = false;
      this.playAnim(p, 'attack');
    }
    const attackElapsed = time - p.attackStart;
    if (attackElapsed < PLAYER.attackTime) {
      if (onGround) body.setVelocityX(0);
      this.setPlayerBody(p, PLAYER.body);
      const hitting = attackElapsed >= PLAYER.hitFrom && attackElapsed <= PLAYER.hitTo;
      if (hitting && !p.attackLanded) p.attackLanded = this.checkAttackHit(p);
      return;
    }

    let speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    if (crouching) speed = PLAYER.crouchSpeed;

    body.setVelocityX(dir * speed);
    if (dir) player.setFlipX(dir < 0);
    this.setPlayerBody(p, crouching ? PLAYER.bodyCrouch : PLAYER.body);

    if (jump && onGround && !crouching) {
      body.setVelocityY(-PLAYER.jumpSpeed);
      Sonido.efecto('salto');
    }

    // Animación según lo que esté haciendo
    const current = player.anims.currentAnim && player.anims.currentAnim.key;
    let anim;
    if (!onGround) anim = body.velocity.y < 0 ? 'jump' : 'fall';
    else if (crouching) anim = dir ? 'crouch-walk' : 'crouch';
    else if (dir) anim = running ? 'run' : 'walk';
    else if (justLanded || (current === `${p.pj.key}-land` && player.anims.isPlaying)) anim = 'land';
    else anim = 'idle';
    this.playAnim(p, anim, true);
  }
}
