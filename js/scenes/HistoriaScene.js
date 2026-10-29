// Pantalla de historia con una introducción breve sobre la misión Apolo 11. Los textos están en js/historia.js.
//   scene.start('Historia', { nivel: 1 })     historia del Nivel 1 (ahora sustituida por el cómic)
// Las tarjetas aparecen una a una; ENTER, ESPACIO o un clic las muestra todas de golpe, y después
// ENTER o el botón empiezan el nivel.
const HISTORIA_UI = {
  font: '"Rubik", sans-serif',
  colores: { texto: '#f2fbff', suave: '#c4cbe0', dorado: '#f3c623', azul: 0x3b6fd0, panel: 0x0e2038, contorno: 0x112021 },
  tarjeta: { w: 290, h: 262, y: 130, hueco: 15 },
  entrada: { primera: 400, entre: 900 }, // ms hasta la primera tarjeta y entre una y otra
};

class HistoriaScene extends Phaser.Scene {
  constructor() {
    super('Historia');
  }

  init(data) {
    this.clave = data && data.nivel !== undefined ? data.nivel : 1;
    this.datos = HISTORIA[this.clave] || HISTORIA[1];
  }

  preload() {
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
  }

  create() {
    const { width, height } = this.scale;
    const d = this.datos;
    const ui = HISTORIA_UI;
    this.listo = false;
    this.saliendo = false;
    this.entradas = [];

    Sonido.musica(d.musica); // sigue la música del menú; si ya suena, no se repite
    Espacio.fondoFijo(this);
    this.add.rectangle(0, 0, width, height, 0x03040a, 0.35).setOrigin(0, 0);
    botonAjustes(this, width - 34, 34);

    const texto = (x, y, str, size, color, extra = {}) => this.add.text(x, y, str, {
      fontFamily: ui.font, fontSize: `${size}px`, color, align: 'center', ...extra,
    }).setOrigin(0.5, 0);

    texto(width / 2, 30, d.titulo, 38, ui.colores.texto, { fontStyle: '800' }).setShadow(4, 4, '#3b6fd0', 0, false, true);
    texto(width / 2, 82, d.subtitulo, 18, ui.colores.dorado, { fontStyle: '700' }).setShadow(2, 2, '#000000', 0, false, true);

    this.crearTarjetas(width);

    this.mision = texto(width / 2, 405, d.mision, 17, ui.colores.texto, {
      fontStyle: '700', wordWrap: { width: 820 }, lineSpacing: 3,
    }).setShadow(2, 2, '#000000', 0, false, true).setAlpha(0);
    this.crearBoton(width / 2, 488, d.boton);

    // Aparición escalonada de las tarjetas, la misión y el botón
    this.entradas.forEach((entrada, i) => {
      entrada.cita = this.time.delayedCall(ui.entrada.primera + i * ui.entrada.entre, () => this.mostrar(entrada));
    });

    this.input.keyboard.on('keydown-ENTER', () => this.accion());
    this.input.keyboard.on('keydown-SPACE', () => this.accion());
    this.input.on('pointerdown', (pointer, sobre) => {
      if (!sobre.length) this.accion();
    });
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  // Tres tarjetas con el estilo de los paneles del juego: marco oscuro, borde azul y fecha en dorado
  crearTarjetas(width) {
    const { tarjeta: t, colores: c, font } = HISTORIA_UI;
    const total = this.datos.tarjetas.length * t.w + (this.datos.tarjetas.length - 1) * t.hueco;
    const x0 = (width - total) / 2;

    this.datos.tarjetas.forEach((info, i) => {
      const x = x0 + i * (t.w + t.hueco);
      const caja = this.add.container(x, t.y);
      const g = this.add.graphics();
      g.fillStyle(c.contorno).fillRect(-4, -4, t.w + 8, t.h + 8);
      g.fillStyle(c.azul).fillRect(-2, -2, t.w + 4, t.h + 4);
      g.fillStyle(c.panel, 0.95).fillRect(0, 0, t.w, t.h);
      g.fillStyle(0x1b3356).fillRect(0, 0, t.w, 30);

      const fecha = this.add.text(t.w / 2, 15, info.fecha, {
        fontFamily: font, fontSize: '14px', fontStyle: '700', color: c.dorado,
      }).setOrigin(0.5);
      const titulo = this.add.text(t.w / 2, 42, info.titulo, {
        fontFamily: font, fontSize: '20px', fontStyle: '800', color: c.texto, align: 'center', wordWrap: { width: t.w - 28 },
      }).setOrigin(0.5, 0);
      const cuerpo = this.add.text(16, 76, info.texto, {
        fontFamily: font, fontSize: '15px', color: c.suave, lineSpacing: 4, wordWrap: { width: t.w - 32 },
      });
      caja.add([g, fecha, titulo, cuerpo]).setAlpha(0);
      this.entradas.push({ objetos: [caja], y: t.y });
    });
  }

  crearBoton(x, y, etiqueta) {
    const { colores: c, font } = HISTORIA_UI;
    const texto = this.add.text(0, 0, `${etiqueta} ▶`, {
      fontFamily: font, fontSize: '24px', fontStyle: '800', color: '#112021',
    }).setOrigin(0.5);
    const w = texto.width + 64;
    const h = 52;
    const g = this.add.graphics();
    const dibujar = (relleno) => {
      g.clear();
      g.fillStyle(0x000000, 0.5).fillRect(-w / 2 + 5, -h / 2 + 5, w, h);
      g.fillStyle(c.contorno).fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle(relleno).fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
      g.fillStyle(0x000000, 0.2).fillRect(-w / 2 + 4, h / 2 - 12, w - 8, 8);
    };
    dibujar(0xf3c623);

    this.boton = this.add.container(x, y, [g, texto]).setAlpha(0);
    this.boton.setSize(w, h).setInteractive({ useHandCursor: true });
    this.boton.on('pointerover', () => { if (this.listo) dibujar(0xf3fb3e); });
    this.boton.on('pointerout', () => dibujar(0xf3c623));
    this.boton.on('pointerdown', () => this.accion());
    this.tweens.add({ targets: this.boton, scale: 1.05, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // La misión y el botón son las dos últimas "entradas"
    this.entradas.push({ objetos: [this.mision], y: this.mision.y });
    this.entradas.push({ objetos: [this.boton], y: y, ultimo: true });
  }

  mostrar(entrada) {
    if (entrada.visible) return;
    entrada.visible = true;
    entrada.objetos.forEach((o) => {
      const final = o.y;
      o.y = final + 14;
      this.tweens.add({ targets: o, alpha: 1, y: final, duration: 450, ease: 'Quad.easeOut' });
    });
    if (entrada.ultimo) this.listo = true;
  }

  // Primera vez: muestra todo de golpe. Con todo visible: empieza el nivel
  accion() {
    if (this.saliendo || PanelAjustes.abierto || PanelAjustes.recienCerrado) return;
    if (!this.listo) {
      this.entradas.forEach((e) => { if (e.cita) e.cita.remove(); this.mostrar(e); });
      return;
    }
    this.comenzar();
  }

  comenzar() {
    this.saliendo = true;
    Sonido.efecto('clic');
    const { escena, datos } = this.datos.siguiente;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(escena, datos));
  }
}
