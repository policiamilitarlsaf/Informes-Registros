// proteccion.js
// Medidas de seguridad para evitar inspección y manipulación del código

(function() {
    'use strict';

    // 1. Deshabilitar clic derecho
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // 2. Deshabilitar combinaciones de teclado que abren herramientas de desarrollador
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Windows/Linux) o Cmd+Option+I (Mac)
        if ((e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.altKey && e.key === 'I')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (abrir inspector con selección)
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (ver código fuente)
        if ((e.ctrlKey && e.key === 'u') || (e.metaKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (guardar página)
        if ((e.ctrlKey && e.key === 's') || (e.metaKey && e.key === 's')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (abrir consola)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+K (consola en Firefox)
        if (e.ctrlKey && e.shiftKey && e.key === 'K') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+E (inspector de CSS en Firefox)
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+M (vista responsiva)
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+P (comandos en Chrome)
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            return false;
        }
    });

    // 3. Limpiar consola cada 2 segundos (dificulta la lectura)
    setInterval(function() {
        console.clear();
    }, 2000);

    // 4. Anular todos los métodos de console para que no muestren nada
    const noop = function() {};
    const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'table', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'count', 'assert', 'profile', 'profileEnd'];
    for (let method of consoleMethods) {
        if (console[method]) {
            console[method] = noop;
        }
    }

    // 5. Prevenir la selección de texto (opcional, para evitar copiar)
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });

    // 6. Deshabilitar arrastre de imágenes (evita que arrastren para inspeccionar)
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // 7. Detecta si se abre la consola (aunque no es 100% infalible)
    // Se puede agregar un detector de tamaño de ventana, pero es más invasivo
    // Nota: Esta técnica no es perfecta y puede tener falsos positivos, pero se incluye como ejemplo.
    setInterval(function() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) { // si hay pausa, probablemente la consola está abierta
            // opcional: redirigir o mostrar mensaje, pero cuidado con los falsos positivos
            // console.clear();
            // alert("Por favor, cierra las herramientas de desarrollador para continuar.");
        }
    }, 5000);

    // 8. Evitar que el usuario pueda ver el código fuente mediante devtools (más agresivo)
    // Esta técnica intenta forzar la desactivación de debugger cuando se abre la consola
    // Nota: Puede causar molestias en algunos navegadores.
    (function() {
        let devtools = /./;
        devtools.toString = function() {
            this.opened = true;
            // Opcional: puedes agregar aquí una acción, como limpiar la consola nuevamente
            console.clear();
        };
        setInterval(function() {
            console.log(devtools);
            console.clear();
        }, 1000);
    })();

    // 9. Proteger el contenido de localStorage (solo si es necesario, no se puede ocultar)
    // No hay forma de ocultar localStorage, pero puedes ofuscar nombres de claves.

})();
