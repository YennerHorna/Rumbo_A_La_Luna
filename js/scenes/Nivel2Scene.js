// Nivel 2 · Rumbo a la Luna. La nave del Apolo 11 viaja de la Tierra a la Luna entre asteroides.
// El diseño del nivel (distancia, duración, daño, asteroides...) está en js/nivel2.js.
//
// Cómo se dibuja: el espacio, la nave, los asteroides y la Luna son 3D (Three.js) y van en un lienzo propio que
// se coloca justo DEBAJO del de Phaser (ver .espacio3d en css/style.css). Phaser tiene el fondo transparente
// (transparent: true en js/main.js) y dibuja encima el HUD, los avisos, el engranaje y los fundidos, con el mismo
// estilo que el Nivel 1. El bucle 3D va dentro de update(): al abrir los ajustes la escena se pausa y el 3D también.
//
// Modos:
//   1 jugador:         si se pierden las vidas, panel de REINTENTAR / IR AL INICIO.
//   2 jugadores local: las dos naves en la misma pantalla, con los mismos asteroides. Quien pierde sus vidas
//                      vuelve con su tecla de disparar (F / M) mientras el compañero sigue.
//   online:            cada ordenador tiene sus propios asteroides; la nave del compañero se ve semitransparente
//                      (llega por la red, mensaje 'nave'). Si se va, la partida sigue en solitario.

// Teclas de cada nave (ver MANDOS en GameScene.js para el Nivel 1)
const MANDOS_NAVE = {
  solo: { izquierda: ['LEFT', 'A'], derecha: ['RIGHT', 'D'], arriba: ['UP', 'W'], abajo: ['DOWN', 'S'], disparar: ['SPACE', 'J', 'X'] },
  j1: { izquierda: ['A'], derecha: ['D'], arriba: ['W'], abajo: ['S'], disparar: ['F'] },
  j2: { izquierda: ['LEFT'], derecha: ['RIGHT'], arriba: ['UP'], abajo: ['DOWN'], disparar: ['M'] },
};

const NIVEL2_UI = {
  font: '"Rubik", sans-serif',
  // Colores de cada nave: franjas y letras "APOLO 11" (franja), nombre en el HUD (texto) y disparos (amarillos).
  // J1 rojo, J2 azul. La nave es blanca con el módulo de mando dorado.
  naves: [
    { franja: 0xe8341c, texto: '#ff7a63', disparo: 0xffd23f },
    { franja: 0x2f6fe0, texto: '#7fb0ff', disparo: 0xffb22e },
  ],
  casco: '#f1eee6',  // blanco del módulo de servicio
  capsula: 0xe2b04a, // dorado del módulo de mando
  separacionHud: 90,                      // px entre el HUD del jugador 1 y el del 2
  envioCada: 66,                          // ms entre dos mensajes 'nave' (online)
  barraViaje: { x: 190, ancho: 580, abajo: 26 }, // barra Tierra → Luna, abajo en el centro
  textos: {
    controles: {
      solo: '← → ↑ ↓ o W A S D: mover   ·   ESPACIO o X: disparar   ·   ESC: ajustes',
      dos: 'J1: W A S D mover · F disparar      J2: flechas mover · M disparar',
    },
    faltan: (km) => `FALTAN ${km.toLocaleString('es-ES')} KM`,
    despegue: '¡DESPEGUE!',
    fuera: (tecla) => `SIN VIDAS · PULSA ${tecla} PARA VOLVER`,
    llegada: (dos) => (dos ? '¡LLEGARON A LA LUNA!' : '¡LLEGASTE A LA LUNA!'),
    llegadaTexto: (puntos) => `20 de julio de 1969: el Apolo 11 llega a la Luna. ¡Misión cumplida! · ${puntos} puntos`,
    // Animación de llegada: [título, texto] de cada momento
    lunaVista: ['¡LUNA A LA VISTA!', 'Motores de frenado: preparando la entrada en órbita lunar...'],
    orbita: ['ÓRBITA LUNAR', 'La nave da la vuelta a la Luna, muy cerca de su superficie. ¡En la cara oculta es de noche!'],
    descenso: ['DESCENSO', 'Motores encendidos para bajar despacio... ¡con suavidad!'],
    finTitulo: '¡NAVE DESTRUIDA!',
    finTexto: 'Los astronautas del Apolo 11 repitieron sus simulaciones\nuna y otra vez. ¿Lo intentas de nuevo?',
    sin3d: 'No se pudo cargar el motor 3D (Three.js).\nRevisa tu conexión a internet.',
  },
};

// Un solo lienzo 3D para todo el juego: se reutiliza al reintentar (los navegadores limitan los contextos WebGL)
let renderer3D = null;

class Nivel2Scene extends Phaser.Scene {
  constructor() {
    super('Nivel2');
  }

  init() {
    // Online solo si sigue habiendo compañero (si se fue en el Nivel 1, Partida ya es de 1 jugador)
    this.online = Partida.modo === 'online' && Red.conectado;
    this.dosJugadores = Partida.jugadores === 2 && Boolean(Partida.jugador2) && (Partida.modo === 'local' || this.online);
    this.nivel = NIVEL_2;
    this.tripulantes = [{ nombre: Voz.ajustes.nombre, sexo: Voz.ajustes.sexo }];
    if (this.dosJugadores) this.tripulantes.push(Partida.jugador2);
    // Lo que usan los métodos que se toman prestados del Nivel 1 (barra de vida, aviso, botones)
    this.font = NIVEL2_UI.font;
    this.letra = LETRA_NORMAL;
    this.hudWidth = this.scale.width;
    this.estado = 'cuenta'; // cuenta → viaje → llegada | perdido
    this.progreso = 0;
    this.perdido = false;
    this.leaving = false;
    this.completado = false;
  }

  preload() {
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
  }

  create() {
    const { width, height } = this.scale;
    if (typeof THREE === 'undefined') {
      this.add.text(width / 2, height / 2, NIVEL2_UI.textos.sin3d, {
        fontFamily: this.font, fontSize: '20px', color: '#f2fbff', align: 'center',
      }).setOrigin(0.5);
      this.time.delayedCall(4000, () => this.scene.start('Title'));
      return;
    }
    Voz.detener();
    this.crearMundo3D();
    this.players = this.tripulantes.map((t, i) => this.crearJugador(i, t));
    this.crearHud();
    this.createNotice();
    botonAjustes(this, width - 34, 34);
    this.input.keyboard.on('keydown-ESC', () => abrirAjustes(this));
    this.setupOnline();
    this.events.once('shutdown', () => this.limpiar());

    this.cameras.main.fadeIn(600, 0, 0, 0);
    Sonido.musica(this.nivel.musica);
    const controles = NIVEL2_UI.textos.controles[this.dosJugadores && !this.online ? 'dos' : 'solo'];
    this.showNotice(`NIVEL ${this.nivel.numero} · ${this.nivel.nombre}`, `${this.nivel.objetivo}\n${controles}`, 7000);
    this.cuentaAtras();
    this.colocarLienzo();
    this.renderer.render(this.escena3d, this.camara);
  }

  // ---------- Mundo 3D ----------

  crearMundo3D() {
    if (!renderer3D) {
      renderer3D = new THREE.WebGLRenderer({ antialias: true });
      renderer3D.domElement.className = 'espacio3d';
      document.body.appendChild(renderer3D.domElement);
    }
    this.renderer = renderer3D;
    this.renderer.domElement.hidden = false;
    this.lienzoClave = '';

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0x070a14);
    escena.fog = new THREE.Fog(0x070a14, 40, 95);
    this.escena3d = escena;

    const { width, height } = this.scale;
    this.camara = new THREE.PerspectiveCamera(60, width / height, 0.1, 400);
    this.camara.position.set(0, 3, 12);
    this.camara.lookAt(0, 0, -10);
    // Hasta dónde se puede mover la nave (lo que se ve a la distancia de la nave)
    const mitadAlto = Math.tan(THREE.MathUtils.degToRad(30)) * 12;
    this.limites = { x: mitadAlto * (width / height) * 0.82, y: mitadAlto * 0.72 };

    escena.add(new THREE.AmbientLight(0x6070a0, 0.6));
    const sol = new THREE.DirectionalLight(0xfff1dd, 1.1);
    sol.position.set(5, 8, 6);
    escena.add(sol);
    const contraluz = new THREE.DirectionalLight(0x5fd4ff, 0.5);
    contraluz.position.set(-6, -3, -4);
    escena.add(contraluz);

    // Estrellas que pasan a toda velocidad
    this.numEstrellas = 900;
    const pos = new Float32Array(this.numEstrellas * 3);
    for (let i = 0; i < this.numEstrellas; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = -Math.random() * 120;
    }
    this.estrellas = new THREE.BufferGeometry();
    this.estrellas.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.matEstrellas = new THREE.PointsMaterial({ color: 0xc8d4ff, size: 0.18, fog: false });
    escena.add(new THREE.Points(this.estrellas, this.matEstrellas));

    // Reflejos de las partes metálicas de la nave: un "cielo" pintado con el brillo del Sol
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const cielo = Modelos3D.texturaReflejos();
    this.envRT = pmrem.fromEquirectangular(cielo);
    this.envMapa = this.envRT.texture;
    cielo.dispose();
    pmrem.dispose();

    // La Luna, al fondo: crece a medida que se acerca. La Tierra se queda atrás, abajo, al despegar.
    const mapaLuna = Modelos3D.texturaLuna();
    this.luna = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({
      map: mapaLuna, emissive: 0xffffff, emissiveMap: mapaLuna, emissiveIntensity: 0.45, roughness: 1, metalness: 0, fog: false,
    }));
    this.luna.position.set(0, 24, -170);
    escena.add(this.luna);
    this.tierra = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 32),
      new THREE.MeshStandardMaterial({ map: Modelos3D.texturaTierra(), roughness: 0.8, metalness: 0, fog: false }));
    this.tierra.position.set(-22, -46, -60);
    escena.add(this.tierra);

    // Materiales y piezas compartidas
    // Disparos: un núcleo casi blanco y un halo amarillo que brilla
    this.geoDisparo = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6);
    this.geoDisparo.rotateX(Math.PI / 2);
    this.geoHalo = new THREE.CylinderGeometry(0.14, 0.14, 1.4, 8);
    this.geoHalo.rotateX(Math.PI / 2);
    this.matDisparo = NIVEL2_UI.naves.map((n) => ({
      nucleo: new THREE.MeshBasicMaterial({ color: 0xfff6c8 }),
      halo: new THREE.MeshBasicMaterial({
        color: n.disparo, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    }));
    this.geoChispa = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    this.matRocas = [];
    this.matRocasHeridas = [];
    for (let i = 0; i < 4; i += 1) {
      const map = Modelos3D.texturaRoca();
      this.matRocas.push(new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0.02 }));
      this.matRocasHeridas.push(new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissive: 0xff5a2a, emissiveIntensity: 0.35 }));
    }
    this.disparos = [];
    this.rocas = [];
    this.chispas = [];
    this.tanques = [];
    this.proximaRoca = 0.6;
    this.proximoTanque = this.nivel.oxigeno.cada;
    this.temblor = 0;
    this.vel3 = new THREE.Vector3(); // vector de trabajo (proyectar etiquetas)
  }

  // El lienzo 3D se pone exactamente debajo del de Phaser (que se escala y centra con Scale.FIT)
  colocarLienzo() {
    const r = this.game.canvas.getBoundingClientRect();
    const clave = `${r.left}|${r.top}|${r.width}|${r.height}|${window.devicePixelRatio}`;
    if (clave === this.lienzoClave) return;
    this.lienzoClave = clave;
    Object.assign(this.renderer.domElement.style, {
      left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(Math.max(1, Math.round(r.width)), Math.max(1, Math.round(r.height)), false);
  }

  // Al salir de la escena: se libera todo lo 3D y se esconde el lienzo (el renderer se guarda para la próxima vez)
  limpiar() {
    if (this.escuchaRed) ['nave', 'desconectado'].forEach((t) => Red.off(t));
    this.input.keyboard.removeAllKeys(true, true); // que las teclas de la nave no se queden capturadas en otras pantallas
    if (!this.escena3d) return;
    this.escena3d.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? [].concat(o.material) : [];
      mats.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    });
    this.matRocas.concat(this.matRocasHeridas).forEach((m) => m.dispose());
    this.envRT.dispose();
    this.renderer.renderLists.dispose();
    this.renderer.domElement.hidden = true;
    this.escena3d = null;
  }

  // ---------- Jugadores ----------

  crearJugador(index, tripulante) {
    const remoto = this.online && index === 1;
    const nave = Modelos3D.nave(NIVEL2_UI.naves[index], remoto, this.envMapa);
    const x = this.dosJugadores ? (index === 0 ? -2.5 : 2.5) : 0;
    nave.grupo.position.set(x, -1, 0);
    nave.grupo.visible = !remoto; // la del compañero aparece al llegar su primer mensaje
    this.escena3d.add(nave.grupo);
    let mando = null;
    if (!remoto) mando = this.crearMando(this.dosJugadores && !this.online ? (index === 0 ? 'j1' : 'j2') : 'solo');
    return {
      index,
      nombre: tripulante.nombre || 'Tripulante',
      remoto,
      nave: nave.grupo,
      llama: nave.llama,
      brillo: nave.brillo,
      luz: nave.luz,
      mando,
      teclaDisparo: mando ? MANDOS_NAVE[this.dosJugadores && !this.online ? (index === 0 ? 'j1' : 'j2') : 'solo'].disparar.at(-1) : '',
      velX: 0,
      velY: 0,
      health: HEALTH.max,
      shownHealth: HEALTH.max,
      lives: HEALTH.vidas,
      puntos: 0,
      invuln: 0,
      recarga: 0,
      fuera: false,
      fueraDesde: 0,
      objetivo: null, // online: última posición recibida del compañero
    };
  }

  crearMando(tipo) {
    const mando = {};
    Object.entries(MANDOS_NAVE[tipo]).forEach(([accion, teclas]) => {
      mando[accion] = teclas.map((k) => this.input.keyboard.addKey(k));
    });
    return mando;
  }

  pulsa(p, accion) {
    return p.mando[accion].some((k) => k.isDown);
  }

  // ---------- HUD (Phaser) ----------

  crearHud() {
    this.players.forEach((p) => this.crearHudJugador(p));
    this.crearBarraViaje();
    // Nombre encima de cada nave (solo con 2 jugadores)
    if (this.dosJugadores) {
      this.players.forEach((p) => {
        p.etiqueta = this.add.text(0, 0, `J${p.index + 1}`, {
          fontFamily: this.font, fontSize: '14px', fontStyle: '800', color: NIVEL2_UI.naves[p.index].texto,
          stroke: '#112021', strokeThickness: 4,
        }).setOrigin(0.5, 1).setDepth(90).setVisible(!p.remoto);
      });
    }
    this.textoCuenta = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, '', {
      fontFamily: this.font, fontSize: '72px', fontStyle: '800', color: '#f3c623', stroke: '#112021', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(125).setShadow(4, 4, '#3b6fd0', 0, false, true);
  }

  // Corazón con las vidas, barra de vida (las del Nivel 1) y puntos. Con 2 jugadores, uno debajo del otro.
  crearHudJugador(p) {
    const oy = this.dosJugadores ? p.index * NIVEL2_UI.separacionHud : 0;
    const u = HUD_PIXEL;
    p.hud = [];
    p.healthBar = this.add.graphics().setDepth(100).setY(oy);
    this.drawHealthBar(p);
    p.hud.push(p.healthBar);
    const altoBarra = (Math.max(HEART_PIXELS.length, HUD_BAR.h + 2)) * u;
    const cy = HUD_TOP + oy + altoBarra / 2;
    p.livesText = this.add.text(HUD_MARGIN + (HUD_LIVES_W / 2 - 0.5) * u, cy, String(p.lives), {
      fontFamily: this.font, fontSize: `${this.letra.vidas}px`, fontStyle: '800', color: '#f2fbff',
      stroke: '#112021', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101);
    // Puntos (o el aviso de "sin vidas") debajo de la barra, donde no los tapa el aviso de arriba
    const yDebajo = HUD_TOP + oy + altoBarra + 2 * u + 3;
    p.puntosText = this.add.text(HUD_MARGIN - u, yDebajo, '0 PTS', {
      fontFamily: this.font, fontSize: '15px', fontStyle: '800', color: '#f2fbff', stroke: '#112021', strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(101);
    p.avisoText = this.add.text(HUD_MARGIN - u, yDebajo, NIVEL2_UI.textos.fuera(p.teclaDisparo), {
      fontFamily: this.font, fontSize: '14px', fontStyle: '800', color: '#f3c623', stroke: '#112021', strokeThickness: 4,
    }).setOrigin(0, 0).setDepth(101).setVisible(false);
    p.hud.push(p.livesText, p.puntosText, p.avisoText);

    if (this.dosJugadores) {
      // "J1 · NOMBRE" encima de la barra, del color de su nave
      const abajo = HUD_TOP + oy - 2 * u - 3;
      const tag = this.add.text(HUD_MARGIN, abajo - u, `J${p.index + 1} · ${p.nombre.toUpperCase()}`, {
        fontFamily: this.font, fontSize: `${this.letra.nombre}px`, fontStyle: '800', color: NIVEL2_UI.naves[p.index].texto,
      }).setOrigin(0, 1).setDepth(101).setShadow(1, 1, '#112021', 0, false, true);
      const fondo = this.add.graphics().setDepth(100).fillStyle(HUD_COLORS.panel, 0.65)
        .fillRect(HUD_MARGIN - 2 * u, abajo - tag.height - 2 * u, tag.width + 4 * u, tag.height + 2 * u);
      p.hud.push(tag, fondo);
    }
  }

  // Barra de viaje: Tierra a la izquierda, Luna a la derecha y la nave que avanza entre las dos
  crearBarraViaje() {
    const { x, ancho, abajo } = NIVEL2_UI.barraViaje;
    const y = this.scale.height - abajo;
    Espacio.texturas(this);
    this.add.image(x - 26, y, 'planeta-tierra').setDisplaySize(30, 30).setDepth(100);
    this.lunaHud = this.add.graphics().setDepth(100);
    const u = HUD_PIXEL;
    const luna = ['.OOO.', 'OWLLO', 'OLLDO', 'OLDLO', '.OOO.'];
    const colores = { O: HUD_COLORS.outline, W: 0xf2fbff, L: 0xc9ccd6, D: 0x8d93a6 };
    luna.forEach((fila, fy) => [...fila].forEach((c, fx) => {
      if (colores[c]) this.lunaHud.fillStyle(colores[c]).fillRect(x + ancho + 14 + fx * u * 1.6, y - 4 * u + fy * u * 1.6, u * 1.6, u * 1.6);
    }));
    this.barraViaje = this.add.graphics().setDepth(100);
    this.textoViaje = this.add.text(x + ancho / 2, y - 14, NIVEL2_UI.textos.faltan(this.nivel.distanciaKm), {
      fontFamily: this.font, fontSize: '14px', fontStyle: '800', color: '#f2fbff', stroke: '#112021', strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(101);
  }

  dibujarBarraViaje() {
    const { x, ancho } = NIVEL2_UI.barraViaje;
    const y = this.scale.height - NIVEL2_UI.barraViaje.abajo;
    const u = HUD_PIXEL;
    const lleno = Math.round(ancho * this.progreso);
    const g = this.barraViaje.clear();
    g.fillStyle(HUD_COLORS.panel, 0.65).fillRect(x - 2 * u, y - 4 * u, ancho + 4 * u, 8 * u);
    g.fillStyle(HUD_COLORS.outline).fillRect(x - u, y - 2 * u, ancho + 2 * u, 4 * u);
    g.fillStyle(HUD_COLORS.empty).fillRect(x, y - u, ancho, 2 * u);
    if (lleno > 0) {
      g.fillStyle(0x5fd4ff).fillRect(x, y - u, lleno, 2 * u);
      g.fillStyle(0xbfeeff).fillRect(x, y - u, lleno, u);
    }
    // La nave: un cohete pequeño en píxeles que apunta a la Luna
    const nx = x + lleno;
    g.fillStyle(HUD_COLORS.outline).fillRect(nx - 4 * u, y - 3 * u, 7 * u, 6 * u);
    g.fillStyle(0xf2fbff).fillRect(nx - 3 * u, y - 2 * u, 4 * u, 4 * u);
    g.fillStyle(0xd0d6e2).fillRect(nx + u, y - u, 2 * u, 2 * u);
    g.fillStyle(0xffb547).fillRect(nx - 5 * u, y - u, u, 2 * u);
    const km = Math.max(0, Math.round(this.nivel.distanciaKm * (1 - this.progreso) / 100) * 100);
    this.textoViaje.setText(NIVEL2_UI.textos.faltan(km));
  }

  actualizarBarra(p) {
    this.tweens.killTweensOf(p);
    this.tweens.add({
      targets: p, shownHealth: p.health, duration: 350, ease: 'Quad.easeOut', onUpdate: () => this.drawHealthBar(p),
    });
  }

  actualizarVidas(p) {
    p.livesText.setText(String(p.lives));
    this.tweens.add({ targets: p.livesText, scale: 1.6, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }

  sumarPuntos(p, puntos) {
    p.puntos += puntos;
    p.puntosText.setText(`${p.puntos} PTS`);
  }

  // ---------- Cuenta atrás y llegada ----------

  cuentaAtras() {
    const n = this.nivel.cuentaAtras;
    for (let i = 0; i <= n; i += 1) {
      this.time.delayedCall(1200 + i * 1000, () => {
        const despegue = i === n;
        this.textoCuenta.setText(despegue ? NIVEL2_UI.textos.despegue : String(n - i)).setScale(1.6).setAlpha(1);
        this.tweens.add({ targets: this.textoCuenta, scale: 1, duration: 300, ease: 'Back.easeOut' });
        Sonido.efecto(despegue ? 'despegue' : 'cuenta');
        if (despegue) {
          this.estado = 'viaje';
          this.tweens.add({ targets: this.textoCuenta, alpha: 0, delay: 700, duration: 400 });
        }
      });
    }
  }

  llegar() {
    if (this.completado) return;
    this.completado = true;
    this.estado = 'llegada';
    if (this.online) {
      Red.enviar({ t: 'nave', llego: true });
      Red.silenciar(); // los dos vuelven al inicio: no hace falta avisar de que el otro se va
    }
    Voz.detener();
    this.puntosFinal = this.players.filter((p) => !p.remoto).reduce((s, p) => s + p.puntos, 0);
    this.prepararLlegada();
  }

  // ---------- Animación de llegada ----------
  // Dura unos 18 s, como una pequeña película (sin HUD):
  //   0 - 3 s    aproximación: la Luna queda delante y la nave frena
  //   3 - 8 s    órbita: la cámara se aleja y la nave da la vuelta a la Luna (por detrás se esconde)
  //   8 - 11.6 s descenso: la nave se pone de pie y baja con el motor encendido hasta el suelo
  //   11.6 s     alunizaje: polvo, la bandera se levanta y "¡LLEGASTE A LA LUNA!"; luego, la portada
  prepararLlegada() {
    // Los asteroides que quedan estallan; fuera tanques y disparos
    this.rocas.forEach((r) => this.explotar(r.mesh.position, 0xffd27a, 8));
    [this.rocas, this.tanques, this.disparos].forEach((lista) => {
      for (let i = lista.length - 1; i >= 0; i -= 1) this.quitar(lista, i);
    });
    // El HUD se va
    this.children.list.filter((o) => o !== this.notice && o !== this.textoCuenta)
      .forEach((o) => this.tweens.add({ targets: o, alpha: 0, duration: 600 }));
    this.luna.material.emissiveIntensity = 0.06; // de cerca, sin brillo propio (si no, se ve blanca)
    this.escena3d.fog.near = 400;
    this.escena3d.fog.far = 800;

    const M = new THREE.Vector3(0, 0, -100); // centro de la Luna en la animación
    const R = 36;                            // y su radio
    // Estrellas quietas, en una esfera grande alrededor de la Luna (así también hay cielo en el alunizaje)
    const sp = this.estrellas.attributes.position.array;
    const d = new THREE.Vector3();
    for (let i = 0; i < this.numEstrellas; i += 1) {
      d.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(260).add(M);
      sp[i * 3] = d.x;
      sp[i * 3 + 1] = d.y;
      sp[i * 3 + 2] = d.z;
    }
    this.estrellas.attributes.position.needsUpdate = true;
    this.matEstrellas.size = 1.1;
    // La Tierra, pequeña, asoma por encima del horizonte de la Luna
    this.tierra.visible = true;
    this.tierra.scale.setScalar(0.25);
    this.tierra.position.set(M.x - 20, M.y + 52, M.z - 80);

    const c = {
      t: 0, M, R, Ro: R + 7, hitos: {},
      u: new THREE.Vector3(0, 0, 1), v: new THREE.Vector3(1, 0.35, 0).normalize(),
      lunaPos0: this.luna.position.clone(), lunaR0: this.luna.scale.x, lunaGiro0: this.luna.rotation.x,
      camPos0: this.camara.position.clone(), camMira0: new THREE.Vector3(0, 0, -10),
      camPos: new THREE.Vector3(), camMira: new THREE.Vector3(),
      qArriba: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), // la punta mira arriba
      q: new THREE.Quaternion(), m: new THREE.Matrix4(), arriba: new THREE.Vector3(0, 1, 0),
    };
    this.cine = c;
    c.L = this.puntoSuelo(0, 0);
    c.C1 = new THREE.Vector3(0, 4, -30);
    c.C3 = c.L.clone().add(new THREE.Vector3(0, 3.5, 12));
    c.mira3 = c.L.clone().add(new THREE.Vector3(0, 2.2, 0));

    // Naves que aterrizan: las de este ordenador (también la que se quedó sin vidas) y la del compañero online
    c.naves = this.players.filter((p) => !p.remoto || p.objetivo);
    c.naves.forEach((p, i) => {
      p.fuera = false;
      p.invuln = 0;
      p.nave.visible = true;
      if (p.etiqueta) p.etiqueta.setVisible(false);
      p.empuje = 0.85;
      p.inicio = p.nave.position.clone();
      p.desfase = -0.22 * i; // la segunda nave va un poco detrás
      p.pos = new THREE.Vector3();
      p.objA = new THREE.Vector3();
      p.tangente = new THREE.Vector3(1, 0, 0); // hacia dónde va en la órbita (para la cámara)
      const lado = c.naves.length > 1 ? (i === 0 ? -2.4 : 2.4) : 0;
      p.suelo = this.puntoSuelo(lado, 0);
      p.posada = p.suelo.clone().add(new THREE.Vector3(0, 1.95, 0)); // centro de la nave al tocar el suelo
      p.encima = p.suelo.clone().add(new THREE.Vector3(0, 10, 0));
    });

    // Piedras alrededor del sitio de alunizaje y la bandera (escondida hasta que tocan el suelo)
    for (let i = 0; i < 22; i += 1) {
      const dx = (Math.random() * 2 - 1) * 11;
      const dz = -9 + Math.random() * 14; // no demasiado cerca de la cámara
      if (Math.abs(dx) < 4.8 && Math.abs(dz) < 3.6) continue;
      const piedra = new THREE.Mesh(Modelos3D.geometriaRoca(0.2 + Math.random() * 0.5),
        this.matRocas[Math.floor(Math.random() * this.matRocas.length)]);
      piedra.position.copy(this.puntoSuelo(dx, dz));
      piedra.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      this.escena3d.add(piedra);
    }
    this.bandera = Modelos3D.bandera();
    this.bandera.grupo.position.copy(c.naves.length > 1 ? this.puntoSuelo(0, 2.4) : this.puntoSuelo(2.8, 1.2));
    this.bandera.grupo.scale.y = 0.001;
    this.bandera.grupo.visible = false;
    this.escena3d.add(this.bandera.grupo);

    this.showNotice(...NIVEL2_UI.textos.lunaVista, 2800);
  }

  // Punto de la superficie de la Luna (de la animación) desplazado (x, z) desde la cima
  puntoSuelo(x, z) {
    const { M, R } = this.cine;
    return new THREE.Vector3(x, R, z).normalize().multiplyScalar(R).add(M);
  }

  animarLlegada(dt, t) {
    const c = this.cine;
    c.t += dt;
    const T = c.t;
    const suave = (x) => {
      const k = Phaser.Math.Clamp(x, 0, 1);
      return k * k * (3 - 2 * k);
    };
    const hito = (nombre, cuando, fn) => {
      if (!c.hitos[nombre] && T >= cuando) {
        c.hitos[nombre] = true;
        fn();
      }
    };

    // La Luna se coloca delante y deja de crecer
    const kA = suave(T / 3);
    this.luna.position.lerpVectors(c.lunaPos0, c.M, kA);
    this.luna.scale.setScalar(Phaser.Math.Linear(c.lunaR0, c.R, kA));
    // Gira para que el sitio de alunizaje no caiga en el polo de la textura (ahí se ve estirada)
    this.luna.rotation.x = Phaser.Math.Linear(c.lunaGiro0, Math.PI / 2, kA);
    this.tierra.rotation.y += dt * 0.05;

    c.naves.forEach((p) => this.naveEnLlegada(p, T, dt, t, suave));

    // Cámara: detrás de la nave → plano general de la órbita → junto al sitio de alunizaje
    // Cámara: detrás de la nave al acercarse → la sigue de cerca en la órbita (con la Luna debajo) → junto al
    // sitio de alunizaje. Entre un tramo y otro se mueve suavemente.
    if (T < 3) {
      c.camPos.lerpVectors(c.camPos0, c.C1, kA);
      c.camMira.lerpVectors(c.camMira0, c.M, kA);
    } else {
      const deseo = c.deseoPos || (c.deseoPos = new THREE.Vector3());
      const mira = c.deseoMira || (c.deseoMira = new THREE.Vector3());
      const guia = c.naves[0];
      if (T < 8.3 && guia) {
        const radial = guia.nave.position.clone().sub(c.M).normalize();
        deseo.copy(guia.nave.position).addScaledVector(radial, 3).addScaledVector(guia.tangente, -7);
        mira.copy(guia.nave.position).addScaledVector(guia.tangente, 6).addScaledVector(radial, -2);
      } else {
        deseo.copy(c.C3);
        mira.copy(c.mira3);
      }
      const k = Math.min(1, dt * (T < 8.3 ? 3 : 1.8));
      c.camPos.lerp(deseo, k);
      c.camMira.lerp(mira, k);
    }
    this.camara.position.copy(c.camPos);
    this.camara.lookAt(c.camMira);

    hito('orbita', 3.2, () => this.showNotice(...NIVEL2_UI.textos.orbita, 4300));
    hito('descenso', 8.3, () => this.showNotice(...NIVEL2_UI.textos.descenso, 3000));
    hito('suelo', 11.6, () => this.tocarSuelo());
    hito('fin', 18, () => {
      this.leaving = true;
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    });

    // La bandera se levanta y ondea
    if (c.hitos.suelo) {
      const k = suave((T - 12.3) / 0.7);
      this.bandera.grupo.visible = k > 0;
      this.bandera.grupo.scale.y = Math.max(0.001, k);
      this.bandera.tela.rotation.y = Math.sin(t * 3) * 0.15;
    }
  }

  // Dónde está cada nave en cada momento de la animación
  naveEnLlegada(p, T, dt, t, suave) {
    const c = this.cine;
    const nave = p.nave;
    const orbita = (phi, out) => out.copy(c.M)
      .addScaledVector(c.u, c.Ro * Math.cos(phi)).addScaledVector(c.v, c.Ro * Math.sin(phi));
    const vuelta = Math.PI * 2 - 0.3;
    let empuje = 0.15;
    let dePie = false;
    if (T < 3) {
      orbita(p.desfase, p.objA);
      p.pos.lerpVectors(p.inicio, p.objA, suave(T / 3));
      empuje = 0.9;
    } else if (T < 8) {
      const phi = p.desfase + suave((T - 3) / 5) * vuelta;
      orbita(phi, p.pos);
      p.tangente.copy(c.u).multiplyScalar(-Math.sin(phi)).addScaledVector(c.v, Math.cos(phi)).normalize();
      empuje = T < 3.9 ? 1 : 0.15; // encendido corto para entrar en órbita
    } else if (T < 11.6) {
      if (!p.finOrbita) {
        p.finOrbita = orbita(p.desfase + vuelta, new THREE.Vector3());
        // Punto de control de la curva: por fuera de la Luna, para no atravesarla
        p.control = p.finOrbita.clone().sub(c.M).add(p.encima.clone().sub(c.M)).normalize()
          .multiplyScalar(c.R + 22).add(c.M);
      }
      if (T < 10) {
        const s = suave((T - 8) / 2);
        p.pos.copy(p.finOrbita).multiplyScalar((1 - s) * (1 - s))
          .addScaledVector(p.control, 2 * (1 - s) * s).addScaledVector(p.encima, s * s);
      } else {
        const s = 1 - Math.pow(1 - (T - 10) / 1.6, 2); // frena al acercarse al suelo
        p.pos.lerpVectors(p.encima, p.posada, s);
      }
      empuje = T < 9.3 ? 0.4 : 1;
      dePie = T >= 8.6;
    } else {
      p.pos.copy(p.posada);
      empuje = 0;
      dePie = true;
    }

    // Orientación: la punta hacia donde se mueve, o de pie para alunizar
    if (dePie) {
      nave.quaternion.slerp(c.qArriba, Math.min(1, dt * 4));
    } else if (p.pos.distanceToSquared(nave.position) > 1e-6) {
      c.m.lookAt(nave.position, p.pos, c.arriba);
      c.q.setFromRotationMatrix(c.m);
      nave.quaternion.slerp(c.q, Math.min(1, dt * 5));
    }
    nave.position.copy(p.pos);
    p.empuje += (empuje - p.empuje) * Math.min(1, dt * 6);
    this.ponerLlama(p, p.empuje, t);
  }

  tocarSuelo() {
    this.cine.naves.forEach((p) => this.polvo(p.suelo));
    Sonido.efecto('alunizaje');
    this.time.delayedCall(800, () => {
      this.showNotice(NIVEL2_UI.textos.llegada(this.dosJugadores), NIVEL2_UI.textos.llegadaTexto(this.puntosFinal), 6000);
      Sonido.efecto('logro');
    });
  }

  // Nube de polvo lunar alrededor de un punto
  polvo(pos) {
    for (let i = 0; i < 36; i += 1) {
      const s = new THREE.Mesh(this.geoChispa, new THREE.MeshBasicMaterial({ color: 0xd4cfc4, transparent: true }));
      s.position.copy(pos);
      this.escena3d.add(s);
      const a = Math.random() * Math.PI * 2;
      const v = 2 + Math.random() * 4;
      this.chispas.push({
        mesh: s, vida: 1.2 + Math.random() * 0.8, max: 2,
        vel: new THREE.Vector3(Math.cos(a) * v, 0.3 + Math.random() * 1.2, Math.sin(a) * v),
      });
    }
  }

  // Llama, brillo y luz del motor según la potencia (0 = apagado)
  ponerLlama(p, potencia, t) {
    p.llama.visible = potencia > 0.03;
    p.llama.children.forEach((f, k) => {
      const largo = (0.3 + potencia) * (1 + Math.sin(t * 40 + k * 2) * 0.12);
      f.scale.set(1, 1, largo);
    });
    p.brillo.visible = p.llama.visible;
    const b = 0.5 + potencia * 1.1 + Math.sin(t * 33) * 0.06;
    p.brillo.scale.set(b, b, 1);
    if (p.luz) p.luz.intensity = potencia * 2.2;
  }

  // ---------- Daño, vidas y fin de partida ----------

  danarNave(p, cantidad) {
    p.health = Math.max(0, p.health - cantidad);
    this.actualizarBarra(p);
    this.tweens.add({ targets: p.healthBar, x: 4, duration: 40, yoyo: true, repeat: 3 });
    this.temblor = 0.4;
    Sonido.efecto('choque');
    p.invuln = this.nivel.invulnerable;
    if (p.health > 0) return;
    p.lives -= 1;
    this.actualizarVidas(p);
    this.explotar(p.nave.position, 0xffb547, 40);
    if (p.lives <= 0) {
      this.naveFuera(p);
      return;
    }
    p.health = HEALTH.max;
    this.actualizarBarra(p);
    p.invuln = 2.4;
  }

  naveFuera(p) {
    p.fuera = true;
    p.fueraDesde = this.time.now;
    p.nave.visible = false;
    if (p.etiqueta) p.etiqueta.setVisible(false);
    if (!this.dosJugadores) {
      this.mostrarFin();
      return;
    }
    p.puntosText.setVisible(false);
    p.avisoText.setVisible(true);
    this.tweens.add({ targets: p.avisoText, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
  }

  // Con 2 jugadores, quien perdió sus vidas vuelve con su tecla de disparar (con la vida y las vidas llenas)
  volverNave(p) {
    if (!p.fuera || this.time.now - p.fueraDesde < 1200 || this.completado) return;
    p.fuera = false;
    p.health = HEALTH.max;
    p.lives = HEALTH.vidas;
    p.invuln = 2.5;
    p.nave.position.set(this.dosJugadores ? (p.index === 0 ? -2.5 : 2.5) : 0, -1, 0);
    p.nave.visible = true;
    if (p.etiqueta) p.etiqueta.setVisible(true);
    this.actualizarBarra(p);
    this.actualizarVidas(p);
    this.tweens.killTweensOf(p.avisoText);
    p.avisoText.setVisible(false).setAlpha(1);
    p.puntosText.setVisible(true);
    Sonido.efecto('clic');
  }

  // 1 jugador sin vidas: panel para reintentar o volver a la portada (ENTER también reintenta)
  mostrarFin() {
    if (this.perdido) return;
    this.perdido = true;
    this.estado = 'perdido';
    Sonido.musica(null);
    this.time.delayedCall(900, () => {
      const { width, height } = this.scale;
      const w = 480;
      const h = 210;
      const capa = this.add.container(width / 2, height / 2).setDepth(130).setAlpha(0);
      const fondo = this.add.rectangle(0, 0, width, height, 0x03040a, 0.6);
      const g = this.add.graphics()
        .fillStyle(HUD_COLORS.outline).fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8)
        .fillStyle(0x3b6fd0).fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4)
        .fillStyle(HUD_COLORS.panel, 0.97).fillRect(-w / 2, -h / 2, w, h);
      const titulo = this.add.text(0, -h / 2 + 22, NIVEL2_UI.textos.finTitulo, {
        fontFamily: this.font, fontSize: '28px', fontStyle: '800', color: '#e8341c',
      }).setOrigin(0.5, 0).setShadow(3, 3, '#112021', 0, false, true);
      const texto = this.add.text(0, -h / 2 + 70, NIVEL2_UI.textos.finTexto, {
        fontFamily: this.font, fontSize: '16px', color: '#f2fbff', align: 'center', lineSpacing: 4,
      }).setOrigin(0.5, 0);
      const reintentar = this.gameOverButton(-100, h / 2 - 40, 'REINTENTAR', 0xf3c623, () => this.reintentar());
      const salir = this.gameOverButton(110, h / 2 - 40, 'IR AL INICIO', 0xc4cbe0, () => this.salirAlInicio());
      capa.add([fondo, g, titulo, texto, reintentar, salir]);
      this.tweens.add({ targets: capa, alpha: 1, duration: 400 });
      this.input.keyboard.once('keydown-ENTER', () => this.reintentar());
    });
  }

  reintentar() {
    if (this.leaving) return;
    this.leaving = true;
    Sonido.efecto('clic');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
  }

  salirAlInicio() {
    if (this.leaving) return;
    this.leaving = true;
    Sonido.efecto('clic');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
  }

  // ---------- Online ----------

  setupOnline() {
    if (!this.online) return;
    this.escuchaRed = true;
    this.proximoEnvio = 0;
    const companero = this.players[1];
    Red.on('nave', (msg) => {
      if (msg.llego) {
        Red.silenciar(); // ya llegó: cuando vuelva al inicio no hace falta el aviso de que se fue
        return;
      }
      if (!companero.objetivo) {
        companero.nave.position.set(msg.x, msg.y, 0);
        companero.nave.visible = !msg.fuera;
        if (companero.etiqueta) companero.etiqueta.setVisible(!msg.fuera);
      }
      companero.objetivo = msg;
      if (msg.fuera !== companero.fuera) {
        companero.fuera = msg.fuera;
        companero.nave.visible = !msg.fuera;
        if (companero.etiqueta) companero.etiqueta.setVisible(!msg.fuera);
      }
      if (msg.vida !== companero.health) {
        companero.health = msg.vida;
        this.actualizarBarra(companero);
      }
      if (msg.vidas !== companero.lives) {
        companero.lives = msg.vidas;
        this.actualizarVidas(companero);
      }
      if (msg.puntos !== companero.puntos) {
        companero.puntos = 0;
        this.sumarPuntos(companero, msg.puntos);
      }
    });
    // El compañero se fue: su nave desaparece y la partida sigue en solitario
    Red.on('desconectado', () => {
      companero.nave.visible = false;
      companero.hud.forEach((o) => o.destroy());
      if (companero.etiqueta) companero.etiqueta.destroy();
      this.players = [this.players[0]];
      this.online = false;
      Partida.modo = 'local';
      Partida.jugadores = 1;
      Partida.jugador2 = null;
    });
  }

  enviarNave(time) {
    if (!this.online || time < this.proximoEnvio) return;
    this.proximoEnvio = time + NIVEL2_UI.envioCada;
    const p = this.players[0];
    Red.enviar({
      t: 'nave',
      x: +p.nave.position.x.toFixed(2),
      y: +p.nave.position.y.toFixed(2),
      vx: +p.velX.toFixed(1),
      vy: +p.velY.toFixed(1),
      fuera: p.fuera,
      inv: p.invuln > 0,
      vida: p.health,
      vidas: p.lives,
      puntos: p.puntos,
    });
  }

  // ---------- Bucle ----------

  update(time, delta) {
    if (!this.escena3d) return;
    const dt = Math.min(delta / 1000, 0.05);
    const t = time / 1000;
    this.colocarLienzo();

    // Llegada: animación de la nave entrando en órbita y alunizando (ver animarLlegada)
    if (this.estado === 'llegada') {
      this.animarLlegada(dt, t);
      this.moverChispas(dt);
      this.renderer.render(this.escena3d, this.camara);
      return;
    }

    const enJuego = this.estado === 'viaje';
    if (enJuego) {
      this.progreso = Math.min(1, this.progreso + dt / this.nivel.duracion);
      if (this.progreso >= 1) {
        this.llegar();
        return;
      }
    }

    this.moverEstrellas(dt);
    this.moverAstros(dt, t);
    if (this.estado !== 'perdido') {
      this.players.forEach((p) => this.moverNave(p, dt, t, enJuego));
      if (enJuego) {
        this.crearRocas(dt);
        this.crearTanques(dt);
        this.moverDisparos(dt);
        this.moverRocas(dt);
        this.moverTanques(dt, t);
      }
    }
    this.moverChispas(dt);
    this.moverCamara(dt);
    this.colocarEtiquetas();
    this.dibujarBarraViaje();
    this.enviarNave(time);
    this.renderer.render(this.escena3d, this.camara);
  }

  moverEstrellas(dt) {
    let velocidad = 6;
    if (this.estado === 'viaje') velocidad = 40 * (1 + this.progreso * 0.5);
    const sp = this.estrellas.attributes.position.array;
    for (let i = 0; i < this.numEstrellas; i += 1) {
      sp[i * 3 + 2] += velocidad * dt;
      if (sp[i * 3 + 2] > 12) sp[i * 3 + 2] = -120;
    }
    this.estrellas.attributes.position.needsUpdate = true;
  }

  // La Luna crece al acercarse y la Tierra se aleja hacia abajo en el primer tramo del viaje
  moverAstros(dt, t) {
    const p = this.progreso;
    const radio = 4 + 66 * Math.pow(p, 2.2);
    this.luna.scale.setScalar(radio);
    this.luna.position.y = 24 + radio * 0.55;
    this.luna.rotation.y = t * 0.02;
    const salida = Math.min(1, p / 0.12);
    this.tierra.position.y = -46 - salida * 60;
    this.tierra.position.z = -60 - salida * 60;
    this.tierra.rotation.y = t * 0.05;
    this.tierra.visible = salida < 1;
  }

  moverNave(p, dt, t, enJuego) {
    const nave = p.nave;
    this.ponerLlama(p, this.estado === 'cuenta' ? 0.35 : 0.85, t);
    if (p.fuera) {
      if (!p.remoto && this.pulsa(p, 'disparar')) this.volverNave(p);
      return;
    }

    if (p.remoto) {
      if (!p.objetivo) return;
      const k = Math.min(1, dt * 12);
      nave.position.x += (p.objetivo.x - nave.position.x) * k;
      nave.position.y += (p.objetivo.y - nave.position.y) * k;
      nave.rotation.z = -p.objetivo.vx * 0.035;
      nave.rotation.x = p.objetivo.vy * 0.02;
      return;
    }

    let ix = 0;
    let iy = 0;
    if (this.pulsa(p, 'izquierda')) ix -= 1;
    if (this.pulsa(p, 'derecha')) ix += 1;
    if (this.pulsa(p, 'arriba')) iy += 1;
    if (this.pulsa(p, 'abajo')) iy -= 1;
    const maxV = this.nivel.nave.velocidad;
    const k = Math.min(1, dt * 60 / maxV * 2);
    p.velX += (ix * maxV - p.velX) * k;
    p.velY += (iy * maxV - p.velY) * k;
    nave.position.x = Phaser.Math.Clamp(nave.position.x + p.velX * dt, -this.limites.x, this.limites.x);
    nave.position.y = Phaser.Math.Clamp(nave.position.y + p.velY * dt, -this.limites.y, this.limites.y);
    nave.rotation.z = -p.velX * 0.035; // se inclina un poco al moverse
    nave.rotation.x = p.velY * 0.02;

    // Parpadeo mientras es invulnerable
    if (p.invuln > 0) {
      p.invuln -= dt;
      nave.visible = Math.floor(t * 12) % 2 === 0 || p.invuln <= 0;
    }

    p.recarga -= dt;
    if (enJuego && this.pulsa(p, 'disparar') && p.recarga <= 0) {
      this.disparar(p);
      p.recarga = this.nivel.nave.cadencia;
    }
  }

  disparar(p) {
    [-0.42, 0.42].forEach((lado) => {
      const m = new THREE.Group();
      m.add(new THREE.Mesh(this.geoDisparo, this.matDisparo[p.index].nucleo));
      m.add(new THREE.Mesh(this.geoHalo, this.matDisparo[p.index].halo));
      m.position.set(p.nave.position.x + lado, p.nave.position.y, p.nave.position.z - 1.2);
      this.escena3d.add(m);
      this.disparos.push({ mesh: m, owner: p });
    });
    Sonido.efecto('disparo');
  }

  // Las naves de este ordenador que pueden chocar (la del compañero online no: sus asteroides son los suyos)
  navesActivas() {
    return this.players.filter((p) => !p.remoto && !p.fuera);
  }

  crearRocas(dt) {
    if (this.progreso >= this.nivel.asteroides.dejanDeSalir) return;
    this.proximaRoca -= dt;
    if (this.proximaRoca > 0) return;
    const a = this.nivel.asteroides;
    const cada = Phaser.Math.Linear(a.cadaInicio, a.cadaFinal, this.progreso) * (this.dosJugadores && !this.online ? 0.8 : 1);
    this.proximaRoca = cada * (0.7 + Math.random() * 0.6);

    const grande = Math.random() < a.probGrande;
    const r = grande ? 1.5 + Math.random() * 0.5 : 0.7 + Math.random() * 0.5;
    const variante = Math.floor(Math.random() * this.matRocas.length);
    const m = new THREE.Mesh(Modelos3D.geometriaRoca(r), this.matRocas[variante]);
    m.position.set((Math.random() * 2 - 1) * this.limites.x * 1.1, (Math.random() * 2 - 1) * this.limites.y * 1.1, -90);
    this.escena3d.add(m);
    const velocidad = Phaser.Math.FloatBetween(a.velocidad[0], a.velocidad[1]) * (1 + a.aumentoVelocidad * this.progreso);
    const deriva = new THREE.Vector2((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2);
    // Algunos van directos a por una nave: así no vale quedarse quieto en una esquina
    const naves = this.navesActivas();
    if (naves.length && Math.random() < 0.35) {
      const blanco = Phaser.Utils.Array.GetRandom(naves).nave.position;
      const tiempo = 90 / velocidad;
      deriva.set((blanco.x - m.position.x) / tiempo, (blanco.y - m.position.y) / tiempo);
    }
    this.rocas.push({
      mesh: m, r, grande, variante, hp: grande ? 2 : 1, velocidad, deriva,
      giro: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2.5),
    });
  }

  crearTanques(dt) {
    if (this.progreso >= this.nivel.asteroides.dejanDeSalir) return;
    this.proximoTanque -= dt;
    if (this.proximoTanque > 0) return;
    this.proximoTanque = this.nivel.oxigeno.cada * (0.8 + Math.random() * 0.4);
    const tanque = Modelos3D.tanque();
    tanque.position.set((Math.random() * 2 - 1) * this.limites.x * 0.8, (Math.random() * 2 - 1) * this.limites.y * 0.8, -90);
    this.escena3d.add(tanque);
    this.tanques.push({ mesh: tanque, velocidad: 16 });
  }

  quitar(lista, i) {
    const o = lista[i];
    this.escena3d.remove(o.mesh);
    if (o.mesh.geometry && o.mesh.geometry !== this.geoDisparo && o.mesh.geometry !== this.geoChispa) o.mesh.geometry.dispose();
    lista.splice(i, 1);
  }

  moverDisparos(dt) {
    for (let i = this.disparos.length - 1; i >= 0; i -= 1) {
      const d = this.disparos[i];
      d.mesh.position.z -= this.nivel.nave.velocidadDisparo * dt;
      if (d.mesh.position.z < -95) this.quitar(this.disparos, i);
    }
  }

  moverRocas(dt) {
    const radioNave = this.nivel.nave.radio;
    for (let i = this.rocas.length - 1; i >= 0; i -= 1) {
      const r = this.rocas[i];
      const m = r.mesh;
      m.position.z += r.velocidad * dt;
      m.position.x += r.deriva.x * dt;
      m.position.y += r.deriva.y * dt;
      m.rotation.x += r.giro.x * dt;
      m.rotation.y += r.giro.y * dt;
      m.rotation.z += r.giro.z * dt;

      // Disparos
      let destruida = null;
      for (let j = this.disparos.length - 1; j >= 0; j -= 1) {
        const d = this.disparos[j];
        if (d.mesh.position.distanceTo(m.position) >= r.r + 0.35) continue;
        this.quitar(this.disparos, j);
        r.hp -= 1;
        if (r.hp <= 0) {
          destruida = d.owner;
          break;
        }
        m.material = this.matRocasHeridas[r.variante];
        this.explotar(m.position, 0xffb547, 6);
      }
      if (destruida) {
        this.explotar(m.position, r.grande ? 0xff8a3d : 0xffd27a, r.grande ? 30 : 18);
        Sonido.efecto('explosion');
        this.sumarPuntos(destruida, r.grande ? this.nivel.puntos.grande : this.nivel.puntos.pequeno);
        this.quitar(this.rocas, i);
        continue;
      }

      // Choque con una nave
      const nave = this.navesActivas().find((p) => p.invuln <= 0 && m.position.distanceTo(p.nave.position) < r.r * 0.95 + radioNave);
      if (nave && !this.completado) {
        this.explotar(m.position, 0xff5a5f, 25);
        this.quitar(this.rocas, i);
        this.danarNave(nave, r.grande ? this.nivel.danio.grande : this.nivel.danio.pequeno);
        continue;
      }

      if (m.position.z > 16) this.quitar(this.rocas, i);
    }
  }

  moverTanques(dt, t) {
    for (let i = this.tanques.length - 1; i >= 0; i -= 1) {
      const o = this.tanques[i];
      o.mesh.position.z += o.velocidad * dt;
      o.mesh.rotation.y = t * 2;
      o.mesh.rotation.z = Math.sin(t * 3) * 0.4;
      const nave = this.navesActivas().find((p) => o.mesh.position.distanceTo(p.nave.position) < 1.4);
      if (nave) {
        nave.health = Math.min(HEALTH.max, nave.health + this.nivel.oxigeno.cura);
        this.actualizarBarra(nave);
        this.explotar(o.mesh.position, 0x7dffa8, 14);
        Sonido.efecto('oxigeno');
        this.quitar(this.tanques, i);
        continue;
      }
      if (o.mesh.position.z > 16) this.quitar(this.tanques, i);
    }
  }

  explotar(pos, color, n) {
    for (let i = 0; i < n; i += 1) {
      const s = new THREE.Mesh(this.geoChispa, new THREE.MeshBasicMaterial({ color, transparent: true }));
      s.position.copy(pos);
      this.escena3d.add(s);
      this.chispas.push({
        mesh: s, vida: 0.6 + Math.random() * 0.5, max: 1.1,
        vel: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
          .multiplyScalar(6 + Math.random() * 10),
      });
    }
  }

  moverChispas(dt) {
    for (let i = this.chispas.length - 1; i >= 0; i -= 1) {
      const s = this.chispas[i];
      s.vida -= dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += dt * 5;
      s.mesh.material.opacity = Math.max(0, s.vida / s.max);
      if (s.vida <= 0) {
        s.mesh.material.dispose();
        this.quitar(this.chispas, i);
      }
    }
  }

  // La cámara sigue un poco a la nave (a la del medio, con 2) y tiembla al recibir un golpe
  moverCamara(dt) {
    const naves = this.players.filter((p) => !p.remoto && !p.fuera);
    const x = naves.length ? naves.reduce((s, p) => s + p.nave.position.x, 0) / naves.length : 0;
    const y = naves.length ? naves.reduce((s, p) => s + p.nave.position.y, 0) / naves.length : 0;
    if (this.temblor > 0) {
      this.temblor -= dt;
      this.camara.position.x = x * 0.15 + (Math.random() - 0.5) * this.temblor;
      this.camara.position.y = 3 + y * 0.1 + (Math.random() - 0.5) * this.temblor;
    } else {
      this.camara.position.x = x * 0.15;
      this.camara.position.y = 3 + y * 0.1;
    }
  }

  // "J1" / "J2" encima de cada nave
  colocarEtiquetas() {
    if (!this.dosJugadores) return;
    const { width, height } = this.scale;
    this.players.forEach((p) => {
      if (!p.etiqueta || !p.etiqueta.active) return;
      const v = this.vel3.copy(p.nave.position);
      v.y += 1.1;
      v.project(this.camara);
      p.etiqueta.setPosition((v.x + 1) / 2 * width, (1 - v.y) / 2 * height);
    });
  }
}

// Métodos del Nivel 1 que se reutilizan tal cual: barra de vida, aviso de arriba y botones del panel
['drawHealthBar', 'healthColor', 'lighten', 'createNotice', 'showNotice', 'gameOverButton'].forEach((m) => {
  Nivel2Scene.prototype[m] = GameScene.prototype[m];
});

// Modelos y texturas 3D del Nivel 2, hechos con código (sin archivos)
const Modelos3D = {
  // Placas del casco con líneas de panel
  texturaCasco(base, linea) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i += 1) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 6, 3);
    }
    g.strokeStyle = linea;
    g.lineWidth = 2;
    for (let x = 0; x < 256; x += 32) g.strokeRect(x + 2, 2, 28, 252);
    for (let y = 40; y < 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  },

  // Laterales del módulo de servicio: blanco con paneles, radiadores y "APOLO 11" del color de la nave.
  // En la textura, x da la vuelta al cilindro (x = mitad: arriba) e y va a lo largo de la nave.
  texturaServicio(base, acento) {
    const W = 512;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);
    // Radiadores: placas grises con aletas
    [40, 300].forEach((x0) => {
      g.fillStyle = '#c9ccd2';
      g.fillRect(x0, 26, 72, 204);
      g.fillStyle = 'rgba(70,74,84,0.35)';
      for (let x = x0 + 4; x < x0 + 72; x += 7) g.fillRect(x, 26, 2, 204);
    });
    // Juntas entre paneles
    g.strokeStyle = 'rgba(80,84,96,0.35)';
    g.lineWidth = 2;
    for (let x = 0; x <= W; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    [70, 186].forEach((y) => {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    });
    // Pequeñas marcas y suciedad
    for (let i = 0; i < 500; i += 1) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
      g.fillRect(Math.random() * W, Math.random() * H, 3 + Math.random() * 6, 2);
    }
    // Letras a lo largo de la nave, arriba
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(Math.PI / 2);
    g.fillStyle = acento;
    g.font = '800 40px "Rubik", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('APOLO 11', 0, 0);
    g.restore();
    return new THREE.CanvasTexture(c);
  },

  // "Cielo" para los reflejos del metal: azul oscuro, el brillo del Sol y una luz azulada de la Tierra
  texturaReflejos() {
    const W = 512;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const fondo = g.createLinearGradient(0, 0, 0, H);
    fondo.addColorStop(0, '#46557a');
    fondo.addColorStop(0.5, '#1a2238');
    fondo.addColorStop(1, '#07090f');
    g.fillStyle = fondo;
    g.fillRect(0, 0, W, H);
    [[370, 70, 70, 'rgba(255,244,220,1)'], [120, 170, 90, 'rgba(110,170,255,0.6)'], [250, 40, 140, 'rgba(255,255,255,0.18)']]
      .forEach(([x, y, r, color]) => {
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, color);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      });
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  },

  // Mancha de luz redonda (brillo del motor)
  texturaBrillo() {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,240,1)');
    grd.addColorStop(0.3, 'rgba(255,190,90,0.7)');
    grd.addColorStop(1, 'rgba(255,120,30,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  },

  // Nave del Apolo: módulo de mando dorado (con el escudo térmico redondeado), módulo de servicio blanco con
  // franjas del color del jugador, propulsores de maniobra, antena de cuatro platos y la tobera del motor con
  // su llama, su brillo y una luz que ilumina lo que tiene cerca.
  // Apunta hacia el fondo (-Z). "colores": NIVEL2_UI.naves[i]; "fantasma": semitransparente (compañero online).
  nave(colores, fantasma = false, envMap = null) {
    const grupo = new THREE.Group();
    const extra = fantasma ? { transparent: true, opacity: 0.4, depthWrite: false } : {};
    const mat = (props) => new THREE.MeshStandardMaterial({ envMap, ...props, ...extra });
    const acento = `#${colores.franja.toString(16).padStart(6, '0')}`;
    const casco = mat({ map: this.texturaServicio(NIVEL2_UI.casco, acento), metalness: 0.15, roughness: 0.4 });
    const oro = mat({ color: NIVEL2_UI.capsula, metalness: 0.95, roughness: 0.22, side: THREE.DoubleSide });
    const metal = mat({ color: 0xa4aab4, metalness: 0.85, roughness: 0.3 });
    const oscuro = mat({ color: 0x2a2a30, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
    const franja = mat({ color: colores.franja, emissive: colores.franja, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.3 });
    const cristal = mat({ color: 0x0d1830, emissive: 0x1d4f7a, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.05 });
    const pieza = (geo, material, x, y, z) => {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      grupo.add(m);
      return m;
    };
    const tubo = (radio, largo, seg = 40) => {
      const geo = new THREE.CylinderGeometry(radio, radio, largo, seg);
      geo.rotateX(Math.PI / 2); // a lo largo de la nave
      return geo;
    };

    // Módulo de servicio, franjas y mamparo trasero
    pieza(tubo(0.66, 1.7), casco, 0, 0, 0.35);
    pieza(tubo(0.675, 0.12), franja, 0, 0, -0.38);
    pieza(tubo(0.675, 0.12), franja, 0, 0, 1.05);
    const tapa = new THREE.CylinderGeometry(0.6, 0.66, 0.1, 40);
    tapa.rotateX(Math.PI / 2);
    pieza(tapa, oro, 0, 0, 1.24);

    // Módulo de mando: perfil girado (escudo térmico abombado y punta redondeada)
    const perfil = [[0, 0], [0.5, 0.02], [0.66, 0.07], [0.7, 0.13], [0.66, 0.2], [0.22, 0.92], [0.16, 0.99], [0.1, 1.03], [0, 1.05]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const mando = new THREE.LatheGeometry(perfil, 40);
    mando.rotateX(-Math.PI / 2); // la punta mira hacia delante (-Z)
    pieza(mando, oro, 0, 0, -0.5);
    pieza(new THREE.TorusGeometry(0.69, 0.035, 8, 40), franja, 0, 0, -0.62);
    // Sonda de acoplamiento
    pieza(tubo(0.03, 0.32, 8), metal, 0, 0, -1.7);
    pieza(new THREE.SphereGeometry(0.05, 8, 6), metal, 0, 0, -1.86);
    // Ventanillas
    [[-0.2, 0.5], [0.2, 0.5], [0, 0.55]].forEach(([x, y], k) => {
      const v = pieza(new THREE.BoxGeometry(0.13, 0.1, 0.03), cristal, x, y, k === 2 ? -0.82 : -0.9);
      v.rotation.x = -1.0;
    });

    // Propulsores de maniobra (RCS): una caja con dos toberas pequeñas en cada lado
    for (let k = 0; k < 4; k += 1) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      const x = Math.cos(a) * 0.72;
      const y = Math.sin(a) * 0.72;
      const caja = pieza(new THREE.BoxGeometry(0.14, 0.18, 0.28), metal, x, y, -0.15);
      caja.rotation.z = a;
      [-1, 1].forEach((sentido) => {
        const geo = new THREE.ConeGeometry(0.04, 0.1, 8);
        geo.rotateX(sentido * Math.PI / 2);
        pieza(geo, oscuro, x, y, -0.15 + sentido * 0.19);
      });
    }

    // Antena de alta ganancia: brazo y cuatro platos dorados
    const a = Math.PI * 1.25;
    const brazo = pieza(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), metal, Math.cos(a) * 0.92, Math.sin(a) * 0.92, 1.1);
    brazo.rotation.z = a - Math.PI / 2;
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => {
      const geo = new THREE.SphereGeometry(0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3);
      geo.rotateX(-Math.PI / 2);
      pieza(geo, oro, Math.cos(a) * 1.22 + dx * 0.12, Math.sin(a) * 1.22 + dy * 0.12, 1.25);
    });

    // Tobera del motor: campana curva con aros dorados y la garganta encendida
    const campana = [];
    for (let i = 0; i <= 10; i += 1) campana.push(new THREE.Vector2(0.17 + 0.33 * Math.pow(i / 10, 0.7), i / 10 * 0.95));
    const tobera = new THREE.LatheGeometry(campana, 32);
    tobera.rotateX(Math.PI / 2); // se abre hacia atrás (+Z)
    pieza(tobera, oscuro, 0, 0, 1.27);
    pieza(new THREE.TorusGeometry(0.5, 0.025, 6, 32), oro, 0, 0, 2.22);
    pieza(new THREE.TorusGeometry(0.36, 0.02, 6, 32), oro, 0, 0, 1.68);
    pieza(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ color: 0xffc060, ...extra }), 0, 0, 1.3);

    // Llama: tres conos (naranja, amarillo y el centro blanco) que crecen desde la tobera hacia atrás
    const llama = new THREE.Group();
    [[0.3, 1.3, 0xff7a1a, 0.45], [0.2, 0.95, 0xffd84a, 0.65], [0.1, 0.55, 0xffffff, 0.9]].forEach(([radio, largo, color, opacidad]) => {
      const geo = new THREE.ConeGeometry(radio, largo, 16, 1, true);
      geo.translate(0, largo / 2, 0); // la base (ancha) en el origen
      geo.rotateX(Math.PI / 2);       // la punta hacia atrás (+Z)
      const f = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: fantasma ? opacidad * 0.5 : opacidad,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }));
      f.position.z = 2.15;
      llama.add(f);
    });
    grupo.add(llama);
    const brillo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.texturaBrillo(), color: 0xffc070, transparent: true, opacity: fantasma ? 0.3 : 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    brillo.position.z = 2.35;
    grupo.add(brillo);
    let luz = null;
    if (!fantasma) {
      luz = new THREE.PointLight(0xffa040, 1.5, 9, 2);
      luz.position.z = 2.9;
      grupo.add(luz);
    }
    grupo.scale.setScalar(0.9);
    return { grupo, llama, brillo, luz };
  },

  // Bandera en un mástil (con barra arriba para que se vea extendida, como la del Apolo 11)
  bandera() {
    const grupo = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xd0d4dc, metalness: 0.7, roughness: 0.35 });
    const mastil = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 8), metal);
    mastil.position.y = 1.2;
    grupo.add(mastil);
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6), metal);
    barra.rotation.z = Math.PI / 2;
    barra.position.set(0.67, 2.35, 0);
    grupo.add(barra);
    const c = document.createElement('canvas');
    c.width = 260;
    c.height = 160;
    const g = c.getContext('2d');
    for (let i = 0; i < 13; i += 1) {
      g.fillStyle = i % 2 === 0 ? '#c8202f' : '#ffffff';
      g.fillRect(0, i * 160 / 13, 260, 160 / 13 + 1);
    }
    g.fillStyle = '#26307a';
    g.fillRect(0, 0, 112, 86);
    g.fillStyle = '#ffffff';
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 6; x += 1) g.fillRect(8 + x * 17 + (y % 2) * 8, 8 + y * 16, 4, 4);
    }
    const tela = new THREE.Group();
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.8, side: THREE.DoubleSide }));
    plano.position.x = 0.65; // gira desde el mástil
    tela.add(plano);
    tela.position.y = 1.93;
    grupo.add(tela);
    return { grupo, tela };
  },

  // Tanque de oxígeno: cilindro verde brillante con tapas
  tanque() {
    const grupo = new THREE.Group();
    const cuerpo = new THREE.MeshStandardMaterial({ color: 0x7dffa8, emissive: 0x1f8a4a, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.3 });
    const tapa = new THREE.MeshStandardMaterial({ color: 0xe9edf2, metalness: 0.5, roughness: 0.3 });
    grupo.add(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 16), cuerpo));
    [-0.4, 0.4].forEach((y) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 8), tapa);
      m.position.y = y;
      m.scale.y = 0.5;
      grupo.add(m);
    });
    const valvula = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), tapa);
    valvula.position.y = 0.6;
    grupo.add(valvula);
    return grupo;
  },

  // Roca gris con manchas, grano, grietas y cráteres
  texturaRoca() {
    const W = 512;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#6f6d6b';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i += 1) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = 20 + Math.random() * 70;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const col = Math.random() < 0.5 ? '140,138,134' : (Math.random() < 0.5 ? '70,68,66' : '160,156,150');
      grd.addColorStop(0, `rgba(${col},0.45)`);
      grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 4000; i += 1) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '230,230,230'},${Math.random() * 0.12})`;
      g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    g.strokeStyle = 'rgba(205,205,205,0.5)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 10; i += 1) {
      let x = Math.random() * W;
      let y = Math.random() * H;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k += 1) {
        x += (Math.random() - 0.5) * 50;
        y += (Math.random() - 0.3) * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    this.crateres(g, W, H, 22, 26, 12);
    return new THREE.CanvasTexture(c);
  },

  crateres(g, W, H, cuantos, grande, normal) {
    for (let i = 0; i < cuantos; i += 1) {
      const x = Math.random() * W;
      const y = 20 + Math.random() * (H - 40);
      const r = 4 + Math.random() * (i < 3 ? grande : normal);
      g.fillStyle = 'rgba(70,68,66,0.85)';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(35,34,33,0.5)';
      g.beginPath();
      g.arc(x - r * 0.15, y - r * 0.15, r * 0.7, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(200,198,194,0.7)';
      g.lineWidth = Math.max(1, r * 0.18);
      g.beginPath();
      g.arc(x, y, r, Math.PI * 0.1, Math.PI * 1.2);
      g.stroke();
    }
  },

  // Roca alargada y abollada, con una muesca grande
  geometriaRoca(r) {
    const geo = new THREE.IcosahedronGeometry(r, 4);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    const d = new THREE.Vector3();
    const a = Math.random() * 6;
    const b = Math.random() * 6;
    const cc = Math.random() * 6;
    const muesca = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const estira = new THREE.Vector3(1.25 + Math.random() * 0.25, 0.85 + Math.random() * 0.15, 0.9 + Math.random() * 0.15);
    for (let i = 0; i < p.count; i += 1) {
      v.fromBufferAttribute(p, i);
      d.copy(v).normalize();
      let f = 1
        + 0.14 * Math.sin(2.2 * d.x + a) * Math.sin(2.6 * d.y + b)
        + 0.08 * Math.sin(4.5 * d.z + cc) * Math.cos(3.7 * d.x + b)
        + 0.04 * Math.sin(9 * d.y + a) * Math.sin(8 * d.z + cc);
      const n = d.dot(muesca);
      if (n > 0.8) f -= (n - 0.8) * 1.2;
      v.copy(d).multiplyScalar(r * f).multiply(estira);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  },

  // Luna: gris claro con "mares" oscuros y cráteres
  texturaLuna() {
    const W = 1024;
    const H = 512;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#b9b8b4';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i += 1) {
      const x = Math.random() * W;
      const y = H * 0.2 + Math.random() * H * 0.6;
      const r = 50 + Math.random() * 110;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(95,95,98,0.75)');
      grd.addColorStop(0.7, 'rgba(110,110,112,0.45)');
      grd.addColorStop(1, 'rgba(120,120,120,0)');
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 6000; i += 1) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.08})`;
      g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    this.crateres(g, W, H, 70, 40, 14);
    return new THREE.CanvasTexture(c);
  },

  // Tierra: océano azul, continentes verdes y nubes
  texturaTierra() {
    const W = 512;
    const H = 256;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#2358b0';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i += 1) {
      const x = Math.random() * W;
      const y = H * 0.2 + Math.random() * H * 0.6;
      const r = 10 + Math.random() * 26;
      g.fillStyle = Math.random() < 0.7 ? '#3a7d36' : '#57a845';
      g.beginPath();
      g.ellipse(x, y, r * 1.4, r, Math.random() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 30; i += 1) {
      g.beginPath();
      g.ellipse(Math.random() * W, Math.random() * H, 10 + Math.random() * 40, 3 + Math.random() * 6, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f2fbff';
    g.fillRect(0, 0, W, 14);
    g.fillRect(0, H - 14, W, 14);
    return new THREE.CanvasTexture(c);
  },
};
