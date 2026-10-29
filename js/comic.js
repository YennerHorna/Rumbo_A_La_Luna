// Textos del cómic que se muestra antes del Nivel 1 (js/scenes/ComicScene.js), en lugar de la pantalla de historia.
// Cuenta la carrera espacial (lo mismo que HISTORIA[1] en js/historia.js) y explica la misión del nivel.
//
// Cada página tiene tres viñetas. En cada viñeta:
//   escena:     dibujo de fondo (ver ComicScene.dibujos)
//   rect:       posición y tamaño en pantalla { x, y, w, h }
//   narracion:  recuadros amarillos del narrador { x, y, w, fecha?, texto, abajo? } (abajo: y mide desde el borde inferior)
//   globos:     bocadillos { x, y, w, texto, cola: { x, y }, quien? } (quien: etiqueta del que habla por radio)
//   sonido:     onomatopeya grande { texto, x, y, angulo }
// Las coordenadas de narración, globos y sonido son relativas a la viñeta.
// En los textos: {Tripulante} / {tripulante} = "Tripulante <nombre>", {o} = "o" u "a" según el sexo del DNI.
const COMIC = {
  paginas: [
    {
      titulo: 'NIVEL 1 · PREPARATIVOS · LA CARRERA ESPACIAL',
      vinetas: [
        {
          escena: 'sputnik',
          rect: { x: 20, y: 56, w: 540, h: 220 },
          narracion: [
            { x: 0, y: 0, w: 300, fecha: '1957 · 1961', texto: 'Después de la Segunda Guerra Mundial, Estados Unidos y la Unión Soviética compiten por llegar más lejos en el espacio.' },
            { x: 230, y: 0, w: 310, abajo: true, texto: 'La URSS lanza el Sputnik 1 (1957) y envía a Yuri Gagarin, el primer ser humano en el espacio (1961).' },
          ],
          sonido: { texto: '¡BIP! ¡BIP!', x: 430, y: 52, angulo: -8 },
        },
        {
          escena: 'congreso',
          rect: { x: 574, y: 56, w: 366, h: 220 },
          narracion: [
            { x: 0, y: 0, w: 366, abajo: true, fecha: '25 DE MAYO DE 1961', texto: 'El presidente John F. Kennedy lanza un reto ante el Congreso.' },
          ],
          globos: [
            { x: 12, y: 6, w: 340, texto: '¡Antes de que termine la década llevaremos a un hombre a la Luna y lo traeremos sano y salvo a la Tierra!', cola: { x: 290, y: 112 } },
          ],
        },
        {
          escena: 'cohete',
          rect: { x: 20, y: 288, w: 920, h: 220 },
          narracion: [
            { x: 0, y: 0, w: 360, fecha: '1961 · 1969 · OCHO AÑOS DE PREPARATIVOS', texto: 'Los programas Mercury y Gemini enseñan a vivir y a trabajar en el espacio, y se construye el gigantesco cohete Saturno V.' },
            { x: 590, y: 0, w: 330, abajo: true, texto: 'La tripulación del Apolo 11, Armstrong, Aldrin y Collins, entrena con simuladores y trajes espaciales.' },
          ],
          globos: [
            { x: 380, y: 50, w: 220, texto: '¡Yo también voy a entrenar para ir a la Luna!', cola: { x: 440, y: 140 } },
          ],
        },
      ],
    },
    {
      titulo: 'NIVEL 1 · PREPARATIVOS · TU MISIÓN',
      vinetas: [
        {
          escena: 'campo',
          rect: { x: 20, y: 56, w: 920, h: 220 },
          narracion: [
            { x: 0, y: 0, w: 280, fecha: 'CAMPO DE ENTRENAMIENTO', texto: 'Llega el gran ensayo antes del viaje...' },
          ],
          globos: [
            { x: 300, y: 12, w: 300, quien: 'CONTROL DE MISIÓN', texto: '{Tripulante}, ¡las piezas de tu equipo están repartidas por todo el campo!' },
            { x: 20, y: 72, w: 160, texto: '¡Sin mi traje no puedo viajar!', cola: { x: 222, y: 150 } },
          ],
        },
        {
          escena: 'enemigos',
          rect: { x: 20, y: 288, w: 440, h: 220 },
          narracion: [
            { x: 0, y: 0, w: 440, texto: 'Algunas piezas están dentro de cajas... ¡y otras las tienen los robots y drones de entrenamiento!' },
          ],
          sonido: { texto: '¡CRAC!', x: 92, y: 104, angulo: -12 },
        },
        {
          escena: 'mision',
          rect: { x: 474, y: 288, w: 466, h: 220 },
          mision: {
            titulo: 'TU MISIÓN',
            texto: 'Recolecta todas las piezas del equipo del astronauta. Rompe cajas y vence a los robots y drones para conseguirlas.',
            controles: '← → mover · ↑ o ESPACIO saltar · J o X golpear · SHIFT correr',
          },
        },
      ],
    },
  ],
  pie: 'CLIC O ENTER PARA SEGUIR ▶',
  saltar: 'SALTAR ▶▶',
  boton: '¿LIST{O}? ¡A ENTRENAR!',
  siguiente: { escena: 'Game', datos: { nivel: 1 } },
};
