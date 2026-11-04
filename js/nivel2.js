// Diseño del Nivel 2 · Rumbo a la Luna (ver js/scenes/Nivel2Scene.js).
// El tripulante pilota la nave del Apolo 11 desde la Tierra hasta la Luna. Por el camino vienen asteroides:
// hay que esquivarlos o destruirlos a disparos. La Luna crece al fondo a medida que se acerca.
// El espacio se dibuja en 3D con Three.js; las medidas de posición y tamaño están en unidades de Three.js
// (la nave mide unas 3 unidades de largo).
const NIVEL_2 = {
  numero: 2,
  nombre: 'RUMBO A LA LUNA',
  objetivo: 'Pilota la nave del Apolo 11 hasta la Luna. Esquiva o destruye los asteroides: los grandes necesitan dos disparos.',
  musica: 'nivel',

  distanciaKm: 384400, // de la Tierra a la Luna
  duracion: 110,       // segundos que dura el viaje
  cuentaAtras: 3,      // 3, 2, 1... ¡DESPEGUE!

  // Vida: la barra tiene HEALTH.max puntos (los mismos que en el Nivel 1) y hay HEALTH.vidas vidas.
  // Cada choque quita estos puntos de vida
  danio: { pequeno: 2, grande: 3 },
  invulnerable: 1.6,   // segundos que la nave parpadea (y no recibe daño) después de un choque

  nave: {
    velocidad: 13,     // velocidad máxima al moverse
    radio: 0.75,       // tamaño de la nave para los choques
    cadencia: 0.16,    // segundos entre dos disparos (manteniendo la tecla)
    velocidadDisparo: 70,
  },

  asteroides: {
    probGrande: 0.3,                 // probabilidad de que salga uno grande (aguanta 2 disparos)
    cadaInicio: 1.1,                 // segundos entre asteroides al despegar...
    cadaFinal: 0.38,                 // ...y cerca de la Luna (cada vez salen más)
    velocidad: [14, 22],             // velocidad al acercarse (mínima y máxima)
    aumentoVelocidad: 0.45,          // al final van un 45 % más rápido
    dejanDeSalir: 0.96,              // al 96 % del viaje ya no salen más (llegada tranquila)
  },

  puntos: { pequeno: 10, grande: 25 },

  // Tanques de oxígeno: flotan hacia la nave y recuperan vida al tocarlos
  oxigeno: { cada: 15, cura: 2 },
};

NIVELES[2] = NIVEL_2;
