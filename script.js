let player;
let checkTimeInterval;
let currentActivity = {
    id: "act_001",
    videoId: "dQw4w9WgXcQ", // ID extraído de tu link de YouTube
    preguntas: [
        { tiempo: 30, texto: "¿Cuál es el objetivo principal explicado?", opciones: ["A", "B", "C"], correcta: 0, resuelta: false },
        { tiempo: 120, texto: "¿Qué herramienta se usa en este paso?", opciones: ["X", "Y", "Z"], correcta: 1, resuelta: false }
    ],
    correctas: 0,
    intentos: 0
};

// Alternar entre login estudiante/docente
function setRole(role) {
    document.getElementById('form-estudiante').classList.toggle('hidden', role !== 'estudiante');
    document.getElementById('form-docente').classList.toggle('hidden', role !== 'docente');
}

// Inicialización de la API de YouTube
function onYouTubeIframeAPIReady() {
    // Solo cargamos el player cuando el estudiante entra a una actividad
}

function iniciarActividad() {
    // 1. Revisar intentos y estado guardado (Local Storage para desconexiones)
    const savedState = JSON.parse(localStorage.getItem(`estado_${currentActivity.id}`));
    let startTime = 0;

    if (savedState) {
        if(confirm("Tienes una sesión guardada. ¿Deseas reanudar desde donde quedaste?")) {
            currentActivity = savedState;
            startTime = savedState.ultimoTiempoGuardado;
        } else {
            currentActivity.intentos = savedState.intentos + 1; // Guarda el intento
            localStorage.removeItem(`estado_${currentActivity.id}`);
        }
    }

    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: currentActivity.videoId,
        playerVars: { 'autoplay': 1, 'controls': 0, 'start': Math.floor(startTime) },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        checkTimeInterval = setInterval(verificarPreguntas, 1000);
    } else {
        clearInterval(checkTimeInterval);
    }
}

function verificarPreguntas() {
    const currentTime = player.getCurrentTime();
    
    // Guardar progreso constante para recuperación de caídas
    currentActivity.ultimoTiempoGuardado = currentTime;
    localStorage.setItem(`estado_${currentActivity.id}`, JSON.stringify(currentActivity));

    currentActivity.preguntas.forEach((q, index) => {
        if (!q.resuelta && currentTime >= q.tiempo && currentTime < q.tiempo + 2) {
            mostrarPregunta(q, index);
        }
    });
}

function mostrarPregunta(pregunta, index) {
    player.pauseVideo();
    clearInterval(checkTimeInterval);
    
    document.getElementById('q-text').innerText = pregunta.texto;
    const optionsContainer = document.getElementById('q-options');
    optionsContainer.innerHTML = '';
    
    pregunta.opciones.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "bg-blue-600 hover:bg-blue-500 py-3 px-6 rounded transition-colors text-left";
        btn.innerText = opt;
        btn.onclick = () => procesarRespuesta(index, i === pregunta.correcta);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('question-overlay').classList.remove('hidden');
}

function procesarRespuesta(index, esCorrecta) {
    document.getElementById('question-overlay').classList.add('hidden');
    currentActivity.preguntas[index].resuelta = true;
    
    if (esCorrecta) currentActivity.correctas++;
    
    // Actualizar progreso visual
    let resueltas = currentActivity.preguntas.filter(p => p.resuelta).length;
    document.getElementById('progreso-text').innerText = Math.round((resueltas / currentActivity.preguntas.length) * 100) + '%';
    
    if (resueltas === currentActivity.preguntas.length) {
        finalizarActividad();
    } else {
        player.playVideo();
    }
}

function finalizarActividad() {
    // Borrar el estado temporal y calcular nota final (Escala 1.0 - 5.0)
    localStorage.removeItem(`estado_${currentActivity.id}`);
    const nota = ((currentActivity.correctas / currentActivity.preguntas.length) * 4) + 1;
    
    // Aquí iría el fetch POST a la URL de tu Apps Script para guardar en la hoja
    alert(`Actividad finalizada. Tu nota es: ${nota.toFixed(1)}`);
}

// Lógica de validación docente (básica en frontend, complementada en backend)
document.getElementById('form-docente').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('pass-docente').value === 'AdminDocente') {
        document.getElementById('login-panel').classList.add('hidden');
        document.getElementById('panel-docente').classList.remove('hidden');
    }
});