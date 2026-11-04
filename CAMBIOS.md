# Rumbo a la Luna · cambios de esta versión

## Flujo del juego
Portada → Registro (nombre, DNI y sexo DNI; el **personaje F/M** sale del sexo: M = masculino, F = femenino) → **Cómic** (carrera espacial + misión del Nivel 1) → Nivel 1 (Preparativos) →
**Nivel 2 (Rumbo a la Luna)** → vuelta a la portada.

## Nivel 2 · Rumbo a la Luna
Basado en el minijuego "Cazador de Asteroides" (Three.js). La nave del Apolo 11 (módulo de mando, módulo de servicio y
tobera, hecha con código) viaja 384.400 km hasta la Luna en unos 110 s. Antes, cuenta atrás y despegue con la Tierra abajo.
- Los asteroides vienen de frente; algunos van directos a la nave. Los grandes aguantan 2 disparos. Cada vez salen más
  y más rápido. Chocar quita vida (la barra y el corazón con las vidas son los del Nivel 1). Al final ya no salen más.
- Tanques de oxígeno verdes: recuperan vida.
- Abajo, barra Tierra → Luna con los km que faltan. La Luna crece al fondo.
- Nave: blanca con el módulo de mando dorado (con reflejos metálicos), franjas y letras "APOLO 11" del color del
  jugador (J1 rojo, J2 azul), propulsores de maniobra, antena de 4 platos y tobera con llama, brillo y luz.
  Disparos amarillos con halo. Los colores están en NIVEL2_UI (naves, casco, capsula).
- Animación de llegada (unos 18 s, sin HUD): la Luna queda delante y la nave frena → entra en órbita y le da la
  vuelta (la cámara la sigue; la cara oculta está a oscuras) → se pone de pie y baja con el motor encendido →
  toca el suelo con una nube de polvo, se levanta la bandera, la Tierra se ve en el cielo y sale
  "¡LLEGASTE A LA LUNA!". Después, la portada. Los tiempos están en animarLlegada (Nivel2Scene.js).
- 1 jugador: sin vidas, panel REINTENTAR / IR AL INICIO. 2 jugadores local: las dos naves en la misma pantalla (J1 cian,
  J2 ámbar); quien pierde sus vidas vuelve con su tecla de disparar. Online: cada uno con sus asteroides y la nave del
  compañero semitransparente (mensaje 'nave'); si se va, se sigue solo.
- El 3D va en un lienzo propio debajo del de Phaser (Phaser tiene ahora fondo transparente; las demás pantallas no
  cambian porque tapan todo con su fondo). El HUD, los avisos, el engranaje y los fundidos siguen siendo de Phaser.
- Todos los valores (duración, daño, cadencia, asteroides, oxígeno...) están en js/nivel2.js; textos, colores y teclas
  al principio de js/scenes/Nivel2Scene.js. Efectos nuevos en js/audio.js: disparo, explosion, choque, cuenta, despegue, oxigeno.
- Para probarlo directamente: index.html?nivel=2

## Modo 2 jugadores (pantalla dividida)
En la portada se elige **1 JUGADOR** o **2 JUGADORES** (flechas o teclas 1 / 2, y ENTER).
Con 2 jugadores: se identifican los dos tripulantes, uno detrás de otro, y en el nivel la pantalla se parte en horizontal.
Cada mitad es el juego al 70 % de tamaño (la cámara sigue al personaje también en vertical), cada personaje solo aparece en su mitad
y el aviso de arriba (nombre del nivel, etc.) sale solo en la mitad de arriba. Los textos usan la letra Lexend con tamaños propios para esta vista.
El tamaño de la vista, la letra y el tamaño de cada texto se ajustan en PANTALLA_DIVIDIDA (GameScene.js).
- Jugador 1 (arriba): A / D mover, W saltar, S agacharse, F golpear, G correr. Usa la voz (V).
- Jugador 2 (abajo): flechas mover, ↑ saltar, ↓ agacharse, M golpear, SHIFT correr.
- Si uno pierde sus 3 vidas, en su mitad sale "¡TE QUEDASTE SIN VIDAS!" con REINICIAR (o su tecla de golpear: F / M;
  en online, X): vuelve a empezar solo su parte, en la entrada, con 3 vidas, su mundo de cero y piezas nuevas. El
  compañero sigue jugando sin interrupción. El nivel termina cuando los dos completan su traje.
- Cada uno recolecta su propio traje: sus 6 piezas están repartidas al azar (por separado de las del otro) y solo él
  las ve y las puede coger. Las cajas rompibles y los enemigos también son de cada uno: lo que rompe o destruye un
  jugador solo desaparece en su mitad, y los enemigos de cada mitad solo atacan a su jugador.

## Modo online (2 jugadores, cada uno en su ordenador)
En la portada: **ONLINE**. Uno pulsa "Crear sala" y recibe un código de 4 cifras; el otro lo escribe en "Unirse".
Cada uno se identifica en su ordenador, ve el cómic y espera en una sala hasta que los dos están listos.
La partida usa la misma pantalla dividida: arriba juegas tú (con los controles de 1 jugador) y abajo ves a tu
compañero, que se mueve con lo que llega por la red. Cada uno tiene su traje, sus cajas y sus enemigos, igual que en
local; se comparten la posición, la vida, las piezas recogidas y lo que rompe cada uno. Al perder, cualquiera puede
pedir "Reintentar" y empiezan los dos con piezas nuevas.
Si el compañero sale de la sala (vuelve al inicio o cierra el juego) o pierde la conexión (no llega nada suyo en 7 s),
aparece un aviso arriba en cualquier pantalla ("Luis salió de la sala." / "Luis perdió la conexión.") y la partida
pasa a ser de 1 jugador, a pantalla completa, conservando todo lo que llevabas (posición, vida, vidas, piezas, cajas
rotas y enemigos destruidos). En la sala de espera se vuelve al inicio. Los textos y tiempos están en RED (js/red.js).
- La conexión usa PeerJS (WebRTC): los navegadores se conectan directamente y el servidor público gratuito de PeerJS
  solo sirve para que se encuentren. No hace falta servidor propio.
- Para jugar con alguien de otro sitio, el juego tiene que estar publicado en internet (GitHub Pages, Netlify, itch.io...).
  En algunas redes (colegios, empresas) la conexión directa puede estar bloqueada.

## Archivos nuevos
- js/nivel2.js              diseño del Nivel 2
- js/scenes/Nivel2Scene.js  el Nivel 2 (escena de Phaser + mundo 3D con Three.js)
- js/red.js                 conexión online (PeerJS): salas, mensajes y desconexión
- js/scenes/LobbyScene.js   pantalla para crear una sala o unirse con un código
- js/scenes/EsperaScene.js  espera a que los dos jugadores online estén listos y reparte las piezas
- js/partida.js             modo de juego (1 o 2 jugadores) y datos del segundo tripulante
- js/audio.js               música ambiental y efectos (Web Audio, sin archivos de audio)
- js/historia.js            textos de la pantalla de historia del Nivel 1 (ahora sin usar: la sustituye el cómic)
- js/comic.js               textos y viñetas del cómic previo al Nivel 1 (edítalos aquí)
- js/scenes/ComicScene.js   cómic dibujado por código con los sprites del juego
- js/scenes/HistoriaScene.js pantalla de historia con tarjetas (ahora sin usar)
- js/espacio.js             fondo de estrellas y Tierra dibujados por código
- assets/images/personaje/personaje-f.png  sprite del personaje femenino (misma distribución que personaje.png)

## Archivos modificados
index.html, css/style.css, js/main.js, js/nivel1.js, js/personaje.js, js/voz.js, js/ajustes.js,
js/scenes/TitleScene.js, js/scenes/RegistroScene.js, js/scenes/GameScene.js

## Cómo sustituir recursos
- Personaje F: reemplaza assets/images/personaje/personaje-f.png por otro sheet de 336x640 con los mismos fotogramas (48x40).
- Audio con archivos propios: la carpeta assets/audio/ está vacía; el sonido se genera por código en js/audio.js.
  Para usar mp3/ogg propios, carga el archivo con fetch + decodeAudioData dentro de Sonido y reproduce el buffer en bus.musica / bus.efectos.

## Ejecutar
Abre la carpeta con un servidor local (por ejemplo `python -m http.server 8000` y entra a http://localhost:8000)
o con la extensión Live Server de VS Code. La música empieza tras el primer clic o tecla (regla de los navegadores).
