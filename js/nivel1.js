// Diseño del Nivel 1. Todo se mide en bloques de 48 px:
//   tile:  columna donde empieza el objeto (0 = borde izquierdo del nivel)
//   start / width: columna inicial y ancho en bloques
//   alto:  bloques por encima del suelo (0 = apoyado en el suelo)
const NIVEL_1 = {
  numero: 1,
  nombre: 'PREPARATIVOS',
  objetivo: 'Recolecta todas las piezas del equipo para preparar el viaje.',
  musica: 'nivel',
  ancho: 100, // 100 bloques = 4800 px (5 pantallas)

  // Piezas del traje que hay en este nivel (se muestran bajo la barra de vida).
  // Cada una la suelta la caja rompible o el enemigo que tenga objeto: '<nombre>'
  objetos: ['pantalon', 'botas', 'casaca', 'casco', 'balon'],

  // Charcos de agua (huecos en el suelo)
  agua: [
    { start: 9, width: 3 },
    { start: 38, width: 6 }, // demasiado ancho para saltarlo: hay una plataforma móvil
    { start: 64, width: 3 },
    { start: 89, width: 5 }, // también con plataforma móvil
  ],

  // Terreno elevado de pasto
  escalones: [
    { start: 17, width: 4, alto: 1 },
    { start: 52, width: 3, alto: 1 },
    { start: 55, width: 5, alto: 2 },
    { start: 60, width: 2, alto: 1 },
    { start: 97, width: 3, alto: 1 },
  ],

  // Cajas de madera sólidas (se pueden apilar con "alto")
  cajas: [
    { tile: 4 },
    { tile: 33 },
    { tile: 34 },
    { tile: 34, alto: 1 },
    { tile: 85 },
    { tile: 86 },
    { tile: 86, alto: 1 },
  ],

  // Cajas que se rompen de un golpe (J o X); las que tengan encima caen un bloque.
  // objeto: qué piezas hay en el nivel. Al empezar cada partida se reparten al azar entre todas las cajas
  // rompibles, robots y drones (ver repartirPiezas en GameScene.js), así que aquí solo cuenta cuántas hay.
  cajasRompibles: [
    { tile: 7 },
    { tile: 21, objeto: 'pantalon' },
    { tile: 36 },
    { tile: 45 },
    { tile: 47 },
    { tile: 47, alto: 1, objeto: 'balon' },
    { tile: 70 },
    { tile: 71 },
    { tile: 71, alto: 1 },
    { tile: 82 },
    { tile: 95 },
    { tile: 96 },
    { tile: 96, alto: 1, objeto: 'balon' },
  ],

  // Conos: hacen daño al tocarlos
  conos: [
    { tile: 14 },
    { tile: 26 },
    { tile: 49 },
    { tile: 50 },
    { tile: 68 },
  ],

  // Barreras sólidas de 2 bloques de ancho
  barreras: [
    { tile: 23 },
    { tile: 62 },
  ],

  // Plataformas metálicas fijas sobre patas; se pueden atravesar desde abajo
  plataformas: [
    { start: 28, width: 3, alto: 2 },
    { start: 78, width: 3, alto: 2 },
  ],

  // Plataformas que van y vienen en horizontal
  //   distancia: cuántos bloques recorre   velocidad: píxeles por segundo
  plataformasMoviles: [
    { start: 38, width: 2, distancia: 4, velocidad: 70 },
    { start: 89, width: 2, distancia: 3, velocidad: 60 },
  ],

  // Enemigos. Patrullan entre los bloques "desde" y "hasta" (ambos incluidos)
  // y quitan vida al tocarlos. Se destruyen a golpes (y sueltan su "objeto", si tienen).
  //   robots: caminan por el suelo (o sobre un escalón con "alto"); aguantan 2 golpes
  //   drones: vuelan subiendo y bajando; si te acercas te siguen; aguantan 1 golpe
  robots: [
    { desde: 27, hasta: 32, velocidad: 50 },
    { desde: 55, hasta: 59, alto: 2, velocidad: 45, objeto: 'botas' },
    { desde: 72, hasta: 81, velocidad: 60, objeto: 'casco' },
  ],
  drones: [
    { desde: 6, hasta: 14, velocidad: 50 },
    { desde: 36, hasta: 46, velocidad: 55 },
    { desde: 83, hasta: 94, velocidad: 60, objeto: 'casaca' },
  ],
};

// Todos los niveles, por número
const NIVELES = { 1: NIVEL_1 };
