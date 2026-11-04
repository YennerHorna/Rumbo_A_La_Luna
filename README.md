# Rumbo a la Luna

Juego de plataformas en pixel art ambientado en la misión **Apolo 11** (1969), hecho con [Phaser 3](https://phaser.io/) y JavaScript, sin herramientas de compilación.

El jugador es un tripulante que se prepara para viajar a la Luna. En el **Nivel 1 · Preparativos** tiene que recorrer el campo de entrenamiento y recolectar todas las piezas de su traje: algunas están dentro de cajas y otras las tienen los robots y drones de entrenamiento. En el **Nivel 2 · Rumbo a la Luna** pilota la nave del Apolo 11 por el espacio, en 3D, entre asteroides, hasta llegar a la Luna.

## Cómo se juega

1. **Portada:** se elige el modo: **1 JUGADOR**, **2 JUGADORES** (mismo teclado) u **ONLINE**.
2. **Identificación del tripulante:** cada jugador rellena su carnet: nombre, DNI y sexo según el DNI. El sexo decide el personaje (M = masculino, F = femenino) y la voz con la que el juego le responde. También puede identificarse por voz.
3. **Cómic:** cuenta la carrera espacial (Sputnik, Gagarin, el reto de Kennedy, el Saturno V) y explica la misión del nivel.
4. **Nivel 1:** hay que recolectar las 6 piezas del traje (pantalón, botas, casaca, casco y 2 balones). Cada partida se reparten al azar.
5. **Nivel 2:** cuenta atrás, despegue y viaje de 384.400 km hasta la Luna. Hay que esquivar o destruir los asteroides (los grandes necesitan dos disparos). Los tanques de oxígeno verdes recuperan vida. La barra de abajo muestra lo que falta y la Luna se ve cada vez más grande. Al llegar, una animación muestra la nave entrando en órbita, dando la vuelta a la Luna y alunizando junto a la bandera.

Cada jugador tiene **3 vidas** (el número junto al corazón) y una barra de vida. Los conos, los enemigos, los láseres y caer al agua quitan vida.

### Controles

| Acción | 1 jugador / online | Jugador 1 (local) | Jugador 2 (local) |
|---|---|---|---|
| Mover | ← → o A / D | A / D | ← → |
| Saltar | ↑, W o ESPACIO | W | ↑ |
| Agacharse | ↓ o S | S | ↓ |
| Golpear | J o X | F | M |
| Correr | SHIFT | G | SHIFT |
| Hablar (mantener) | V | V | — |
| Ajustes | ESC o el engranaje | ESC o el engranaje | ESC o el engranaje |

En el **Nivel 2** (la nave):

| Acción | 1 jugador / online | Jugador 1 (local) | Jugador 2 (local) |
|---|---|---|---|
| Mover la nave | ← → ↑ ↓ o W A S D | W A S D | ← → ↑ ↓ |
| Disparar (mantener) | ESPACIO, J o X | F | M |

## Modos de juego

### 1 jugador
La partida clásica a pantalla completa. Si se pierden las 3 vidas, se puede reintentar (con las piezas en otros sitios) o volver al inicio.

### 2 jugadores (mismo teclado)
La pantalla se divide en horizontal: **arriba el jugador 1 y abajo el jugador 2**.

- Cada uno tiene su propio traje que completar, sus propias cajas y sus propios enemigos. Lo que rompe uno no cambia en la mitad del otro.
- Si uno pierde sus 3 vidas, en su mitad aparece **REINICIAR**: vuelve a empezar solo su parte, con su mundo de cero, mientras el compañero sigue jugando.
- El nivel termina cuando **los dos** completan su traje.
- En el Nivel 2 la pantalla ya no se divide: las dos naves vuelan juntas entre los mismos asteroides. Quien pierde sus 3 vidas vuelve a la partida pulsando su tecla de disparar (F / M).

### Online
Igual que el modo de 2 jugadores, pero cada uno en su ordenador:

1. Uno pulsa **Crear sala** y recibe un código de 4 cifras.
2. El otro escribe ese código en **Unirse**.
3. Cada uno se identifica en su ordenador, ve el cómic y espera en la sala hasta que los dos están listos.

En la pantalla dividida, arriba juegas tú y abajo ves a tu compañero. En el Nivel 2 cada uno tiene sus propios asteroides y la nave del compañero se ve semitransparente. Si tu compañero sale de la sala o pierde la conexión, aparece un aviso y la partida sigue en modo de 1 jugador, a pantalla completa, sin perder nada de lo que llevabas.

La conexión usa [PeerJS](https://peerjs.com/) (WebRTC): los navegadores se conectan directamente y no hace falta servidor propio. En algunas redes (colegios, empresas) la conexión directa puede estar bloqueada.

## Cómo ejecutarlo

El juego carga imágenes, así que hay que abrirlo con un servidor local; si se abre `index.html` con doble clic, no funciona.

```bash
python -m http.server 8000
```

Después hay que entrar a <http://localhost:8000>. También sirve la extensión **Live Server** de VS Code.

- La música empieza tras el primer clic o tecla, porque así lo exigen los navegadores.
- La identificación por voz funciona en Chrome y Edge, y necesita permiso para usar el micrófono.
- Para probar el Nivel 2 sin pasar por el Nivel 1: <http://localhost:8000/?nivel=2> (1 jugador).
- Para jugar online con alguien de otro sitio, el juego tiene que estar publicado en internet, por ejemplo en GitHub Pages, Netlify o itch.io.

## Estructura del proyecto

```
index.html              página del juego (carga Phaser, PeerJS, Three.js y los scripts)
css/style.css           estilos de las pantallas HTML (registro, sala online, ajustes, avisos)
assets/images/          sprites: personajes, enemigos, objetos, obstáculos, terreno, fondos e iconos
js/
  main.js               configuración de Phaser y orden de las escenas
  nivel1.js             diseño del Nivel 1 (agua, escalones, cajas, enemigos, piezas...)
  nivel2.js             diseño del Nivel 2 (distancia, duración, daño, asteroides, oxígeno...)
  personaje.js          sprite sheet y animaciones del personaje (masculino y femenino)
  comic.js              textos y viñetas del cómic
  historia.js           textos de la pantalla de historia (ahora sin usar)
  partida.js            modo de juego (1 / 2 jugadores, local / online) y datos del segundo jugador
  red.js                conexión online con PeerJS (salas, mensajes, desconexión)
  voz.js                reconocimiento y síntesis de voz, datos del jugador
  audio.js              música y efectos generados por código (Web Audio)
  ajustes.js            panel de ajustes (voz y sonido)
  espacio.js            fondo de estrellas y la Tierra dibujados por código
  scenes/
    TitleScene.js       portada y elección del modo
    LobbyScene.js       sala online (crear / unirse)
    RegistroScene.js    identificación del tripulante
    ComicScene.js       cómic antes del nivel
    EsperaScene.js      espera online hasta que los dos están listos
    GameScene.js        el Nivel 1: jugadores, enemigos, piezas, HUD y pantalla dividida
    Nivel2Scene.js      el Nivel 2: espacio 3D (Three.js), nave del Apolo, asteroides, Luna y su HUD
    HistoriaScene.js    pantalla de historia con tarjetas (ahora sin usar)
```

La mayoría de los valores ajustables (velocidades, vidas, tamaños de letra, zoom de la pantalla dividida, teclas...) están como constantes al principio de cada archivo, con comentarios.

## Tecnologías

- [Phaser 3.90](https://phaser.io/): motor del juego.
- [PeerJS 1.5](https://peerjs.com/): conexión online entre dos navegadores.
- [Three.js r128](https://threejs.org/): el espacio en 3D del Nivel 2 (nave, asteroides, la Tierra y la Luna se dibujan con código, sin modelos ni imágenes).
- Web Speech API: reconocimiento de voz y voz sintetizada.
- Web Audio API: música y efectos generados por código, sin archivos de audio.
- Fuentes de Google Fonts: Rubik y Lexend (pantalla dividida).

En [CAMBIOS.md](CAMBIOS.md) hay más detalle de cada cambio.
