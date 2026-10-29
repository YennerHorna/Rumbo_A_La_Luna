// Sala online: uno crea una sala y recibe un código de 4 cifras; el otro lo escribe para unirse.
// Cuando los dos están conectados, cada uno pasa a identificarse en su ordenador. La conexión está en js/red.js.
const LOBBY = {
  textos: {
    inicio: 'Uno de los dos crea la sala y le pasa el código al otro.',
    creando: 'Creando la sala...',
    esperando: 'Sala creada. Pásale el código a tu compañero y espera a que se una.',
    uniendo: 'Conectando con la sala...',
    conectado: '¡Conectados! Ahora cada uno se identifica en su ordenador.',
    codigoMal: 'Escribe el código de 4 cifras que te ha pasado tu compañero.',
  },
};

class LobbyScene extends Phaser.Scene {
  constructor() {
    super('Lobby');
  }

  preload() {
    this.load.image('fondo-luna', 'assets/images/inicio/fondo-luna.png');
    this.load.image('icono-ajustes', 'assets/images/ui/icono-ajustes.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(0, 0, 'fondo-luna').setOrigin(0, 0).setScale(3);
    this.add.rectangle(0, 0, width, height, 0x03040a, 0.6).setOrigin(0, 0);
    botonAjustes(this, width - 34, 34);
    Sonido.musica('menu');
    this.saliendo = false;

    this.crearPantalla();
    this.events.once('shutdown', () => this.dom.remove());
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  crearPantalla() {
    this.dom = document.createElement('div');
    this.dom.className = 'registro';
    this.dom.innerHTML = `
      <h1 class="registro-titulo">Partida online</h1>
      <section class="lobby">
        <div class="lobby-opcion">
          <h2>Crear sala</h2>
          <p>Te damos un código para tu compañero.</p>
          <button type="button" class="lobby-boton" data-accion="crear">Crear sala</button>
          <p class="lobby-codigo" aria-live="polite"></p>
        </div>
        <form class="lobby-opcion" novalidate autocomplete="off">
          <h2>Unirse</h2>
          <label>Código de la sala
            <input name="codigo" type="text" inputmode="numeric" maxlength="4" placeholder="1234">
          </label>
          <button type="submit" class="lobby-boton">Unirse</button>
        </form>
      </section>
      <p class="registro-estado" role="status" aria-live="polite">${LOBBY.textos.inicio}</p>
      <button type="button" class="lobby-volver">◀ Volver</button>`;
    document.body.appendChild(this.dom);

    const form = this.dom.querySelector('form');
    form.codigo.addEventListener('input', () => {
      form.codigo.value = form.codigo.value.replace(/\D/g, '');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.unirse(form.codigo.value);
    });
    this.dom.querySelector('[data-accion="crear"]').addEventListener('click', () => this.crear());
    this.dom.querySelector('.lobby-volver').addEventListener('click', () => {
      Red.cerrar();
      this.irA('Title');
    });
  }

  estado(texto, tipo = '') {
    const p = this.dom.querySelector('.registro-estado');
    p.textContent = texto;
    p.dataset.tipo = tipo;
  }

  // Desactiva los botones mientras se conecta
  ocupado(on) {
    this.dom.querySelectorAll('.lobby-boton').forEach((b) => { b.disabled = on; });
  }

  crear() {
    Sonido.efecto('clic');
    this.ocupado(true);
    this.estado(LOBBY.textos.creando);
    Red.crearSala({
      alCodigo: (codigo) => {
        this.dom.querySelector('.lobby-codigo').textContent = codigo;
        this.estado(LOBBY.textos.esperando);
      },
      alConectar: () => this.conectado(),
      alError: (mensaje) => this.fallo(mensaje),
    });
  }

  unirse(codigo) {
    if (!/^\d{4}$/.test(codigo)) {
      this.estado(LOBBY.textos.codigoMal, 'error');
      return;
    }
    Sonido.efecto('clic');
    this.ocupado(true);
    this.estado(LOBBY.textos.uniendo);
    Red.unirse(codigo, {
      alConectar: () => this.conectado(),
      alError: (mensaje) => this.fallo(mensaje),
    });
  }

  fallo(mensaje) {
    Red.cerrar();
    this.ocupado(false);
    this.dom.querySelector('.lobby-codigo').textContent = '';
    this.estado(mensaje, 'error');
  }

  conectado() {
    this.estado(LOBBY.textos.conectado, 'ok');
    Sonido.efecto('logro');
    this.time.delayedCall(1200, () => this.irA('Registro', { jugador: 1 }));
  }

  irA(escena, datos) {
    if (this.saliendo) return;
    this.saliendo = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.dom.classList.add('saliendo');
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(escena, datos));
  }
}
