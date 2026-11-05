const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoSync } = require('./helpers/entorno-sync');

for (const evento of ['focus', 'online', 'visibilitychange']) {
    test(`restauración retenida no se publica por ${evento}`, async () => {
        const e = crearEntornoSync(); await e.iniciar();
        assert.equal(await e.prepararRestauracion(), true);
        await e.evento(evento); await e.ejecutarTimer();
        assert.equal(e.escrituras.length, 0);
        assert.equal(e.confirmaciones, 0);
        assert.equal(e.data.docentes[0].nombre, 'Restaurado sintético');
    });
}

test('snapshot remoto, guardado forzado y recarga automática respetan retención', async () => {
    const e = crearEntornoSync(); await e.iniciar(); await e.prepararRestauracion();
    await e.emitirSnapshot();
    assert.equal(e.escrituras.length, 0);
    assert.equal(e.data.docentes[0].nombre, 'Restaurado sintético');
    await e.sync.guardar({ forzar: true });
    await e.sync.recargarDesdeFirestore({ automatico: true });
    assert.equal(e.escrituras.length, 0);
    assert.equal(e.confirmaciones, 0);
    assert.equal(e.data.docentes[0].nombre, 'Restaurado sintético');
});

test('cancelar sincronización manual mantiene retención durable', async () => {
    const e = crearEntornoSync({ confirmar: false }); await e.iniciar(); await e.prepararRestauracion();
    const retencion = e.storage.get('planificador_v5_8_restauracion_retenida');
    assert.ok(retencion);
    await e.sync.recargarDesdeFirestore();
    assert.equal(e.confirmaciones, 1);
    assert.equal(e.escrituras.length, 0);
    assert.equal(e.storage.get('planificador_v5_8_restauracion_retenida'), retencion);
});

for (const yaConfirmada of [false, true]) {
    test(`publicación explícita permite fusión y libera retención (UI=${yaConfirmada})`, async () => {
        const e = crearEntornoSync({ confirmar: true }); await e.iniciar(); await e.prepararRestauracion();
        const resultado = await e.sync.recargarDesdeFirestore(yaConfirmada ? { confirmarRestauracion: true } : undefined);
        assert.equal(resultado, true);
        assert.ok(e.escrituras.length > 0);
        assert.equal(e.confirmaciones, yaConfirmada ? 0 : 1);
        assert.equal(e.storage.has('planificador_v5_8_restauracion_retenida'), false);
    });
}

test('reinicio conserva retención con localStorage compartido', async () => {
    const storage = new Map();
    const primero = crearEntornoSync({ storage }); await primero.iniciar(); await primero.prepararRestauracion();
    const segundo = crearEntornoSync({ storage }); await segundo.iniciar();
    await segundo.evento('focus'); await segundo.ejecutarTimer();
    await segundo.sync.guardar({ forzar: true });
    assert.equal(segundo.escrituras.length, 0);
    assert.ok(storage.has('planificador_v5_8_restauracion_retenida'));
});

test('sin almacenamiento durable restauración falla y no afirma éxito', async () => {
    const e = crearEntornoSync({ fallarStorage: true }); await e.iniciar();
    assert.equal(await e.prepararRestauracion(), false);
    assert.equal(e.escrituras.length, 0);
    assert.equal(e.storage.size, 0);
    assert.equal(e.estados.some(args => args[1] === 'Restaurado localmente'), false);
});

test('sin red ni almacenamiento guardar no afirma protección local', async () => {
    const e = crearEntornoSync({ fallarStorage: true, fallarRed: true }); await e.iniciar();
    assert.equal(await e.sync.guardar(), false);
    assert.equal(e.estados.some(args => args[0] === 'success'), false);
    assert.equal(e.avisos.some(args => /quedaron guardados localmente|permanece protegido/i.test(args[0])), false);
});

test('snapshot espera persistencia y devuelve false si fallan ambos almacenes', async () => {
    const e = crearEntornoSync({ usarIDB: true, abortarIDB: true, fallarStorage: true }); await e.iniciar();
    assert.equal(await e.sync.crearSnapshotActual(), false);
    assert.equal(e.registrosIDB.size, 0);
    assert.equal(e.storage.size, 0);
});

test('snapshot con transacción IDB abortada usa fallback durable', async () => {
    const e = crearEntornoSync({ usarIDB: true, abortarIDB: true }); await e.iniciar();
    assert.equal(await e.sync.crearSnapshotActual(), true);
    assert.equal(e.registrosIDB.size, 0);
    const lista = JSON.parse(e.storage.get('planificador_v5_8_recovery_snapshots'));
    assert.equal(lista.length, 1);
    assert.equal(JSON.parse(lista[0].json).docentes[0].id, 'd1');
});

test('retención persiste en IndexedDB y sobrevive reinicio', async () => {
    const registrosIDB = new Map();
    const primero = crearEntornoSync({ usarIDB: true, registrosIDB }); await primero.iniciar();
    assert.equal(await primero.prepararRestauracion(), true);
    assert.ok(registrosIDB.has('restauracion'));
    const segundo = crearEntornoSync({ usarIDB: true, registrosIDB }); await segundo.iniciar();
    await segundo.sync.guardar({ forzar: true });
    assert.equal(segundo.escrituras.length, 0);
    assert.ok(registrosIDB.has('restauracion'));
});

for (const clave of ['planificador_v5_8_restauracion_retenida', 'planificador_v5_8', 'planificador_v5_8_pendiente']) {
    test(`restauración falla si no persiste componente requerido ${clave}`, async () => {
        const e = crearEntornoSync(); await e.iniciar();
        e.opciones.fallarStorageKey = clave;
        assert.equal(await e.prepararRestauracion(), false);
        assert.equal(e.estados.some(args => args[1] === 'Restaurado localmente'), false);
        assert.equal(e.escrituras.length, 0);
    });
}

test('publicación autorizada fallida conserva retención para reintento manual', async () => {
    const e = crearEntornoSync({ confirmar: true }); await e.iniciar(); await e.prepararRestauracion();
    e.opciones.fallarRed = true;
    assert.equal(await e.sync.recargarDesdeFirestore(), false);
    assert.ok(e.storage.has('planificador_v5_8_restauracion_retenida'));
    assert.equal(e.escrituras.length, 0);
    e.opciones.fallarRed = false;
    await e.evento('focus'); await e.ejecutarTimer();
    assert.equal(e.escrituras.length, 0);
});

function diferido() {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
}

test('lectura snapshot iniciada antes de restaurar no aplica remoto durante persistencia de retención', async () => {
    const lecturaIniciada = diferido(), liberarLectura = diferido();
    const marcadorIniciado = diferido(), liberarMarcador = diferido();
    const e = crearEntornoSync({
        usarIDB: true,
        antesLecturaRemota: async () => { lecturaIniciada.resolve(); await liberarLectura.promise; },
        antesEscrituraIDB: async clave => {
            if (clave === 'restauracion') { marcadorIniciado.resolve(); await liberarMarcador.promise; }
        },
        remoto: {
            docentes: [{ id: 'd1', nombre: 'Remoto más nuevo sintético' }], salas: [],
            sel: {}, configuracion: {}, temporadas: [], temporadaData: {},
            _version: 10, _revisionId: 'revision-nueva'
        }
    });
    await e.iniciar();
    await e.emitirSnapshot(); await lecturaIniciada.promise;
    const restauracion = e.prepararRestauracion();
    await marcadorIniciado.promise;
    liberarLectura.resolve(); await e.drenar();
    const nombreDuranteLectura = e.data.docentes[0].nombre;
    liberarMarcador.resolve();
    assert.equal(await restauracion, true);
    assert.equal(nombreDuranteLectura, 'Restaurado sintético');
    assert.equal(e.data.docentes[0].nombre, 'Restaurado sintético');
    const registro = e.registrosIDB.get('estado');
    assert.equal(JSON.parse(registro.json).docentes[0].nombre, 'Restaurado sintético');
    assert.equal(e.escrituras.length, 0);
});

test('marcador IDB y fallback de estado/pendiente conserva retención al reiniciar sin IDB', async () => {
    const storage = new Map();
    const e = crearEntornoSync({ usarIDB: true, storage }); await e.iniciar();
    // Base común recuperable incluso si el siguiente arranque carece de IndexedDB.
    storage.set('planificador_v5_8_base', JSON.stringify(e.base));
    storage.set('planificador_v5_8_base_ts', new Date().toISOString());
    e.opciones.abortarClavesIDB = ['estado', 'pendiente'];
    assert.equal(await e.prepararRestauracion(), true);
    assert.ok(e.registrosIDB.has('restauracion'));
    assert.equal(JSON.parse(storage.get('planificador_v5_8_pendiente')).docentes[0].nombre, 'Restaurado sintético');
    const reinicio = crearEntornoSync({ storage });
    await reinicio.sync.cargar();
    assert.equal(reinicio.data.docentes[0].nombre, 'Restaurado sintético');
    await reinicio.evento('focus'); await reinicio.ejecutarTimer();
    assert.equal(reinicio.escrituras.length, 0);
    assert.equal(reinicio.data.docentes[0].nombre, 'Restaurado sintético');
});

test('API pública cargar recupera restauración retenida y bloquea guardado después del reinicio', async () => {
    const storage = new Map();
    const e = crearEntornoSync({ storage }); await e.iniciar(); await e.prepararRestauracion();
    const reinicio = crearEntornoSync({ storage });
    await reinicio.sync.cargar();
    assert.equal(reinicio.data.docentes[0].nombre, 'Restaurado sintético');
    await reinicio.sync.guardar({ forzar: true });
    await reinicio.evento('online'); await reinicio.ejecutarTimer();
    assert.equal(reinicio.escrituras.length, 0);
});

test('estado histórico sin marcador carga y guarda preservando IDs y temporadas', async () => {
    const base = {
        docentes: [{ id: 'docente-historico', nombre: 'Histórico sintético' }], salas: [],
        carreras: [{ id: 'carrera-historica', nombre: 'Carrera sintética' }],
        secciones: [{ id: 'seccion-historica', carreraId: 'carrera-historica' }],
        asignaturas: [{ id: 'asignatura-historica' }],
        planificaciones: [{ id: 'plan-historico', docenteId: 'docente-historico', seccionId: 'seccion-historica', asignaturaId: 'asignatura-historica' }],
        sel: { temporadaId: 'temporada-historica' }, configuracion: { temporadaActualId: 'temporada-historica' },
        temporadas: [{ id: 'temporada-historica', temporada: 'Otoño', anio: 2026 }], temporadaData: {},
        _version: 1, _revisionId: 'historica'
    };
    const storage = new Map([['planificador_v5_8', JSON.stringify(base)]]);
    const e = crearEntornoSync({ storage, base });
    await e.sync.cargar();
    e.data.docentes[0].nombre = 'Edición normal sintética';
    assert.equal(await e.sync.guardar(), true);
    const guardado = JSON.parse(e.escrituras.findLast(x => x.ref === 'planificador/datos').valor._payloadJson);
    assert.equal(guardado.docentes[0].id, 'docente-historico');
    assert.equal(guardado.secciones[0].carreraId, 'carrera-historica');
    assert.equal(guardado.planificaciones[0].id, 'plan-historico');
    assert.equal(guardado.planificaciones[0].asignaturaId, 'asignatura-historica');
    assert.equal(guardado.temporadas[0].id, 'temporada-historica');
    assert.equal(guardado.temporadaData['temporada-historica'].planificaciones[0].id, 'plan-historico');
    assert.equal(storage.has('planificador_v5_8_restauracion_retenida'), false);
});
