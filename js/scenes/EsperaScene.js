// Sala de espera online: entre el cómic y el Nivel 1. Cada uno avisa de que está listo; cuando el anfitrión
// tiene los datos del compañero y los dos están listos, reparte las piezas de los dos y empiezan a la vez.
//   Mensajes (js/red.js): 'datos' (nombre y sexo del compañero, se mandan al identificarse), 'listo' e
//   'inicio' (el anfitrión manda el reparto de piezas).
const ESPERA = {
  font: '"Rubik", sans-serif',
  textos: {
    titulo: 'ESPERANDO A TU COMPAÑERO',
    esperando: (nombre) => `${nombre ? nombre.toUpperCase() : 'Tu compañero'} aún está preparándose...`,
    desconectado: 'Volviendo al inicio...',
  },
};

class EsperaScene extends Phaser.Scene {
  constructor() {
    super('Espera');
  }

  preload() {
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
  }

  create() {
    const { width, height } = this.scale;
    this.otroListo = false;
    this.saliendo = false;
    Espacio.fondoFijo(this);
    this.add.rectangle(0, 0, width, height, 0x03040a, 0.35).setOrigin(0, 0);
    botonAjustes(this, width - 34, 34);

    const estilo = (size, color, extra = {}) => ({ fontFamily: ESPERA.font, fontSize: `${size}px`, color, align: 'center', ...extra });
    this.add.text(width / 2, height / 2 - 50, ESPERA.textos.titulo, estilo(34, '#f2fbff', { fontStyle: '800' }))
      .setOrigin(0.5).setShadow(4, 4, '#3b6fd0', 0, false, true);
    this.estado = this.add.text(width / 2, height / 2 + 10, '', estilo(18, '#f3c623', { fontStyle: '700' })).setOrigin(0.5);
    // Tres puntos que se encienden por turnos
    this.puntos = [-1, 0, 1].map((i) => this.add.rectangle(width / 2 + i * 24, height / 2 + 60, 12, 12, 0xf2fbff));
    this.puntos.forEach((punto, i) => this.tweens.add({
      targets: punto, alpha: 0.2, duration: 400, delay: i * 200, yoyo: true, repeat: -1,
    }));
    this.mostrarEstado();

    Red.on('datos', ({ nombre, sexo }) => {
      Partida.jugador2 = { nombre, dni: '', sexo };
      this.mostrarEstado();
      this.revisar();
    });
    Red.on('listo', () => {
      this.otroListo = true;
      this.revisar();
    });
    Red.on('inicio', ({ reparto }) => this.empezar(reparto));
    Red.on('desconectado', () => this.desconectado());
    this.events.once('shutdown', () => ['datos', 'listo', 'inicio', 'desconectado'].forEach((t) => Red.off(t)));

    if (!Red.conectado) {
      this.desconectado();
      return;
    }
    Red.enviar({ t: 'listo' });
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  mostrarEstado() {
    this.estado.setText(ESPERA.textos.esperando(Partida.jugador2 && Partida.jugador2.nombre));
  }

  // Solo el anfitrión da la salida: reparte las piezas de los dos y se las manda al compañero
  revisar() {
    if (!Red.esAnfitrion || !this.otroListo || !Partida.jugador2) return;
    const reparto = exportarReparto(repartirPiezas(NIVEL_1, 2));
    Red.enviar({ t: 'inicio', reparto });
    this.empezar(reparto);
  }

  empezar(reparto) {
    if (this.saliendo) return;
    this.saliendo = true;
    Sonido.efecto('logro');
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { nivel: 1, reparto }));
  }

  desconectado() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.estado.setText(ESPERA.textos.desconectado).setColor('#f08a3c');
    this.time.delayedCall(2500, () => this.scene.start('Title'));
  }
}
