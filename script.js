const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwU-4PYRnAFAo7TrNau5QKyXOOntvlzbvIF2IcotVslMjiZI7qloelbuPqwU83NyBnQ/exec';
const LISTA_GRADOS = ["6-1", "6-2", "7", "8-1", "8-2", "9", "10", "11"];
const OPCIONES_DESTINO = ["Docente", "6-1", "6-2", "7", "8-1", "8-2", "9", "10", "11"];

const CLASE_GRADIENTES = [
    { bg: 'from-indigo-600 to-purple-600', border: 'border-indigo-200', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { bg: 'from-emerald-600 to-teal-600', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { bg: 'from-amber-500 to-orange-600', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    { bg: 'from-fuchsia-600 to-pink-600', border: 'border-fuchsia-200', text: 'text-fuchsia-600', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
    { bg: 'from-blue-600 to-cyan-600', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    { bg: 'from-violet-600 to-indigo-600', border: 'border-violet-200', text: 'text-violet-600', badge: 'bg-violet-50 text-violet-700 border-violet-200' }
];

let player, intervaloVideo, actividadActual = null, intentoActual = { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: 1 };
let estudianteIdActual = "", nombreEstudianteActual = "", gradoEstudianteActual = "";
let idActividadEditando = null, maxTiempoVisto = 0; 
window.filtroGradoActual = null; 
window.reporteActividadActualId = null;
window.datosReporteGlobal = [];

/* VARIABLES MOTOR DE LECTURA */
let lineasLecturaArray = [];
let palabrasLecturaArray = [];
let indiceLineaLector = 0;
let timeoutLineaPacer = null;
let estadoLecturaPausada = true;
let segundosTranscurridosLectura = 0;
let cronometroLecturaInterval = null;
let tamanoFuenteLectura = 20;

window.baseActividades = [];
try { const temp = JSON.parse(localStorage.getItem('cafelab_actividades')); if (Array.isArray(temp)) window.baseActividades = temp; } catch(e) {}
window.baseEstudiantes = [];
try { const temp = JSON.parse(localStorage.getItem('cafelab_estudiantes')); if (Array.isArray(temp)) window.baseEstudiantes = temp; } catch(e) {}

window.renderLucide = function() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
};

window.toggleSidebarDocente = function(forceState) {
    const sidebar = document.getElementById('sidebar-docente');
    const backdrop = document.getElementById('sidebar-backdrop');
    if(!sidebar || !backdrop) return;
    
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    const targetState = (typeof forceState === 'boolean') ? forceState : !isOpen;

    if(targetState) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
};

window.escapeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

window.mostrarToast = function(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const color = tipo === 'success' ? 'bg-emerald-600 text-white' : (tipo === 'error' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white');
    const iconName = tipo === 'success' ? 'check-circle' : (tipo === 'error' ? 'alert-triangle' : 'info');
    toast.className = `${color} px-4 py-2.5 rounded-xl shadow-xl transform transition-all duration-300 opacity-0 translate-y-4 font-bold text-xs flex items-center gap-2 z-50 border border-white/20 pointer-events-auto max-w-sm sm:max-w-md`;
    toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i><span>${window.escapeHTML(mensaje)}</span>`;
    container.appendChild(toast);
    window.renderLucide();
    setTimeout(() => { toast.classList.remove('opacity-0', 'translate-y-4'); }, 10);
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-4'); setTimeout(() => toast.remove(), 300); }, 3500);
};

window.cambiarTabLogin = function(tab) {
    const formEst = document.getElementById('form-estudiante');
    const formDoc = document.getElementById('form-docente');
    const tabEst = document.getElementById('tab-estudiante');
    const tabDoc = document.getElementById('tab-docente');
    
    if (tab === 'estudiante') {
        formEst.classList.remove('hidden');
        formDoc.classList.add('hidden');
        tabEst.className = 'flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-indigo-700 font-bold rounded-xl shadow-sm w-full text-xs transition-all';
        tabDoc.className = 'flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-500 font-bold rounded-xl w-full text-xs transition-all hover:text-slate-900';
    } else {
        formDoc.classList.remove('hidden');
        formEst.classList.add('hidden');
        tabDoc.className = 'flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-slate-900 font-bold rounded-xl shadow-sm w-full text-xs transition-all';
        tabEst.className = 'flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-500 font-bold rounded-xl w-full text-xs transition-all hover:text-indigo-700';
    }
    window.renderLucide();
};

window.mostrarVistaDocente = function(idVista) {
    document.querySelectorAll('.view-docente').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('block');
    });
    const vistaEl = document.getElementById(idVista);
    if (vistaEl) {
        vistaEl.classList.remove('hidden');
        vistaEl.classList.add('block');
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = "nav-btn w-full text-left hover:bg-white/5 px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 text-xs text-slate-300 hover:text-white";
    });
    
    let btnId = null;
    if (idVista === 'vista-dashboard') btnId = 'nav-dashboard';
    else if (idVista === 'vista-hub-actividades' || idVista === 'vista-actividad' || idVista === 'vista-actividad-lectura' || idVista === 'vista-actividad-juego') btnId = 'nav-actividad';
    else if (idVista === 'vista-estudiantes') btnId = 'nav-estudiantes';

    if(btnId) {
        const b = document.getElementById(btnId);
        if(b) b.className = "nav-btn w-full text-left bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 text-xs shadow-md";
    }
    window.renderLucide();
};

window.renderSelectoresGradosDestino = function(seleccionados = [], containerId = 'contenedor-grados-destino') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    const todosMarcados = seleccionados.includes('Todos');
    
    OPCIONES_DESTINO.forEach(opt => {
        const isChecked = todosMarcados || seleccionados.includes(opt);
        const isDocente = opt === 'Docente';
        const labelColor = isDocente ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-slate-800 bg-white border-slate-200';
        
        let fnChange = 'window.actualizarSelectClasesFormulario()';
        if (containerId === 'contenedor-grados-destino-lectura') fnChange = 'window.actualizarSelectClasesLectura()';
        if (containerId === 'contenedor-grados-destino-juego') fnChange = 'window.actualizarSelectClasesJuego()';

        cont.innerHTML += `
            <label class="flex items-center gap-1.5 p-2 rounded-lg border ${labelColor} cursor-pointer hover:border-indigo-400 text-xs font-bold select-none">
                <input type="checkbox" value="${opt}" onchange="${fnChange}" class="checkbox-grado-${containerId} rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" ${isChecked ? 'checked' : ''}>
                <span>${isDocente ? '⭐ Docente' : opt}</span>
            </label>
        `;
    });
};

window.toggleTodosGradosDestino = function() {
    const boxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino');
    const algunDesmarcado = Array.from(boxes).some(b => !b.checked);
    boxes.forEach(b => b.checked = algunDesmarcado);
    window.actualizarSelectClasesFormulario();
};

window.toggleTodosGradosDestinoLectura = function() {
    const boxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-lectura');
    const algunDesmarcado = Array.from(boxes).some(b => !b.checked);
    boxes.forEach(b => b.checked = algunDesmarcado);
    window.actualizarSelectClasesLectura();
};

window.toggleTodosGradosDestinoJuego = function() {
    const boxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-juego');
    const algunDesmarcado = Array.from(boxes).some(b => !b.checked);
    boxes.forEach(b => b.checked = algunDesmarcado);
    window.actualizarSelectClasesJuego();
};

window.actualizarSelectClasesFormulario = function(claseSeleccionada = '') {
    const select = document.getElementById('select-clase-existente');
    const inputNueva = document.getElementById('input-nueva-clase');
    if(!select || !inputNueva) return;

    const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino:checked');
    const grados = Array.from(checkedBoxes).map(cb => cb.value);

    const clasesSet = new Set();
    window.baseActividades.forEach(act => {
        if (!act.clase || !act.clase.trim()) return;
        const coincide = act.grados && act.grados.some(g => grados.includes(g) || grados.includes('Todos') || g === 'Todos');
        if (coincide || grados.length === 0) clasesSet.add(act.clase.trim());
    });

    select.innerHTML = '<option value="__NUEVA__">+ Crear Nueva Clase...</option>';
    clasesSet.forEach(cl => {
        const sel = (cl === claseSeleccionada) ? 'selected' : '';
        select.innerHTML += `<option value="${window.escapeHTML(cl)}" ${sel}>Clase: ${window.escapeHTML(cl)}</option>`;
    });

    if (claseSeleccionada && clasesSet.has(claseSeleccionada)) {
        select.value = claseSeleccionada;
        inputNueva.classList.add('hidden');
        inputNueva.value = claseSeleccionada;
    } else if (claseSeleccionada) {
        select.value = '__NUEVA__';
        inputNueva.classList.remove('hidden');
        inputNueva.value = claseSeleccionada;
    } else {
        select.value = '__NUEVA__';
        inputNueva.classList.remove('hidden');
        inputNueva.value = '';
    }
};

window.gestionarCambioClase = function() {
    const select = document.getElementById('select-clase-existente');
    const inputNueva = document.getElementById('input-nueva-clase');
    if (!select || !inputNueva) return;
    if (select.value === '__NUEVA__') {
        inputNueva.classList.remove('hidden');
        inputNueva.value = '';
        inputNueva.focus();
    } else {
        inputNueva.classList.add('hidden');
        inputNueva.value = select.value;
    }
};

window.actualizarSelectClasesLectura = function(claseSeleccionada = '') {
    const select = document.getElementById('select-clase-existente-lec');
    const inputNueva = document.getElementById('input-nueva-clase-lec');
    if(!select || !inputNueva) return;

    const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-lectura:checked');
    const grados = Array.from(checkedBoxes).map(cb => cb.value);

    const clasesSet = new Set();
    window.baseActividades.forEach(act => {
        if (!act.clase || !act.clase.trim()) return;
        const coincide = act.grados && act.grados.some(g => grados.includes(g) || grados.includes('Todos') || g === 'Todos');
        if (coincide || grados.length === 0) clasesSet.add(act.clase.trim());
    });

    select.innerHTML = '<option value="__NUEVA__">+ Crear Nueva Clase...</option>';
    clasesSet.forEach(cl => {
        const sel = (cl === claseSeleccionada) ? 'selected' : '';
        select.innerHTML += `<option value="${window.escapeHTML(cl)}" ${sel}>Clase: ${window.escapeHTML(cl)}</option>`;
    });

    if (claseSeleccionada && clasesSet.has(claseSeleccionada)) {
        select.value = claseSeleccionada;
        inputNueva.classList.add('hidden');
        inputNueva.value = claseSeleccionada;
    } else {
        select.value = '__NUEVA__';
        inputNueva.classList.remove('hidden');
        inputNueva.value = claseSeleccionada || '';
    }
};

window.gestionarCambioClaseLectura = function() {
    const select = document.getElementById('select-clase-existente-lec');
    const inputNueva = document.getElementById('input-nueva-clase-lec');
    if (!select || !inputNueva) return;
    if (select.value === '__NUEVA__') {
        inputNueva.classList.remove('hidden');
        inputNueva.value = '';
        inputNueva.focus();
    } else {
        inputNueva.classList.add('hidden');
        inputNueva.value = select.value;
    }
};

/* GESTIÓN CLASES FORMULARIO JUEGO (NUEVO) */
window.actualizarSelectClasesJuego = function(claseSeleccionada = '') {
    const select = document.getElementById('select-clase-existente-juego');
    const inputNueva = document.getElementById('input-nueva-clase-juego');
    if(!select || !inputNueva) return;

    const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-juego:checked');
    const grados = Array.from(checkedBoxes).map(cb => cb.value);

    const clasesSet = new Set();
    window.baseActividades.forEach(act => {
        if (!act.clase || !act.clase.trim()) return;
        const coincide = act.grados && act.grados.some(g => grados.includes(g) || grados.includes('Todos') || g === 'Todos');
        if (coincide || grados.length === 0) clasesSet.add(act.clase.trim());
    });

    select.innerHTML = '<option value="__NUEVA__">+ Crear Nueva Clase...</option>';
    clasesSet.forEach(cl => {
        const sel = (cl === claseSeleccionada) ? 'selected' : '';
        select.innerHTML += `<option value="${window.escapeHTML(cl)}" ${sel}>Clase: ${window.escapeHTML(cl)}</option>`;
    });

    if (claseSeleccionada && clasesSet.has(claseSeleccionada)) {
        select.value = claseSeleccionada;
        inputNueva.classList.add('hidden');
        inputNueva.value = claseSeleccionada;
    } else {
        select.value = '__NUEVA__';
        inputNueva.classList.remove('hidden');
        inputNueva.value = claseSeleccionada || '';
    }
};

window.gestionarCambioClaseJuego = function() {
    const select = document.getElementById('select-clase-existente-juego');
    const inputNueva = document.getElementById('input-nueva-clase-juego');
    if (!select || !inputNueva) return;
    if (select.value === '__NUEVA__') {
        inputNueva.classList.remove('hidden');
        inputNueva.value = '';
        inputNueva.focus();
    } else {
        inputNueva.classList.add('hidden');
        inputNueva.value = select.value;
    }
};

window.renderDashboardDocente = function(filtroGrado = null) {
    window.filtroGradoActual = filtroGrado; 
    window.mostrarVistaDocente('vista-dashboard');
    
    const kpiTot = document.getElementById('kpi-total-actividades');
    if(kpiTot) kpiTot.innerText = window.baseActividades.length;
    
    const listaGrupos = document.getElementById('lista-grupos-docente');
    if(listaGrupos) {
        listaGrupos.innerHTML = '';
        const gradosLabels = []; const promediosData = []; const participacionData = [];

        LISTA_GRADOS.forEach(grado => {
            const actAsignadas = window.baseActividades.filter(a => {
                if(!a || !a.grados || !Array.isArray(a.grados)) return false;
                return a.grados.includes(grado) || a.grados.includes('Todos');
            }).length;
            
            const isActive = window.filtroGradoActual === grado 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white';
            const seguroGrado = window.escapeHTML(grado);
            listaGrupos.innerHTML += `
                <li onclick="window.renderDashboardDocente('${seguroGrado}'); window.toggleSidebarDocente(false);" class="px-3 py-2 cursor-pointer flex justify-between items-center rounded-xl transition-all ${isActive}">
                    <span class="text-xs font-bold flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full ${window.filtroGradoActual === grado ? 'bg-white' : 'bg-indigo-400'}"></span>
                        Grado ${seguroGrado}
                    </span>
                    <span class="bg-black/40 text-slate-200 text-[10px] font-black px-1.5 py-0.5 rounded-md">${actAsignadas}</span>
                </li>
            `;
            
            let totalNotas = 0, count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(`nota_${grado}-`)) { 
                    let valObj = localStorage.getItem(key);
                    try { 
                        let parseado = JSON.parse(valObj); 
                        totalNotas += parseFloat(parseado.nota || valObj); 
                    } catch(e) { 
                        totalNotas += parseFloat(valObj); 
                    }
                    count++; 
                }
            }
            const promStr = count > 0 ? (totalNotas/count).toFixed(1) : '0';
            const porc = actAsignadas > 0 ? (count > 0 ? Math.min(Math.round((count/(actAsignadas*5))*100), 100) : 0) : 0; 
            
            gradosLabels.push(`Grado ${grado}`);
            promediosData.push(parseFloat(promStr));
            participacionData.push(porc);
        });

        if(window.myChart1) window.myChart1.destroy();
        const ctx1 = document.getElementById('chartPromedios');
        if(ctx1) { 
            window.myChart1 = new Chart(ctx1.getContext('2d'), { 
                type: 'bar', 
                data: { labels: gradosLabels, datasets: [{ label: 'Promedio Académico', data: promediosData, backgroundColor: '#6366F1', borderRadius: 6 }] }, 
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 5 } } } 
            }); 
        }

        if(window.myChart2) window.myChart2.destroy();
        const ctx2 = document.getElementById('chartParticipacion');
        if(ctx2) { 
            window.myChart2 = new Chart(ctx2.getContext('2d'), { 
                type: 'line', 
                data: { labels: gradosLabels, datasets: [{ label: '% Participación', data: participacionData, borderColor: '#C026D3', backgroundColor: 'rgba(192, 38, 211, 0.1)', fill: true, tension: 0.3 }] }, 
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } } 
            }); 
        }
    }

    let acts = window.filtroGradoActual ? window.baseActividades.filter(a => {
        if(!a || !a.grados || !Array.isArray(a.grados)) return false;
        return a.grados.includes(window.filtroGradoActual) || a.grados.includes('Todos');
    }) : window.baseActividades;
    
    const tabla = document.getElementById('tabla-actividades-creadas');
    if(tabla) {
        tabla.innerHTML = '';
        [...acts].reverse().forEach(act => {
            if(!act || !Array.isArray(act.grados)) return; 
            const badge = act.estado === 'Activa' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200';
            const btnEstado = act.estado === 'Activa' ? 'Desactivar' : 'Activar';
            const seguroId = window.escapeHTML(act.id);
            const claseNombre = act.clase ? window.escapeHTML(act.clase) : '<span class="text-slate-400 italic">General</span>';
            const intentosTxt = (act.evaluacion && act.evaluacion.intentosPermitidos >= 999) ? 'Ilimitados' : ((act.evaluacion && act.evaluacion.intentosPermitidos) || 1);
            
            let tipoBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">🎬 Video</span>';
            if (act.tipo === 'lectura') {
                tipoBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">📖 Lectura</span>';
            } else if (act.tipo === 'juego') {
                tipoBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🎮 RPG / Juego</span>';
            }

            tabla.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 sm:px-5 py-3 font-extrabold text-slate-900">${window.escapeHTML(act.grados.join(', '))}</td>
                    <td class="px-4 sm:px-5 py-3 font-bold text-indigo-700">${claseNombre}</td>
                    <td class="px-4 sm:px-5 py-3 font-bold text-slate-800">${window.escapeHTML(act.titulo)}</td>
                    <td class="px-4 sm:px-5 py-3 text-center">${tipoBadge}</td>
                    <td class="px-4 sm:px-5 py-3 text-center font-bold text-slate-600">${intentosTxt}</td>
                    <td class="px-4 sm:px-5 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badge}">${window.escapeHTML(act.estado)}</span></td>
                    <td class="px-4 sm:px-5 py-3 text-right space-x-1 whitespace-nowrap">
                        <button type="button" onclick="window.toggleEstadoActividad('${seguroId}')" class="text-[11px] font-bold text-slate-600 border border-slate-200 bg-white px-2.5 py-1 rounded-lg hover:bg-slate-50">${btnEstado}</button>
                        <button type="button" onclick="window.editarActividad('${seguroId}')" class="text-[11px] font-bold text-indigo-700 border border-indigo-200 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100">Editar</button>
                        <button type="button" onclick="window.eliminarActividad('${seguroId}')" class="text-[11px] font-bold text-rose-600 border border-rose-200 bg-rose-50 px-2 py-1 rounded-lg hover:bg-rose-100">🗑️</button>
                        <button type="button" onclick="window.generarReporteActividad('${seguroId}')" class="text-[11px] font-bold text-purple-700 border border-purple-200 bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100">Reporte</button>
                    </td>
                </tr>
            `;
        });
    }
    window.renderLucide();
};

window.sincronizarConNube = async function() {
    document.getElementById('loading-overlay').classList.remove('hidden');
    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'obtenerDatos' }) });
        const result = await response.json();
        
        if(result.success && result.data) {
            window.baseActividades = result.data.actividades || [];
            window.baseEstudiantes = result.data.estudiantes || [];
            localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
            localStorage.setItem('cafelab_estudiantes', JSON.stringify(window.baseEstudiantes));

            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).startsWith('nota_')) keysToRemove.push(localStorage.key(i));
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            if(result.data.entregas) {
                result.data.entregas.forEach(ent => {
                    if(ent.estudianteId && ent.actividadId) {
                        localStorage.setItem(`nota_${ent.estudianteId}_${ent.actividadId}`, JSON.stringify(ent));
                    }
                });
            }
            window.mostrarToast("Sincronización completa con la nube", "success");
        }
    } catch (error) {
        window.mostrarToast("Modo Offline activado.", "warning");
    } finally {
        window.renderDashboardDocente(window.filtroGradoActual);
        window.renderEstudiantesLocales();
        document.getElementById('loading-overlay').classList.add('hidden');
    }
};

/* ACTIVIDADES VIDEO INTERACTIVO */
window.prepararNuevaActividad = function() {
    idActividadEditando = null;
    const formAct = document.getElementById('form-crear-actividad');
    if(formAct) formAct.reset();
    const contPreg = document.getElementById('contenedor-preguntas');
    if(contPreg) contPreg.innerHTML = '';
    
    document.getElementById('titulo-formulario-actividad').innerText = "Crear Nueva Actividad de Video Interactivo";
    document.getElementById('btn-submit-actividad').innerText = "Guardar Actividad y Publicar";
    document.getElementById('toggle-laboratorio').checked = false;
    document.getElementById('lab-fields-config').classList.add('hidden');
    document.getElementById('contenedor-campos-lab').innerHTML = '';
    document.getElementById('intentos-permitidos').value = "1";

    window.renderSelectoresGradosDestino([]);
    window.actualizarSelectClasesFormulario('');
    window.crearBloquePregunta(); 
    window.mostrarVistaDocente('vista-actividad'); 
};

window.editarActividad = function(idActividad) {
    const act = window.baseActividades.find(a => a.id === idActividad);
    if(!act) return;

    if (act.tipo === 'juego') {
        idActividadEditando = act.id;
        document.getElementById('titulo-formulario-juego').innerText = "Editar Juego Pedagógico / RPG";
        document.getElementById('juego-titulo').value = act.titulo || '';
        document.getElementById('juego-url').value = act.urlJuego || '';
        window.renderSelectoresGradosDestino(act.grados || [], 'contenedor-grados-destino-juego');
        window.actualizarSelectClasesJuego(act.clase || '');
        window.mostrarVistaDocente('vista-actividad-juego');
        return;
    }

    if (act.tipo === 'lectura') {
        idActividadEditando = act.id;
        document.getElementById('titulo-formulario-lectura').innerText = "Editar Lectura Interactiva";
        document.getElementById('lec-titulo').value = act.titulo;
        document.getElementById('lec-wpm').value = act.lectura?.wpmSugerido || 165;
        document.getElementById('lec-intentos').value = (act.evaluacion?.intentosPermitidos || 2).toString();
        document.getElementById('lec-texto').value = act.lectura?.texto || '';
        window.actualizarConteoPalabrasDocente(act.lectura?.texto || '');
        
        window.renderSelectoresGradosDestino(act.grados || [], 'contenedor-grados-destino-lectura');
        window.actualizarSelectClasesLectura(act.clase || '');

        const contGlo = document.getElementById('contenedor-items-glosario');
        contGlo.innerHTML = '';
        if(act.lectura?.glosario) {
            act.lectura.glosario.forEach(g => window.agregarFilaGlosarioDocente(g.termino, g.def));
        }

        const contP = document.getElementById('contenedor-preguntas-lectura');
        contP.innerHTML = '';
        if(act.preguntas) {
            act.preguntas.forEach(p => window.crearBloquePreguntaLecturaDocente(p.texto, p.opciones, p.correcta, p.feedback, p.parrafoPausa || 0));
        }
        window.mostrarVistaDocente('vista-actividad-lectura');
        return;
    }

    idActividadEditando = act.id;
    document.getElementById('titulo-formulario-actividad').innerText = "Editar Actividad Interactiva";
    document.getElementById('btn-submit-actividad').innerText = "Actualizar Actividad";

    window.renderSelectoresGradosDestino(act.grados || []);
    window.actualizarSelectClasesFormulario(act.clase || '');
    
    document.getElementById('url-video').value = `https://youtube.com/watch?v=${act.video.id}`;
    document.getElementById('titulo-clase').value = act.titulo;
    document.getElementById('objetivo-actividad').value = act.pedagogia.objetivo || "";
    document.getElementById('descripcion-actividad').value = act.pedagogia.descripcion || "";
    document.getElementById('intentos-permitidos').value = (act.evaluacion && act.evaluacion.intentosPermitidos) ? act.evaluacion.intentosPermitidos.toString() : "1";
    
    const checkLab = document.getElementById('toggle-laboratorio');
    checkLab.checked = act.requiereLaboratorio || false;
    document.getElementById('lab-fields-config').classList.toggle('hidden', !checkLab.checked);

    document.getElementById('contenedor-campos-lab').innerHTML = '';
    if(act.laboratorioCampos && act.laboratorioCampos.length > 0) {
        act.laboratorioCampos.forEach(c => window.agregarCampoLabConfig(c));
    } else if (checkLab.checked) {
        window.agregarCampoLabConfig('Temperatura (°C)'); window.agregarCampoLabConfig('Grados Brix / TDS (%)');
    }

    const cont = document.getElementById('contenedor-preguntas');
    cont.innerHTML = '';
    if(act.preguntas && act.preguntas.length > 0) {
        act.preguntas.forEach(p => { window.crearBloquePregunta(p.tiempo, p.texto, p.opciones, p.correcta, p.feedback); });
    } else {
        window.crearBloquePregunta();
    }

    window.mostrarVistaDocente('vista-actividad'); 
};

window.crearBloquePregunta = function(t='', p='', oArr=[], c='1', f='') {
    const contPreguntas = document.getElementById('contenedor-preguntas');
    if(!contPreguntas) return;
    const div = document.createElement('div');
    div.className = "p-3 sm:p-4 border border-slate-200 rounded-xl bg-slate-50 relative mt-2";
    
    const opt1 = window.escapeHTML(oArr[0] || ''); 
    const opt2 = window.escapeHTML(oArr[1] || '');
    const opt3 = window.escapeHTML(oArr[2] || ''); 
    const opt4 = window.escapeHTML(oArr[3] || '');
    
    let rawC = String(c).trim().toUpperCase();
    let selC = '1';
    if (rawC === '2' || rawC === 'B' || rawC === 'OPCIÓN 2' || rawC === 'OPCION 2') selC = '2';
    else if (rawC === '3' || rawC === 'C' || rawC === 'OPCIÓN 3' || rawC === 'OPCION 3') selC = '3';
    else if (rawC === '4' || rawC === 'D' || rawC === 'OPCIÓN 4' || rawC === 'OPCION 4') selC = '4';

    div.innerHTML = `
        <button type="button" class="absolute top-2 right-2 text-rose-600 font-bold p-1 text-xs" onclick="this.parentElement.remove()">✕ Quitar</button>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 mt-4 sm:mt-1">
            <div class="col-span-1">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Segundo de pausa</label>
                <input type="number" value="${window.escapeHTML(t)}" class="q-time w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold" required>
            </div>
            <div class="col-span-1 sm:col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Pregunta</label>
                <input type="text" value="${window.escapeHTML(p)}" class="q-text w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold" required>
            </div>
            <div class="col-span-1 sm:col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Retroalimentación pedagógica</label>
                <input type="text" placeholder="Ej: Recuerda la temperatura óptima..." value="${window.escapeHTML(f)}" class="q-feedback w-full p-2 border border-slate-200 rounded-lg bg-white text-xs">
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input type="text" placeholder="Opción 1" value="${opt1}" class="q-opt1 p-2 border border-slate-200 rounded-lg bg-white text-xs" required>
            <input type="text" placeholder="Opción 2" value="${opt2}" class="q-opt2 p-2 border border-slate-200 rounded-lg bg-white text-xs" required>
            <input type="text" placeholder="Opción 3" value="${opt3}" class="q-opt3 p-2 border border-slate-200 rounded-lg bg-white text-xs">
            <input type="text" placeholder="Opción 4" value="${opt4}" class="q-opt4 p-2 border border-slate-200 rounded-lg bg-white text-xs">
        </div>
        <div class="flex items-center gap-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase">Opción Correcta:</label>
            <select class="q-correct p-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-indigo-700">
                <option value="1" ${selC === '1' ? 'selected' : ''}>Opción 1</option>
                <option value="2" ${selC === '2' ? 'selected' : ''}>Opción 2</option>
                <option value="3" ${selC === '3' ? 'selected' : ''}>Opción 3</option>
                <option value="4" ${selC === '4' ? 'selected' : ''}>Opción 4</option>
            </select>
        </div>
    `;
    contPreguntas.appendChild(div);
};

window.agregarCampoLabConfig = function(val = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center";
    div.innerHTML = `
        <input type="text" value="${window.escapeHTML(val)}" placeholder="Nombre variable (ej: pH)" class="campo-lab-input w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold">
        <button type="button" onclick="this.parentElement.remove()" class="text-rose-500 p-1 font-bold text-xs">✕</button>
    `;
    document.getElementById('contenedor-campos-lab').appendChild(div);
};

window.eliminarActividad = async function(idActividad) {
    if(confirm("¿Eliminar actividad permanentemente?")) {
        window.baseActividades = window.baseActividades.filter(a => a.id !== idActividad);
        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.renderDashboardDocente(window.filtroGradoActual); 
        try {
            await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'eliminarActividad', id: idActividad }) });
            window.mostrarToast("Actividad eliminada", "success");
        } catch(e) {}
    }
};

window.toggleEstadoActividad = function(idActividad) {
    const index = window.baseActividades.findIndex(a => a.id === idActividad);
    if (index > -1) {
        window.baseActividades[index].estado = window.baseActividades[index].estado === 'Activa' ? 'Desactivada' : 'Activa';
        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.renderDashboardDocente(window.filtroGradoActual); 
        window.mostrarToast("Actividad actualizada", "success");
    }
};

window.guardarActividad = async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-actividad');
    if(btnSubmit) btnSubmit.disabled = true;

    try {
        const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino:checked');
        let gradosSeleccionados = Array.from(checkedBoxes).map(cb => cb.value);
        if (gradosSeleccionados.length === 0) {
            window.mostrarToast("Selecciona al menos un grado o Docente", "warning");
            if(btnSubmit) btnSubmit.disabled = false;
            return;
        }
        if (gradosSeleccionados.length === OPCIONES_DESTINO.length) gradosSeleccionados = ['Todos', ...OPCIONES_DESTINO];

        let nombreClaseFinal = document.getElementById('input-nueva-clase').value.trim();
        if (!nombreClaseFinal) {
            const selClase = document.getElementById('select-clase-existente').value;
            if (selClase !== '__NUEVA__') nombreClaseFinal = selClase;
        }
        if (!nombreClaseFinal) nombreClaseFinal = "General";

        const inputTitulo = document.getElementById('titulo-clase').value;
        const inputUrl = document.getElementById('url-video').value;
        const inputObjetivo = document.getElementById('objetivo-actividad').value;
        const inputDescripcion = document.getElementById('descripcion-actividad').value;
        const intentosPerm = parseInt(document.getElementById('intentos-permitidos').value) || 1;
        const reqLaboratorio = document.getElementById('toggle-laboratorio').checked;
        
        let labCampos = [];
        if(reqLaboratorio) {
            document.querySelectorAll('.campo-lab-input').forEach(inp => { if(inp.value.trim()) labCampos.push(inp.value.trim()); });
        }

        let arregloPreguntas = [];
        document.querySelectorAll('#contenedor-preguntas > div').forEach(r => {
            const timeEl = r.querySelector('.q-time');
            const textEl = r.querySelector('.q-text');
            const fdbkEl = r.querySelector('.q-feedback');
            const rawOpts = [ r.querySelector('.q-opt1').value, r.querySelector('.q-opt2').value, r.querySelector('.q-opt3').value, r.querySelector('.q-opt4').value ];
            const correctVal = r.querySelector('.q-correct').value;

            let finalOptions = []; let finalCorrect = 1; let actualIndex = 1;
            for(let i = 0; i < 4; i++){
                if(rawOpts[i] && rawOpts[i].trim()){
                    finalOptions.push(rawOpts[i].trim());
                    if(parseInt(correctVal) === (i + 1)) finalCorrect = actualIndex;
                    actualIndex++;
                }
            }
            if(finalOptions.length > 0) {
                arregloPreguntas.push({ tiempo: parseInt(timeEl.value) || 0, texto: textEl.value, opciones: finalOptions, correcta: finalCorrect, feedback: fdbkEl.value || '', respondida: false });
            }
        });

        let payloadEnviar = null;
        if (idActividadEditando) {
            const idx = window.baseActividades.findIndex(a => a.id === idActividadEditando);
            if(idx !== -1) {
                window.baseActividades[idx].grados = gradosSeleccionados;
                window.baseActividades[idx].clase = nombreClaseFinal;
                window.baseActividades[idx].titulo = inputTitulo;
                window.baseActividades[idx].video = { provider: 'youtube', id: extraerIdYouTubeFront(inputUrl) };
                window.baseActividades[idx].pedagogia = { objetivo: inputObjetivo, descripcion: inputDescripcion };
                window.baseActividades[idx].evaluacion = { intentosPermitidos: intentosPerm, notaMinima: 3.0 };
                window.baseActividades[idx].requiereLaboratorio = reqLaboratorio;
                window.baseActividades[idx].laboratorioCampos = labCampos;
                window.baseActividades[idx].preguntas = arregloPreguntas;
                payloadEnviar = window.baseActividades[idx];
            }
        } else {
            const nuevoId = "ACT_" + Date.now().toString(36).toUpperCase();
            const d = new Date();
            const nuevaActividad = {
                id: nuevoId, version: 1, clase: nombreClaseFinal, titulo: inputTitulo, grados: gradosSeleccionados, estado: "Activa",
                fechaCreacion: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
                video: { provider: 'youtube', id: extraerIdYouTubeFront(inputUrl) },
                pedagogia: { objetivo: inputObjetivo, descripcion: inputDescripcion },
                evaluacion: { intentosPermitidos: intentosPerm, notaMinima: 3.0 },
                requiereLaboratorio: reqLaboratorio, laboratorioCampos: labCampos,
                preguntas: arregloPreguntas
            };
            window.baseActividades.push(nuevaActividad);
            payloadEnviar = nuevaActividad;
        }
        
        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.mostrarToast("Actividad guardada con éxito", "success");
        document.getElementById('nav-dashboard').click(); 
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'crearActividad', payload: payloadEnviar }) }).catch(()=>{});
    } catch(err) {
        window.mostrarToast("Error al procesar formulario", "error");
    } finally {
        if(btnSubmit) btnSubmit.disabled = false;
    }
};

/* GESTIÓN DOCENTE: LECTURA */
window.prepararNuevaActividadLectura = function() {
    idActividadEditando = null;
    const form = document.getElementById('form-crear-lectura');
    if (form) form.reset();
    
    document.getElementById('titulo-formulario-lectura').innerText = "Crear Nueva Lectura Interactiva";
    document.getElementById('contenedor-items-glosario').innerHTML = '';
    document.getElementById('contenedor-preguntas-lectura').innerHTML = '';
    
    window.actualizarConteoPalabrasDocente('');
    window.renderSelectoresGradosDestino([], 'contenedor-grados-destino-lectura');
    window.actualizarSelectClasesLectura('');
    window.agregarFilaGlosarioDocente();
    window.crearBloquePreguntaLecturaDocente();
    
    window.mostrarVistaDocente('vista-actividad-lectura');
};

window.actualizarConteoPalabrasDocente = function(texto) {
    const palabras = texto && texto.trim() ? texto.trim().split(/\s+/).length : 0;
    const wpmInput = document.getElementById('lec-wpm');
    const wpm = wpmInput ? (parseInt(wpmInput.value) || 165) : 165;
    const seg = Math.round((palabras / wpm) * 60);
    const cont = document.getElementById('lec-contador-palabras');
    if (cont) cont.innerText = `${palabras} palabras (~${seg} seg a ${wpm} WPM)`;
};

window.agregarFilaGlosarioDocente = function(term='', def='') {
    const cont = document.getElementById('contenedor-items-glosario');
    if (!cont) return;
    const div = document.createElement('div');
    div.className = "flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-lg border border-slate-200";
    div.innerHTML = `
        <input type="text" placeholder="Término (ej: endospermo)" value="${window.escapeHTML(term)}" class="glo-term w-full sm:w-1/3 p-2 border border-slate-200 rounded-md text-xs font-bold text-slate-800">
        <input type="text" placeholder="Definición pedagógica..." value="${window.escapeHTML(def)}" class="glo-def w-full sm:w-2/3 p-2 border border-slate-200 rounded-md text-xs">
        <button type="button" onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 font-bold p-1 text-xs">✕</button>
    `;
    cont.appendChild(div);
};

window.crearBloquePreguntaLecturaDocente = function(texto='', opts=[], corr='1', fdbk='', parrafoPausa=0) {
    const cont = document.getElementById('contenedor-preguntas-lectura');
    if (!cont) return;
    const div = document.createElement('div');
    div.className = "p-3 sm:p-4 border border-slate-200 rounded-xl bg-slate-50 relative mt-2";

    const opt1 = window.escapeHTML(opts[0] || '');
    const opt2 = window.escapeHTML(opts[1] || '');
    const opt3 = window.escapeHTML(opts[2] || '');
    const opt4 = window.escapeHTML(opts[3] || '');
    const cStr = String(corr);
    const pPausaNum = parseInt(parrafoPausa) || 0;

    div.innerHTML = `
        <button type="button" class="absolute top-2 right-2 text-rose-600 font-bold p-1 text-xs" onclick="this.parentElement.remove()">✕ Quitar</button>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 mt-4 sm:mt-1">
            <div class="col-span-1">
                <label class="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Momento de Parada</label>
                <select class="q-lec-parrafo-pausa w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-bold text-emerald-800">
                    <option value="0" ${pPausaNum === 0 ? 'selected' : ''}>Al finalizar lectura</option>
                    <option value="1" ${pPausaNum === 1 ? 'selected' : ''}>Pausa: Fin Párrafo 1</option>
                    <option value="2" ${pPausaNum === 2 ? 'selected' : ''}>Pausa: Fin Párrafo 2</option>
                    <option value="3" ${pPausaNum === 3 ? 'selected' : ''}>Pausa: Fin Párrafo 3</option>
                    <option value="4" ${pPausaNum === 4 ? 'selected' : ''}>Pausa: Fin Párrafo 4</option>
                    <option value="5" ${pPausaNum === 5 ? 'selected' : ''}>Pausa: Fin Párrafo 5</option>
                    <option value="6" ${pPausaNum === 6 ? 'selected' : ''}>Pausa: Fin Párrafo 6</option>
                </select>
            </div>
            <div class="col-span-1 sm:col-span-3">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Pregunta Tipo Saber</label>
                <input type="text" value="${window.escapeHTML(texto)}" class="q-lec-text w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-semibold" required>
            </div>
            <div class="col-span-1 sm:col-span-4">
                <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Retroalimentación Formativa</label>
                <input type="text" placeholder="Retroalimentación al estudiante..." value="${window.escapeHTML(fdbk)}" class="q-lec-feedback w-full p-2 border border-slate-200 rounded-lg bg-white text-xs">
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input type="text" placeholder="Opción 1" value="${opt1}" class="q-lec-opt1 p-2 border border-slate-200 rounded-lg bg-white text-xs" required>
            <input type="text" placeholder="Opción 2" value="${opt2}" class="q-lec-opt2 p-2 border border-slate-200 rounded-lg bg-white text-xs" required>
            <input type="text" placeholder="Opción 3" value="${opt3}" class="q-lec-opt3 p-2 border border-slate-200 rounded-lg bg-white text-xs">
            <input type="text" placeholder="Opción 4" value="${opt4}" class="q-lec-opt4 p-2 border border-slate-200 rounded-lg bg-white text-xs">
        </div>
        <div class="flex items-center gap-2">
            <label class="text-[10px] font-bold text-slate-500 uppercase">Opción Correcta:</label>
            <select class="q-lec-correct p-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-emerald-700">
                <option value="1" ${cStr === '1' ? 'selected' : ''}>Opción 1</option>
                <option value="2" ${cStr === '2' ? 'selected' : ''}>Opción 2</option>
                <option value="3" ${cStr === '3' ? 'selected' : ''}>Opción 3</option>
                <option value="4" ${cStr === '4' ? 'selected' : ''}>Opción 4</option>
            </select>
        </div>
    `;
    cont.appendChild(div);
};

window.guardarActividadLectura = async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-lectura');
    if(btnSubmit) btnSubmit.disabled = true;

    try {
        const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-lectura:checked');
        let gradosSeleccionados = Array.from(checkedBoxes).map(cb => cb.value);
        if (gradosSeleccionados.length === 0) {
            window.mostrarToast("Selecciona al menos un grado o Docente", "warning");
            if(btnSubmit) btnSubmit.disabled = false;
            return;
        }
        if (gradosSeleccionados.length === OPCIONES_DESTINO.length) gradosSeleccionados = ['Todos', ...OPCIONES_DESTINO];

        let nombreClaseFinal = document.getElementById('input-nueva-clase-lec').value.trim();
        if (!nombreClaseFinal) {
            const selClase = document.getElementById('select-clase-existente-lec').value;
            if (selClase !== '__NUEVA__') nombreClaseFinal = selClase;
        }
        if (!nombreClaseFinal) nombreClaseFinal = "General";

        const titulo = document.getElementById('lec-titulo').value.trim();
        const wpm = parseInt(document.getElementById('lec-wpm').value) || 165;
        const intentos = parseInt(document.getElementById('lec-intentos').value) || 2;
        const texto = document.getElementById('lec-texto').value.trim();

        const glosario = [];
        document.querySelectorAll('#contenedor-items-glosario > div').forEach(row => {
            const term = row.querySelector('.glo-term').value.trim();
            const def = row.querySelector('.glo-def').value.trim();
            if (term && def) glosario.push({ termino: term, def: def });
        });

        const preguntas = [];
        document.querySelectorAll('#contenedor-preguntas-lectura > div').forEach(row => {
            const txt = row.querySelector('.q-lec-text').value.trim();
            const fdbk = row.querySelector('.q-lec-feedback').value.trim();
            const o1 = row.querySelector('.q-lec-opt1').value.trim();
            const o2 = row.querySelector('.q-lec-opt2').value.trim();
            const o3 = row.querySelector('.q-lec-opt3').value.trim();
            const o4 = row.querySelector('.q-lec-opt4').value.trim();
            const corr = parseInt(row.querySelector('.q-lec-correct').value) || 1;
            const parPausa = parseInt(row.querySelector('.q-lec-parrafo-pausa').value) || 0;
            
            const opciones = [o1, o2, o3, o4].filter(Boolean);
            if (txt && opciones.length >= 2) {
                preguntas.push({
                    texto: txt,
                    opciones,
                    correcta: corr,
                    feedback: fdbk,
                    parrafoPausa: parPausa,
                    respondida: false
                });
            }
        });

        let payload = null;
        if (idActividadEditando) {
            const idx = window.baseActividades.findIndex(a => a.id === idActividadEditando);
            if(idx !== -1) {
                window.baseActividades[idx].grados = gradosSeleccionados;
                window.baseActividades[idx].clase = nombreClaseFinal;
                window.baseActividades[idx].titulo = titulo;
                window.baseActividades[idx].evaluacion = { intentosPermitidos: intentos, notaMinima: 3.0 };
                window.baseActividades[idx].lectura = { wpmSugerido: wpm, texto, glosario };
                window.baseActividades[idx].preguntas = preguntas;
                payload = window.baseActividades[idx];
            }
        } else {
            const nuevoId = "ACT_LEC_" + Date.now().toString(36).toUpperCase();
            const d = new Date();
            const nueva = {
                id: nuevoId,
                tipo: "lectura",
                version: 1,
                clase: nombreClaseFinal,
                titulo: titulo,
                grados: gradosSeleccionados,
                estado: "Activa",
                fechaCreacion: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
                evaluacion: { intentosPermitidos: intentos, notaMinima: 3.0 },
                lectura: { wpmSugerido: wpm, texto, glosario },
                preguntas: preguntas
            };
            window.baseActividades.push(nueva);
            payload = nueva;
        }

        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.mostrarToast("Lectura guardada con éxito", "success");
        document.getElementById('nav-dashboard').click();
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'crearActividad', payload }) }).catch(()=>{});
    } catch(e) {
        window.mostrarToast("Error al guardar lectura", "error");
    } finally {
        if(btnSubmit) btnSubmit.disabled = false;
    }
};

/* GESTIÓN DOCENTE: JUEGOS PEDAGÓGICOS Y RPG (NUEVO) */
window.prepararNuevaActividadJuego = function() {
    idActividadEditando = null;
    const form = document.getElementById('form-crear-juego');
    if (form) form.reset();
    document.getElementById('titulo-formulario-juego').innerText = "Vincular Juego / RPG Interactivo";
    window.renderSelectoresGradosDestino([], 'contenedor-grados-destino-juego');
    window.actualizarSelectClasesJuego('');
    window.mostrarVistaDocente('vista-actividad-juego');
};

window.guardarActividadJuego = async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-juego');
    if(btnSubmit) btnSubmit.disabled = true;

    try {
        const checkedBoxes = document.querySelectorAll('.checkbox-grado-contenedor-grados-destino-juego:checked');
        let gradosSeleccionados = Array.from(checkedBoxes).map(cb => cb.value);
        if (gradosSeleccionados.length === 0) {
            window.mostrarToast("Selecciona al menos un grado o Docente", "warning");
            if(btnSubmit) btnSubmit.disabled = false;
            return;
        }
        if (gradosSeleccionados.length === OPCIONES_DESTINO.length) gradosSeleccionados = ['Todos', ...OPCIONES_DESTINO];

        let nombreClaseFinal = document.getElementById('input-nueva-clase-juego').value.trim();
        if (!nombreClaseFinal) {
            const selClase = document.getElementById('select-clase-existente-juego').value;
            if (selClase !== '__NUEVA__') nombreClaseFinal = selClase;
        }
        if (!nombreClaseFinal) nombreClaseFinal = "General";

        const titulo = document.getElementById('juego-titulo').value.trim();
        const urlJuego = document.getElementById('juego-url').value.trim();

        let payload = null;
        if (idActividadEditando) {
            const idx = window.baseActividades.findIndex(a => a.id === idActividadEditando);
            if(idx !== -1) {
                window.baseActividades[idx].grados = gradosSeleccionados;
                window.baseActividades[idx].clase = nombreClaseFinal;
                window.baseActividades[idx].titulo = titulo;
                window.baseActividades[idx].urlJuego = urlJuego;
                payload = window.baseActividades[idx];
            }
        } else {
            const nuevoId = "ACT_JUEGO_" + Date.now().toString(36).toUpperCase();
            const d = new Date();
            const nueva = {
                id: nuevoId,
                tipo: "juego",
                version: 1,
                clase: nombreClaseFinal,
                titulo: titulo,
                urlJuego: urlJuego,
                grados: gradosSeleccionados,
                estado: "Activa",
                fechaCreacion: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
                evaluacion: { intentosPermitidos: 999, notaMinima: 3.0 }
            };
            window.baseActividades.push(nueva);
            payload = nueva;
        }

        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.mostrarToast("Juego educativo publicado con éxito", "success");
        document.getElementById('nav-dashboard').click();
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'crearActividad', payload }) }).catch(()=>{});
    } catch(err) {
        window.mostrarToast("Error al guardar juego", "error");
    } finally {
        if(btnSubmit) btnSubmit.disabled = false;
    }
};

/* LANZADOR Y VISOR DE JUEGOS INMERSIVOS */
window.iniciarJuegoInmersivo = function(actividad) {
    actividadActual = actividad;
    document.getElementById('juego-inmersivo-titulo').innerText = actividad.titulo;
    const iframe = document.getElementById('iframe-juego');
    
    const sep = actividad.urlJuego.includes('?') ? '&' : '?';
    iframe.src = `${actividad.urlJuego}${sep}estudianteId=${encodeURIComponent(estudianteIdActual)}&actividadId=${encodeURIComponent(actividad.id)}`;

    document.getElementById('vista-juego-inmersivo').classList.remove('hidden');
    document.getElementById('vista-juego-inmersivo').classList.add('flex');
    window.renderLucide();
};

window.salirModoJuego = function() {
    const iframe = document.getElementById('iframe-juego');
    iframe.src = '';
    document.getElementById('vista-juego-inmersivo').classList.add('hidden');
    document.getElementById('vista-juego-inmersivo').classList.remove('flex');
    window.volverDashboardEstudiante();
};

/* RECEPTOR DE ENTREGAS GAMIFICADAS (POSTMESSAGE) */
window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'guardarEntregaJuego') {
        const d = event.data;
        const totalIntentos = d.intentosTotales || 1;
        const notaFinal = d.nota || "5.0";

        const entrega = {
            idEntrega: "ENT_RPG_" + Date.now().toString(36).toUpperCase(),
            estudianteId: estudianteIdActual || d.estudianteId,
            actividadId: d.actividadId,
            versionActividad: 1,
            correctas: d.correctas || 5,
            resueltas: 5,
            nota: notaFinal,
            numeroIntento: totalIntentos,
            fecha: new Date().toLocaleString(),
            laboratorio: { "Mundos Superados": "5/5", "Intentos Utilizados": `#${totalIntentos}` },
            reflexion: d.reflexion || `Completó el recorrido pedagógico en ${totalIntentos} intento(s).`,
            respuestas: d.respuestas || [],
            validador: btoa("RPG_" + estudianteIdActual + "_CafeLab")
        };

        localStorage.setItem(`nota_${entrega.estudianteId}_${entrega.actividadId}`, JSON.stringify(entrega));
        window.mostrarToast(`¡Misión cumplida en ${totalIntentos} intento(s)! Calificación: ${notaFinal}`, "success");
        window.salirModoJuego();
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'guardarNota', payload: entrega }) }).catch(()=>{});
    }
});

/* CSV PARSER */
window.abrirModalPegarCSV = function() {
    const modal = document.getElementById('modal-pegar-csv');
    const txtArea = document.getElementById('texto-pegar-csv');
    if (txtArea) txtArea.value = '';
    if (modal) modal.classList.remove('hidden');
    window.renderLucide();
};

window.confirmarPegadoCSV = function() {
    const txt = document.getElementById('texto-pegar-csv').value.trim();
    if (!txt) {
        window.mostrarToast("Por favor pega el contenido CSV", "warning");
        return;
    }
    document.getElementById('modal-pegar-csv').classList.add('hidden');
    window.procesarTextoCSV(txt);
};

window.cargarActividadDesdeCSV = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        window.procesarTextoCSV(text);
        event.target.value = '';
    };
    reader.readAsText(file, "UTF-8");
};

window.procesarTextoCSV = function(csvText) {
    let limpio = csvText.trim();
    if (limpio.startsWith('```csv')) limpio = limpio.replace(/^```csv\s*/, '');
    if (limpio.startsWith('```')) limpio = limpio.replace(/^```\s*/, '');
    if (limpio.endsWith('```')) limpio = limpio.replace(/\s*```$/, '');
    limpio = limpio.trim();

    const parseCSV = (str) => {
        const arr = [];
        let quote = false;
        let col = 0, row = 0;
        for (let c = 0; c < str.length; c++) {
            let cc = str[c], nc = str[c+1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';

            if (cc === '"' && quote && nc === '"') { arr[row][col] += '"'; ++c; continue; }
            if (cc === '"') { quote = !quote; continue; }
            if (cc === ',' && !quote) { ++col; continue; }
            if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc === '\n' && !quote) { ++row; col = 0; continue; }
            if (cc === '\r' && !quote) { ++row; col = 0; continue; }
            arr[row][col] += cc;
        }
        return arr.filter(r => r.some(cell => cell && cell.trim().length > 0));
    };

    const filas = parseCSV(limpio);
    if (filas.length < 2) {
        window.mostrarToast("El archivo o texto no contiene suficientes filas", "error");
        return;
    }

    const headers = filas[0].map(h => h.trim().toLowerCase());
    const getVal = (row, key) => {
        const idx = headers.indexOf(key.toLowerCase());
        return idx !== -1 && row[idx] ? row[idx].trim() : '';
    };

    const primera = filas[1];
    const tipo = getVal(primera, 'tipo').toLowerCase();

    if (tipo === 'lectura' || headers.includes('texto')) {
        const rawGlosario = getVal(primera, 'glosario');
        const glosarioArray = [];
        if (rawGlosario) {
            rawGlosario.split(';').forEach(par => {
                const parts = par.split(':');
                if (parts.length >= 2) glosarioArray.push({ termino: parts[0].trim(), def: parts.slice(1).join(':').trim() });
            });
        }

        const preguntas = [];
        for (let i = 1; i < filas.length; i++) {
            const pTexto = getVal(filas[i], 'pregunta');
            if (pTexto) {
                const parPausa = parseInt(getVal(filas[i], 'parrafo_pausa') || getVal(filas[i], 'parrafo') || 0);
                preguntas.push({
                    texto: pTexto,
                    opciones: [
                        getVal(filas[i], 'opcion1'),
                        getVal(filas[i], 'opcion2'),
                        getVal(filas[i], 'opcion3'),
                        getVal(filas[i], 'opcion4')
                    ].filter(Boolean),
                    correcta: parseInt(getVal(filas[i], 'correcta')) || 1,
                    feedback: getVal(filas[i], 'feedback') || '',
                    parrafoPausa: parPausa,
                    respondida: false
                });
            }
        }

        const d = new Date();
        const nuevaLectura = {
            id: "ACT_LEC_" + Date.now().toString(36).toUpperCase(),
            tipo: "lectura",
            version: 1,
            clase: getVal(primera, 'clase') || 'General',
            titulo: getVal(primera, 'titulo'),
            grados: getVal(primera, 'grados').split(';').map(g => g.trim()).filter(Boolean),
            estado: "Activa",
            fechaCreacion: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
            evaluacion: { intentosPermitidos: parseInt(getVal(primera, 'intentos')) || 2, notaMinima: 3.0 },
            lectura: {
                wpmSugerido: parseInt(getVal(primera, 'wpm')) || 165,
                texto: getVal(primera, 'texto').replace(/\\n/g, '\n'),
                glosario: glosarioArray
            },
            preguntas: preguntas
        };

        window.baseActividades.push(nuevaLectura);
        localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
        window.renderDashboardDocente(window.filtroGradoActual);
        window.mostrarToast(`Lectura "${nuevaLectura.titulo}" importada con éxito`, "success");
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'crearActividad', payload: nuevaLectura }) }).catch(()=>{});
        return;
    }

    document.getElementById('titulo-clase').value = getVal(primera, 'titulo');
    document.getElementById('url-video').value = getVal(primera, 'youtube_url');
    document.getElementById('objetivo-actividad').value = getVal(primera, 'objetivo');
    document.getElementById('descripcion-actividad').value = getVal(primera, 'descripcion');

    const claseCSV = getVal(primera, 'clase') || 'General';
    const intentosCSV = parseInt(getVal(primera, 'intentos')) || 1;
    document.getElementById('intentos-permitidos').value = intentosCSV.toString();

    const rawGrados = getVal(primera, 'grados').split(';').map(g => g.trim()).filter(Boolean);
    window.renderSelectoresGradosDestino(rawGrados);
    window.actualizarSelectClasesFormulario(claseCSV);

    const reqLab = getVal(primera, 'requiere_lab').toUpperCase() === 'SI';
    const checkLab = document.getElementById('toggle-laboratorio');
    checkLab.checked = reqLab;
    document.getElementById('lab-fields-config').classList.toggle('hidden', !reqLab);
    
    const contLab = document.getElementById('contenedor-campos-lab');
    contLab.innerHTML = '';
    if (reqLab) {
        const campos = getVal(primera, 'campos_lab').split(';').map(c => c.trim()).filter(Boolean);
        campos.forEach(c => window.agregarCampoLabConfig(c));
    }

    const contPreguntas = document.getElementById('contenedor-preguntas');
    contPreguntas.innerHTML = '';

    let pregCount = 0;
    for (let i = 1; i < filas.length; i++) {
        const r = filas[i];
        const seg = parseInt(getVal(r, 'segundo')) || 0;
        const texto = getVal(r, 'pregunta');
        const feedback = getVal(r, 'feedback');
        const opc1 = getVal(r, 'opcion1');
        const opc2 = getVal(r, 'opcion2');
        const opc3 = getVal(r, 'opcion3');
        const opc4 = getVal(r, 'opcion4');
        const correctaRaw = getVal(r, 'correcta') || '1';

        if (texto) {
            window.crearBloquePregunta(seg, texto, [opc1, opc2, opc3, opc4], correctaRaw, feedback);
            pregCount++;
        }
    }

    window.mostrarToast(`Actividad y ${pregCount} preguntas cargadas correctamente`, "success");
    window.renderLucide();
};

/* AUTENTICACIÓN */
window.loginDocente = async function(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-docente');
    const inputPass = document.getElementById('pass-docente');
    if (!inputPass) return;
    
    const password = inputPass.value.trim();
    if (!password) {
        window.mostrarToast("Por favor ingresa la contraseña", "warning");
        return;
    }

    if (btnSubmit) btnSubmit.disabled = true;

    const abrirPanelAdmin = () => {
        const loginPanel = document.getElementById('login-panel');
        const panelDoc = document.getElementById('panel-docente');
        if (loginPanel) loginPanel.classList.add('hidden');
        if (panelDoc) {
            panelDoc.classList.remove('hidden');
            panelDoc.classList.add('flex');
        }
        window.renderDashboardDocente(window.filtroGradoActual);
        window.mostrarToast("Bienvenido al Dashboard Administrador", "success");
    };

    if (password === "AdminCafeLab") {
        abrirPanelAdmin();
        if (btnSubmit) btnSubmit.disabled = false;
        window.sincronizarConNube().catch(() => {});
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'validarDocente', password: password })
        });
        const result = await response.json();
        
        if (result && result.success) {
            abrirPanelAdmin();
            window.sincronizarConNube().catch(() => {});
        } else {
            window.mostrarToast(result.error || "Contraseña incorrecta", "error");
        }
    } catch (error) {
        window.mostrarToast("Error de conexión. Si usas la clave maestra usa: AdminCafeLab", "error");
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
};

window.agregarEstudiante = async function(e) {
    e.preventDefault();
    const grado = document.getElementById('new-est-grado').value;
    const codigo = document.getElementById('new-est-codigo').value.trim();
    const nombre = document.getElementById('new-est-nombre').value.trim();
    const pass = codigo + nombre.charAt(0).toUpperCase();

    window.baseEstudiantes.push({ grado, codigo, nombre, pass });
    localStorage.setItem('cafelab_estudiantes', JSON.stringify(window.baseEstudiantes));
    window.renderEstudiantesLocales();
    e.target.reset();
    window.mostrarToast(`${grado === 'Docente' ? 'Docente' : 'Estudiante'} guardado. Clave: ${pass}`, "success");
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'agregarEstudiante', payload: {grado, codigo, nombre} }) }).catch(()=>{});
};

window.eliminarUsuarioDirectorio = async function(grado, codigo, nombre) {
    if (confirm(`¿Eliminar a ${nombre} (${grado} - ${codigo})?`)) {
        window.baseEstudiantes = window.baseEstudiantes.filter(e => !(String(e.grado) === String(grado) && String(e.codigo).trim().toLowerCase() === String(codigo).trim().toLowerCase()));
        localStorage.setItem('cafelab_estudiantes', JSON.stringify(window.baseEstudiantes));
        window.renderEstudiantesLocales();
        window.mostrarToast("Eliminado", "info");
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'eliminarUsuario', grado, codigo }) }).catch(()=>{});
    }
};

window.renderEstudiantesLocales = function() {
    const tbody = document.getElementById('tabla-estudiantes-locales');
    if(!tbody) return;
    tbody.innerHTML = '';
    window.baseEstudiantes.forEach((est, index) => {
        const idPas = `pass-${index}`;
        const esDocente = String(est.grado).toLowerCase() === 'docente';
        const badgeRol = esDocente
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">Docente</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">${window.escapeHTML(est.grado)}</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-3 sm:px-4 py-2 font-black">${badgeRol}</td>
                <td class="px-3 sm:px-4 py-2 font-bold text-indigo-600">${window.escapeHTML(est.codigo)}</td>
                <td class="px-3 sm:px-4 py-2 font-semibold text-slate-800">${window.escapeHTML(est.nombre)}</td>
                <td class="px-3 sm:px-4 py-2 text-center text-slate-500 font-mono text-xs">
                    <span id="${idPas}-txt" class="hidden">${window.escapeHTML(est.pass)}</span>
                    <span id="${idPas}-dots">••••••••</span>
                    <button type="button" onclick="document.getElementById('${idPas}-txt').classList.toggle('hidden'); document.getElementById('${idPas}-dots').classList.toggle('hidden');" class="ml-1 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">👁</button>
                </td>
                <td class="px-3 sm:px-4 py-2 text-right">
                    <button type="button" onclick="window.eliminarUsuarioDirectorio('${window.escapeHTML(est.grado)}', '${window.escapeHTML(est.codigo)}', '${window.escapeHTML(est.nombre)}')" class="text-rose-500 hover:text-rose-700 p-1">🗑️</button>
                </td>
            </tr>
        `;
    });
};

/* REPORTES */
window.generarReporteGlobal = function() {
    window.reporteActividadActualId = null;
    document.getElementById('titulo-vista-reporte').innerText = "Reporte Global";
    document.getElementById('filtros-reporte-global').classList.remove('hidden');
    document.getElementById('contenedor-grafico-reporte').style.display = 'block';
    document.getElementById('btn-reiniciar-grupo').classList.add('hidden');

    const selAct = document.getElementById('filtro-rep-actividad');
    selAct.innerHTML = '<option value="Todas">Todas las Actividades</option>';
    window.baseActividades.forEach(a => { selAct.innerHTML += `<option value="${a.id}">${window.escapeHTML(a.titulo)}</option>`; });

    window.datosReporteGlobal = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nota_')) {
            const raw = key.replace('nota_', '');
            let separator = '_ACT_';
            if (raw.includes('_ACT_LEC_')) separator = '_ACT_LEC_';
            else if (raw.includes('_ACT_JUEGO_')) separator = '_ACT_JUEGO_';

            const estIdRaw = raw.split(separator)[0]; 
            const actId = separator.substring(1) + raw.split(separator)[1];
            
            let gradoDetectado = "Desconocido", codigoDetectado = estIdRaw;
            for(let g of LISTA_GRADOS) {
                if(estIdRaw.startsWith(g + '-')) { gradoDetectado = g; codigoDetectado = estIdRaw.substring(g.length + 1); break; }
            }
            if(estIdRaw.startsWith("Docente-")) { gradoDetectado = "Docente"; codigoDetectado = estIdRaw.substring(8); }

            let nombreEst = "Cód: " + codigoDetectado;
            const estObj = window.baseEstudiantes.find(e => e.grado === gradoDetectado && String(e.codigo).toLowerCase() === codigoDetectado.toLowerCase());
            if(estObj) nombreEst = estObj.nombre;

            let valObj = localStorage.getItem(key);
            let val = 0.0, labData = null, refData = "", respData = [], fechaData = "", numIntento = 1;
            try { 
                let parseado = JSON.parse(valObj); 
                val = parseFloat(parseado.nota || valObj); 
                labData = parseado.laboratorio || null;
                refData = parseado.reflexion || "";
                respData = parseado.respuestas || [];
                fechaData = parseado.fecha || "";
                numIntento = parseado.numeroIntento || 1;
            } catch(e) { val = parseFloat(valObj); }
            
            const actObj = window.baseActividades.find(a => a.id === actId);
            const nombreAct = actObj?.titulo || actId;
            const claseAct = actObj?.clase || 'General';
            window.datosReporteGlobal.push({ estId: estIdRaw, grado: gradoDetectado, nombreEst, actId, nombreAct, clase: claseAct, nota: val, numIntento, lab: labData, reflexion: refData, respuestas: respData, fecha: fechaData });
        }
    }
    
    document.getElementById('filtro-rep-grado').value = window.filtroGradoActual || 'Todos';
    selAct.value = 'Todas';
    window.actualizarFiltrosReporte();
    window.mostrarVistaDocente('vista-reportes');
};

window.actualizarFiltrosReporte = function() {
    const fGrado = document.getElementById('filtro-rep-grado').value;
    const fAct = document.getElementById('filtro-rep-actividad').value;

    let filtrados = window.datosReporteGlobal || [];
    if (fGrado !== 'Todos') filtrados = filtrados.filter(d => d.grado === fGrado);
    if (fAct !== 'Todas') filtrados = filtrados.filter(d => d.actId === fAct);

    const tbody = document.getElementById('tabla-datos-reporte');
    tbody.innerHTML = '';
    let totalNotas = 0, aprobados = 0;

    if(filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 font-bold text-xs">Sin registros.</td></tr>`;
        document.getElementById('kpis-reporte').innerHTML = '';
        document.getElementById('contenedor-grafico-reporte').style.display = 'none';
        return;
    }

    filtrados.forEach(d => {
        totalNotas += d.nota;
        if(d.nota >= 3.0) aprobados++;
        const color = d.nota >= 3.0 ? 'text-emerald-600' : 'text-rose-600';
        const entregaObj = { nota: d.nota.toFixed(1), fecha: d.fecha, laboratorio: d.lab, reflexion: d.reflexion, respuestas: d.respuestas, numeroIntento: d.numIntento };
        const safeEntrega = encodeURIComponent(JSON.stringify(entregaObj));
        const labBtn = `<button type="button" onclick="window.verDetalleEntrega('${safeEntrega}', true)" class="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200">Ver Evidencias</button>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 sm:px-5 py-2.5 font-black">${window.escapeHTML(d.grado)}</td>
                <td class="px-4 sm:px-5 py-2.5 font-bold text-slate-800">${window.escapeHTML(d.nombreEst)}</td>
                <td class="px-4 sm:px-5 py-2.5 text-slate-600">
                    <span class="block text-[10px] text-indigo-600 font-bold uppercase">${window.escapeHTML(d.clase)}</span>
                    <strong class="text-slate-800">${window.escapeHTML(d.nombreAct)}</strong>
                </td>
                <td class="px-4 sm:px-5 py-2.5 text-center font-bold text-slate-600">#${d.numIntento || 1}</td>
                <td class="px-4 sm:px-5 py-2.5 text-center">${labBtn}</td>
                <td class="px-4 sm:px-5 py-2.5 text-center font-black ${color}">${d.nota.toFixed(1)}</td>
                <td class="px-4 sm:px-5 py-2.5 text-right">
                    <button type="button" onclick="window.reiniciarActividadEstudiante('${window.escapeHTML(d.estId)}', '${window.escapeHTML(d.actId)}', '${window.escapeHTML(d.nombreEst)}')" class="text-xs bg-amber-50 text-amber-800 border border-amber-300 font-bold px-2 py-1 rounded-lg">Reiniciar</button>
                </td>
            </tr>
        `;
    });

    const prom = (totalNotas / filtrados.length).toFixed(1);
    const porcAprob = Math.round((aprobados / filtrados.length) * 100);
    
    document.getElementById('kpis-reporte').innerHTML = `
        <div class="glass-card p-4 border-l-4 border-l-indigo-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Entregas</span><p class="text-2xl font-black">${filtrados.length}</p></div>
        <div class="glass-card p-4 border-l-4 border-l-purple-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Promedio</span><p class="text-2xl font-black text-purple-700">${prom}</p></div>
        <div class="glass-card p-4 border-l-4 border-l-teal-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Aprobación</span><p class="text-2xl font-black text-teal-600">${porcAprob}%</p></div>
    `;

    actualizarGraficoReporte(filtrados, fGrado, fAct);
    document.getElementById('contenedor-grafico-reporte').style.display = 'block';
};

function actualizarGraficoReporte(datos, fGrado, fAct) {
    if(window.chartRepGlobal) window.chartRepGlobal.destroy();
    const ctx = document.getElementById('chartReporte').getContext('2d');
    let labels = [], data = [];
    if (fAct !== 'Todas' && fGrado === 'Todos') {
        const map = {};
        datos.forEach(d => { if(!map[d.grado]) map[d.grado] = {s:0, c:0}; map[d.grado].s += d.nota; map[d.grado].c++; });
        labels = Object.keys(map); data = labels.map(g => (map[g].s / map[g].c).toFixed(1));
    } else {
        const map = {};
        datos.forEach(d => { if(!map[d.nombreAct]) map[d.nombreAct] = {s:0, c:0}; map[d.nombreAct].s += d.nota; map[d.nombreAct].c++; });
        labels = Object.keys(map); data = labels.map(a => (map[a].s / map[a].c).toFixed(1));
    }
    window.chartRepGlobal = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Promedio', data: data, backgroundColor: '#6366F1', borderRadius: 6 }] }, options: { responsive: true, scales: { y: { beginAtZero: true, max: 5 } }, maintainAspectRatio: false } });
}

window.generarReporteActividad = function(idActividad) {
    window.reporteActividadActualId = idActividad;
    const act = window.baseActividades.find(a => a.id === idActividad);
    document.getElementById('titulo-vista-reporte').innerText = `Reporte: ${window.escapeHTML(act?.titulo || idActividad)}`;
    document.getElementById('filtros-reporte-global').classList.add('hidden');
    document.getElementById('contenedor-grafico-reporte').style.display = 'none';

    const btnReiniciarG = document.getElementById('btn-reiniciar-grupo');
    btnReiniciarG.classList.remove('hidden');
    document.getElementById('btn-reiniciar-grupo-texto').innerText = window.filtroGradoActual ? `Reiniciar Grupo ${window.filtroGradoActual}` : `Reiniciar Todos los Grupos`;

    const tbody = document.getElementById('tabla-datos-reporte');
    tbody.innerHTML = '';
    let notas = [], totalNotas = 0, aprobados = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nota_') && key.includes(idActividad)) {
            let separator = '_ACT_';
            if (idActividad.startsWith('ACT_LEC_')) separator = '_ACT_LEC_';
            else if (idActividad.startsWith('ACT_JUEGO_')) separator = '_ACT_JUEGO_';

            const estIdRaw = key.replace('nota_', '').split(separator)[0];
            if (window.filtroGradoActual && !estIdRaw.startsWith(window.filtroGradoActual + '-')) continue; 

            let gradoDetectado = "Desconocido", codigoDetectado = estIdRaw;
            for(let g of LISTA_GRADOS) {
                if(estIdRaw.startsWith(g + '-')) { gradoDetectado = g; codigoDetectado = estIdRaw.substring(g.length + 1); break; }
            }
            if(estIdRaw.startsWith("Docente-")) { gradoDetectado = "Docente"; codigoDetectado = estIdRaw.substring(8); }

            let nombreEst = "Cód: " + codigoDetectado;
            const estObj = window.baseEstudiantes.find(e => e.grado === gradoDetectado && String(e.codigo).toLowerCase() === codigoDetectado.toLowerCase());
            if(estObj) nombreEst = estObj.nombre;

            let valObj = localStorage.getItem(key);
            let val = 0.0, labData = null, refData = "", respData = [], fechaData = "", numIntento = 1;
            try {
                let parseado = JSON.parse(valObj);
                val = parseFloat(parseado.nota || valObj);
                labData = parseado.laboratorio || null;
                refData = parseado.reflexion || "";
                respData = parseado.respuestas || [];
                fechaData = parseado.fecha || "";
                numIntento = parseado.numeroIntento || 1;
            } catch(e) { val = parseFloat(valObj); }

            notas.push({ estId: estIdRaw, grado: gradoDetectado, nombre: nombreEst, val: val, valStr: val.toFixed(1), numIntento, lab: labData, reflexion: refData, respuestas: respData, fecha: fechaData });
            totalNotas += val;
            if (val >= 3.0) aprobados++;
        }
    }

    if(notas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 font-bold text-xs">Sin entregas para esta actividad.</td></tr>`;
        document.getElementById('kpis-reporte').innerHTML = '';
    } else {
        notas.forEach(n => {
            const color = n.val >= 3.0 ? 'text-emerald-600' : 'text-rose-600';
            const entregaObj = { nota: n.valStr, fecha: n.fecha, laboratorio: n.lab, reflexion: n.reflexion, respuestas: n.respuestas, numeroIntento: n.numIntento };
            const safeEntrega = encodeURIComponent(JSON.stringify(entregaObj));
            const labBtn = `<button type="button" onclick="window.verDetalleEntrega('${safeEntrega}', true)" class="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200">Ver Evidencias</button>`;

            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 sm:px-5 py-2.5 font-black">${window.escapeHTML(n.grado)}</td>
                    <td class="px-4 sm:px-5 py-2.5 font-bold text-slate-800">${window.escapeHTML(n.nombre)}</td>
                    <td class="px-4 sm:px-5 py-2.5 text-slate-600">${window.escapeHTML(act?.titulo || idActividad)}</td>
                    <td class="px-4 sm:px-5 py-2.5 text-center font-bold text-slate-600">#${n.numIntento || 1}</td>
                    <td class="px-4 sm:px-5 py-2.5 text-center">${labBtn}</td>
                    <td class="px-4 sm:px-5 py-2.5 text-center font-black ${color}">${n.valStr}</td>
                    <td class="px-4 sm:px-5 py-2.5 text-right">
                        <button type="button" onclick="window.reiniciarActividadEstudiante('${window.escapeHTML(n.estId)}', '${window.escapeHTML(idActividad)}', '${window.escapeHTML(n.nombre)}')" class="text-xs bg-amber-50 text-amber-800 border border-amber-300 font-bold px-2 py-1 rounded-lg">Reiniciar</button>
                    </td>
                </tr>
            `;
        });

        const prom = (totalNotas / notas.length).toFixed(1);
        const porcAprob = Math.round((aprobados / notas.length) * 100);
        document.getElementById('kpis-reporte').innerHTML = `
            <div class="glass-card p-4 border-l-4 border-l-indigo-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Entregas</span><p class="text-2xl font-black">${notas.length}</p></div>
            <div class="glass-card p-4 border-l-4 border-l-purple-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Promedio</span><p class="text-2xl font-black text-purple-700">${prom}</p></div>
            <div class="glass-card p-4 border-l-4 border-l-teal-600"><span class="text-[10px] font-bold text-slate-400 uppercase">Aprobación</span><p class="text-2xl font-black text-teal-600">${porcAprob}%</p></div>
        `;
    }
    window.mostrarVistaDocente('vista-reportes');
};

window.reiniciarActividadEstudiante = async function(estudianteId, actividadId, nombreEstudiante) {
    if(confirm(`¿Reiniciar actividad para ${nombreEstudiante}? Se restablecerán todos los intentos y progreso.`)) {
        localStorage.removeItem(`nota_${estudianteId}_${actividadId}`);
        localStorage.removeItem(`estado_${actividadId}_${estudianteId}`);
        localStorage.removeItem(`progreso_sesion_${estudianteId}_${actividadId}`);
        localStorage.removeItem(`rpg_state_${estudianteId}_${actividadId}`);
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'reiniciarEntregaEstudiante', estudianteId, actividadId }) }).catch(()=>{});
        window.mostrarToast(`Actividad reiniciada para ${nombreEstudiante}`, "success");
        if (window.reporteActividadActualId) window.generarReporteActividad(window.reporteActividadActualId);
        else window.generarReporteGlobal();
    }
};

window.reiniciarGrupoActual = async function() {
    if (!window.reporteActividadActualId) return;
    const targetGrado = window.filtroGradoActual || 'Todos';
    if(confirm(`¿Reiniciar actividad para ${targetGrado}?`)) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('nota_') && key.includes(window.reporteActividadActualId)) {
                let separator = '_ACT_';
                if (window.reporteActividadActualId.startsWith('ACT_LEC_')) separator = '_ACT_LEC_';
                else if (window.reporteActividadActualId.startsWith('ACT_JUEGO_')) separator = '_ACT_JUEGO_';

                const rawEstId = key.replace('nota_', '').split(separator)[0];
                if (targetGrado === 'Todos' || rawEstId.startsWith(targetGrado + '-')) {
                    localStorage.removeItem(key);
                    localStorage.removeItem(`estado_${window.reporteActividadActualId}_${rawEstId}`);
                    localStorage.removeItem(`progreso_sesion_${rawEstId}_${window.reporteActividadActualId}`);
                    localStorage.removeItem(`rpg_state_${rawEstId}_${window.reporteActividadActualId}`);
                }
            }
        }
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'reiniciarEntregaGrupo', grado: targetGrado, actividadId: window.reporteActividadActualId }) }).catch(()=>{});
        window.mostrarToast("Grupo reiniciado", "success");
        window.generarReporteActividad(window.reporteActividadActualId);
    }
};

/* SESIÓN DE ESTUDIANTE */
window.loginEstudiante = async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-estudiante');
    if(btnSubmit) btnSubmit.disabled = true;

    const grado = document.getElementById('grado').value;
    const codigo = document.getElementById('codigo-estudiante').value.trim();
    const password = document.getElementById('pass-estudiante').value.trim();
    const codigoLower = codigo.toLowerCase();

    if (codigoLower === 'ejemplo' || codigoLower === 'ensayo') {
        window.iniciarSesionEstudianteLocal(grado, codigo.toUpperCase(), 'Estudiante de Prueba');
        if(btnSubmit) btnSubmit.disabled = false;
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'validarEstudiante', grado, codigo, password }) });
        const result = await response.json();
        if(result.success) { 
            window.iniciarSesionEstudianteLocal(grado, codigo, result.nombre); 
        } else { 
            const localEst = window.baseEstudiantes.find(es => String(es.grado) === grado && String(es.codigo).trim().toLowerCase() === codigoLower);
            if(localEst && String(localEst.pass).trim() === password) {
                window.iniciarSesionEstudianteLocal(grado, codigo, localEst.nombre);
            } else {
                window.mostrarToast(result.error || "Credenciales incorrectas", "error"); 
            }
        }
    } catch (error) { 
        const localEst = window.baseEstudiantes.find(es => String(es.grado) === grado && String(es.codigo).trim().toLowerCase() === codigoLower);
        if(localEst && String(localEst.pass).trim() === password) {
            window.iniciarSesionEstudianteLocal(grado, codigo, localEst.nombre);
        } else {
            window.mostrarToast("Error de conexión", "error"); 
        }
    } finally { 
        if(btnSubmit) btnSubmit.disabled = false; 
    }
};

window.iniciarSesionEstudianteLocal = function(grado, codigo, nombre) {
    estudianteIdActual = `${grado}-${codigo}`; nombreEstudianteActual = nombre; gradoEstudianteActual = grado; 
    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('panel-estudiante').classList.remove('hidden'); 
    document.getElementById('panel-estudiante').classList.add('flex');

    document.getElementById('nombre-estudiante-display').innerText = window.escapeHTML(nombre);
    document.getElementById('grado-estudiante-display').innerText = window.escapeHTML(grado);
    document.getElementById('codigo-estudiante-display').innerText = window.escapeHTML(codigo);
    window.construirDashboardEstudiante(grado);
    
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'obtenerDatos' }) }).then(res => res.json()).then(result => {
        if(result.success && result.data && result.data.actividades) {
            window.baseActividades = result.data.actividades;
            localStorage.setItem('cafelab_actividades', JSON.stringify(window.baseActividades));
            window.construirDashboardEstudiante(grado);
        }
    }).catch(()=>{}); 
};

window.volverDashboardEstudiante = function() {
    let tiempoPausa = 0;
    if(player && typeof player.getCurrentTime === 'function') {
        try { 
            tiempoPausa = player.getCurrentTime();
            player.pauseVideo(); 
        } catch(e) {}
    }
    if(intervaloVideo) clearInterval(intervaloVideo);
    
    if(actividadActual && actividadActual.tipo !== 'lectura' && actividadActual.tipo !== 'juego' && estudianteIdActual) {
        const sesionGuardada = {
            tiempoGuardado: Math.max(tiempoPausa, maxTiempoVisto),
            maxTiempoVisto: Math.max(tiempoPausa, maxTiempoVisto),
            intentoActual: intentoActual,
            preguntas: actividadActual.preguntas || []
        };
        localStorage.setItem(`progreso_sesion_${estudianteIdActual}_${actividadActual.id}`, JSON.stringify(sesionGuardada));
        window.mostrarToast("Progreso guardado. Podrás reanudar donde quedaste.", "info");
    }

    document.getElementById('vista-reproductor').classList.add('hidden');
    document.getElementById('vista-reproductor').classList.remove('flex');
    document.getElementById('vista-bienvenida-estudiante').classList.remove('hidden');
    window.construirDashboardEstudiante(gradoEstudianteActual);
};

window.cerrarSesion = function() {
    if(player && typeof player.pauseVideo === 'function') {
        try { player.pauseVideo(); } catch(e) {}
    }
    if(intervaloVideo) clearInterval(intervaloVideo);
    window.salirModoLecturaInmersiva();
    window.salirModoJuego();

    document.getElementById('panel-docente').classList.add('hidden');
    document.getElementById('panel-docente').classList.remove('flex');
    document.getElementById('panel-estudiante').classList.add('hidden');
    document.getElementById('panel-estudiante').classList.remove('flex');
    document.getElementById('login-panel').classList.remove('hidden');
    window.toggleSidebarDocente(false);
};

/* CONSTRUCCIÓN DASHBOARD ESTUDIANTE */
window.construirDashboardEstudiante = function(grado) {
    const contenedorAtajos = document.getElementById('lista-pendientes-atajos');
    const badgeAtajos = document.getElementById('badge-pendientes-count');
    const contenedorClases = document.getElementById('contenedor-carpetas-clases');
    if(!contenedorAtajos || !contenedorClases) return;

    contenedorAtajos.innerHTML = '';
    contenedorClases.innerHTML = '';

    const actividadesAccesibles = window.baseActividades.filter(act => {
        if(!act || !act.grados || !Array.isArray(act.grados)) return false;
        return act.grados.includes(grado) || act.grados.includes('Todos');
    });

    let countPendientesTotal = 0;
    const mapaClases = {};

    actividadesAccesibles.forEach(act => {
        const nombreClase = (act.clase && act.clase.trim()) ? act.clase.trim() : "General";
        if (!mapaClases[nombreClase]) mapaClases[nombreClase] = [];
        
        const notaObj = localStorage.getItem(`nota_${estudianteIdActual}_${act.id}`);
        let entrega = null;
        if(notaObj) {
            try { entrega = JSON.parse(notaObj); } catch(e) { entrega = { nota: notaObj, numeroIntento: 1 }; }
        }

        const maxIntentos = (act.evaluacion && act.evaluacion.intentosPermitidos) ? parseInt(act.evaluacion.intentosPermitidos) : 1;
        const intentosRealizados = entrega ? (parseInt(entrega.numeroIntento) || 1) : 0;
        const puedeReintentar = intentosRealizados < maxIntentos;
        const esPendiente = !entrega || (puedeReintentar && parseFloat(entrega.nota || 0) < 3.0);

        if (esPendiente && act.estado === 'Activa') {
            countPendientesTotal++;
            const txtIntentosAtajo = maxIntentos >= 999 ? 'Ilimitados' : `${intentosRealizados} de ${maxIntentos}`;
            
            let iconAtajo = '🎬 ';
            let btnClass = 'histudy-btn';
            if (act.tipo === 'lectura') { iconAtajo = '📖 '; btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white'; }
            else if (act.tipo === 'juego') { iconAtajo = '🎮 '; btnClass = 'bg-amber-600 hover:bg-amber-700 text-white'; }

            contenedorAtajos.innerHTML += `
                <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-300 transition-all">
                    <div class="min-w-0">
                        <span class="text-[9px] font-black uppercase text-indigo-600 tracking-wider">${window.escapeHTML(nombreClase)}</span>
                        <h4 class="font-bold text-slate-900 text-xs truncate">${iconAtajo}${window.escapeHTML(act.titulo)}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold">Intentos: ${txtIntentosAtajo}</span>
                    </div>
                    <button type="button" onclick="window.iniciarActividadPorId('${window.escapeHTML(act.id)}')" class="${btnClass} px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                        ${intentosRealizados > 0 ? 'Reintentar' : 'Iniciar'}
                    </button>
                </div>
            `;
        }

        mapaClases[nombreClase].push({ act, entrega, maxIntentos, intentosRealizados, puedeReintentar });
    });

    if (badgeAtajos) badgeAtajos.innerText = `${countPendientesTotal} pendientes`;
    if (countPendientesTotal === 0) {
        contenedorAtajos.innerHTML = `<div class="col-span-full p-4 text-center text-slate-400 font-bold text-xs bg-white rounded-xl border border-slate-100">🎉 ¡Estás al día! No tienes actividades pendientes urgentes.</div>`;
    }

    const nombresClases = Object.keys(mapaClases);
    if (nombresClases.length === 0) {
        contenedorClases.innerHTML = `<div class="glass-card p-6 text-center text-slate-400 font-bold text-xs">No hay clases asignadas para tu grado actualmente.</div>`;
        window.renderLucide();
        return;
    }

    nombresClases.forEach((nombreClase, index) => {
        const items = mapaClases[nombreClase];
        const idCarpeta = `carpeta-clase-${index}`;
        const totalActs = items.length;
        const completadas = items.filter(it => it.entrega).length;
        const estiloClase = CLASE_GRADIENTES[index % CLASE_GRADIENTES.length];

        let actividadesHTML = '';
        items.forEach(it => {
            const { act, entrega, maxIntentos, intentosRealizados, puedeReintentar } = it;
            const seguroId = window.escapeHTML(act.id);
            const intentosMaxTxt = maxIntentos >= 999 ? '∞' : maxIntentos;
            
            let iconTipo = 'play-circle';
            let bgIcon = 'bg-purple-100 text-purple-700';
            let btnIniciarColor = 'histudy-btn';
            let btnIniciarTxt = 'Comenzar Actividad';

            if (act.tipo === 'lectura') {
                iconTipo = 'book-open';
                bgIcon = 'bg-emerald-100 text-emerald-800';
                btnIniciarColor = 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold';
                btnIniciarTxt = 'Iniciar Lectura';
            } else if (act.tipo === 'juego') {
                iconTipo = 'gamepad-2';
                bgIcon = 'bg-amber-100 text-amber-800';
                btnIniciarColor = 'bg-amber-600 hover:bg-amber-700 text-white font-bold';
                btnIniciarTxt = 'Jugar Misión RPG';
            }

            if (entrega) {
                const val = entrega.nota != null ? entrega.nota : '0.0';
                const esGanada = parseFloat(val) >= 3.0;
                const badgeColor = esGanada ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';
                const notaBoxColor = esGanada ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300';
                
                const permitirVerRespuestas = (intentosRealizados >= maxIntentos) || (parseFloat(val) > 4.0);
                const safeEntrega = encodeURIComponent(JSON.stringify(entrega));

                const btnReintentar = (puedeReintentar && act.estado === 'Activa')
                    ? `<button type="button" onclick="window.iniciarActividadPorId('${seguroId}')" class="text-xs ${btnIniciarColor} font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all">Reintentar</button>`
                    : `<span class="text-[10px] text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-lg">Completada</span>`;

                actividadesHTML += `
                    <div class="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="p-1 rounded-md ${bgIcon}"><i data-lucide="${iconTipo}" class="w-3.5 h-3.5"></i></span>
                                <h5 class="font-bold text-slate-900 text-xs sm:text-sm">${window.escapeHTML(act.titulo)}</h5>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                                <span class="px-2 py-0.5 rounded-full border ${badgeColor}">${esGanada ? 'Aprobada' : 'Reprobada'}</span>
                                <span class="text-slate-400">Intento: <strong>#${intentosRealizados}</strong></span>
                                <span class="text-slate-400 font-normal">Entregado: ${window.escapeHTML(entrega.fecha || '')}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 self-end sm:self-center">
                            <button type="button" onclick="window.verDetalleEntrega('${safeEntrega}', ${permitirVerRespuestas})" class="text-xs bg-white text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50">Ver Evidencias</button>
                            ${btnReintentar}
                            <div class="px-3 py-1 rounded-lg border-2 font-black text-sm ${notaBoxColor}" title="Última Calificación">${val}</div>
                        </div>
                    </div>
                `;
            } else if (act.estado === 'Activa') {
                actividadesHTML += `
                    <div class="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="p-1 rounded-md ${bgIcon}"><i data-lucide="${iconTipo}" class="w-3.5 h-3.5"></i></span>
                                <h5 class="font-bold text-slate-900 text-xs sm:text-sm">${window.escapeHTML(act.titulo)}</h5>
                            </div>
                            <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                <span>Intentos: ${intentosMaxTxt}</span>
                                <span>•</span>
                                <span>📅 ${window.escapeHTML(act.fechaCreacion || 'Activo')}</span>
                            </div>
                        </div>
                        <button type="button" onclick="window.iniciarActividadPorId('${seguroId}')" class="${btnIniciarColor} px-4 py-2 rounded-lg text-xs w-full sm:w-auto">
                            ${btnIniciarTxt}
                        </button>
                    </div>
                `;
            }
        });

        contenedorClases.innerHTML += `
            <div class="glass-card overflow-hidden border border-slate-200/80 shadow-sm transition-all">
                <div onclick="document.getElementById('${idCarpeta}').classList.toggle('hidden'); document.getElementById('${idCarpeta}-icon').classList.toggle('rotate-180');" class="p-4 sm:p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50/70 select-none">
                    <div class="flex items-center gap-3.5">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr ${estiloClase.bg} text-white flex items-center justify-center shadow-md shrink-0">
                            <i data-lucide="folder" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${estiloClase.badge}">Clase ${index + 1}</span>
                            </div>
                            <h4 class="font-black text-slate-900 text-sm sm:text-base mt-0.5">${window.escapeHTML(nombreClase)}</h4>
                            <span class="text-xs font-semibold text-slate-400">${completadas} de ${totalActs} actividades realizadas</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${completadas === totalActs && totalActs > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}">
                            ${completadas === totalActs && totalActs > 0 ? 'Completada' : 'En progreso'}
                        </span>
                        <i id="${idCarpeta}-icon" data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200"></i>
                    </div>
                </div>
                <div id="${idCarpeta}" class="p-4 pt-0 space-y-2.5 border-t border-slate-100">
                    <div class="pt-3 flex flex-col gap-2.5">
                        ${actividadesHTML || '<p class="text-xs text-slate-400 italic">No hay actividades activas en esta clase.</p>'}
                    </div>
                </div>
            </div>
        `;
    });

    window.renderLucide();
};

/* ENRUTADOR POLIMÓRFICO: VIDEO / LECTURA / JUEGO */
window.iniciarActividadPorId = function(idActividad) {
    const act = window.baseActividades.find(a => a.id === idActividad);
    if(!act) return;

    if (act.tipo === 'juego') {
        window.iniciarJuegoInmersivo(act);
        return;
    }

    if (act.tipo === 'lectura') {
        window.iniciarLectorInmersivo(act);
        return;
    }

    actividadActual = JSON.parse(JSON.stringify(act));
    const notaGuardada = localStorage.getItem(`nota_${estudianteIdActual}_${act.id}`);
    let intentoNum = 1;
    if (notaGuardada) {
        try {
            const p = JSON.parse(notaGuardada);
            intentoNum = (parseInt(p.numeroIntento) || 1) + 1;
        } catch(e) { intentoNum = 2; }
    }

    let tiempoInicio = 0;
    const sesionPreviaStr = localStorage.getItem(`progreso_sesion_${estudianteIdActual}_${act.id}`);
    if (sesionPreviaStr) {
        try {
            const sesionPrevia = JSON.parse(sesionPreviaStr);
            tiempoInicio = Math.floor(sesionPrevia.tiempoGuardado || 0);
            maxTiempoVisto = sesionPrevia.maxTiempoVisto || tiempoInicio;
            intentoActual = sesionPrevia.intentoActual || { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: intentoNum };
            if (sesionPrevia.preguntas && Array.isArray(sesionPrevia.preguntas)) {
                actividadActual.preguntas = sesionPrevia.preguntas;
            }
            window.mostrarToast(`Reanudando clase desde el segundo ${tiempoInicio}`, "info");
        } catch(e) {
            tiempoInicio = 0; maxTiempoVisto = 0;
            intentoActual = { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: intentoNum };
        }
    } else {
        intentoActual = { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: intentoNum };
        maxTiempoVisto = 0;
    }

    document.getElementById('vista-bienvenida-estudiante').classList.add('hidden');
    document.getElementById('vista-reproductor').classList.remove('hidden');
    document.getElementById('vista-reproductor').classList.add('flex');
    document.getElementById('titulo-reproductor').innerText = window.escapeHTML(actividadActual.titulo);
    document.getElementById('reproductor-clase-nombre').innerText = window.escapeHTML(actividadActual.clase || 'Clase');
    document.getElementById('intento-num-text').innerText = intentoNum;

    const totalP = actividadActual.preguntas ? actividadActual.preguntas.length : 1;
    const porcAvance = Math.round((intentoActual.resueltas / (totalP === 0 ? 1 : totalP)) * 100);
    document.getElementById('progreso-text').innerText = `${porcAvance}%`;
    
    const vId = actividadActual.video ? actividadActual.video.id : actividadActual.videoId; 
    if (player && typeof player.loadVideoById === 'function') { 
        player.loadVideoById({ videoId: vId, startSeconds: tiempoInicio }); 
    } else {
        player = new YT.Player('youtube-player', { 
            videoId: vId, 
            host: 'https://www.youtube-nocookie.com',
            playerVars: { 
                'autoplay': 1, 
                'controls': 0, 
                'rel': 0, 
                'modestbranding': 1, 
                'start': tiempoInicio,
                'origin': window.location.origin || 'https://cafelab.co' 
            }, 
            events: { 
                'onStateChange': (e) => { 
                    if (e.data == YT.PlayerState.PLAYING) { 
                        intervaloVideo = setInterval(window.verificarTiempo, 1000); 
                    } else { 
                        clearInterval(intervaloVideo); 
                    } 
                } 
            } 
        });
    }
    window.renderLucide();
};

window.verificarTiempo = function() {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const tAct = player.getCurrentTime();

    if (tAct > maxTiempoVisto + 3) { 
        player.seekTo(maxTiempoVisto); 
        window.mostrarToast("⚠️️ Debes ver la clase completa sin adelantar.", "warning"); 
        return;
    }
    if(tAct > maxTiempoVisto) maxTiempoVisto = tAct;

    if(!actividadActual.preguntas || !Array.isArray(actividadActual.preguntas)) return;

    actividadActual.preguntas.forEach((pregunta, index) => {
        if (!pregunta.respondida && tAct >= pregunta.tiempo && tAct < (pregunta.tiempo + 2)) {
            player.pauseVideo(); 
            clearInterval(intervaloVideo);
            const qBox = document.getElementById('question-box');
            qBox.innerHTML = `
                <h3 class="text-sm sm:text-base md:text-lg mb-4 font-extrabold text-slate-900">${window.escapeHTML(pregunta.texto)}</h3>
                <div id="q-options" class="grid grid-cols-1 gap-2 mb-2"></div>
            `;
            const contO = document.getElementById('q-options');
            
            pregunta.opciones.forEach((opcion, i) => {
                const btn = document.createElement('button');
                btn.type = "button";
                btn.className = "w-full bg-slate-50 text-slate-800 hover:bg-indigo-600 hover:text-white font-bold py-2.5 px-4 rounded-xl text-left text-xs border border-slate-200 transition-all";
                btn.innerText = opcion; 
                btn.onclick = () => {
                    const esCorrecta = ((i + 1) === parseInt(pregunta.correcta));
                    actividadActual.preguntas[index].respondida = true; 
                    intentoActual.resueltas++;
                    if (esCorrecta) intentoActual.correctas++;
                    
                    const optCorrectaTexto = pregunta.opciones[parseInt(pregunta.correcta) - 1] || 'Opción ' + pregunta.correcta;
                    intentoActual.respuestas.push({ 
                        textoPregunta: pregunta.texto, 
                        opcionSeleccionada: opcion, 
                        opcionCorrecta: optCorrectaTexto, 
                        esCorrecta: esCorrecta, 
                        feedback: pregunta.feedback || "" 
                    });
                    
                    document.getElementById('progreso-text').innerText = `${Math.round((intentoActual.resueltas / actividadActual.preguntas.length) * 100)}%`;
                    
                    const boxColor = esCorrecta ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800';
                    const mensajeRetro = esCorrecta 
                        ? (pregunta.feedback || '¡Excelente trabajo! Has comprendido el concepto.')
                        : 'Tu respuesta no es correcta. Recuerda analizar bien cada detalle antes de responder.';

                    qBox.innerHTML = `
                        <div class="p-3 sm:p-4 rounded-xl border ${boxColor} mb-4">
                            <h4 class="text-xs sm:text-sm font-black mb-1">${esCorrecta ? '¡Respuesta Correcta! ✅' : 'Respuesta Incorrecta ❌'}</h4>
                            <p class="text-xs">${window.escapeHTML(mensajeRetro)}</p>
                        </div>
                        <button type="button" id="btn-continuar-video" class="w-full histudy-btn py-2.5 rounded-xl text-xs uppercase">Continuar Clase ▶</button>
                    `;
                    document.getElementById('btn-continuar-video').onclick = () => {
                        document.getElementById('question-overlay').classList.add('hidden');
                        if (intentoActual.resueltas === actividadActual.preguntas.length) {
                            window.mostrarPantallaFinalizacion();
                        } else {
                            player.playVideo();
                        }
                    };
                };
                contO.appendChild(btn);
            });
            document.getElementById('question-overlay').classList.remove('hidden');
        }
    });
};

window.mostrarPantallaFinalizacion = function() {
    document.getElementById('estudiante-reflexion').value = '';
    const labSection = document.getElementById('estudiante-lab-section');
    const labInputs = document.getElementById('estudiante-lab-inputs');
    labInputs.innerHTML = '';

    if (actividadActual.requiereLaboratorio && actividadActual.laboratorioCampos && actividadActual.laboratorioCampos.length > 0) {
        labSection.classList.remove('hidden');
        actividadActual.laboratorioCampos.forEach(campo => {
            labInputs.innerHTML += `
                <div>
                    <label class="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">${window.escapeHTML(campo)}</label>
                    <input type="text" data-campo="${window.escapeHTML(campo)}" class="dyn-lab-input w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
            `;
        });
    } else { labSection.classList.add('hidden'); }
    document.getElementById('final-overlay').classList.remove('hidden');
};

window.guardarEvidenciasYFinalizar = function() {
    const refEl = document.getElementById('estudiante-reflexion');
    const reflexion = refEl ? refEl.value.trim() : "";
    if (!reflexion) { window.mostrarToast("Ingresa tus aprendizajes", "warning"); return; }

    let datosLab = null;
    if (actividadActual.requiereLaboratorio && actividadActual.laboratorioCampos && actividadActual.laboratorioCampos.length > 0) {
        datosLab = {};
        document.querySelectorAll('.dyn-lab-input').forEach(inp => { datosLab[inp.getAttribute('data-campo')] = inp.value; });
    }

    intentoActual.reflexion = reflexion;
    if (datosLab) intentoActual.laboratorio = datosLab;
    document.getElementById('final-overlay').classList.add('hidden');
    window.finalizarActividad();
};

window.finalizarActividad = async function() {
    localStorage.removeItem(`progreso_sesion_${estudianteIdActual}_${actividadActual.id}`);
    localStorage.removeItem(`estado_${actividadActual.id}_${estudianteIdActual}`);
    
    const totalP = actividadActual.preguntas ? actividadActual.preguntas.length : 1;
    const notaFinal = (((intentoActual.correctas / (totalP === 0 ? 1 : totalP)) * 4) + 1).toFixed(1);
    
    const entrega = {
        idEntrega: "ENT_" + Date.now().toString(36).toUpperCase(),
        estudianteId: estudianteIdActual, 
        actividadId: actividadActual.id, 
        versionActividad: actividadActual.version || 1,
        correctas: intentoActual.correctas, 
        resueltas: intentoActual.resueltas, 
        nota: notaFinal,
        numeroIntento: intentoActual.numeroIntento || 1,
        fecha: new Date().toLocaleString(), 
        laboratorio: intentoActual.laboratorio || null,
        reflexion: intentoActual.reflexion || "", 
        respuestas: intentoActual.respuestas || [],
        validador: btoa(notaFinal + "_" + estudianteIdActual + "_CafeLab")
    };
    
    localStorage.setItem(`nota_${estudianteIdActual}_${actividadActual.id}`, JSON.stringify(entrega));
    window.volverDashboardEstudiante(); 
    window.mostrarToast(`¡Completado! Última nota registrada: ${notaFinal}`, "success");
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'guardarNota', payload: entrega }) }).catch(()=>{});
};

/* LECTOR INMERSIVO */
window.iniciarLectorInmersivo = function(actividad) {
    actividadActual = JSON.parse(JSON.stringify(actividad));
    
    if (actividadActual.preguntas) {
        actividadActual.preguntas.forEach(p => p.respondida = false);
    }

    const notaGuardada = localStorage.getItem(`nota_${estudianteIdActual}_${actividad.id}`);
    let intentoNum = 1;
    if (notaGuardada) {
        try { intentoNum = (parseInt(JSON.parse(notaGuardada).numeroIntento) || 1) + 1; } catch(e) { intentoNum = 2; }
    }
    intentoActual = { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: intentoNum };

    indiceLineaLector = 0;
    segundosTranscurridosLectura = 0;
    estadoLecturaPausada = true;
    if (timeoutLineaPacer) clearTimeout(timeoutLineaPacer);
    if (cronometroLecturaInterval) clearInterval(cronometroLecturaInterval);

    document.getElementById('inmersivo-titulo').innerText = actividad.titulo;
    document.getElementById('inmersivo-clase-badge').innerText = actividad.clase || 'Lectura';
    document.getElementById('inmersivo-wpm-display').innerText = `${actividad.lectura?.wpmSugerido || 165} WPM`;
    document.getElementById('inmersivo-progreso').innerText = '0%';
    document.getElementById('inmersivo-tiempo').innerText = '00:00';
    document.getElementById('inmersivo-intento-num').innerText = intentoNum;
    
    document.getElementById('btn-inmersivo-evaluar').classList.add('hidden');
    document.getElementById('btn-inmersivo-play').innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Iniciar Ritmo</span>`;

    const lienzo = document.getElementById('inmersivo-columna-texto');
    lienzo.innerHTML = '';
    lineasLecturaArray = [];
    palabrasLecturaArray = [];

    const parrafos = (actividad.lectura?.texto || '').split(/\n\s*\n/);
    let idLineaGlobal = 0;

    parrafos.forEach((parrafoTexto, numParrafo) => {
        const pElem = document.createElement('div');
        pElem.className = "mb-6 space-y-1.5";
        pElem.setAttribute('data-parrafo', numParrafo + 1);

        const segmentos = parrafoTexto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [parrafoTexto];

        segmentos.forEach((seg, idxSeg) => {
            const textoSegmento = seg.trim();
            if (!textoSegmento) return;

            const palabras = textoSegmento.split(/\s+/);
            const lineaElem = document.createElement('div');
            lineaElem.id = `linea-lec-${idLineaGlobal}`;
            lineaElem.className = "linea-lectura";

            palabras.forEach(palabra => {
                const span = document.createElement('span');
                span.innerText = palabra + ' ';

                const palabraLimpia = palabra.toLowerCase().replace(/[.,;:()]/g, '');
                const defItem = actividad.lectura?.glosario?.find(g => palabraLimpia === g.termino.toLowerCase().trim());
                if (defItem) {
                    span.classList.add('palabra-glosario');
                    span.title = defItem.def;
                    span.onclick = (e) => {
                        e.stopPropagation();
                        window.mostrarToast(`📖 ${defItem.termino.toUpperCase()}: ${defItem.def}`, "info");
                    };
                }
                lineaElem.appendChild(span);
                palabrasLecturaArray.push(palabra);
            });

            pElem.appendChild(lineaElem);
            const esFinDeParrafo = (idxSeg === segmentos.length - 1);

            lineasLecturaArray.push({
                elem: lineaElem,
                conteoPalabras: palabras.length,
                parrafo: numParrafo + 1,
                esFinDeParrafo: esFinDeParrafo
            });
            idLineaGlobal++;
        });

        lienzo.appendChild(pElem);
    });

    document.getElementById('vista-lector-inmersivo').classList.remove('hidden');
    document.getElementById('vista-lector-inmersivo').classList.add('flex');
    window.renderLucide();
};

window.toggleReproduccionLectura = function() {
    if (estadoLecturaPausada) {
        window.reanudarRitmoLectura();
    } else {
        window.pausarRitmoLectura();
    }
};

window.reanudarRitmoLectura = function() {
    estadoLecturaPausada = false;
    const wpm = actividadActual.lectura?.wpmSugerido || 165;

    const btn = document.getElementById('btn-inmersivo-play');
    btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i><span>Pausar</span>`;
    window.renderLucide();

    if (!cronometroLecturaInterval) {
        cronometroLecturaInterval = setInterval(() => {
            segundosTranscurridosLectura++;
            const m = String(Math.floor(segundosTranscurridosLectura / 60)).padStart(2, '0');
            const s = String(segundosTranscurridosLectura % 60).padStart(2, '0');
            document.getElementById('inmersivo-tiempo').innerText = `${m}:${s}`;
        }, 1000);
    }

    const avanzarRenglon = () => {
        if (estadoLecturaPausada) return;

        if (indiceLineaLector < lineasLecturaArray.length) {
            if (indiceLineaLector > 0) {
                const prev = lineasLecturaArray[indiceLineaLector - 1].elem;
                prev.classList.remove('linea-activa');
                prev.classList.add('linea-leida');
            }

            const lineaActual = lineasLecturaArray[indiceLineaLector];
            lineaActual.elem.classList.add('linea-activa');
            lineaActual.elem.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const duracionMs = Math.max((lineaActual.conteoPalabras / wpm) * 60 * 1000, 1200);

            timeoutLineaPacer = setTimeout(() => {
                if (lineaActual.esFinDeParrafo) {
                    const pregPausa = actividadActual.preguntas?.find(p => !p.respondida && parseInt(p.parrafoPausa || 0) === lineaActual.parrafo);
                    
                    if (pregPausa) {
                        window.pausarRitmoLectura();
                        window.mostrarPreguntaIntermediaLectura(pregPausa);
                        return;
                    }
                }
                
                indiceLineaLector++;
                const porc = Math.round((indiceLineaLector / lineasLecturaArray.length) * 100);
                document.getElementById('inmersivo-progreso').innerText = `${porc}%`;
                avanzarRenglon();
            }, duracionMs);

        } else {
            window.pausarRitmoLectura();
            document.getElementById('btn-inmersivo-evaluar').classList.remove('hidden');
            window.mostrarToast("🎉 ¡Lectura finalizada! Realiza tu síntesis y preguntas finales.", "success");
        }
    };

    avanzarRenglon();
};

window.pausarRitmoLectura = function() {
    estadoLecturaPausada = true;
    if (timeoutLineaPacer) clearTimeout(timeoutLineaPacer);
    if (cronometroLecturaInterval) { clearInterval(cronometroLecturaInterval); cronometroLecturaInterval = null; }
    
    const btn = document.getElementById('btn-inmersivo-play');
    if (btn) {
        btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Continuar</span>`;
        window.renderLucide();
    }
};

window.mostrarPreguntaIntermediaLectura = function(pregunta) {
    const overlay = document.getElementById('overlay-pregunta-intermedia');
    const caja = document.getElementById('caja-pregunta-intermedia-activa');
    if (!overlay || !caja) return;

    caja.innerHTML = `
        <span class="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full mb-2 inline-block">Comprobación: Párrafo ${pregunta.parrafoPausa}</span>
        <h3 class="text-sm sm:text-base font-extrabold text-slate-900 mb-4 leading-snug">${window.escapeHTML(pregunta.texto)}</h3>
        <div id="opts-intermedia" class="space-y-2 mb-3"></div>
    `;

    const contO = caja.querySelector('#opts-intermedia');
    pregunta.opciones.forEach((opcion, i) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "w-full bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-800 font-bold py-2.5 px-4 rounded-xl text-left text-xs border border-slate-200 transition-all shadow-xs";
        btn.innerText = opcion;
        btn.onclick = () => {
            const esCorrecta = (i + 1) === parseInt(pregunta.correcta);
            pregunta.respondida = true;
            intentoActual.resueltas++;
            if (esCorrecta) intentoActual.correctas++;

            const optCorrectaTexto = pregunta.opciones[parseInt(pregunta.correcta) - 1] || '';
            intentoActual.respuestas.push({
                textoPregunta: pregunta.texto,
                opcionSeleccionada: opcion,
                opcionCorrecta: optCorrectaTexto,
                esCorrecta: esCorrecta,
                feedback: pregunta.feedback || ""
            });

            const boxColor = esCorrecta ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800';
            const feedbackMsg = esCorrecta
                ? (pregunta.feedback || '¡Correcto! Has interpretado muy bien el párrafo.')
                : 'Respuesta incorrecta. Recuerda analizar los conceptos con atención antes de responder.';

            caja.innerHTML = `
                <div class="p-4 rounded-xl border ${boxColor} mb-4 text-center">
                    <h4 class="text-sm font-black mb-1">${esCorrecta ? '¡Respuesta Correcta! ✅' : 'Respuesta Incorrecta ❌'}</h4>
                    <p class="text-xs leading-relaxed">${window.escapeHTML(feedbackMsg)}</p>
                </div>
                <button type="button" id="btn-reanudar-lectura-modal" class="w-full histudy-btn py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider">
                    Continuar Lectura ▶
                </button>
            `;

            document.getElementById('btn-reanudar-lectura-modal').onclick = () => {
                overlay.classList.add('hidden');
                indiceLineaLector++;
                window.reanudarRitmoLectura();
            };
        };
        contO.appendChild(btn);
    });

    overlay.classList.remove('hidden');
};

window.salirModoLecturaInmersiva = function() {
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    window.pausarRitmoLectura();
    document.getElementById('vista-lector-inmersivo').classList.add('hidden');
    document.getElementById('vista-lector-inmersivo').classList.remove('flex');
    window.volverDashboardEstudiante();
};

window.toggleFullScreenNativo = function() {
    const doc = document.documentElement;
    const icon = document.getElementById('icon-fullscreen');
    if (!document.fullscreenElement) {
        if (doc.requestFullscreen) doc.requestFullscreen();
        if (icon) icon.setAttribute('data-lucide', 'minimize');
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        if (icon) icon.setAttribute('data-lucide', 'maximize');
    }
    window.renderLucide();
};

window.setTemaInmersivo = function(modo) {
    const vista = document.getElementById('vista-lector-inmersivo');
    if (!vista) return;
    if (modo === 'sepia') {
        vista.className = "fixed inset-0 z-[80] flex flex-col bg-[#FBF0D9] text-[#292524] transition-colors duration-200";
    } else if (modo === 'noche') {
        vista.className = "fixed inset-0 z-[80] flex flex-col bg-[#0F172A] text-[#E2E8F0] transition-colors duration-200";
    } else {
        vista.className = "fixed inset-0 z-[80] flex flex-col bg-slate-50 text-[#0F172A] transition-colors duration-200";
    }
};

window.cambiarTamanoTexto = function(delta) {
    tamanoFuenteLectura = Math.max(16, Math.min(32, tamanoFuenteLectura + delta));
    const contenedor = document.getElementById('inmersivo-columna-texto');
    if (contenedor) contenedor.style.fontSize = `${tamanoFuenteLectura}px`;
};

window.pasarAEvaluacionLectura = function() {
    window.pausarRitmoLectura();
    const totalPalabras = palabrasLecturaArray.length;
    const tiempoMinutos = Math.max(segundosTranscurridosLectura / 60, 0.1);
    const wpmReal = Math.round(totalPalabras / tiempoMinutos);
    
    document.getElementById('eval-wpm-real').innerText = `${wpmReal} WPM`;
    const cajaP = document.getElementById('caja-preguntas-lectura-estudiante');
    cajaP.innerHTML = '';

    const preguntasPendientes = (actividadActual.preguntas || []).filter(p => !p.respondida);

    if (preguntasPendientes.length === 0) {
        cajaP.innerHTML = `<div class="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">✅ Ya respondiste todas las preguntas intermedias durante la lectura. Completa tu síntesis para finalizar.</div>`;
    } else {
        preguntasPendientes.forEach((p, idx) => {
            const div = document.createElement('div');
            div.className = "bg-white p-3.5 rounded-xl border border-slate-200 text-left";
            div.innerHTML = `
                <p class="text-xs sm:text-sm font-bold text-slate-900 mb-2">${idx + 1}. ${window.escapeHTML(p.texto)}</p>
                <div class="space-y-1.5" id="opts-lec-pregunta-${idx}"></div>
            `;
            const oCont = div.querySelector(`#opts-lec-pregunta-${idx}`);
            p.opciones.forEach((opcion, oIdx) => {
                oCont.innerHTML += `
                    <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs font-semibold select-none">
                        <input type="radio" name="resp_lec_${idx}" value="${oIdx + 1}" class="text-emerald-600 focus:ring-emerald-500">
                        <span>${window.escapeHTML(opcion)}</span>
                    </label>
                `;
            });
            cajaP.appendChild(div);
        });
    }

    document.getElementById('estudiante-reflexion-lectura').value = '';
    document.getElementById('modal-evaluacion-lectura').classList.remove('hidden');
};

window.finalizarEvaluacionLectura = async function() {
    const reflexion = document.getElementById('estudiante-reflexion-lectura').value.trim();
    if (!reflexion) {
        window.mostrarToast("Por favor escribe tu síntesis de la lectura", "warning");
        return;
    }

    const preguntasPendientes = (actividadActual.preguntas || []).filter(p => !p.respondida);

    for (let i = 0; i < preguntasPendientes.length; i++) {
        const sel = document.querySelector(`input[name="resp_lec_${i}"]:checked`);
        if (!sel) {
            window.mostrarToast(`Responde la pregunta #${i + 1}`, "warning");
            return;
        }
        const seleccionadaVal = parseInt(sel.value);
        const esCorrecta = seleccionadaVal === parseInt(preguntasPendientes[i].correcta);
        preguntasPendientes[i].respondida = true;
        intentoActual.resueltas++;
        if (esCorrecta) intentoActual.correctas++;

        intentoActual.respuestas.push({
            textoPregunta: preguntasPendientes[i].texto,
            opcionSeleccionada: preguntasPendientes[i].opciones[seleccionadaVal - 1],
            opcionCorrecta: preguntasPendientes[i].opciones[parseInt(preguntasPendientes[i].correcta) - 1],
            esCorrecta: esCorrecta,
            feedback: preguntasPendientes[i].feedback || ""
        });
    }

    const totalP = actividadActual.preguntas && actividadActual.preguntas.length > 0 ? actividadActual.preguntas.length : 1;
    const notaFinal = (((intentoActual.correctas / totalP) * 4) + 1).toFixed(1);
    const tiempoMinutos = Math.max(segundosTranscurridosLectura / 60, 0.1);
    const wpmReal = Math.round(palabrasLecturaArray.length / tiempoMinutos);

    const entrega = {
        idEntrega: "ENT_LEC_" + Date.now().toString(36).toUpperCase(),
        estudianteId: estudianteIdActual,
        actividadId: actividadActual.id,
        versionActividad: actividadActual.version || 1,
        correctas: intentoActual.correctas,
        resueltas: totalP,
        nota: notaFinal,
        numeroIntento: intentoActual.numeroIntento || 1,
        fecha: new Date().toLocaleString(),
        laboratorio: { "Velocidad": `${wpmReal} WPM`, "Tiempo": `${segundosTranscurridosLectura} seg` },
        reflexion: reflexion,
        respuestas: intentoActual.respuestas,
        validador: btoa(notaFinal + "_" + estudianteIdActual + "_LecturaCafeLab")
    };

    localStorage.setItem(`nota_${estudianteIdActual}_${actividadActual.id}`, JSON.stringify(entrega));
    document.getElementById('modal-evaluacion-lectura').classList.add('hidden');
    window.salirModoLecturaInmersiva();
    window.mostrarToast(`¡Lectura calificada! Tu nota: ${notaFinal}`, "success");
    fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'guardarNota', payload: entrega }) }).catch(()=>{});
};

/* VISOR DE DETALLES */
window.verDetalleEntrega = function(encodedData, permitirVerCorrectas = false) {
    if (!encodedData || encodedData === 'null') return;
    let data;
    try { data = JSON.parse(decodeURIComponent(encodedData)); } catch(e) { return; }

    const notaNum = parseFloat(data.nota || 0);
    const notaColor = notaNum >= 3.0 ? 'text-emerald-600' : 'text-rose-600';
    const puedeVerCorrectas = permitirVerCorrectas || (notaNum > 4.0);

    document.getElementById('view-detalle-resumen').innerHTML = `
        <div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <span class="block text-[10px] font-bold text-slate-500 uppercase">Última Nota</span>
            <span class="text-xl sm:text-2xl font-black ${notaColor}">${window.escapeHTML(data.nota != null ? data.nota : '--')} / 5.0</span>
        </div>
        <div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <span class="block text-[10px] font-bold text-slate-500 uppercase">Intento Registrado</span>
            <span class="text-base sm:text-lg font-black text-slate-800 block mt-1">#${window.escapeHTML(data.numeroIntento || 1)}</span>
        </div>
        <div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <span class="block text-[10px] font-bold text-slate-500 uppercase">Fecha Entrega</span>
            <span class="text-xs font-bold text-slate-800 block mt-1">${window.escapeHTML(data.fecha || 'No registrada')}</span>
        </div>
    `;

    const pregContainer = document.getElementById('view-detalle-preguntas-container');
    const pregList = document.getElementById('view-detalle-preguntas-list');
    
    if (data.respuestas && Array.isArray(data.respuestas) && data.respuestas.length > 0) {
        pregList.innerHTML = '';
        data.respuestas.forEach((r, idx) => {
            const esOk = r.esCorrecta;
            let bloqueOpcionCorrecta = '';
            let bloqueFeedback = '';

            if (puedeVerCorrectas) {
                if (!esOk) bloqueOpcionCorrecta = `<p class="text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded border border-emerald-300">Opción correcta: ${window.escapeHTML(r.opcionCorrecta)}</p>`;
                if (r.feedback) bloqueFeedback = `<p class="text-slate-500 italic mt-1">💡 ${window.escapeHTML(r.feedback)}</p>`;
            } else if (!esOk) {
                bloqueOpcionCorrecta = `<p class="text-slate-500 italic text-[11px] bg-slate-100 p-1.5 rounded">🔒 La respuesta correcta estará disponible en tu último intento o al obtener una nota superior a 4.0.</p>`;
            }

            pregList.innerHTML += `
                <div class="p-3 rounded-xl border ${esOk ? 'border-emerald-200 bg-white' : 'border-rose-200 bg-rose-50/30'} text-xs space-y-1">
                    <div class="flex justify-between font-bold text-slate-900">
                        <span>${idx + 1}. ${window.escapeHTML(r.textoPregunta)}</span>
                        <span class="${esOk ? 'text-emerald-700' : 'text-rose-700'}">${esOk ? 'Correcta ✅' : 'Incorrecta ❌'}</span>
                    </div>
                    <p class="${esOk ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}">Tu Respuesta: ${window.escapeHTML(r.opcionSeleccionada)}</p>
                    ${bloqueOpcionCorrecta}
                    ${bloqueFeedback}
                </div>
            `;
        });
        pregContainer.classList.remove('hidden');
    } else { 
        pregContainer.classList.add('hidden'); 
    }

    const labContainer = document.getElementById('view-detalle-lab-container');
    const labGrid = document.getElementById('view-detalle-lab-grid');
    if (data.laboratorio && Object.keys(data.laboratorio).length > 0) {
        labGrid.innerHTML = '';
        for (const [campo, valor] of Object.entries(data.laboratorio)) {
            labGrid.innerHTML += `<div class="bg-white p-2.5 rounded-lg border text-xs"><span class="text-slate-400 block text-[10px] font-bold uppercase">${window.escapeHTML(campo)}</span><span class="font-black text-slate-800">${window.escapeHTML(valor) || '--'}</span></div>`;
        }
        labContainer.classList.remove('hidden');
    } else { labContainer.classList.add('hidden'); }

    document.getElementById('view-detalle-reflexion').innerText = data.reflexion || 'Sin reflexión registrada.';
    document.getElementById('view-detalle-overlay').classList.remove('hidden');
    window.renderLucide();
};

function extraerIdYouTubeFront(url) {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : "M7lc1UVf-VE"; 
}

document.addEventListener("DOMContentLoaded", () => {
    window.renderLucide();
    window.renderSelectoresGradosDestino([]);
});