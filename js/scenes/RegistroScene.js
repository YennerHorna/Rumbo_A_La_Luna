// Pantalla de identificación del tripulante: aparece al iniciar el juego, entre la portada y la historia del Nivel 1.
// El jugador rellena su "documento" (nombre, DNI y sexo según el DNI) y se identifica por voz:
// dice su nombre, el juego lo reconoce y le responde repitiéndolo con voz de hombre (M = masculino) o de mujer (F = femenino).
// El personaje del juego (femenino o masculino) sale del sexo del DNI. Los ajustes de voz y sonido están en otro panel aparte (engranaje).
// Con 2 jugadores en el mismo ordenador la pantalla sale dos veces: { jugador: 1 } y luego { jugador: 2 }.
// En online cada uno se identifica en su ordenador y sus datos se mandan al compañero (js/red.js).
const REGISTRO = {
  saludo: { M: 'Bienvenido a bordo', F: 'Bienvenida a bordo' },
  // Debajo del título, con 2 jugadores: en qué mitad de la pantalla juega cada uno y con qué teclas
  jugadores: {
    1: 'Jugador 1 · pantalla de arriba · se mueve con A / D, salta con W y golpea con F',
    2: 'Jugador 2 · pantalla de abajo · se mueve con las flechas, salta con ↑ y golpea con M',
  },
  // Personaje que saldrá en el juego (F = femenino, M = masculino) según el sexo del DNI.
  // Su dibujo es el primer fotograma del sprite sheet.
  personajes: {
    F: { nombre: 'Femenino', imagen: PERSONAJE.variantes.F.file },
    M: { nombre: 'Masculino', imagen: PERSONAJE.variantes.M.file },
  },
};

class RegistroScene extends Phaser.Scene {
  constructor() {
    super('Registro');
  }

  init(data) {
    this.jugador = (data && data.jugador) || 1;
    this.dosJugadores = Partida.jugadores === 2 && Partida.modo === 'local';
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
    Sonido.musica('menu'); // si ya suena desde la portada, no se repite

    this.crearFormulario();
    this.events.once('shutdown', () => {
      Voz.detener();
      this.dom.remove();
    });
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  crearFormulario() {
    // El jugador 1 usa los datos guardados en Voz.ajustes; el 2, los que dejó la última vez (si los hay)
    const a = this.jugador === 1 ? Voz.ajustes : (Voz.ajustes.jugador2 || { nombre: '', dni: '', sexo: '' });
    const registrado = this.jugador === 1 ? a.registrado : Boolean(a.sexo);
    this.dom = document.createElement('div');
    this.dom.className = 'registro';
    this.dom.innerHTML = `
      <h1 class="registro-titulo">Identificación del tripulante${this.dosJugadores ? ` ${this.jugador}` : ''}</h1>
      ${this.dosJugadores ? `<p class="registro-jugador">${REGISTRO.jugadores[this.jugador]}</p>` : ''}

      <form id="carnet" class="carnet" novalidate autocomplete="off">
        <div class="carnet-banda">
          <span>Rumbo a la Luna</span>
          <span>Documento de tripulante</span>
        </div>
        <div class="carnet-cuerpo">
          <div class="carnet-foto">
            <img class="carnet-casco" src="assets/images/objetos/casco.png" alt="">
            <div class="carnet-personaje" role="img" aria-label="Personaje del tripulante" hidden></div>
          </div>
          <div class="carnet-datos">
            <label>Nombre
              <input name="nombre" type="text" maxlength="24" placeholder="Tu nombre" required aria-required="true">
            </label>
            <label>Nº DNI
              <input name="dni" type="text" maxlength="12" placeholder="12345678" required aria-required="true">
            </label>
            <fieldset class="carnet-sexo">
              <legend>Sexo según DNI</legend>
              <label title="Masculino"><input type="radio" name="sexo" value="M"><span>M</span></label>
              <label title="Femenino"><input type="radio" name="sexo" value="F"><span>F</span></label>
            </fieldset>
          </div>
        </div>
        <p class="carnet-mrz" aria-hidden="true"></p>
      </form>

      <section class="registro-voz" aria-label="Identificación por voz">
        <button type="button" class="registro-micro" aria-pressed="false">
          <img src="assets/images/ui/icono-microfono.png" alt="">
          <span>Pulsa y di tu nombre</span>
        </button>
        <p class="registro-estado" role="status" aria-live="polite">
          El astronauta repetirá lo que digas con voz de hombre o de mujer según tu DNI.
        </p>
      </section>

      <p class="registro-error" role="alert"></p>
      <button type="submit" form="carnet" class="registro-continuar">Continuar ▶</button>`;
    document.body.appendChild(this.dom);

    const form = this.dom.querySelector('form');
    this.form = form;
    form.nombre.value = a.nombre;
    form.dni.value = a.dni;
    // La primera vez no se marca ningún sexo: tiene que elegirlo el jugador
    if (registrado) form.sexo.value = a.sexo;
    this.actualizarMrz();
    this.actualizarPersonaje();

    form.addEventListener('input', () => {
      this.actualizarMrz();
      this.actualizarPersonaje();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.continuar();
    });
    this.dom.querySelector('.registro-micro').addEventListener('click', () => this.identificarVoz());
    (registrado ? this.dom.querySelector('.registro-continuar') : form.nombre).focus();
  }

  // Línea de lectura mecánica del documento, como la de los DNI de verdad
  actualizarMrz() {
    const limpiar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
      .replace(/[^A-Z0-9]+/g, '<');
    const { nombre, dni, sexo } = this.form;
    const linea = `IDLUN<${limpiar(dni.value) || '<<<<<<<<'}<${sexo.value || '<'}<${limpiar(nombre.value)}`;
    this.dom.querySelector('.carnet-mrz').textContent = linea.padEnd(36, '<').slice(0, 36);
  }

  // Muestra en el carnet el personaje que corresponde al sexo del DNI, con su primer fotograma
  actualizarPersonaje() {
    const eleccion = this.form.sexo.value;
    const foto = this.dom.querySelector('.carnet-personaje');
    const casco = this.dom.querySelector('.carnet-casco');
    const datos = REGISTRO.personajes[eleccion];
    foto.hidden = !datos;
    casco.hidden = Boolean(datos);
    if (!datos) return;
    foto.style.backgroundImage = `url("${datos.imagen}")`;
    this.error('');
  }

  estado(texto, tipo = '') {
    const p = this.dom.querySelector('.registro-estado');
    p.textContent = texto;
    p.dataset.tipo = tipo;
  }

  error(texto) {
    this.dom.querySelector('.registro-error').textContent = texto;
  }

  // Escucha al jugador y le responde repitiendo lo que dijo, con la voz de su sexo
  identificarVoz() {
    const boton = this.dom.querySelector('.registro-micro');
    if (Voz.escuchando) {
      Voz.detener();
      return;
    }
    const sexo = this.form.sexo.value;
    if (!sexo) {
      this.error('Elige primero el sexo que figura en tu DNI (M o F).');
      return;
    }
    this.error('');
    const marcar = (on) => {
      boton.classList.toggle('escuchando', on);
      boton.setAttribute('aria-pressed', String(on));
      boton.querySelector('span').textContent = on ? 'Escuchando...' : 'Pulsa y di tu nombre';
    };
    const ok = Voz.escuchar({
      onParcial: (t) => this.estado(`Escuchando: "${t}"`),
      onFinal: (t) => {
        // Si aún no había nombre, se toma el que ha dicho
        if (!this.form.nombre.value.trim()) {
          this.form.nombre.value = t.charAt(0).toUpperCase() + t.slice(1, 24);
          this.actualizarMrz();
        }
        this.estado(`✔ Voz identificada: "${t}"`, 'ok');
        const nombre = this.form.nombre.value.trim();
        Voz.hablar(`${t}. ${REGISTRO.saludo[sexo]}${nombre ? `, ${nombre}` : ''}.`, { con: { ...Voz.ajustes, sexo } });
      },
      onError: (codigo) => this.estado(Voz.mensajeError(codigo), 'error'),
      onFin: () => marcar(false),
    });
    if (ok) {
      marcar(true);
      this.estado('Escuchando... di tu nombre.');
    }
  }

  continuar() {
    const { nombre, dni, sexo } = this.form;
    // Nombre y DNI son obligatorios; se revisan en el orden en que aparecen en el carnet
    if (!nombre.value.trim()) {
      this.error('Escribe tu nombre.');
      nombre.focus();
      return;
    }
    const comprobado = Voz.validarDni(dni.value);
    if (!comprobado.ok) {
      this.error(comprobado.mensaje);
      dni.focus();
      return;
    }
    if (!sexo.value) {
      this.error('Elige el sexo que figura en tu DNI (M o F).');
      return;
    }
    const datos = { nombre: nombre.value.trim(), dni: comprobado.valor, sexo: sexo.value };
    if (this.jugador === 1) {
      Voz.guardar({ ...datos, personaje: sexo.value, registrado: true });
      if (Partida.modo === 'online') Red.enviar({ t: 'datos', nombre: datos.nombre, sexo: datos.sexo });
    } else {
      Partida.jugador2 = datos;
      Voz.guardar({ jugador2: datos }); // para rellenar el carnet la próxima vez
    }
    // Con 2 jugadores, después del primero se identifica el segundo
    const siguiente = this.dosJugadores && this.jugador === 1 ? ['Registro', { jugador: 2 }] : ['Comic'];
    Sonido.efecto('clic');
    Voz.detener();
    this.dom.querySelector('.registro-continuar').disabled = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.dom.classList.add('saliendo'); // el HTML no se funde con la cámara: lo hace el CSS
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(...siguiente));
  }
}
