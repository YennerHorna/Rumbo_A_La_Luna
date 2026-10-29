// Sprite sheet del personaje (assets/images/personaje/personaje.png).
// Cada fotograma mide 48x40 px y se dibuja al doble (PLAYER_SCALE). Los pies apoyan en la fila 38.
// Cada fila del sheet es una animación; start/end son los índices de sus fotogramas.
//   frameRate: fotogramas por segundo   repeat: -1 = en bucle, 0 = una sola vez
const PERSONAJE = {
  key: 'personaje',
  file: 'assets/images/personaje/personaje.png',
  // Personaje del juego: F = femenino, M = masculino. No se elige: es el mismo que el sexo del DNI.
  // Los dos sheets tienen exactamente la misma distribución de fotogramas, así que comparten las animaciones.
  // Para usar otro dibujo, sustituye el archivo por uno de 336x640 con los mismos fotogramas.
  variantes: {
    M: { key: 'personaje-m', file: 'assets/images/personaje/personaje.png', nombre: 'Astronauta' },
    F: { key: 'personaje-f', file: 'assets/images/personaje/personaje-f.png', nombre: 'Astronauta' },
  },
  frameWidth: 48,
  frameHeight: 40,
  animaciones: {
    idle:          { start:  0, end:  5, frameRate:  6, repeat: -1 }, // espera
    walk:          { start:  7, end: 13, frameRate: 10, repeat: -1 }, // caminar
    run:           { start: 14, end: 18, frameRate: 12, repeat: -1 }, // correr
    jump:          { start: 21, end: 26, frameRate: 12, repeat:  0 }, // saltar
    fall:          { start: 28, end: 32, frameRate: 10, repeat: -1 }, // caer
    land:          { start: 35, end: 40, frameRate: 14, repeat:  0 }, // aterrizar
    crouch:        { start: 42, end: 46, frameRate: 12, repeat:  0 }, // agacharse
    'crouch-walk': { start: 49, end: 53, frameRate: 10, repeat: -1 }, // agachado caminar
    slide:         { start: 56, end: 59, frameRate: 10, repeat:  0 }, // deslizarse
    climb:         { start: 63, end: 66, frameRate:  8, repeat: -1 }, // escalar
    attack:        { start: 70, end: 75, frameRate: 14, repeat:  0 }, // atacar
    hurt:          { start: 77, end: 79, frameRate: 10, repeat:  0 }, // daño
    death:         { start: 84, end: 87, frameRate:  6, repeat:  0 }, // muerte
    use:           { start: 91, end: 94, frameRate:  8, repeat:  0 }, // usar / interactuar
    push:          { start: 98, end: 99, frameRate:  4, repeat: -1 }, // empujar
    pull:          { start: 105, end: 106, frameRate:  4, repeat: -1 }, // halar
  },
};
