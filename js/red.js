// Conexión online entre dos jugadores con PeerJS (WebRTC): los dos navegadores se conectan directamente.
// PeerJS usa su servidor público gratuito solo para que se encuentren; no hace falta servidor propio.
//
//   Red.crearSala({ alCodigo, alConectar, alError })  crea una sala; alCodigo recibe el código de 4 cifras
//   Red.unirse(codigo, { alConectar, alError })        se une a la sala de ese código
//   Red.enviar({ t: 'tipo', ... })                     manda un mensaje al compañero
//   Red.on('tipo', fn) / Red.off('tipo')               qué hacer al recibir cada tipo de mensaje
//   Red.cerrar()                                       corta la conexión
//
// Los mensajes que llegan antes de que alguien los escuche se guardan y se entregan al hacer Red.on
// (salvo 'pos', las posiciones, que caducan enseguida). Al cortarse la conexión llega { t: 'desconectado' }.
const Red = (() => {
  const PREFIJO = 'rumbo-a-la-luna-sala-'; // el código de sala va detrás
  let peer = null;
  let conn = null;
  let anfitrion = false;
  const manejadores = {};
  const pendientes = [];

  function recibir(msg) {
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
    c.on('open', () => alConectar());
    c.on('data', recibir);
    c.on('close', () => {
      if (conn === c) recibir({ t: 'desconectado' });
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
    if (c) c.close();
    if (peer) peer.destroy();
    peer = null;
    pendientes.length = 0;
  }

  return {
    crearSala,
    unirse,
    enviar,
    on,
    off,
    cerrar,
    get esAnfitrion() { return anfitrion; },
    get conectado() { return Boolean(conn && conn.open); },
  };
})();
