// Voz del jugador.
//   - Reconoce lo que dice por el micrófono (SpeechRecognition, disponible en Chrome y Edge).
//   - Lo repite con una voz sintetizada (speechSynthesis) masculina o femenina según el
//     sexo que figura en su DNI: M = masculino, F = femenino.
// Los ajustes se guardan solo en este navegador (localStorage); no se envían a ningún sitio
// aparte del propio reconocimiento de voz del navegador.
const Voz = (() => {
  const CLAVE = 'rumbo-a-la-luna:ajustes-voz';
  const CLAVE_ANTIGUA = 'camino-a-marte:ajustes-voz'; // nombre anterior del juego: se sigue leyendo para no perder los ajustes
  const DEFAULTS = {
    nombre: '',
    dni: '',
    sexo: 'M',        // según DNI: 'M' (masculino) o 'F' (femenino)
    personaje: '',    // personaje del juego: 'F' (femenino) o 'M' (masculino); se deduce del sexo del DNI
    idioma: 'es-ES',  // idioma en el que se escucha y se habla
    vozManual: '',    // nombre de una voz concreta; vacío = automática según el sexo
    tono: 1,
    velocidad: 1,
    volumen: 1,
    repetir: true,    // repetir en voz alta lo que dice el jugador
    registrado: false, // ya pasó por la pantalla de identificación alguna vez
    sexoMF: true,      // el sexo ya usa M/F (antes era H = hombre, M = mujer)
  };
  const IDIOMAS = {
    'es-ES': 'Español (España)',
    'es-MX': 'Español (México)',
    'es-US': 'Español (EE. UU.)',
    'es-AR': 'Español (Argentina)',
    'es-CO': 'Español (Colombia)',
    'es-PE': 'Español (Perú)',
    'es-CL': 'Español (Chile)',
  };
  // Los navegadores no dicen si una voz es de hombre o de mujer: se deduce por su nombre
  const NOMBRES_MUJER = ['female', 'mujer', 'helena', 'laura', 'sabina', 'monica', 'mónica', 'paulina',
    'elvira', 'dalia', 'paloma', 'esperanza', 'lucia', 'lucía', 'elena', 'marisol', 'francisca',
    'catalina', 'camila', 'valentina', 'ximena', 'salome', 'salomé', 'lupe', 'penelope', 'conchita',
    'google español'];
  const NOMBRES_HOMBRE = ['male', 'hombre', 'pablo', 'jorge', 'raul', 'raúl', 'alvaro', 'álvaro', 'diego',
    'juan', 'carlos', 'enrique', 'gerardo', 'tomas', 'tomás', 'lorenzo', 'gonzalo', 'alonso', 'miguel',
    'andres', 'andrés', 'emilio', 'federico', 'jose', 'josé', 'mateo', 'sergio', 'liam'];
  // Si la voz elegida no es del sexo pedido, se corrige el tono para acercarla
  const TONO_SEXO = { M: 0.75, F: 1.3 };
  const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let ajustes = cargar();
  let reconocedor = null;

  function cargar() {
    try {
      const guardados = JSON.parse(localStorage.getItem(CLAVE) || localStorage.getItem(CLAVE_ANTIGUA) || '{}');
      // Ajustes de antes, con H = hombre y M = mujer: se pasan a M = masculino y F = femenino
      if (guardados.sexo && !guardados.sexoMF) {
        guardados.sexo = guardados.sexo === 'M' ? 'F' : 'M';
        guardados.sexoMF = true;
      }
      return { ...DEFAULTS, ...guardados };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function guardar(nuevos) {
    ajustes = { ...ajustes, ...nuevos };
    try {
      localStorage.setItem(CLAVE, JSON.stringify(ajustes));
    } catch (e) {
      // Sin almacenamiento (modo privado): los ajustes duran hasta cerrar la página
    }
    return ajustes;
  }

  // DNI obligatorio: 8 cifras (Perú, España...) y, si lleva letra, se comprueba la de control española
  function validarDni(dni) {
    const valor = dni.trim().toUpperCase().replace(/[\s.-]/g, '');
    if (!valor) return { ok: false, valor, mensaje: 'Escribe tu número de DNI.' };
    const m = valor.match(/^(\d{8})([A-Z])?$/);
    if (!m) return { ok: false, valor, mensaje: 'El DNI debe tener 8 cifras (y, si lleva, una letra).' };
    if (m[2] && LETRAS_DNI[Number(m[1]) % 23] !== m[2]) {
      return { ok: false, valor, mensaje: 'La letra del DNI no coincide con el número.' };
    }
    return { ok: true, valor };
  }

  function voces() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'));
  }

  // 'M' (hombre), 'F' (mujer) o null si no se puede saber
  function generoDeVoz(voz) {
    const nombre = voz.name.toLowerCase();
    if (NOMBRES_MUJER.some((n) => nombre.includes(n))) return 'F'; // 'female' antes que 'male'
    if (NOMBRES_HOMBRE.some((n) => nombre.includes(n))) return 'M';
    return null;
  }

  // Voz manual si hay una elegida; si no, la que mejor encaja con el idioma y el sexo del DNI.
  // "a" permite probar otros ajustes sin guardarlos (por defecto, los guardados).
  function elegirVoz(a = ajustes) {
    const lista = voces();
    if (a.vozManual) {
      const manual = lista.find((v) => v.name === a.vozManual);
      if (manual) return manual;
    }
    const idioma = a.idioma.toLowerCase();
    const mismoIdioma = (v) => v.lang.toLowerCase().replace('_', '-') === idioma;
    const mismoSexo = (v) => generoDeVoz(v) === a.sexo;
    return lista.find((v) => mismoIdioma(v) && mismoSexo(v))
      || lista.find(mismoSexo)
      || lista.find(mismoIdioma)
      || lista[0]
      || null;
  }

  // Dice "texto" en voz alta. Opciones: alTerminar (función) y con (ajustes de prueba sin guardar)
  function hablar(texto, { alTerminar, con = ajustes } = {}) {
    if (!('speechSynthesis' in window) || !texto) {
      if (alTerminar) alTerminar();
      return;
    }
    const frase = new SpeechSynthesisUtterance(texto);
    const voz = elegirVoz(con);
    let tono = con.tono;
    if (voz) {
      frase.voice = voz;
      frase.lang = voz.lang;
      if (generoDeVoz(voz) !== con.sexo) tono *= TONO_SEXO[con.sexo];
    } else {
      frase.lang = con.idioma;
      tono *= TONO_SEXO[con.sexo];
    }
    frase.pitch = Math.min(2, Math.max(0, tono));
    frase.rate = con.velocidad;
    frase.volume = con.volumen;
    frase.onend = () => alTerminar && alTerminar();
    frase.onerror = () => alTerminar && alTerminar();
    speechSynthesis.cancel();
    speechSynthesis.speak(frase);
  }

  // Empieza a escuchar. Avisa con onParcial mientras habla, onFinal con la frase completa,
  // onError con el motivo ('no-soportado', 'no-seguro', 'not-allowed', 'no-speech'...) y onFin al acabar.
  function escuchar({ onParcial, onFinal, onError, onFin, idioma = ajustes.idioma } = {}) {
    if (!Recognition) {
      if (onError) onError('no-soportado');
      return false;
    }
    if (!window.isSecureContext) {
      if (onError) onError('no-seguro');
      return false;
    }
    detener();
    const r = new Recognition();
    r.lang = idioma;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let texto = '';
      let final = false;
      for (const resultado of e.results) {
        texto += resultado[0].transcript;
        if (resultado.isFinal) final = true;
      }
      texto = texto.trim();
      if (final) {
        if (onFinal) onFinal(texto);
      } else if (onParcial) {
        onParcial(texto);
      }
    };
    r.onerror = (e) => onError && onError(e.error);
    r.onend = () => {
      if (reconocedor === r) reconocedor = null;
      if (onFin) onFin();
    };
    reconocedor = r;
    try {
      r.start();
    } catch (e) {
      reconocedor = null;
      if (onError) onError('no-disponible');
      return false;
    }
    return true;
  }

  function detener() {
    if (reconocedor) reconocedor.stop();
  }

  // Texto para mostrar al jugador según el motivo de error
  function mensajeError(codigo) {
    return {
      'no-soportado': 'Tu navegador no reconoce la voz. Usa Chrome o Edge.',
      'no-seguro': 'Abre el juego con http://localhost o https para usar el micrófono.',
      'not-allowed': 'No hay permiso para usar el micrófono.',
      'service-not-allowed': 'No hay permiso para usar el micrófono.',
      'no-speech': 'No te he oído. Prueba otra vez.',
      'audio-capture': 'No se encuentra ningún micrófono.',
      network: 'Sin conexión: el reconocimiento de voz necesita internet.',
      aborted: 'Se ha cancelado la escucha.',
    }[codigo] || 'No se ha podido usar el micrófono.';
  }

  return {
    get ajustes() { return ajustes; },
    IDIOMAS,
    guardar,
    validarDni,
    voces,
    generoDeVoz,
    elegirVoz,
    hablar,
    escuchar,
    detener,
    mensajeError,
    get escuchando() { return Boolean(reconocedor); },
    microfonoDisponible: Boolean(Recognition),
  };
})();
