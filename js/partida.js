// Datos de la partida en curso (solo en memoria; los datos del jugador 1 se guardan en Voz.ajustes).
//   jugadores: 1 o 2 (se elige en la portada). Con 2, la pantalla del juego se divide en dos: arriba el
//              jugador 1 y abajo el jugador 2.
//   modo:      'local' (los dos en el mismo teclado) u 'online' (cada uno en su ordenador, ver js/red.js).
//              En online, el jugador 1 es siempre el de este ordenador y el 2 su compañero.
//   jugador2:  { nombre, dni, sexo } del segundo tripulante (en local se rellena en la pantalla de
//              identificación; en online llega por la red)
const Partida = {
  jugadores: 1,
  modo: 'local',
  jugador2: null,
};
