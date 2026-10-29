// Panel de ajustes (engranaje): cómo suena la voz del astronauta y el volumen de la música y los efectos. Los datos del tripulante
// (nombre, DNI y sexo) no se editan aquí sino en la pantalla de identificación del inicio.
// Es HTML encima del juego (los formularios son más cómodos así).
const PanelAjustes = (() => {
  let panel = null;
  let alCerrar = null;
  let probandoMicro = false;
  let cerradoEn = -Infinity;

  const $ = (sel) => panel.querySelector(sel);

  function crear() {
    panel = document.createElement('div');
    panel.className = 'ajustes-fondo';
    panel.hidden = true;
    panel.innerHTML = `
      <form class="ajustes" role="dialog" aria-modal="true" aria-labelledby="ajustes-titulo" novalidate>
        <header class="ajustes-cabecera">
          <img src="assets/images/ui/icono-ajustes.png" alt="">
          <h2 id="ajustes-titulo">Ajustes</h2>
          <button type="button" class="ajustes-cerrar" data-accion="cancelar" aria-label="Cerrar">✕</button>
        </header>

        <p class="ajustes-tripulante"></p>

        <fieldset>
          <legend>Voz del astronauta</legend>
          <label>Idioma
            <select name="idioma"></select>
          </label>
          <label>Voz
            <select name="vozManual"></select>
          </label>
          <label><span class="ajustes-etiqueta">Tono <output data-de="tono"></output></span>
            <input name="tono" type="range" min="0.5" max="1.5" step="0.05">
          </label>
          <label><span class="ajustes-etiqueta">Velocidad <output data-de="velocidad"></output></span>
            <input name="velocidad" type="range" min="0.6" max="1.6" step="0.05">
          </label>
          <label><span class="ajustes-etiqueta">Volumen <output data-de="volumen"></output></span>
            <input name="volumen" type="range" min="0" max="1" step="0.05">
          </label>
          <label class="ajustes-check"><input name="repetir" type="checkbox"> Repetir en voz alta lo que digo</label>
          <div class="ajustes-pruebas">
            <button type="button" data-accion="probar-voz">Probar voz</button>
            <button type="button" data-accion="probar-micro">Probar micrófono</button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Sonido</legend>
          <label><span class="ajustes-etiqueta">Música <output data-de="musica"></output></span>
            <input name="musica" type="range" min="0" max="1" step="0.05">
          </label>
          <label><span class="ajustes-etiqueta">Efectos <output data-de="efectos"></output></span>
            <input name="efectos" type="range" min="0" max="1" step="0.05">
          </label>
          <label class="ajustes-check"><input name="silencio" type="checkbox"> Silenciar música y efectos</label>
        </fieldset>

        <p class="ajustes-estado" role="status" aria-live="polite"></p>

        <footer class="ajustes-botones">
          <button type="button" data-accion="cancelar">Cancelar</button>
          <button type="submit" class="ajustes-principal">Guardar</button>
        </footer>
      </form>`;
    document.body.appendChild(panel);

    const idiomas = $('select[name="idioma"]');
    Object.entries(Voz.IDIOMAS).forEach(([codigo, nombre]) => idiomas.add(new Option(nombre, codigo)));

    panel.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => mostrarValor(input));
    });
    // El sonido se oye al momento mientras se mueven los deslizadores (si se cancela, vuelve a lo guardado)
    ['musica', 'efectos', 'silencio'].forEach((nombre) => {
      $(`input[name="${nombre}"]`).addEventListener('input', () => {
        Sonido.aplicar(leerSonido());
        if (nombre === 'efectos') Sonido.efecto('recolectar');
      });
    });
    // Las voces del sistema pueden tardar en estar disponibles
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', () => rellenarVoces());
    // Al cambiar el idioma, la opción automática puede elegir otra voz
    $('select[name="idioma"]').addEventListener('change', () => rellenarVoces());

    panel.addEventListener('click', (e) => {
      const accion = e.target.closest('[data-accion]');
      if (accion) ejecutar(accion.dataset.accion);
      else if (e.target === panel) cerrar(false); // clic fuera del panel
    });
    $('form').addEventListener('submit', (e) => {
      e.preventDefault();
      cerrar(true);
    });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrar(false);
    });
  }

  function mostrarValor(input) {
    $(`output[data-de="${input.name}"]`).textContent = Number(input.value).toFixed(2);
  }

  // Lista de voces en español; la primera opción elige sola según el sexo del DNI
  function rellenarVoces(seleccionada = $('select[name="vozManual"]').value) {
    const select = $('select[name="vozManual"]');
    const { sexo } = Voz.ajustes;
    select.innerHTML = '';
    select.add(new Option(`Automática (voz de ${sexo === 'F' ? 'mujer' : 'hombre'})`, ''));
    Voz.voces().forEach((v) => {
      const genero = { M: ' · hombre', F: ' · mujer' }[Voz.generoDeVoz(v)] || '';
      select.add(new Option(`${v.name} (${v.lang})${genero}`, v.name));
    });
    select.value = [...select.options].some((o) => o.value === seleccionada) ? seleccionada : '';
  }

  // Ajustes de voz del formulario, junto con los datos del tripulante ya guardados
  function leerFormulario() {
    const form = $('form');
    return {
      ...Voz.ajustes,
      idioma: form.idioma.value,
      vozManual: form.vozManual.value,
      tono: Number(form.tono.value),
      velocidad: Number(form.velocidad.value),
      volumen: Number(form.volumen.value),
      repetir: form.repetir.checked,
    };
  }

  function leerSonido() {
    const form = $('form');
    return { musica: Number(form.musica.value), efectos: Number(form.efectos.value), silencio: form.silencio.checked };
  }

  function rellenarFormulario(a) {
    const form = $('form');
    const sonido = Sonido.ajustes;
    form.musica.value = sonido.musica;
    form.efectos.value = sonido.efectos;
    form.silencio.checked = sonido.silencio;
    form.idioma.value = a.idioma;
    form.tono.value = a.tono;
    form.velocidad.value = a.velocidad;
    form.volumen.value = a.volumen;
    form.repetir.checked = a.repetir;
    panel.querySelectorAll('input[type="range"]').forEach(mostrarValor);
    rellenarVoces(a.vozManual);
  }

  function estado(texto, error = false) {
    const p = $('.ajustes-estado');
    p.textContent = texto;
    p.classList.toggle('ajustes-error', error);
  }

  function ejecutar(accion) {
    if (accion === 'cancelar') cerrar(false);
    if (accion === 'probar-voz') {
      // Se prueba con lo que hay en el formulario, sin guardarlo todavía
      const prueba = leerFormulario();
      Voz.hablar(`Hola${prueba.nombre ? ` ${prueba.nombre}` : ''}, rumbo a la Luna.`, { con: prueba });
      const voz = Voz.elegirVoz(prueba);
      estado(voz ? `Voz: ${voz.name}` : 'No hay voces en español instaladas; se usa la del sistema.');
    }
    if (accion === 'probar-micro') probarMicrofono();
  }

  function probarMicrofono() {
    if (probandoMicro) {
      Voz.detener();
      return;
    }
    const prueba = leerFormulario();
    probandoMicro = true;
    estado('Escuchando... habla ahora.');
    const ok = Voz.escuchar({
      idioma: prueba.idioma,
      onParcial: (t) => estado(`Escuchando: "${t}"`),
      onFinal: (t) => {
        estado(`Has dicho: "${t}"`);
        if (prueba.repetir) Voz.hablar(t, { con: prueba });
      },
      onError: (codigo) => estado(Voz.mensajeError(codigo), true),
      onFin: () => { probandoMicro = false; },
    });
    if (!ok) probandoMicro = false;
  }

  function abrir(onClose) {
    if (!panel) crear();
    alCerrar = onClose;
    rellenarFormulario(Voz.ajustes);
    const { nombre, sexo } = Voz.ajustes;
    $('.ajustes-tripulante').textContent = `Tripulante: ${nombre || 'sin nombre'} · ${sexo === 'F' ? 'F (voz de mujer)' : 'M (voz de hombre)'}`;
    estado(Voz.microfonoDisponible ? '' : Voz.mensajeError('no-soportado'), !Voz.microfonoDisponible);
    panel.hidden = false;
    $('select[name="idioma"]').focus();
  }

  function cerrar(guardarCambios) {
    if (guardarCambios) {
      Voz.guardar(leerFormulario());
      Sonido.guardar(leerSonido());
    } else {
      Sonido.aplicar(Sonido.ajustes); // deshace lo que se oyó al probar los deslizadores
    }
    Voz.detener();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    panel.hidden = true;
    cerradoEn = performance.now();
    if (alCerrar) alCerrar();
  }

  return {
    abrir,
    get abierto() { return Boolean(panel && !panel.hidden); },
    // La tecla que cierra el panel (Esc, Enter) no debe llegar también al juego
    get recienCerrado() { return performance.now() - cerradoEn < 300; },
  };
})();

// Tamaño en pantalla de los iconos de la interfaz (engranaje y micrófono)
const ICONO_UI = 36;

// Los iconos de la interfaz no son pixel art: se dibujan suavizados aunque el juego use pixelArt
function suavizarIcono(scene, key) {
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
}

// Engranaje que abre el panel de ajustes desde una escena de Phaser ("size": lado en píxeles).
// Mientras el panel está abierto la escena se pausa y el teclado queda libre para escribir.
function botonAjustes(scene, x, y, size = ICONO_UI) {
  suavizarIcono(scene, 'icono-ajustes');
  const boton = scene.add.image(x, y, 'icono-ajustes')
    .setDisplaySize(size, size)
    .setScrollFactor(0)
    .setDepth(110)
    .setInteractive({ useHandCursor: true });
  // Quieto; al pasar el ratón se ilumina y crece un poco
  boton.on('pointerover', () => boton.setTint(0xfff6c8).setDisplaySize(size * 1.15, size * 1.15));
  boton.on('pointerout', () => boton.clearTint().setDisplaySize(size, size));
  boton.on('pointerdown', () => abrirAjustes(scene));
  return boton;
}

function abrirAjustes(scene) {
  if (PanelAjustes.abierto || PanelAjustes.recienCerrado) return;
  const teclado = scene.input.keyboard;
  teclado.resetKeys();
  teclado.disableGlobalCapture();
  scene.events.emit('ajustes-abiertos');
  scene.scene.pause();
  PanelAjustes.abrir(() => {
    teclado.enableGlobalCapture();
    teclado.resetKeys();
    scene.scene.resume();
  });
}
