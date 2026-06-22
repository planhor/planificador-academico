const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { cargarModulo } = require('./helpers/cargar-modulo');

const DOCS = path.resolve(__dirname, '../docs');
const INDEX = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');

const PESTANAS = {
    dashboard: 'panelDashboard',
    secciones: 'panelSecciones',
    asignaturas: 'panelAsignaturas',
    docentes: 'panelDocentes',
    salas: 'panelSalas',
    planificacion: 'panelPlanificacion',
    vistaHorarios: 'panelVistaHorarios',
    reportes: 'panelReportes',
    gestorSecciones: 'panelGestorSecciones',
    historial: 'panelHistorial',
    fichaDocente: 'panelFichaDocente'
};

test('cada pestaña principal tiene un panel correspondiente', () => {
    for (const [pestana, panel] of Object.entries(PESTANAS)) {
        assert.match(INDEX, new RegExp(`data-tab=["']${pestana}["']`));
        assert.match(INDEX, new RegExp(`id=["']${panel}["']`));
    }
});

test('el HTML no contiene IDs duplicados', () => {
    const ids = [...INDEX.matchAll(/\bid=["']([^"']+)["']/g)].map(coincidencia => coincidencia[1]);
    const duplicados = ids.filter((id, indice) => ids.indexOf(id) !== indice);
    assert.deepEqual(duplicados, []);
});

test('los módulos cargan antes de app.js y conservan el orden requerido', () => {
    const scripts = [...INDEX.matchAll(/<script\s+src=["']([^"']+)["']/g)]
        .map(coincidencia => coincidencia[1].split('?')[0])
        .filter(src => src.includes('planificador_modulos/'));
    const esperados = [
        'planificador_modulos/utils.js',
        'planificador_modulos/sync.js',
        'planificador_modulos/exportaciones.js',
        'planificador_modulos/vista-horario.js',
        'planificador_modulos/reportes.js',
        'planificador_modulos/ficha-docente.js',
        'planificador_modulos/entidades.js',
        'planificador_modulos/planificacion.js',
        'planificador_modulos/configuracion.js',
        'planificador_modulos/app.js'
    ];
    assert.deepEqual(scripts, esperados);
});

test('los controles de exportación visibles están enlazados a sus módulos', () => {
    ['btnExportar', 'btnExportarVista', 'btnExportarReporte', 'btnExportarFichaPDF', 'btnExportarFichaJPG']
        .forEach(id => assert.match(INDEX, new RegExp(`id=["']${id}["']`)));
    ['excel', 'jpg', 'pdf'].forEach(formato => assert.match(INDEX, new RegExp(`data-format=["']${formato}["']`)));

    const vista = fs.readFileSync(path.join(DOCS, 'planificador_modulos/vista-horario.js'), 'utf8');
    const ficha = fs.readFileSync(path.join(DOCS, 'planificador_modulos/ficha-docente.js'), 'utf8');
    assert.match(vista, /exportarVistaExcel/);
    assert.match(vista, /exportarVistaJPG/);
    assert.match(vista, /exportarVistaPDF/);
    assert.match(ficha, /btnExportarFichaPDF/);
    assert.match(ficha, /btnExportarFichaJPG/);
    assert.match(ficha, /sanitizarNodoExportacion/);
    assert.match(ficha, /reforzarGrillasExportacion/);
});

test('el Worker del solver conserva contrato y fallback en Planificación', () => {
    const planificacion = fs.readFileSync(path.join(DOCS, 'planificador_modulos/planificacion.js'), 'utf8');
    const worker = fs.readFileSync(path.join(DOCS, 'planificador_modulos/solver-worker.js'), 'utf8');

    assert.match(planificacion, /new Worker\(['"]planificador_modulos\/solver-worker\.js/);
    assert.match(planificacion, /simularOptimizacionIterativa/);
    assert.match(planificacion, /Worker de optimización no disponible; se usa el motor local/);
    assert.match(worker, /importScripts\(['"]planificacion\.js/);
    assert.match(worker, /self\.onmessage/);
    assert.match(worker, /self\.postMessage/);
});

test('las colecciones grandes mantienen paginacion o virtualizacion nativa', () => {
    const app = fs.readFileSync(path.join(DOCS, 'planificador_modulos/app.js'), 'utf8');
    const reportes = fs.readFileSync(path.join(DOCS, 'planificador_modulos/reportes.js'), 'utf8');
    const estilos = fs.readFileSync(path.join(DOCS, 'planificador_modulos/estilos.css'), 'utf8');

    assert.match(app, /\[20,50,100\]/);
    assert.match(app, /filtradas\.slice\(inicio,inicio\+tamano\)/);
    assert.match(reportes, /filtrados\.slice\(inicio,inicio\+reporteTamano\)/);
    assert.match(reportes, /gruposTodos\.slice\(inicio,inicio\+historialTamano\)/);
    assert.match(estilos, /@supports \(content-visibility:auto\)/);
    for (const clase of ['area-section-group', 'subject-specialty-group', 'docentes-specialty-group', 'rooms-type-group']) {
        assert.match(estilos, new RegExp(`\\.${clase}`));
    }
});

test('el historial agrupa por operación o revisión sin mezclar momentos distintos', () => {
    const reportes = fs.readFileSync(path.join(DOCS, 'planificador_modulos/reportes.js'), 'utf8');
    assert.match(reportes, /ev\.operacionId\|\|ev\.revisionId/);
    assert.match(reportes, /\[operacion,ev\.accion,ev\.usuario,p\.seccionId,p\.asignaturaId\]/);
});

function crearXlsxFalso() {
    const escritos = [];
    const letra = indice => String.fromCharCode(65 + indice);
    const utils = {
        book_new: () => ({ SheetNames: [], Sheets: {} }),
        aoa_to_sheet: matriz => {
            const hoja = { '!ref': `A1:${letra(Math.max(0, (matriz[0] || []).length - 1))}${Math.max(1, matriz.length)}` };
            matriz.forEach((fila, r) => fila.forEach((valor, c) => { hoja[`${letra(c)}${r + 1}`] = { v: valor }; }));
            return hoja;
        },
        book_append_sheet: (libro, hoja, nombre) => {
            libro.SheetNames.push(nombre);
            libro.Sheets[nombre] = hoja;
        },
        decode_range: referencia => {
            const [, fin = 'A1'] = String(referencia).split(':');
            return { s: { r: 0, c: 0 }, e: { r: Number(fin.match(/\d+/)?.[0] || 1) - 1, c: fin.charCodeAt(0) - 65 } };
        },
        encode_cell: ({ r, c }) => `${letra(c)}${r + 1}`
    };
    return {
        utils,
        escritos,
        writeFile: (libro, nombre) => escritos.push({ libro, nombre })
    };
}

test('las exportaciones Excel generan grillas y archivos con datos', async () => {
    const XLSX = crearXlsxFalso();
    const data = {
        configuracion: { exportacionExcel: 'xlsx' },
        secciones: [{ id: 'sec-1', nombre: 'D-TST-N1-P1-C1' }],
        asignaturas: [{ id: 'asi-1', codigo: 'TST101', nombre: 'Asignatura' }],
        docentes: [{ id: 'doc-1', nombre: 'Nombre', apellido: 'Apellido' }],
        salas: [{ id: 'sala-1', nombre: 'Sala 101' }],
        gruposDictacion: [],
        asignaturaSeccion: [],
        planificaciones: [{
            id: 'p1', seccionId: 'sec-1', asignaturaId: 'asi-1', docenteId: 'doc-1', salaId: 'sala-1', dia: 0, bloque: 1
        }]
    };
    const factory = cargarModulo('exportaciones.js', 'PlanificadorExportaciones', { window: { XLSX } });
    const api = factory.create({
        getData: () => data,
        getPlanificaciones: () => data.planificaciones,
        getModoExcel: () => 'xlsx',
        getTemporadaLabel: () => 'Otono_2026',
        toast: () => {},
        DIAS: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        BLOQUES: Array.from({ length: 18 }, (_, indice) => ({ n: indice + 1, inicio: '08:00', fin: '08:45' })),
        DOCENTE_NN_ID: 'docente-nn'
    });

    const matriz = api.generarMatriz(data.planificaciones);
    assert.equal(matriz.length, 19);
    assert.equal(matriz[0].length, 7);
    assert.match(matriz[1][1], /TST101/);
    assert.match(matriz[1][1], /N\. Apellido/);
    assert.match(matriz[1][1], /Sala 101/);

    await api.exportarCursos();
    await api.exportarDocentes();
    await api.exportarSalas();
    await api.descargarExcelCompleto();

    assert.deepEqual(XLSX.escritos.map(item => item.nombre), [
        'Cursos_Otono_2026.xlsx',
        'Docentes_Otono_2026.xlsx',
        'Salas_Otono_2026.xlsx',
        'Planificador_Completo_Otono_2026.xlsx'
    ]);
    XLSX.escritos.forEach(item => assert.ok(item.libro.SheetNames.length > 0));
});
