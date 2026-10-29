// Conexión online entre dos jugadores con PeerJS (WebRTC): los dos navegadores se conectan directamente.
// PeerJS usa su servidor público gratuito solo para que se encuentren; no hace falta servidor propio.
//
//   Red.crearSala({ alCodigo, alConectar, alError })  crea una sala; alCodigo recibe el código de 4 cifras
//   Red.unirse(codigo, { alConectar, alError })        se une a la sala de ese código
//   Red.enviar({ t: 'tipo', ... })                     manda un mensaje al compañero
//   Red.on('tipo', fn) / Red.off('tipo')               qué hacer al recibir cada tipo de mensaje
//   Red.salir()                                        avisa al compañero de que se va y corta la conexión
//   Red.cerrar()                                       corta la conexión sin avisar
//   Red.silenciar()                                    no avisar de la desconexión (al terminar el nivel juntos)
//
// Los mensajes que llegan antes de que alguien los escuche se guardan y se entregan al hacer Red.on
// (salvo 'pos', las posiciones, que caducan enseguida). Al cortarse la conexión llega
// { t: 'desconectado', motivo: 'salio' | 'conexion' } y aparece un aviso arriba, en cualquier pantalla:
//   'salio':    el compañero salió de la sala (volvió al inicio o cerró el juego)
//   'conexion': se perdió la conexión (no llega nada suyo desde hace RED.sinRespuesta ms)
const RED = {
  latido: 2000,        // cada cuánto se manda un "sigo aquí" (ms)
  sinRespuesta: 7000,  // sin noticias del compañero durante este tiempo = conexión perdida (ms)
  avisoDura: 6000,     // ms que se ve el aviso de desconexión
  textos: {
    salio: (nombre) => `${nombre} salió de la sala.`,
    conexion: (nombre) => `${nombre} perdió la conexión.`,
  },
};

const Red = (() => {
  const PREFIJO = 'rumbo-a-la-luna-sala-'; // el código de sala va detrás
  let peer = null;
  let conn = null;
  let anfitrion = false;
  let silencio = false;
  let ultimoMensaje = 0;
  let reloj = null;
  const manejadores = {};
  const pendientes = [];

  // Aviso arriba en el centro, por encima del juego, sea cual sea la pantalla
  function mostrarAviso(texto) {
    const viejo = document.querySelector('.red-aviso');
    if (viejo) viejo.remove();
    const aviso = document.createElement('div');
    aviso.className = 'red-aviso';
    aviso.setAttribute('role', 'alert');
    aviso.textContent = texto;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.classList.add('saliendo'), RED.avisoDura);
    setTimeout(() => aviso.remove(), RED.avisoDura + 600);
  }

  // Se acabó la conexión con el compañero: se avisa y se cuenta a la pantalla que esté escuchando
  function perdido(motivo) {
    const c = conn;
    if (!c) return;
    conn = null;
    clearInterval(reloj);
    c.close();
    if (!silencio) {
      const nombre = (Partida.jugador2 && Partida.jugador2.nombre) || 'Tu compañero';
      mostrarAviso(RED.textos[motivo](nombre));
    }
    recibir({ t: 'desconectado', motivo });
  }

  function recibir(msg) {
    if (msg.t === 'latido') return;
    if (msg.t === 'adios') {
      perdido('salio');
      return;
    }
    const fn = manejadores[msg.t];
    if (fn) fn(msg);
    else if (msg.t !== 'pos') pendientes.push(msg);
  }

  function on(tipo, fn) {
    manejadores[tipo] = fn;
    for (let i = 0; i < pendientes.length;) {
      if (pendientes[i].t === tipo) fn(pendientes.splice(i, 1)[0]);
      else i += 1;
    }
  }

  function off(tipo) {
    delete manejadores[tipo];
  }

  function mensajeError(e) {
    const textos = {
      'peer-unavailable': 'No hay ninguna sala con ese código.',
      network: 'No se pudo conectar. Revisa tu conexión a internet.',
      'server-error': 'El servidor de conexión no responde. Inténtalo en un momento.',
      'browser-incompatible': 'Este navegador no permite jugar online.',
    };
    return textos[e.type] || `Error de conexión (${e.type}).`;
  }

  function prepararConexion(c, alConectar) {
    conn = c;
    silencio = false;
    c.on('open', () => {
      // Latido: si el compañero deja de dar señales, se da la conexión por perdida
      ultimoMensaje = Date.now();
      clearInterval(reloj);
      reloj = setInterval(() => {
        enviar({ t: 'latido' });
        if (Date.now() - ultimoMensaje > RED.sinRespuesta) perdido('conexion');
      }, RED.latido);
      alConectar();
    });
    c.on('data', (msg) => {
      ultimoMensaje = Date.now();
      recibir(msg);
    });
    // Se cerró sin despedirse: se cayó la conexión (o cerró la pestaña sin que llegara el aviso)
    c.on('close', () => {
      if (conn === c) perdido('conexion');
    });
  }

  function crearSala({ alCodigo, alConectar, alError }) {
    cerrar();
    anfitrion = true;
    const codigo = String(Phaser.Math.Between(1000, 9999));
    peer = new Peer(PREFIJO + codigo);
    peer.on('open', () => alCodigo(codigo));
    peer.on('connection', (c) => {
      if (conn) {
        c.on('open', () => c.close()); // la sala ya está llena
        return;
      }
      prepararConexion(c, alConectar);
    });
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id') crearSala({ alCodigo, alConectar, alError }); // código ocupado: otro
      else alError(mensajeError(e));
    });
  }

  function unirse(codigo, { alConectar, alError }) {
    cerrar();
    anfitrion = false;
    peer = new Peer();
    peer.on('open', () => prepararConexion(peer.connect(PREFIJO + codigo, { reliable: true }), alConectar));
    peer.on('error', (e) => alError(mensajeError(e)));
  }

  function enviar(msg) {
    if (conn && conn.open) conn.send(msg);
  }

  function cerrar() {
    const c = conn;
    conn = null;
    clearInterval(reloj);
    if (c) c.close();
    if (peer) peer.destroy();
    peer = null;
    pendientes.length = 0;
  }

  // Avisa al compañero de que se va y, un momento después (para que el aviso llegue), corta
  function salir() {
    if (!conn) {
      cerrar();
      return;
    }
    enviar({ t: 'adios' });
    const c = conn;
    conn = null;
    clearInterval(reloj);
    const p = peer;
    peer = null;
    pendientes.length = 0;
    setTimeout(() => {
      c.close();
      if (p) p.destroy();
    }, 300);
  }

  // Al cerrar la pestaña o el navegador también se despide
  window.addEventListener('pagehide', () => enviar({ t: 'adios' }));

  return {
    crearSala,
    unirse,
    enviar,
    on,
    off,
    cerrar,
    salir,
    silenciar: () => { silencio = true; },
    get esAnfitrion() { return anfitrion; },
    get conectado() { return Boolean(conn && conn.open); },
  };
})();
