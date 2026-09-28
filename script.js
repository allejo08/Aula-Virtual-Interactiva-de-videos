const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwU-4PYRnAFAo7TrNau5QKyXOOntvlzbvIF2IcotVslMjiZI7qloelbuPqwU83NyBnQ/exec';
const LISTA_GRADOS = ["6-1", "6-2", "7", "8-1", "8-2", "9", "10", "11"];
const OPCIONES_DESTINO = ["Docente", "6-1", "6-2", "7", "8-1", "8-2", "9", "10", "11"];

// Paleta de degradados para distinguir clases visualmente
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
    else if (idVista === 'vista-hub-actividades' || idVista === 'vista-actividad') btnId = 'nav-actividad';
    else if (idVista === 'vista-estudiantes') btnId = 'nav-estudiantes';

    if(btnId) {
        const b = document.getElementById(btnId);
        if(b) b.className = "nav-btn w-full text-left bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2.5 text-xs shadow-md";
    }
    window.renderLucide();
};

window.renderSelectoresGradosDestino = function(seleccionados = []) {
    const cont = document.getElementById('contenedor-grados-destino');
    if (!cont) return;
    cont.innerHTML = '';
    const todosMarcados = seleccionados.includes('Todos');
    
    OPCIONES_DESTINO.forEach(opt => {
        const isChecked = todosMarcados || seleccionados.includes(opt);
        const isDocente = opt === 'Docente';
        const labelColor = isDocente ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-slate-800 bg-white border-slate-200';
        cont.innerHTML += `
            <label class="flex items-center gap-1.5 p-2 rounded-lg border ${labelColor} cursor-pointer hover:border-indigo-400 text-xs font-bold select-none">
                <input type="checkbox" value="${opt}" onchange="window.actualizarSelectClasesFormulario()" class="checkbox-grado-destino rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" ${isChecked ? 'checked' : ''}>
                <span>${isDocente ? '⭐ Docente' : opt}</span>
            </label>
        `;
    });
};

window.toggleTodosGradosDestino = function() {
    const boxes = document.querySelectorAll('.checkbox-grado-destino');
    const algunDesmarcado = Array.from(boxes).some(b => !b.checked);
    boxes.forEach(b => b.checked = algunDesmarcado);
    window.actualizarSelectClasesFormulario();
};

/* GESTIÓN DE CLASES EN EL FORMULARIO DOCENTE */
window.actualizarSelectClasesFormulario = function(claseSeleccionada = '') {
    const select = document.getElementById('select-clase-existente');
    const inputNueva = document.getElementById('input-nueva-clase');
    if(!select || !inputNueva) return;

    const checkedBoxes = document.querySelectorAll('.checkbox-grado-destino:checked');
    const grados = Array.from(checkedBoxes).map(cb => cb.value);

    const clasesSet = new Set();
    window.baseActividades.forEach(act => {
        if (!act.clase || !act.clase.trim()) return;
        const coincide = act.grados && act.grados.some(g => grados.includes(g) || grados.includes('Todos') || g === 'Todos');
        if (coincide || grados.length === 0) {
            clasesSet.add(act.clase.trim());
        }
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
            const labelLab = act.requiereLaboratorio ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Sí</span>' : '<span class="text-[10px] text-slate-400">No</span>';
            const claseNombre = act.clase ? window.escapeHTML(act.clase) : '<span class="text-slate-400 italic">General</span>';
            const intentosTxt = (act.evaluacion && act.evaluacion.intentosPermitidos >= 999) ? 'Ilimitados' : ((act.evaluacion && act.evaluacion.intentosPermitidos) || 1);

            tabla.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 sm:px-5 py-3 font-extrabold text-slate-900">${window.escapeHTML(act.grados.join(', '))}</td>
                    <td class="px-4 sm:px-5 py-3 font-bold text-indigo-700">${claseNombre}</td>
                    <td class="px-4 sm:px-5 py-3 font-bold text-slate-800">${window.escapeHTML(act.titulo)}</td>
                    <td class="px-4 sm:px-5 py-3 text-center font-bold text-slate-600">${intentosTxt}</td>
                    <td class="px-4 sm:px-5 py-3 text-center">${labelLab}</td>
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
        const checkedBoxes = document.querySelectorAll('.checkbox-grado-destino:checked');
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

/* MODAL Y PARSER CSV */
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

window.loginDocente = async function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-docente');
    if(btnSubmit) btnSubmit.disabled = true;
    const password = document.getElementById('pass-docente').value.trim();

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'validarDocente', password: password }) });
        const result = await response.json();
        if(result.success) {
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('panel-docente').classList.remove('hidden');
            document.getElementById('panel-docente').classList.add('flex');
            window.sincronizarConNube(); 
        } else if(password === "AdminCafeLab") {
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('panel-docente').classList.remove('hidden');
            document.getElementById('panel-docente').classList.add('flex');
            window.renderDashboardDocente(window.filtroGradoActual);
        } else {
            window.mostrarToast(result.error || "Contraseña incorrecta", "error"); 
        }
    } catch(error) {
        if(password === "AdminCafeLab") {
            document.getElementById('login-panel').classList.add('hidden');
            document.getElementById('panel-docente').classList.remove('hidden');
            document.getElementById('panel-docente').classList.add('flex');
            window.renderDashboardDocente(window.filtroGradoActual);
        } else {
            window.mostrarToast("Error de conexión", "error");
        }
    } finally {
        if(btnSubmit) btnSubmit.disabled = false;
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
            const estIdRaw = raw.split('_ACT_')[0]; 
            const actId = 'ACT_' + raw.split('_ACT_')[1];
            
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
        // En vista docente siempre se permite ver evidencias completas
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
            const estIdRaw = key.replace('nota_', '').split('_ACT_')[0];
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
                const rawEstId = key.replace('nota_', '').split('_ACT_')[0];
                if (targetGrado === 'Todos' || rawEstId.startsWith(targetGrado + '-')) {
                    localStorage.removeItem(key);
                    localStorage.removeItem(`estado_${window.reporteActividadActualId}_${rawEstId}`);
                    localStorage.removeItem(`progreso_sesion_${rawEstId}_${window.reporteActividadActualId}`);
                }
            }
        }
        fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'reiniciarEntregaGrupo', grado: targetGrado, actividadId: window.reporteActividadActualId }) }).catch(()=>{});
        window.mostrarToast("Grupo reiniciado", "success");
        window.generarReporteActividad(window.reporteActividadActualId);
    }
};

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

// Pausar y guardar estado exacto de segundo visto y avance
window.volverDashboardEstudiante = function() {
    let tiempoPausa = 0;
    if(player && typeof player.getCurrentTime === 'function') {
        try { 
            tiempoPausa = player.getCurrentTime();
            player.pauseVideo(); 
        } catch(e) {}
    }
    if(intervaloVideo) clearInterval(intervaloVideo);
    
    // Guardar progreso de sesión parcial
    if(actividadActual && estudianteIdActual) {
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

    document.getElementById('panel-docente').classList.add('hidden');
    document.getElementById('panel-docente').classList.remove('flex');
    document.getElementById('panel-estudiante').classList.add('hidden');
    document.getElementById('panel-estudiante').classList.remove('flex');
    document.getElementById('login-panel').classList.remove('hidden');
    window.toggleSidebarDocente(false);
};

/* CONSTRUCCIÓN DEL DASHBOARD ESTUDIANTE: CARPETAS CON GRADIENTES Y ATAJOS */
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
            contenedorAtajos.innerHTML += `
                <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-300 transition-all">
                    <div class="min-w-0">
                        <span class="text-[9px] font-black uppercase text-indigo-600 tracking-wider">${window.escapeHTML(nombreClase)}</span>
                        <h4 class="font-bold text-slate-900 text-xs truncate">${window.escapeHTML(act.titulo)}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold">Intentos: ${txtIntentosAtajo}</span>
                    </div>
                    <button type="button" onclick="window.iniciarActividadPorId('${window.escapeHTML(act.id)}')" class="histudy-btn px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
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
        
        // Asignación de gradiente diferenciador según índice
        const estiloClase = CLASE_GRADIENTES[index % CLASE_GRADIENTES.length];

        let actividadesHTML = '';
        items.forEach(it => {
            const { act, entrega, maxIntentos, intentosRealizados, puedeReintentar } = it;
            const seguroId = window.escapeHTML(act.id);
            const intentosMaxTxt = maxIntentos >= 999 ? '∞' : maxIntentos;
            
            if (entrega) {
                const val = entrega.nota != null ? entrega.nota : '0.0';
                const esGanada = parseFloat(val) >= 3.0;
                const badgeColor = esGanada ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';
                const notaBoxColor = esGanada ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300';
                
                // Determinar si puede ver retroalimentación completa: último intento o nota > 4.0
                const permitirVerRespuestas = (intentosRealizados >= maxIntentos) || (parseFloat(val) > 4.0);
                const safeEntrega = encodeURIComponent(JSON.stringify(entrega));

                const btnReintentar = (puedeReintentar && act.estado === 'Activa')
                    ? `<button type="button" onclick="window.iniciarActividadPorId('${seguroId}')" class="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all">Reintentar</button>`
                    : `<span class="text-[10px] text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded-lg">Intentos agotados</span>`;

                actividadesHTML += `
                    <div class="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="p-1 rounded-md bg-purple-100 text-purple-700"><i data-lucide="play-circle" class="w-3.5 h-3.5"></i></span>
                                <h5 class="font-bold text-slate-900 text-xs sm:text-sm">${window.escapeHTML(act.titulo)}</h5>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                                <span class="px-2 py-0.5 rounded-full border ${badgeColor}">${esGanada ? 'Aprobada' : 'Reprobada'}</span>
                                <span class="text-slate-400">Intento: <strong>${intentosRealizados}/${intentosMaxTxt}</strong></span>
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
                                <span class="p-1 rounded-md bg-indigo-100 text-indigo-700"><i data-lucide="play-circle" class="w-3.5 h-3.5"></i></span>
                                <h5 class="font-bold text-slate-900 text-xs sm:text-sm">${window.escapeHTML(act.titulo)}</h5>
                            </div>
                            <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                <span>Intentos permitidos: ${intentosMaxTxt}</span>
                                <span>•</span>
                                <span>📅 ${window.escapeHTML(act.fechaCreacion || 'Activo')}</span>
                            </div>
                        </div>
                        <button type="button" onclick="window.iniciarActividadPorId('${seguroId}')" class="histudy-btn px-4 py-2 rounded-lg text-xs font-bold w-full sm:w-auto">
                            Comenzar Actividad
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

/* INICIAR O REANUDAR ACTIVIDAD */
window.iniciarActividadPorId = function(idActividad) {
    const act = window.baseActividades.find(a => a.id === idActividad);
    if(!act) return;
    actividadActual = JSON.parse(JSON.stringify(act));

    // Determinar número de intento
    const notaGuardada = localStorage.getItem(`nota_${estudianteIdActual}_${act.id}`);
    let intentoNum = 1;
    if (notaGuardada) {
        try {
            const p = JSON.parse(notaGuardada);
            intentoNum = (parseInt(p.numeroIntento) || 1) + 1;
        } catch(e) { intentoNum = 2; }
    }

    // Verificar si hay sesión previa guardada para reanudar tiempo y preguntas
    let tiempoInicio = 0;
    const sesionPreviaStr = localStorage.getItem(`progreso_sesion_${estudianteIdActual}_${act.id}`);
    if (sesionPreviaStr) {
        try {
            const sesionPrevia = JSON.parse(sesionPreviaStr);
            tiempoInicio = Math.floor(sesionPrevia.tiempoGuardado || 0);
            maxTiempoVisto = sesionPrevia.maxTiempoVisto || tiempoInicio;
            intentoActual = sesionPrevia.intentoActual || { correctas: 0, resueltas: 0, respuestas: [], numeroIntento: intentoNum };
            
            // Rehidratar preguntas contestadas
            if (sesionPrevia.preguntas && Array.isArray(sesionPrevia.preguntas)) {
                actividadActual.preguntas = sesionPrevia.preguntas;
            }
            window.mostrarToast(`Reanudando clase desde el segundo ${tiempoInicio}`, "info");
        } catch(e) {
            tiempoInicio = 0;
            maxTiempoVisto = 0;
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
        window.mostrarToast("⚠️ Debes ver la clase completa sin adelantar.", "warning"); 
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
                    
                    // Condición: en intento en curso, solo dar feedback formativo sin revelar respuesta correcta
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
    // Al finalizar completamente, se limpia el progreso en pausa
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

/* VISOR DE DETALLES CON REVELACIÓN CONDICIONAL DE RESPUESTAS */
window.verDetalleEntrega = function(encodedData, permitirVerCorrectas = false) {
    if (!encodedData || encodedData === 'null') return;
    let data;
    try { data = JSON.parse(decodeURIComponent(encodedData)); } catch(e) { return; }

    const notaNum = parseFloat(data.nota || 0);
    const notaColor = notaNum >= 3.0 ? 'text-emerald-600' : 'text-rose-600';
    
    // Regla pedagógica: revela respuestas correctas si docente lo abre, si es el último intento o si nota > 4.0
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
                if (!esOk) {
                    bloqueOpcionCorrecta = `<p class="text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded border border-emerald-300">Opción correcta: ${window.escapeHTML(r.opcionCorrecta)}</p>`;
                }
                if (r.feedback) {
                    bloqueFeedback = `<p class="text-slate-500 italic mt-1">💡 ${window.escapeHTML(r.feedback)}</p>`;
                }
            } else if (!esOk) {
                bloqueOpcionCorrecta = `<p class="text-slate-500 italic text-[11px] bg-slate-100 p-1.5 rounded">🔒 La respuesta correcta y retroalimentación completa estarán disponibles en tu último intento o al obtener una nota superior a 4.0.</p>`;
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