// Sonido del juego: música ambiental y efectos, generados con Web Audio (no hacen falta archivos de audio).
//
//  - Sonido.musica('menu' | 'nivel' | null)  cambia la música con un fundido; si ya suena esa, no hace nada.
//  - Sonido.efecto('salto' | 'agacharse' | 'recolectar' | 'logro' | 'clic')
//  - Sonido.ajustes / aplicar() / guardar()  volúmenes y silencio (se editan en el panel del engranaje)
//
// Reglas que cumple:
//  - Los navegadores no dejan sonar hasta que el jugador interactúa (clic, tecla o toque): el contexto de audio
//    se "desbloquea" con el primer gesto y la música pedida antes empieza justo entonces.
//  - Solo existe UN contexto de audio y UNA pista de música a la vez: pedir la misma pista dos veces no la
//    duplica, y al cambiar de pista la anterior se apaga con un fundido.
//  - Cada efecto tiene un tiempo mínimo entre repeticiones y hay un tope de efectos simultáneos, así que
//    mantener una tecla pulsada no apila sonidos.
//  - Al ocultar la pestaña el audio se pausa, y se reanuda al volver.
const Sonido = (() => {
  const CLAVE = 'rumbo-a-la-luna:ajustes-audio';
  const DEFAULTS = { musica: 0.5, efectos: 0.8, silencio: false };
  const MAX_EFECTOS = 8; // efectos sonando a la vez

  const Contexto = window.AudioContext || window.webkitAudioContext;
  let ajustes = cargar();
  let ctx = null;
  let bus = null;        // { master, musica, efectos, reverb }
  let pista = null;      // pista que suena ahora
  let deseada = null;    // pista que se ha pedido (puede esperar al primer gesto)
  let activos = 0;       // efectos sonando
  const ultimo = {};     // última vez que sonó cada efecto

  function cargar() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') };
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
    aplicar(ajustes);
    return ajustes;
  }

  // Aplica volúmenes sin guardarlos (sirve para oír el cambio mientras se mueve el deslizador)
  function aplicar(a) {
    if (!bus) return;
    const t = ctx.currentTime;
    bus.musica.gain.setTargetAtTime(a.silencio ? 0 : a.musica * 0.55, t, 0.05);
    bus.efectos.gain.setTargetAtTime(a.silencio ? 0 : a.efectos, t, 0.05);
  }

  // ---------- Contexto y desbloqueo ----------

  function crearContexto() {
    if (ctx || !Contexto) return;
    ctx = new Contexto();
    const master = ctx.createGain();
    const limitador = ctx.createDynamicsCompressor(); // evita que la suma de sonidos sature
    master.connect(limitador).connect(ctx.destination);

    const musica = ctx.createGain();
    const efectos = ctx.createGain();
    efectos.connect(master);
    musica.connect(master);

    // Un poco de reverberación para que la música suene "espacial"
    const reverb = ctx.createConvolver();
    reverb.buffer = impulso(2.6);
    const envio = ctx.createGain();
    envio.gain.value = 0.45;
    musica.connect(envio).connect(reverb).connect(master);

    bus = { master, musica, efectos, reverb };
    aplicar(ajustes);
    ctx.addEventListener('statechange', sincronizar);
    sincronizar();
  }

  // Respuesta al impulso de la reverberación: ruido que se apaga poco a poco
  function impulso(segundos) {
    const n = Math.floor(ctx.sampleRate * segundos);
    const buffer = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const datos = buffer.getChannelData(c);
      for (let i = 0; i < n; i += 1) datos[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5;
    }
    return buffer;
  }

  // El primer gesto del jugador permite (o reanuda) el audio
  const GESTOS = ['pointerdown', 'keydown', 'touchend', 'click'];
  function alGesto() {
    crearContexto();
    if (!ctx) return;
    if (ctx.state === 'running') {
      quitarGestos();
      return;
    }
    ctx.resume().then(sincronizar).catch(() => {});
  }
  function quitarGestos() {
    GESTOS.forEach((g) => window.removeEventListener(g, alGesto, true));
  }
  GESTOS.forEach((g) => window.addEventListener(g, alGesto, true));

  // Si se oculta la pestaña, silencio; al volver, sigue donde estaba
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  });

  // Hace que suene la pista pedida cuando el audio está permitido
  function sincronizar() {
    if (!ctx || ctx.state !== 'running') return;
    quitarGestos();
    if (deseada === null) {
      if (pista) detener(pista, 1);
      pista = null;
    } else if (!pista || pista.nombre !== deseada) {
      empezar(deseada);
    }
  }

  // ---------- Notas ----------

  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

  // Una nota con envolvente: sube en "ataque", se mantiene hasta "dur" y se apaga en "suelta"
  function nota(destino, t, midi, dur, { tipo = 'sine', vol = 0.1, ataque = 0.02, suelta = 0.3, filtro = 0, desafina = 0 } = {}) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = hz(midi);
    osc.detune.value = desafina;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + Math.max(ataque, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + suelta);
    let salida = osc;
    if (filtro) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filtro;
      osc.connect(f);
      salida = f;
    }
    salida.connect(g).connect(destino);
    osc.start(t);
    osc.stop(t + dur + suelta + 0.05);
    return osc;
  }

  function ruido(destino, t, dur, vol, agudos = 6000) {
    const n = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < n; i += 1) datos[i] = Math.random() * 2 - 1;
    const fuente = ctx.createBufferSource();
    fuente.buffer = buffer;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = agudos;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    fuente.connect(f).connect(g).connect(destino);
    fuente.start(t);
  }

  // ---------- Pistas ----------
  // Cada pista dice cuánto dura un "paso" (en segundos) y qué suena en cada uno.
  // Notas en MIDI: 45 = La2, 57 = La3, 69 = La4.

  // Ambiental: acordes largos y suaves, notas sueltas que "caen" y, si pulso = true, un latido grave
  function ambiental({ paso, acordes, escala, pulso }) {
    const porAcorde = 8; // pasos por acorde
    return {
      paso,
      suena(p, t, n) {
        const ac = acordes[Math.floor(n / porAcorde) % acordes.length];
        if (n % porAcorde === 0) {
          const dur = porAcorde * paso;
          ac.notas.forEach((m, i) => {
            nota(p.gain, t, m, dur * 0.6, { tipo: 'sine', vol: 0.07, ataque: 2.2, suelta: dur * 0.5, desafina: i * 4 });
            nota(p.gain, t, m, dur * 0.6, { tipo: 'triangle', vol: 0.025, ataque: 2.6, suelta: dur * 0.5, filtro: 900, desafina: -6 });
          });
          nota(p.gain, t, ac.bajo, dur * 0.8, { tipo: 'sine', vol: 0.11, ataque: 1.5, suelta: dur * 0.4 });
        }
        if (Math.random() < 0.5) {
          const m = escala[Math.floor(Math.random() * escala.length)];
          nota(p.gain, t, m, 0.12, { tipo: 'sine', vol: 0.06, ataque: 0.01, suelta: 1.6 });
        }
        if (pulso && n % 2 === 0) {
          nota(p.gain, t, ac.bajo - 12, 0.1, { tipo: 'sine', vol: 0.12, ataque: 0.01, suelta: 0.35 });
        }
      },
    };
  }

  // Ritmo suave de aventura (como el pixel art del juego): bajo, arpegio, un golpe suave y un "hi-hat" muy bajo
  function ritmica({ paso, acordes }) {
    const porAcorde = 16;
    const dibujo = [0, 1, 2, 1, 0, 2, 1, 3]; // qué nota del acorde toca en cada paso
    return {
      paso,
      suena(p, t, n) {
        const ac = acordes[Math.floor(n / porAcorde) % acordes.length];
        if (n % 4 === 0) nota(p.gain, t, ac.bajo, paso * 3, { tipo: 'triangle', vol: 0.16, ataque: 0.01, suelta: 0.15, filtro: 500 });
        const m = ac.notas[dibujo[n % dibujo.length] % ac.notas.length] + 12;
        nota(p.gain, t, m, paso * 0.7, { tipo: 'square', vol: 0.03, ataque: 0.005, suelta: 0.1, filtro: 2200 });
        if (n % 8 === 0) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.setValueAtTime(130, t);
          o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
          g.gain.setValueAtTime(0.16, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          o.connect(g).connect(p.gain);
          o.start(t);
          o.stop(t + 0.2);
        }
        if (n % 2 === 1) ruido(p.gain, t, 0.04, 0.025);
        if (n % 16 === 8) nota(p.gain, t, ac.notas[2] + 24, 0.1, { tipo: 'sine', vol: 0.05, suelta: 0.8 });
      },
    };
  }

  const LA_MENOR = [
    { bajo: 33, notas: [57, 60, 64, 67] },  // Am
    { bajo: 29, notas: [53, 57, 60, 64] },  // F
    { bajo: 36, notas: [55, 60, 64, 67] },  // C
    { bajo: 31, notas: [55, 59, 62, 66] },  // G
  ];
  const PISTAS = {
    menu: ambiental({ paso: 1, acordes: LA_MENOR, escala: [69, 72, 74, 76, 79, 81, 84], pulso: false }),
    nivel: ritmica({ paso: 0.3125, acordes: LA_MENOR }),
  };

  function empezar(nombre) {
    const def = PISTAS[nombre];
    if (!def) return;
    if (pista) detener(pista, 1.2);
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(1, t + 2); // entra con un fundido
    gain.connect(bus.musica);
    const p = { nombre, def, gain, siguiente: t + 0.1, n: 0, timer: null };
    // Planifica las notas un poco por adelantado para que no haya cortes
    const programar = () => {
      while (p.siguiente < ctx.currentTime + 0.6) {
        def.suena(p, p.siguiente, p.n);
        p.siguiente += def.paso;
        p.n += 1;
      }
    };
    p.timer = setInterval(programar, 150);
    programar();
    pista = p;
  }

  function detener(p, fundido) {
    clearInterval(p.timer);
    p.timer = null;
    const t = ctx.currentTime;
    p.gain.gain.cancelScheduledValues(t);
    p.gain.gain.setValueAtTime(Math.max(p.gain.gain.value, 0.0001), t);
    p.gain.gain.linearRampToValueAtTime(0.0001, t + fundido);
    setTimeout(() => p.gain.disconnect(), (fundido + 0.3) * 1000);
  }

  function musica(nombre) {
    deseada = nombre || null;
    crearContexto();
    sincronizar();
  }

  // ---------- Efectos ----------

  function barrido(t, tipo, desde, hasta, dur, vol) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(desde, t);
    o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus.efectos);
    o.start(t);
    o.stop(t + dur + 0.02);
    return o;
  }

  // "min": segundos mínimos entre dos repeticiones del mismo efecto
  const EFECTOS = {
    // Salto: chirrido que sube
    salto: { min: 0.1, dur: 0.2, suena: (t) => barrido(t, 'square', 260, 700, 0.18, 0.13) },
    // Agacharse: golpe grave que baja, con un soplido corto
    agacharse: {
      min: 0.2,
      dur: 0.2,
      suena: (t) => {
        barrido(t, 'triangle', 230, 90, 0.14, 0.3);
        ruido(bus.efectos, t, 0.06, 0.08, 1500);
      },
    },
    // Recolectar: arpegio brillante ascendente
    recolectar: {
      min: 0.05,
      dur: 0.4,
      suena: (t) => {
        [76, 80, 83, 88].forEach((m, i) => {
          nota(bus.efectos, t + i * 0.065, m, 0.05, { tipo: 'square', vol: 0.07, ataque: 0.004, suelta: 0.12, filtro: 5000 });
          nota(bus.efectos, t + i * 0.065, m + 12, 0.04, { tipo: 'sine', vol: 0.05, ataque: 0.004, suelta: 0.2 });
        });
      },
    },
    // Fin de nivel
    logro: {
      min: 1,
      dur: 1.6,
      suena: (t) => {
        [60, 64, 67, 72, 67, 72, 76].forEach((m, i) => {
          nota(bus.efectos, t + i * 0.14, m, 0.12, { tipo: 'square', vol: 0.08, ataque: 0.005, suelta: 0.25, filtro: 3500 });
        });
        nota(bus.efectos, t + 0.98, 79, 0.6, { tipo: 'triangle', vol: 0.1, ataque: 0.01, suelta: 0.5 });
      },
    },
    // Botones
    clic: { min: 0.1, dur: 0.1, suena: (t) => barrido(t, 'square', 520, 780, 0.07, 0.08) },
  };

  function efecto(nombre) {
    const def = EFECTOS[nombre];
    if (!def || !ctx || ctx.state !== 'running' || ajustes.silencio) return;
    const ahora = ctx.currentTime;
    if (ultimo[nombre] !== undefined && ahora - ultimo[nombre] < def.min) return; // sin repeticiones seguidas
    if (activos >= MAX_EFECTOS) return;                                           // sin apilar sonidos
    ultimo[nombre] = ahora;
    activos += 1;
    def.suena(ahora + 0.005);
    setTimeout(() => { activos -= 1; }, def.dur * 1000);
  }

  return {
    musica,
    efecto,
    aplicar,
    guardar,
    get ajustes() { return { ...ajustes }; },
    get disponible() { return Boolean(Contexto); },
  };
})();
