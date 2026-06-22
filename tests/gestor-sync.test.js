const test = require('node:test');
const assert = require('node:assert/strict');

const { cargarGestorPrueba } = require('./helpers/cargar-gestor');
const { cargarSyncPrueba } = require('./helpers/cargar-sync');
const { filaGestor, gestorConFilasInformativas } = require('./fixtures/gestor-base');

test('Gestor detecta el encabezado después de cinco filas informativas', () => {
    const gestor = cargarGestorPrueba();
    const analisis = gestor.analizarGestorSecciones(gestorConFilasInformativas());

    assert.equal(analisis.headerIndex, 5);
    assert.equal(analisis.registros.length, 1);
    assert.equal(analisis.registros[0].codigoAsignatura, 'TST101');
    assert.equal(analisis.registros[0].horasVirtuales, 18);
});

test('Gestor conserva planes de estudio completos y separados', () => {
    const gestor = cargarGestorPrueba();
    const filas = [
        filaGestor({ plan: 'IEL-IEL-1', seccion: 'D-IEL-N1-P1-C1', id: '1' }),
        filaGestor({ plan: 'IEL-IEL-2', seccion: 'D-IEL-N1-P2-C1', id: '2' })
    ];
    const analisis = gestor.analizarGestorSecciones(gestorConFilasInformativas(filas));
    const planes = analisis.propuesta.carreras.map(item => item.codigo).sort();

    assert.deepEqual(Array.from(planes), ['IEL-IEL-1', 'IEL-IEL-2']);
});

test('Gestor mantiene en memoria filas externas relacionadas por la misma ID', () => {
    const gestor = cargarGestorPrueba();
    const filas = [
        filaGestor({
            programa: 'IRA - Ingeniería en Automatización', plan: 'IRA-IRA-1', id: '66910000',
            seccion: 'Fusionada', tipo: 'Fusionada', codigo: 'FICE01'
        }),
        filaGestor({
            programa: 'FTLO - Técnico en Logística', plan: 'FTL-FTLO-2', nivel: '4', id: '66910000',
            seccion: 'D-FTLO-N4-P2-C1(F)', tipo: 'Planificada', codigo: 'FICE01'
        })
    ];
    const analisis = gestor.analizarGestorSecciones(gestorConFilasInformativas(filas));
    const preparados = gestor.prepararRegistrosAplicacionGestor(analisis.registros, { carreras: ['IRA-IRA-1'] });
    const memoria = gestor.construirMemoriaIdsGestor(analisis, 'gestor-prueba.xlsx', { carrerasSeleccionadas: ['IRA-IRA-1'] });
    const id = memoria.ids.find(item => item.idSeccion === '66910000');

    assert.equal(preparados.seleccionados.length, 1);
    assert.equal(preparados.memoria.length, 2);
    assert.equal(preparados.externos, 1);
    assert.equal(id.estado, 'pendiente_externa');
    assert.equal(id.madreDetectada, 'D-FTLO-N4-P2-C1(F)');
    assert.match(id.motivo, /IRA-IRA-1\(N1\)/);
});

test('Sync valida longitud y checksum antes de aplicar contenido', async () => {
    const sync = cargarSyncPrueba();
    const texto = JSON.stringify({ planificaciones: [{ id: 'p1' }] });
    const checksum = sync.checksumRapido(texto);

    assert.equal(await sync.validarTextoPayload({ _payloadLength: texto.length, _payloadChecksum: checksum }, texto), texto);
    await assert.rejects(
        sync.validarTextoPayload({ _payloadLength: texto.length + 1, _payloadChecksum: checksum }, texto),
        error => error.code === 'payload-integrity' && /longitud-invalida/.test(error.message)
    );
});

test('Sync reconstruye un payload grande solo con fragmentos de la misma revisión', async () => {
    const sync = cargarSyncPrueba();
    const contenido = { texto: 'x'.repeat(710000), planificaciones: [{ id: 'p1' }] };
    const json = JSON.stringify(contenido);
    const payload = await sync.crearPayloadFirestore(json, { _version: 10, _revisionId: 'rev-1' });
    const partes = sync.dividirPayload(json);
    const doc = (_db, ...segmentos) => segmentos.join('/');
    const getDoc = async ref => {
        const indice = Number(ref.split('/').at(-1));
        return {
            exists: () => true,
            data: () => ({
                _payloadPart: partes[indice],
                _chunkIndex: indice,
                _chunkCount: partes.length,
                _revisionId: payload._revisionId,
                _payloadChecksum: payload._payloadChecksum
            })
        };
    };
    const reconstruido = await sync.leerPayloadFirestore(payload, { db: {}, doc, getDoc });

    assert.equal(payload._schema, 'planificador-json-chunks-v1');
    assert.equal(reconstruido.planificaciones[0].id, 'p1');

    const getDocInconsistente = async ref => {
        const snap = await getDoc(ref);
        const fila = snap.data();
        fila._revisionId = 'otra-revision';
        return { exists: () => true, data: () => fila };
    };
    await assert.rejects(
        sync.leerPayloadFirestore(payload, { db: {}, doc, getDoc: getDocInconsistente }),
        error => error.code === 'payload-integrity' && /revision-fragmento/.test(error.message)
    );
});

test('Sync combina cambios independientes y detecta cambios sobre la misma entidad', () => {
    const sync = cargarSyncPrueba();
    const base = {
        docentes: [{ id: 'd1', nombre: 'Docente Base' }],
        salas: [{ id: 's1', nombre: 'Sala Base' }]
    };
    const local = {
        docentes: [{ id: 'd1', nombre: 'Docente Local' }],
        salas: [{ id: 's1', nombre: 'Sala Base' }]
    };
    const remotoIndependiente = {
        docentes: [{ id: 'd1', nombre: 'Docente Base' }],
        salas: [{ id: 's1', nombre: 'Sala Remota' }]
    };
    const combinado = sync.fusionarTresVias(base, local, remotoIndependiente);

    assert.equal(combinado.conflictos.length, 0);
    assert.equal(combinado.fusion.docentes[0].nombre, 'Docente Local');
    assert.equal(combinado.fusion.salas[0].nombre, 'Sala Remota');

    const remotoConflictivo = {
        docentes: [{ id: 'd1', nombre: 'Docente Remoto' }],
        salas: [{ id: 's1', nombre: 'Sala Base' }]
    };
    const conflicto = sync.fusionarTresVias(base, local, remotoConflictivo);
    assert.equal(conflicto.conflictos.length, 1);
    assert.equal(conflicto.conflictos[0].entidadId, 'd1');
});

test('Sync impide una sobrescritura regresiva salvo autorización explícita', () => {
    const sync = cargarSyncPrueba();
    const remoto = { planificaciones: [{ id: 'p1' }], carreras: [{ id: 'c1' }] };
    const local = { planificaciones: [], carreras: [] };

    assert.throws(
        () => sync.validarSobrescrituraSegura({ local, remoto, versionRemota: 2, versionBase: 1, opciones: {} }),
        /sobrescritura-regresiva/
    );
    assert.doesNotThrow(() => sync.validarSobrescrituraSegura({
        local, remoto, versionRemota: 2, versionBase: 1, opciones: { sobrescribirRemoto: true }
    }));
});

test('Sync vincula eventos pendientes con la revisión que los guarda', () => {
    const sync = cargarSyncPrueba();
    const eventos = [
        { id: 'e1', accion: 'bloque_creado', revisionId: '' },
        { id: 'e2', accion: 'bloque_movido', revisionId: 'revision-anterior' }
    ];

    assert.equal(sync.asignarRevisionAuditoria(eventos, 'revision-nueva'), 1);
    assert.equal(eventos[0].revisionId, 'revision-nueva');
    assert.equal(eventos[1].revisionId, 'revision-anterior');
});

test('Sync verifica puntos de recuperación y conserva compatibilidad histórica', () => {
    const sync = cargarSyncPrueba();
    const json = JSON.stringify({ planificaciones: [{ id: 'p1' }] });
    const checksum = sync.checksumRapido(json);

    assert.equal(sync.verificarIntegridadSnapshot({ json, checksum }), 'valido');
    assert.equal(sync.verificarIntegridadSnapshot({ json: `${json}x`, checksum }), 'invalido');
    assert.equal(sync.verificarIntegridadSnapshot({ json }), 'historico');
});
