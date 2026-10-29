// Textos de las pantallas de historia (js/scenes/HistoriaScene.js). Ahora no se usan: el Nivel 1 empieza con el cómic (js/comic.js).
// Cada pantalla tiene un título, un subtítulo, tres tarjetas (fecha + texto breve), la misión del nivel
// y el texto del botón. Datos históricos de la misión Apolo 11 (NASA, 1969).
const HISTORIA = {
  1: {
    titulo: 'NIVEL 1 · PREPARATIVOS',
    subtitulo: 'LA CARRERA ESPACIAL',
    tarjetas: [
      {
        fecha: '1957 · 1961',
        titulo: 'La carrera espacial',
        texto: 'Después de la Segunda Guerra Mundial, Estados Unidos y la Unión Soviética compiten por llegar más lejos en el espacio. La URSS lanza el Sputnik 1 (1957) y envía a Yuri Gagarin, el primer ser humano en el espacio (1961).',
      },
      {
        fecha: '25 DE MAYO DE 1961',
        titulo: 'Un reto para la década',
        texto: 'El presidente John F. Kennedy anuncia ante el Congreso que Estados Unidos se propone llevar a un hombre a la Luna y traerlo sano y salvo de vuelta a la Tierra antes de que termine la década.',
      },
      {
        fecha: '1961 · 1969',
        titulo: 'Ocho años de preparativos',
        texto: 'Los programas Mercury y Gemini enseñan a vivir y a trabajar en el espacio, y se construye el gigantesco cohete Saturno V. La tripulación del Apolo 11, Armstrong, Aldrin y Collins, entrena con simuladores y trajes espaciales.',
      },
    ],
    mision: 'TU MISIÓN: recolecta todas las piezas del equipo del astronauta. Rompe cajas y vence a los robots y drones para conseguirlas.',
    boton: 'COMENZAR NIVEL 1',
    siguiente: { escena: 'Game', datos: { nivel: 1 } },
    musica: 'menu',
  },
};
