// Cómic antes del Nivel 1 (sustituye a su pantalla de historia): cuenta la carrera espacial y explica la misión del nivel.
// Los textos y la posición de las viñetas están en js/comic.js; los dibujos se hacen aquí, con código y los sprites del juego.
// Las viñetas aparecen una a una. Un clic, ENTER o ESPACIO muestra la siguiente; con la página completa, pasa de página.
// "Saltar" va directo al Nivel 1.
const COMIC_UI = {
  font: '"Rubik", sans-serif',
  colores: {
    papel: 0xf4ecd8, puntos: 0xe2d6b8, tinta: 0x112021, narracion: 0xf3c623, globo: 0xffffff, radio: 0xdff0ff,
    texto: '#112021', radioTexto: '#16325e', dorado: '#f3c623',
  },
  borde: 4,
  // Tamaño del campo de entrenamiento respecto al juego: fondo, pasto, personaje, cajas y enemigos se
  // encogen todos igual, así mantienen las mismas proporciones que en el Nivel 1
  escala: 0.75,
  entrada: { primera: 350, entre: 1300, textos: 300 }, // ms hasta la primera viñeta, entre viñetas y hasta sus textos
};

class ComicScene extends Phaser.Scene {
  constructor() {
    super('Comic');
  }

  preload() {
    this.pj = PERSONAJE.variantes[Voz.ajustes.sexo] || PERSONAJE.variantes.M;
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
    BACKGROUND_LAYERS.forEach((layer) => this.load.image(layer.key, layer.file));
    this.load.image('suelo-pasto', 'assets/images/terreno/suelo-pasto.png');
    this.load.image('caja-rompible', 'assets/images/obstaculos/caja-rompible.png');
    this.load.spritesheet('robot', 'assets/images/enemigos/robot.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('dron', 'assets/images/enemigos/dron.png', { frameWidth: 16, frameHeight: 16 });
    NIVEL_1.objetos.forEach((key) => this.load.image(`objeto-${key}`, `assets/images/objetos/${key}.png`));
    this.load.spritesheet(this.pj.key, this.pj.file, {
      frameWidth: PERSONAJE.frameWidth,
      frameHeight: PERSONAJE.frameHeight,
    });
  }

  create() {
    const { width, height } = this.scale;
    this.saliendo = false;
    this.pagina = -1;
    this.objetos = [];
    this.animaciones = [];

    Sonido.musica('menu');
    Espacio.texturas(this);
    this.crearAnimaciones();
    this.crearPapel(width, height);
    this.crearPie(width, height);
    botonAjustes(this, width - 30, 28, 30);
    this.siguientePagina();

    this.input.keyboard.on('keydown-ENTER', () => this.accion());
    this.input.keyboard.on('keydown-SPACE', () => this.accion());
    this.input.on('pointerdown', (pointer, sobre) => {
      if (!sobre.length) this.accion();
    });
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  // Animaciones propias del cómic; las de robots y drones son las mismas que en el juego
  crearAnimaciones() {
    const anim = (key, textura, start, end, frameRate) => {
      if (this.anims.exists(key)) this.anims.remove(key);
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(textura, { start, end }), frameRate, repeat: -1 });
    };
    const { idle } = PERSONAJE.animaciones;
    anim('comic-idle', this.pj.key, idle.start, idle.end, idle.frameRate);
    if (!this.anims.exists('robot-walk')) anim('robot-walk', 'robot', 0, 1, 6);
    if (!this.anims.exists('dron-fly')) anim('dron-fly', 'dron', 0, 1, 12);
  }

  // Papel del cómic con una trama de puntos
  crearPapel(width, height) {
    const { colores: c } = COMIC_UI;
    const g = this.add.graphics();
    g.fillStyle(c.papel).fillRect(0, 0, width, height);
    g.fillStyle(c.puntos);
    for (let y = 6; y < height; y += 12) {
      for (let x = (y / 12) % 2 ? 12 : 6; x < width; x += 12) g.fillRect(x, y, 2, 2);
    }
    this.titulo = this.add.text(20, 18, '', {
      fontFamily: COMIC_UI.font, fontSize: '22px', fontStyle: '800', color: COMIC_UI.colores.texto,
    });
  }

  crearPie(width, height) {
    const { font, colores: c } = COMIC_UI;
    this.indicador = this.add.text(width / 2, height - 18, '', {
      fontFamily: font, fontSize: '14px', fontStyle: '700', color: '#515c7a',
    }).setOrigin(0.5);
    this.aviso = this.add.text(width - 20, height - 18, COMIC.pie, {
      fontFamily: font, fontSize: '14px', fontStyle: '700', color: c.texto,
    }).setOrigin(1, 0.5);
    this.tweens.add({ targets: this.aviso, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    const saltar = this.add.text(20, height - 18, COMIC.saltar, {
      fontFamily: font, fontSize: '14px', fontStyle: '800', color: '#515c7a',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    saltar.on('pointerover', () => saltar.setColor(c.texto));
    saltar.on('pointerout', () => saltar.setColor('#515c7a'));
    saltar.on('pointerdown', () => this.terminar());
  }

  // ---------- Páginas y viñetas ----------

  siguientePagina() {
    this.pagina += 1;
    if (this.pagina >= COMIC.paginas.length) {
      this.terminar();
      return;
    }
    this.animaciones.forEach((t) => t.remove());
    this.objetos.forEach((o) => o.destroy());
    this.animaciones = [];
    this.objetos = [];
    if (this.cita) this.cita.remove();

    const pagina = COMIC.paginas[this.pagina];
    this.titulo.setText(pagina.titulo);
    this.indicador.setText(`${this.pagina + 1} / ${COMIC.paginas.length}`);
    this.aviso.setVisible(true);
    this.mostradas = 0;
    this.cita = this.time.delayedCall(COMIC_UI.entrada.primera, () => this.siguienteVineta());
  }

  siguienteVineta() {
    const vinetas = COMIC.paginas[this.pagina].vinetas;
    if (this.cita) this.cita.remove();
    this.crearVineta(vinetas[this.mostradas]);
    this.mostradas += 1;
    if (this.mostradas < vinetas.length) {
      this.cita = this.time.delayedCall(COMIC_UI.entrada.entre, () => this.siguienteVineta());
    } else if (this.pagina === COMIC.paginas.length - 1) {
      this.aviso.setVisible(false);
      this.crearBoton();
    }
  }

  get paginaCompleta() {
    return this.mostradas >= COMIC.paginas[this.pagina].vinetas.length;
  }

  // Clic / ENTER: muestra la siguiente viñeta o pasa de página
  accion() {
    if (this.saliendo || PanelAjustes.abierto || PanelAjustes.recienCerrado) return;
    if (!this.paginaCompleta) {
      this.siguienteVineta();
      return;
    }
    Sonido.efecto('clic');
    this.siguientePagina();
  }

  terminar() {
    if (this.saliendo) return;
    this.saliendo = true;
    Sonido.efecto('clic');
    // En online, antes del nivel se espera a que el compañero también esté listo (EsperaScene)
    const { escena, datos } = Partida.modo === 'online' ? { escena: 'Espera' } : COMIC.siguiente;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(escena, datos));
  }

  // Guarda lo que se crea (y las animaciones en bucle) para borrarlo al cambiar de página
  guardar(...objs) {
    this.objetos.push(...objs);
    return objs[0];
  }

  enBucle(tween) {
    this.animaciones.push(tween);
    return tween;
  }

  // Una viñeta: dibujo recortado al marco, recuadros del narrador, marco negro y, encima, globos y onomatopeya
  crearVineta(v) {
    const { x, y, w, h } = v.rect;
    const ui = COMIC_UI;
    const arte = this.guardar(this.add.container(x, y));
    const forma = this.guardar(this.make.graphics({ add: false }).fillRect(x, y, w, h));
    arte.setMask(forma.createGeometryMask());
    this.dibujos[v.escena].call(this, arte, w, h, v);

    const textos = [];
    (v.narracion || []).forEach((n) => arte.add(this.narracion(n, w, h)));
    if (v.sonido) textos.push(this.onomatopeya(x + v.sonido.x, y + v.sonido.y, v.sonido));

    const marco = this.guardar(this.add.graphics());
    marco.lineStyle(ui.borde, ui.colores.tinta).strokeRect(x, y, w, h);

    (v.globos || []).forEach((gl) => textos.push(this.globo(x, y, gl)));

    arte.setAlpha(0);
    marco.setAlpha(0);
    this.tweens.add({ targets: [arte, marco], alpha: 1, duration: 350 });
    textos.forEach((t, i) => {
      t.setScale(0.6).setAlpha(0);
      this.tweens.add({
        targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut', delay: ui.entrada.textos + i * 250,
      });
    });
  }

  // Sustituye {Tripulante}, {tripulante}, {o} y {O} según el registro
  rellenar(texto) {
    const { nombre, sexo } = Voz.ajustes;
    const tripulante = nombre ? `tripulante ${nombre}` : 'tripulante';
    const o = sexo === 'F' ? 'a' : 'o';
    return texto
      .replace(/\{Tripulante\}/g, tripulante.charAt(0).toUpperCase() + tripulante.slice(1))
      .replace(/\{tripulante\}/g, tripulante)
      .replace(/\{o\}/g, o)
      .replace(/\{O\}/g, o.toUpperCase());
  }

  // Recuadro amarillo del narrador (dentro del dibujo, así el marco lo recorta)
  narracion(n, w, h) {
    const { font, colores: c } = COMIC_UI;
    const cont = this.add.container(n.x, 0);
    let alto = 10;
    if (n.fecha) {
      const fecha = this.add.text(10, alto, n.fecha, {
        fontFamily: font, fontSize: '12px', fontStyle: '800', color: c.texto,
      });
      cont.add(fecha);
      alto += fecha.height + 2;
    }
    const texto = this.add.text(10, alto, this.rellenar(n.texto), {
      fontFamily: font, fontSize: '14px', fontStyle: '500', color: c.texto, lineSpacing: 2, wordWrap: { width: n.w - 20 },
    });
    alto += texto.height + 10;
    const g = this.add.graphics();
    g.fillStyle(c.narracion).fillRect(0, 0, n.w, alto);
    g.lineStyle(3, c.tinta).strokeRect(0, 0, n.w, alto);
    cont.addAt(g, 0).add(texto);
    cont.y = n.abajo ? h - alto - n.y : n.y;
    return cont;
  }

  // Bocadillo blanco con cola hacia el que habla; con "quien", es un mensaje de radio (azul, sin cola)
  globo(px, py, gl) {
    const { font, colores: c } = COMIC_UI;
    const radio = Boolean(gl.quien);
    const texto = this.add.text(0, 0, this.rellenar(gl.texto), {
      fontFamily: font, fontSize: '15px', fontStyle: '500', color: radio ? c.radioTexto : c.texto,
      align: 'center', lineSpacing: 2, wordWrap: { width: gl.w - 24 },
    }).setOrigin(0.5);
    const w = gl.w;
    const h = texto.height + 22;
    const g = this.add.graphics();
    const relleno = radio ? c.radio : c.globo;
    const esquina = radio ? 4 : Math.min(22, h / 2);
    let cola = null;
    if (gl.cola) {
      const cx = gl.cola.x - gl.x - w / 2;
      const cy = gl.cola.y - gl.y - h / 2;
      const bx = Phaser.Math.Clamp(cx, -w / 2 + 24, w / 2 - 24);
      const by = cy > 0 ? h / 2 - 6 : -h / 2 + 6;
      cola = [bx - 10, by, bx + 10, by, cx, cy];
    }
    // Primero los bordes gruesos y luego el relleno encima: así el borde no corta la unión con la cola
    g.lineStyle(6, c.tinta).strokeRoundedRect(-w / 2, -h / 2, w, h, esquina);
    if (cola) g.strokeTriangle(...cola);
    g.fillStyle(relleno).fillRoundedRect(-w / 2, -h / 2, w, h, esquina);
    if (cola) g.fillTriangle(...cola);

    const cont = this.guardar(this.add.container(px + gl.x + w / 2, py + gl.y + h / 2, [g, texto]));
    if (radio) {
      const etiqueta = this.add.text(-w / 2 + 10, -h / 2 - 9, ` ${gl.quien} `, {
        fontFamily: font, fontSize: '11px', fontStyle: '800', color: '#f2fbff', backgroundColor: '#16325e',
      });
      cont.add(etiqueta);
    }
    return cont;
  }

  onomatopeya(x, y, s) {
    return this.guardar(this.add.text(x, y, s.texto, {
      fontFamily: COMIC_UI.font, fontSize: '30px', fontStyle: '800', color: COMIC_UI.colores.dorado,
      stroke: '#112021', strokeThickness: 7,
    }).setOrigin(0.5).setAngle(s.angulo || 0));
  }

  // Personaje del jugador de pie con los pies en "suelo" (el fotograma mide 48x40 y los pies están en la fila 38).
  // Por defecto, al mismo tamaño que en el juego respecto al fondo.
  personaje(cont, x, suelo, escala = PLAYER_SCALE * COMIC_UI.escala) {
    const pj = this.add.sprite(x, suelo, this.pj.key, 0).setOrigin(0.5, 39 / 40).setScale(escala);
    pj.play('comic-idle');
    cont.add(pj);
    return pj;
  }

  // Cielo, montañas, vegetación y pasto del campo de entrenamiento: las mismas capas que el Nivel 1 y colocadas
  // igual respecto al pasto (ver BACKGROUND_LAYERS y GROUND_TOP en GameScene.js), todo a COMIC_UI.escala.
  // Con limpio = true se quita la vegetación (árboles, farolas y vallas) para que el fondo quede más despejado.
  // Devuelve la altura donde se apoyan los pies (como en el juego, un poco hundidos entre las matas del pasto).
  fondoCampo(cont, w, h, limpio = false) {
    const k = COMIC_UI.escala;
    const suelo = h - 34;
    cont.add(this.add.graphics().fillStyle(0x85dcfc).fillRect(0, 0, w, h)); // el celeste de debajo del cielo
    BACKGROUND_LAYERS.forEach((capa) => {
      if (limpio && capa.key === 'vegetacion') return;
      cont.add(this.add.image(-30, suelo + (capa.bottom - GROUND_TOP) * k, capa.key).setOrigin(0, 1).setScale(k));
    });
    cont.add(this.add.tileSprite(0, suelo, w, h - suelo, 'suelo-pasto').setOrigin(0, 0).setTileScale(GROUND_SCALE * k));
    return suelo + GRASS_TOP * k;
  }

  // Cuadrados de 3 px para las estrellas
  estrellas(g, w, h, cuantas) {
    for (let i = 0; i < cuantas; i += 1) {
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1))
        .fillRect(Phaser.Math.Between(0, w / 3) * 3, Phaser.Math.Between(0, h / 3) * 3, 3, 3);
    }
  }
}

// Dibujo de fondo de cada viñeta: function (contenedor, ancho, alto, viñeta). "this" es la escena.
ComicScene.prototype.dibujos = {
  // 1957: el Sputnik 1 da vueltas alrededor de la Tierra
  sputnik(cont, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x050818).fillRect(0, 0, w, h);
    this.estrellas(g, w, h, 60);
    const tierra = this.add.image(150, h + 70, 'planeta-tierra').setScale(1.7);

    const sputnik = this.add.graphics();
    sputnik.lineStyle(2, 0xc9ccd6);
    [[-46, 22], [-50, 10], [-40, 32], [-54, 30]].forEach(([ax, ay]) => sputnik.lineBetween(0, 0, ax, ay));
    sputnik.fillStyle(0x8d90a2).fillCircle(0, 0, 13);
    sputnik.fillStyle(0xc9ccd6).fillCircle(-2, -2, 11);
    sputnik.fillStyle(0xffffff).fillRect(-7, -8, 5, 5);
    cont.add([g, tierra, sputnik]);
    // Órbita en elipse alrededor de la Tierra
    this.enBucle(this.tweens.addCounter({
      from: 0, to: Math.PI * 2, duration: 9000, repeat: -1,
      onUpdate: (t) => {
        const a = t.getValue();
        sputnik.setPosition(330 + Math.cos(a) * 150, 95 + Math.sin(a) * 40).setAngle(Math.sin(a) * 15);
      },
    }));
  },

  // 1961: el presidente habla en el Congreso (silueta genérica)
  congreso(cont, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x2a3f6b).fillRect(0, 0, w, h);
    g.fillStyle(0x34508a);
    for (let x = 18; x < w; x += 70) g.fillRect(x, 0, 22, h); // columnas
    // Bandera con franjas
    const fx = 24;
    const fy = 96;
    for (let i = 0; i < 7; i += 1) g.fillStyle(i % 2 ? 0xf2fbff : 0xcf3a2a).fillRect(fx, fy + i * 8, 90, 8);
    g.fillStyle(0x1f3f8f).fillRect(fx, fy, 38, 32);
    g.fillStyle(0xf2fbff);
    for (let i = 0; i < 6; i += 1) g.fillRect(fx + 5 + (i % 3) * 12, fy + 5 + Math.floor(i / 3) * 14, 3, 3);
    // Orador: traje oscuro, cabeza y pelo
    const ox = 285;
    g.fillStyle(0x1b2236).fillRect(ox - 40, 134, 80, 70);
    g.fillStyle(0xf2fbff).fillRect(ox - 8, 134, 16, 20);
    g.fillStyle(0x2a3a6e).fillRect(ox - 3, 136, 6, 18);
    g.fillStyle(0xe0b48a).fillRect(ox - 18, 96, 36, 38);
    g.fillStyle(0x6b4a2c).fillRect(ox - 20, 90, 40, 14).fillRect(ox - 20, 90, 8, 22);
    g.fillStyle(0x112021).fillRect(ox - 10, 110, 4, 4).fillRect(ox + 6, 110, 4, 4);
    // Atril con micrófonos
    g.fillStyle(0x6b3f1f).fillRect(ox - 60, 152, 120, 80);
    g.fillStyle(0x8a5a2e).fillRect(ox - 66, 146, 132, 12);
    g.fillStyle(0xf3c623).fillCircle(ox, 186, 14);
    g.lineStyle(3, 0x112021).lineBetween(ox - 18, 146, ox - 10, 128).lineBetween(ox + 18, 146, ox + 10, 128);
    g.fillStyle(0x112021).fillCircle(ox - 10, 126, 5).fillCircle(ox + 10, 126, 5);
    cont.add(g);
  },

  // 1961-1969: el Saturno V en la plataforma y el jugador entrenando
  // (sobre el fondo del Nivel 1 sin la vegetación: cielo, montañas y pasto)
  cohete(cont, w, h) {
    const pasto = this.fondoCampo(cont, w, h, true);
    const g = this.add.graphics();
    // Base de hormigón sobre el pasto donde se apoyan la torre y el cohete
    const suelo = pasto - 6;
    g.fillStyle(0x112021).fillRect(646, suelo - 2, 182, h - suelo + 2);
    g.fillStyle(0x8d90a2).fillRect(648, suelo, 178, h - suelo);
    g.fillStyle(0xb7b9c7).fillRect(648, suelo, 178, 3);

    // Torre de lanzamiento roja
    const tx = 680;
    g.fillStyle(0xcf3a2a).fillRect(tx, 24, 6, suelo - 24).fillRect(tx + 20, 24, 6, suelo - 24);
    g.lineStyle(2, 0xcf3a2a);
    for (let y = 30; y < suelo; y += 18) g.lineBetween(tx, y, tx + 26, y + 18).lineBetween(tx + 26, y, tx, y + 18);
    g.fillStyle(0xcf3a2a).fillRect(tx + 26, 60, 28, 4).fillRect(tx + 26, 110, 28, 4);

    // Saturno V: cuerpo plateado con contorno oscuro, bandas azules, cono rojo y aletas
    const cx = 774;
    const top = 26;
    const cuerpo = { x: cx - 16, y: top + 30, w: 32, h: suelo - top - 30 };
    g.fillStyle(0x112021).fillRect(cuerpo.x - 3, cuerpo.y - 3, cuerpo.w + 6, cuerpo.h + 3)
      .fillTriangle(cx - 20, top + 28, cx + 20, top + 28, cx, top - 1);
    g.fillStyle(0xc4cbe0).fillRect(cuerpo.x, cuerpo.y, cuerpo.w, cuerpo.h);
    g.fillStyle(0xe4e8f2).fillRect(cuerpo.x + 4, cuerpo.y, 6, cuerpo.h); // brillo
    g.fillStyle(0x16325e);
    [70, 110, 150].forEach((y) => g.fillRect(cuerpo.x, top + y, cuerpo.w, 6));
    g.fillRect(cuerpo.x, top + 40, 8, 26).fillRect(cx + 8, top + 120, 8, 26);
    g.fillStyle(0xcf3a2a).fillTriangle(cx - 16, top + 30, cx + 16, top + 30, cx, top + 4);
    g.lineStyle(2, 0x112021).lineBetween(cx, top + 4, cx, top - 10);
    g.fillStyle(0xcf3a2a).fillTriangle(cx - 16, suelo - 26, cx - 16, suelo, cx - 28, suelo)
      .fillTriangle(cx + 16, suelo - 26, cx + 16, suelo, cx + 28, suelo);
    cont.add(g);
    this.personaje(cont, 440, pasto);
  },

  // Campo de entrenamiento con las piezas del equipo repartidas
  campo(cont, w, h) {
    const suelo = this.fondoCampo(cont, w, h);
    this.personaje(cont, 230, suelo);
    NIVEL_1.objetos.forEach((key, i) => {
      const x = 420 + i * 105;
      const y = suelo - 24 - (i % 2) * 30;
      const pieza = this.add.image(x, y, `objeto-${key}`).setScale(ITEMS.scale * COMIC_UI.escala);
      const duda = this.add.text(x + 16, y - 24, '?', {
        fontFamily: COMIC_UI.font, fontSize: '24px', fontStyle: '800', color: '#f2fbff', stroke: '#112021', strokeThickness: 5,
      }).setOrigin(0.5);
      cont.add([pieza, duda]);
      this.enBucle(this.tweens.add({
        targets: [pieza, duda], y: '-=8', duration: 800 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }));
    });
  },

  // Cajas rompibles, un robot y un dron con piezas
  enemigos(cont, w, h) {
    const suelo = this.fondoCampo(cont, w, h);
    const bloque = GROUND_SCALE * COMIC_UI.escala; // cajas y enemigos van al triple en el juego, como el suelo
    const pieza = ITEMS.scale * COMIC_UI.escala;
    cont.add([
      this.add.image(70, suelo, 'caja-rompible').setOrigin(0.5, 1).setScale(bloque),
      this.add.image(70, suelo - 16 * bloque, 'caja-rompible').setOrigin(0.5, 1).setScale(bloque),
      this.add.image(100, suelo - 14, 'objeto-pantalon').setScale(pieza).setAngle(20),
    ]);
    const robot = this.add.sprite(230, suelo, 'robot').setOrigin(0.5, 1).setScale(bloque).play('robot-walk');
    const casco = this.add.image(230, suelo - 16 * bloque - 14, 'objeto-casco').setScale(pieza);
    const dron = this.add.sprite(360, 110, 'dron').setScale(bloque).play('dron-fly');
    const casaca = this.add.image(360, 140, 'objeto-casaca').setScale(pieza);
    cont.add([robot, casco, dron, casaca]);
    this.enBucle(this.tweens.add({ targets: [dron, casaca], y: '-=14', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    this.enBucle(this.tweens.add({
      targets: [robot, casco], x: '-=30', duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onYoyo: () => robot.toggleFlipX(), onRepeat: () => robot.toggleFlipX(),
    }));
  },

  // Resumen de la misión con las piezas y los controles
  mision(cont, w, h, v) {
    const { font, colores: c } = COMIC_UI;
    const m = v.mision;
    const g = this.add.graphics();
    g.fillStyle(0x0e2038).fillRect(0, 0, w, h);
    // Líneas de velocidad desde el centro
    g.lineStyle(2, 0x1b3356);
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
      g.lineBetween(w / 2 + Math.cos(a) * 60, h / 2 + Math.sin(a) * 60, w / 2 + Math.cos(a) * 400, h / 2 + Math.sin(a) * 400);
    }
    const titulo = this.add.text(w / 2, 16, m.titulo, {
      fontFamily: font, fontSize: '30px', fontStyle: '800', color: c.dorado, stroke: '#112021', strokeThickness: 6,
    }).setOrigin(0.5, 0);
    const texto = this.add.text(w / 2, 62, this.rellenar(m.texto), {
      fontFamily: font, fontSize: '15px', fontStyle: '700', color: '#f2fbff', align: 'center', lineSpacing: 3, wordWrap: { width: w - 40 },
    }).setOrigin(0.5, 0);
    cont.add([g, titulo, texto]);
    const piezas = NIVEL_1.objetos;
    piezas.forEach((key, i) => {
      cont.add(this.add.image(w / 2 + (i - (piezas.length - 1) / 2) * 52, 148, `objeto-${key}`).setScale(2.5));
    });
    cont.add(this.add.text(w / 2, 190, m.controles, {
      fontFamily: font, fontSize: '12px', fontStyle: '700', color: '#c4cbe0', align: 'center', wordWrap: { width: w - 30 },
    }).setOrigin(0.5, 0));
  },
};

// Botón final, como el de las pantallas de historia
ComicScene.prototype.crearBoton = function crearBoton() {
  const { width, height } = this.scale;
  const texto = this.add.text(0, 0, `${this.rellenar(COMIC.boton)} ▶`, {
    fontFamily: COMIC_UI.font, fontSize: '15px', fontStyle: '800', color: '#112021',
  }).setOrigin(0.5);
  const w = texto.width + 40;
  const h = 24;
  const g = this.add.graphics();
  const dibujar = (relleno) => {
    g.clear();
    g.fillStyle(0x000000, 0.4).fillRect(-w / 2 + 4, -h / 2 + 4, w, h);
    g.fillStyle(COMIC_UI.colores.tinta).fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle(relleno).fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
  };
  dibujar(0xf3c623);
  const boton = this.guardar(this.add.container(width - 20 - w / 2, height - 15, [g, texto]));
  boton.setSize(w, h).setInteractive({ useHandCursor: true });
  boton.on('pointerover', () => dibujar(0xf3fb3e));
  boton.on('pointerout', () => dibujar(0xf3c623));
  boton.on('pointerdown', () => this.terminar());
  boton.setAlpha(0);
  this.tweens.add({ targets: boton, alpha: 1, duration: 400, delay: 600 });
};
