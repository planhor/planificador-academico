(function(){
    function createConfiguracion(ctx){
        const getData = ctx.getData;

        function resumenMemoriaPlanificacion(){
            const data=getData();
            const senales=Array.isArray(data.configuracion?.memoriaPlanificacion?.senales)?data.configuracion.memoriaPlanificacion.senales:[];
            const labelTipo={
                bloque_auto_fijado:'Bloques fijados',
                bloque_auto_movido:'Bloques movidos',
                docente_corregido:'Docentes corregidos',
                sala_corregida:'Salas corregidas',
                solver_optimizacion_aplicada:'Optimizaciones aplicadas'
            };
            const grupos=new Map();
            senales.forEach(s=>{
                const key=s.asignaturaId||(s.tipo==='solver_optimizacion_aplicada'?'solver_optimizacion':'sin_asignatura');
                if(!grupos.has(key)){
                    const asig=data.asignaturas.find(a=>a.id===s.asignaturaId);
                    grupos.set(key,{
                        asignaturaId:s.asignaturaId||'',
                        asignatura:asig?[asig.codigo,asig.nombre].filter(Boolean).join(' · '):(s.tipo==='solver_optimizacion_aplicada'?'Solver de optimización':(s.asignaturaId||'Sin asignatura')),
                        total:0,
                        tipos:{},
                        ultima:s.ts||''
                    });
                }
                const g=grupos.get(key);
                g.total++;
                g.tipos[s.tipo]=(g.tipos[s.tipo]||0)+1;
                if((s.ts||'')>g.ultima) g.ultima=s.ts||g.ultima;
            });
            const filas=[...grupos.values()].sort((a,b)=>b.total-a.total||a.asignatura.localeCompare(b.asignatura));
            return {senales,filas,labelTipo};
        }

        function abrirAyudaApp(){
            const existente=document.getElementById('helpOverlay');
            if(existente) existente.remove();
            const cont=document.createElement('div');
            cont.id='helpOverlay';
            cont.className='modal-overlay help-overlay';
            cont.innerHTML=`
                <div class="modal modal-wide help-modal">
                    <div class="modal-header help-header">
                        <div>
                            <h3>Ayuda de Planificador Académico</h3>
                            <p>Guía práctica para cargar datos, planificar, optimizar, revisar y respaldar tu trabajo.</p>
                        </div>
                        <button class="btn btn-sm" id="btnCerrarAyuda" type="button">Cerrar</button>
                    </div>
                    <div class="help-layout">
                        <nav class="help-nav">
                            <a href="#ayuda-flujo">Flujo recomendado</a>
                            <a href="#ayuda-configuracion">Configuración</a>
                            <a href="#ayuda-secciones">Secciones</a>
                            <a href="#ayuda-asignaturas">Asignaturas</a>
                            <a href="#ayuda-docentes">Docentes</a>
                            <a href="#ayuda-salas">Salas</a>
                            <a href="#ayuda-gestor">Gestor Secciones</a>
                            <a href="#ayuda-planificador">Planificador</a>
                            <a href="#ayuda-automatico">Auto-planificación</a>
                            <a href="#ayuda-solver">Solver</a>
                            <a href="#ayuda-reportes">Reportes</a>
                            <a href="#ayuda-respaldos">Respaldos</a>
                            <a href="#ayuda-buenas">Buenas prácticas</a>
                        </nav>
                        <div class="help-content">
                            <section id="ayuda-flujo">
                                <h4>Flujo recomendado de trabajo</h4>
                                <p>Para evitar inconsistencias, trabaja siempre desde la estructura base hacia la planificación.</p>
                                <ol>
                                    <li>Define temporada, áreas/especialidades y reglas generales en Configuración.</li>
                                    <li>Crea o importa carreras, niveles, jornadas y secciones.</li>
                                    <li>Carga asignaturas y relaciónalas con carrera, nivel y sección cuando corresponda.</li>
                                    <li>Carga docentes, especialidades, asignaturas que pueden dictar y disponibilidad.</li>
                                    <li>Carga salas, capacidad y tipo de espacio.</li>
                                    <li>Revisa Dashboard y Reportes antes de planificar.</li>
                                    <li>Planifica manualmente los casos delicados y usa auto-planificación para acelerar el resto.</li>
                                    <li>Optimiza, revisa escenarios y aplica solo cuando la propuesta sea coherente.</li>
                                    <li>Exporta reportes o respaldo JSON al terminar una versión importante.</li>
                                </ol>
                            </section>

                            <section id="ayuda-configuracion">
                                <h4>Configuración</h4>
                                <p>Aquí defines reglas globales que afectan el comportamiento de la app.</p>
                                <ul>
                                    <li><strong>Bloques diarios máximos:</strong> carga total máxima diaria del docente. Incluye bloques presenciales y virtuales.</li>
                                    <li><strong>Horas de descanso:</strong> mínimo entre el último bloque de un día y el primero del siguiente para un docente.</li>
                                    <li><strong>Sábado hasta bloque:</strong> límite general para planificación de sábado, salvo reglas específicas ya modeladas.</li>
                                    <li><strong>Criterios del solver:</strong> permite decidir qué pesa más al optimizar: topes, compactación, ventanas, recursos, virtuales, etc.</li>
                                    <li><strong>Memoria:</strong> registra señales de correcciones y optimizaciones aplicadas para orientar futuras propuestas.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si quieres proteger más a los estudiantes, sube Ventanas estudiantes y Compactación asignatura. Si estás cerrando una planificación, sube Topes duros y Salas definitivas.</p>
                            </section>

                            <section id="ayuda-secciones">
                                <h4>Secciones, carreras, niveles y jornadas</h4>
                                <p>La pestaña Secciones construye la base sobre la que se asignan asignaturas y horarios.</p>
                                <ul>
                                    <li><strong>Carrera:</strong> conserva el plan completo cuando exista, por ejemplo IEL-IEL-2 o IEL-IEL-1.</li>
                                    <li><strong>Nivel:</strong> representa semestre académico, por ejemplo N1, N2, N7.</li>
                                    <li><strong>Jornada:</strong> Día o Noche. Esto ayuda a filtrar y evita mezclar secciones diurnas y vespertinas.</li>
                                    <li><strong>Sección regular:</strong> se planifica directamente.</li>
                                    <li><strong>Sección fusionada/heredada:</strong> puede consumir asignaturas dictadas desde una sección madre.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> D-IEL-N1-P2-C27 puede dictar una asignatura que D-IEL-N1-P2-C28(F) ve como heredada.</p>
                            </section>

                            <section id="ayuda-asignaturas">
                                <h4>Asignaturas</h4>
                                <p>Las asignaturas concentran horas, modalidad, tipo, área y criterios de planificación.</p>
                                <ul>
                                    <li><strong>Horas presenciales:</strong> bloques que requieren sala/docente en horario presencial.</li>
                                    <li><strong>Horas virtuales:</strong> bloques de autoaprendizaje. No son asignaturas online; son bloques virtuales de una asignatura.</li>
                                    <li><strong>Online TEAMS:</strong> asignatura remota, normalmente sábado en la mañana.</li>
                                    <li><strong>Electivas:</strong> se reconocen desde el programa/código ELEC del gestor, no por azar.</li>
                                    <li><strong>Crítica con ayudantía:</strong> debe entenderse como subperfil de una asignatura crítica.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> una asignatura práctica puede tener horas presenciales y virtuales; eso no la convierte automáticamente en semipresencial.</p>
                            </section>

                            <section id="ayuda-docentes">
                                <h4>Docentes</h4>
                                <p>Los docentes se usan para disponibilidad, carga, reportes, ficha docente y auto-planificación.</p>
                                <ul>
                                    <li>Registra nombre, apellido, especialidad, contrato y asignaturas que puede dictar.</li>
                                    <li>Completa disponibilidad antes de usar auto-planificación.</li>
                                    <li>Usa perfiles de idoneidad: preferente, apto o apoyo.</li>
                                    <li>Docente NN sirve para bosquejar horarios cuando aún no conoces el docente definitivo.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si Cristian Ramos puede dictar EEA401 y EEA402, esas asignaturas deben estar asociadas para que el sistema lo proponga correctamente.</p>
                            </section>

                            <section id="ayuda-salas">
                                <h4>Salas y espacios</h4>
                                <p>Las salas ayudan a validar capacidad, disponibilidad y tipo de espacio.</p>
                                <ul>
                                    <li><strong>Sala de Clases:</strong> espacio lectivo general.</li>
                                    <li><strong>Laboratorio de Computación:</strong> espacio con computadores.</li>
                                    <li><strong>Laboratorio de Especialidad:</strong> espacio técnico especializado.</li>
                                    <li><strong>Taller de Especialidad:</strong> espacio práctico/taller.</li>
                                    <li><strong>TRO2:</strong> sala provisional o terreno. Sirve para avanzar, pero debe revisarse antes del cierre.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si el gestor recomienda 315-COMPUTACIÓN, conviene registrar número 315, nombre Computación y tipo Laboratorio de Computación.</p>
                            </section>

                            <section id="ayuda-gestor">
                                <h4>Gestor Secciones</h4>
                                <p>La pestaña Gestor sirve para importar, revisar y relacionar información institucional.</p>
                                <ul>
                                    <li>La ID de sección es clave para entender relaciones y fusiones.</li>
                                    <li>Las filas con sección “Fusionada” indican asignaturas que se heredan desde una sección madre.</li>
                                    <li>Si la ID no tiene relación visible, aparecerá como pendiente para revisión.</li>
                                    <li>Las relaciones manuales permiten enlazar casos que el gestor no puede resolver solo.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si Formación Ciudadana aparece planificada en C27 y otra fila como Fusionada, debes revisar qué sección del mismo nivel no tiene esa asignatura y enlazarla como heredada.</p>
                            </section>

                            <section id="ayuda-planificador">
                                <h4>Planificador</h4>
                                <p>Es la vista principal para asignar bloques manualmente y revisar la grilla por carrera, nivel, jornada y sección.</p>
                                <ul>
                                    <li>Activa modo planificación antes de crear o eliminar bloques.</li>
                                    <li>Selecciona asignatura, docente, sala y tipo antes de asignar.</li>
                                    <li>Los bloques heredados se visualizan, pero deben modificarse desde la sección madre.</li>
                                    <li>Los candados fijan bloques para que el solver no los mueva.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si una asignatura heredada aparece en una sección fusionada, usa el acceso a la sección madre para modificar horario, docente o sala.</p>
                            </section>

                            <section id="ayuda-automatico">
                                <h4>Auto-planificación</h4>
                                <p>La auto-planificación acelera la carga, pero siempre debe revisarse.</p>
                                <ul>
                                    <li><strong>Auto-asignatura:</strong> planifica la asignatura seleccionada.</li>
                                    <li><strong>Auto-sección:</strong> intenta completar una sección.</li>
                                    <li><strong>Auto-general:</strong> trabaja sobre un conjunto mayor, por eso está dentro del modo planificación.</li>
                                    <li>Revisa siempre pendientes, Docente NN, TRO2 y bloques virtuales.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> para secciones vespertinas, el sistema prioriza comenzar desde los bloques de tarde/noche y evitar ventanas innecesarias.</p>
                            </section>

                            <section id="ayuda-solver">
                                <h4>Solver y optimización</h4>
                                <p>El solver mejora horarios ya cargados. No reemplaza tu criterio; te da propuestas medibles.</p>
                                <ul>
                                    <li><strong>Restricciones duras:</strong> no deberían romperse: docente ocupado, sala ocupada, jornada, descanso, disponibilidad, sección ocupada.</li>
                                    <li><strong>Restricciones blandas:</strong> penalizan: ventanas, fragmentación, TRO2, Docente NN, virtuales fuera de preferencia.</li>
                                    <li><strong>Costo total:</strong> costo duro + costo blando. Mientras más bajo, mejor.</li>
                                    <li><strong>Escenarios:</strong> permite comparar balanceado, estudiantes, docentes, conflictos o recursos.</li>
                                    <li><strong>Solver por etapas:</strong> primero factibilidad, luego compactación, docentes y recursos.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si una asignatura de 72 horas queda separada, el solver puede intentar moverla como asignatura completa para compactarla.</p>
                            </section>

                            <section id="ayuda-reportes">
                                <h4>Dashboard, reportes y vista horario</h4>
                                <p>Estas vistas son para revisar, comunicar y exportar.</p>
                                <ul>
                                    <li><strong>Dashboard:</strong> muestra progreso, alertas, Docente NN, TRO2, calidad y secciones incompletas.</li>
                                    <li><strong>Reportes:</strong> permite revisar asignaturas por sección, docente, sala, fusiones y pendientes.</li>
                                    <li><strong>Vista horario:</strong> sirve para exportar horarios visuales en PDF/JPG/Excel.</li>
                                    <li><strong>Ficha docente:</strong> revisa carga y distribución por docente.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> antes de enviar un horario, revisa reportes de Docente NN, TRO2, conflictos y asignaturas incompletas.</p>
                            </section>

                            <section id="ayuda-respaldos">
                                <h4>Respaldos, importación y exportación</h4>
                                <p>La app tiene dos tipos de archivos: respaldo completo y archivos de catálogo.</p>
                                <ul>
                                    <li><strong>JSON:</strong> respaldo completo de toda la app. Úsalo para guardar una versión exacta.</li>
                                    <li><strong>Exportar Archivo:</strong> exporta docentes, salas, secciones o asignaturas como archivo reutilizable.</li>
                                    <li><strong>Crear archivo de importación:</strong> genera plantilla con columnas y ayuda.</li>
                                    <li><strong>Alertas de importación:</strong> quedan disponibles en la pestaña correspondiente aunque cierres la ventana inicial.</li>
                                </ul>
                                <p><strong>Ejemplo:</strong> si quieres reutilizar docentes del semestre anterior, exporta solo el archivo docente e impórtalo en la nueva temporada.</p>
                            </section>

                            <section id="ayuda-buenas">
                                <h4>Buenas prácticas</h4>
                                <ul>
                                    <li>Planifica primero lo más restrictivo: vespertinos, laboratorios críticos, docentes con poca disponibilidad y asignaturas fusionadas.</li>
                                    <li>Usa Docente NN y TRO2 como apoyo temporal, no como cierre final.</li>
                                    <li>Fija con candado los bloques que ya estén negociados o confirmados.</li>
                                    <li>Después de cada carga masiva, revisa Dashboard y Reportes antes de auto-planificar.</li>
                                    <li>Antes de cambios grandes, exporta JSON. Es la forma más completa de respaldo.</li>
                                    <li>Usa el solver como segunda mirada: si la propuesta no tiene sentido académico, ajusta pesos o aplica solo lo que aporte.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>`;
            document.getElementById('modalContainer').appendChild(cont);
            const cerrar=()=>cont.remove();
            cont.addEventListener('click',(e)=>{if(e.target===cont) cerrar();});
            cont.querySelector('#btnCerrarAyuda')?.addEventListener('click',cerrar);
            cont.querySelectorAll('.help-nav a').forEach(a=>a.addEventListener('click',()=>{
                cont.querySelectorAll('.help-nav a').forEach(x=>x.classList.remove('active'));
                a.classList.add('active');
            }));
        }

        function abrirDesarrolloApp(){
            const existente=document.getElementById('devOverlay');
            if(existente) existente.remove();
            const cont=document.createElement('div');
            cont.id='devOverlay';
            cont.className='modal-overlay help-overlay';
            cont.innerHTML=`
                <div class="modal modal-wide help-modal dev-modal">
                    <div class="modal-header help-header">
                        <div>
                            <h3>Desarrollo de Planificador Académico</h3>
                            <p>Memoria técnica y metodológica del proyecto creado y dirigido por Gerald Andrade.</p>
                        </div>
                        <button class="btn btn-sm" id="btnCerrarDesarrollo" type="button">Cerrar</button>
                    </div>
                    <div class="help-layout">
                        <nav class="help-nav">
                            <a href="#dev-resumen">Resumen ejecutivo</a>
                            <a href="#dev-origen">Origen del proyecto</a>
                            <a href="#dev-iteraciones">Iteraciones</a>
                            <a href="#dev-diseno">Diseño de producto</a>
                            <a href="#dev-arquitectura">Arquitectura</a>
                            <a href="#dev-datos">Modelo de datos</a>
                            <a href="#dev-gestor">Gestor Secciones</a>
                            <a href="#dev-planificacion">Planificación</a>
                            <a href="#dev-solver">Solver</a>
                            <a href="#dev-reportes">Reportes y exportación</a>
                            <a href="#dev-seguridad">Respaldo y sincronización</a>
                            <a href="#dev-codigo">Descripción del código</a>
                            <a href="#dev-prompt">Prompt maestro</a>
                            <a href="#dev-creditos">Créditos</a>
                        </nav>
                        <div class="help-content">
                            <section id="dev-resumen">
                                <h4>Resumen ejecutivo</h4>
                                <p><strong>Planificador Académico</strong> es una aplicación especializada para crear, revisar, optimizar y exportar planificación horaria académica. Fue construida como una herramienta real de coordinación, no como una maqueta: incorpora carreras, niveles, jornadas, secciones, asignaturas, docentes, salas, gestor institucional, reportes, respaldo, sincronización y solver de optimización.</p>
                                <p>El proyecto fue guiado por Gerald Andrade mediante una iteración continua basada en problemas reales de planificación: fusiones, secciones madre, asignaturas heredadas, Docente NN, TRO2, bloques virtuales, jornada diurna/vespertina, cargas docentes, transversales, electivas y criterios humanos de planificación.</p>
                                <div class="dev-facts">
                                    <div><strong>Nombre</strong><span>Planificador Académico</span></div>
                                    <div><strong>Dirección funcional</strong><span>Gerald Andrade</span></div>
                                    <div><strong>Iteraciones</strong><span>Más de 200 ajustes y decisiones acumuladas</span></div>
                                    <div><strong>Estado</strong><span>Sistema local avanzado con sincronización y optimización</span></div>
                                </div>
                            </section>

                            <section id="dev-origen">
                                <h4>Origen del proyecto</h4>
                                <p>La primera etapa nació como una app de planificación horaria apoyada inicialmente por DeepSeek. Esa base permitió levantar una primera estructura funcional, pero requería madurar fuertemente para responder a la realidad académica: datos institucionales incompletos, criterios humanos, fusiones, relaciones entre secciones, docentes desconocidos, salas provisionales y exportaciones útiles.</p>
                                <p>La evolución posterior transformó esa base en una app modular y especializada. Se mejoraron la estructura visual, la persistencia de datos, la seguridad de respaldo, las importaciones, la exportación, la lógica de planificación automática, la validación, los reportes y el solver.</p>
                                <p><strong>Qué se debió mejorar desde la base inicial:</strong> modularización del código, separación de responsabilidades, compatibilidad con Excel, control de errores, modelos de jornada y sección, integración con Firebase, reportes profesionales, dashboard interactivo, manejo de Gestor Secciones, relaciones heredadas/fusionadas y un solver explicable.</p>
                            </section>

                            <section id="dev-iteraciones">
                                <h4>Cómo se construyó mediante iteraciones</h4>
                                <p>El desarrollo avanzó mediante un proceso de corrección guiada. Gerald probaba la app en escenarios reales, detectaba una incoherencia y la convertía en una regla funcional. Cada ciclo permitió transformar conocimiento tácito de planificación en comportamiento del sistema.</p>
                                <ul>
                                    <li>Se detectaron problemas de exportación y se robustecieron Excel, PDF y JPG.</li>
                                    <li>Se corrigieron fallas de visualización al asignar/eliminar bloques.</li>
                                    <li>Se incorporaron reportes agrupados para evitar listas desordenadas bloque a bloque.</li>
                                    <li>Se agregó manejo de Docente NN y TRO2 como estados provisorios, no como cierre final.</li>
                                    <li>Se maduró la lógica de secciones fusionadas, heredadas y secciones madre.</li>
                                    <li>Se incorporaron importadores/exportadores de docentes, salas, asignaturas y secciones.</li>
                                    <li>Se rediseñó el solver desde heurística simple hacia un motor por costos, etapas y escenarios.</li>
                                </ul>
                                <p>El resultado no fue una construcción lineal: fue una refinación progresiva donde cada error observado se transformó en una regla, alerta, interfaz o mejora de datos.</p>
                            </section>

                            <section id="dev-diseno">
                                <h4>Diseño de producto</h4>
                                <p>La interfaz busca ser sobria, profesional y práctica. No se diseñó como landing page, sino como herramienta de trabajo. El objetivo es que una persona coordinadora pueda revisar grandes volúmenes de información sin perder contexto.</p>
                                <ul>
                                    <li><strong>Dashboard:</strong> muestra estado general, pendientes y calidad.</li>
                                    <li><strong>Planificador:</strong> grilla de trabajo con filtros por carrera, nivel, jornada y sección.</li>
                                    <li><strong>Reportes:</strong> lectura tabular y exportable para auditoría operativa.</li>
                                    <li><strong>Gestor Secciones:</strong> pestaña especializada para cargar y analizar datos institucionales.</li>
                                    <li><strong>Configuración:</strong> concentra reglas, pesos, memoria, perfil, tipografía y ayuda.</li>
                                </ul>
                                <p>Una decisión importante fue mantener la app usable en pantallas pequeñas mediante desplazamiento, sin comprimir la estructura al punto de perder coherencia visual.</p>
                            </section>

                            <section id="dev-arquitectura">
                                <h4>Arquitectura general</h4>
                                <p>La app se mantiene como una aplicación web local modular. El archivo principal carga módulos separados para facilitar mantenimiento y evitar que toda la lógica viva en un único bloque inmanejable.</p>
                                <ul>
                                    <li><strong>planificador.html:</strong> estructura base, carga de scripts, encabezado y contenedores principales.</li>
                                    <li><strong>app.js:</strong> estado global, configuración base, sincronización, inicialización y conexión de módulos.</li>
                                    <li><strong>planificacion.js:</strong> grilla, asignación manual, auto-planificación, optimización y solver.</li>
                                    <li><strong>entidades.js:</strong> gestión de carreras, niveles, secciones, asignaturas, docentes y salas.</li>
                                    <li><strong>reportes.js:</strong> dashboard, reportes, validaciones y métricas de calidad.</li>
                                    <li><strong>configuracion.js:</strong> preferencias, memoria, perfiles, ayuda y documentación interna.</li>
                                    <li><strong>exportaciones.js / vista-horario.js:</strong> exportación, vista horario y formatos de salida.</li>
                                    <li><strong>estilos.css:</strong> sistema visual, grillas, modales, reportes y componentes.</li>
                                </ul>
                            </section>

                            <section id="dev-datos">
                                <h4>Modelo de datos</h4>
                                <p>La app trabaja con un modelo orientado a planificación académica real. Las entidades principales son:</p>
                                <ul>
                                    <li><strong>Carreras:</strong> incluyen área/especialidad y plan de estudio.</li>
                                    <li><strong>Niveles:</strong> representan semestre académico y configuración de online.</li>
                                    <li><strong>Secciones:</strong> contienen jornada, tipo y relaciones de planificación.</li>
                                    <li><strong>Asignaturas:</strong> incluyen horas presenciales, virtuales, modalidad, condición, área y sala sugerida.</li>
                                    <li><strong>Docentes:</strong> disponibilidad, especialidad, contrato, asignaturas que puede dictar e idoneidad.</li>
                                    <li><strong>Salas:</strong> capacidad, número, nombre y tipo de espacio.</li>
                                    <li><strong>Planificaciones:</strong> bloques asignados a sección, asignatura, docente, sala, día, bloque y tipo.</li>
                                    <li><strong>Grupos de dictación:</strong> representan secciones madre, compartidas y heredadas.</li>
                                </ul>
                            </section>

                            <section id="dev-gestor">
                                <h4>Gestor Secciones</h4>
                                <p>El Gestor Secciones fue uno de los módulos más delicados. La app no solo importa filas: interpreta IDs, secciones planificadas, filas Fusionada, equivalencias, planes de estudio y relaciones entre secciones.</p>
                                <p>La idea central es que la ID permite rastrear dónde se dicta realmente una asignatura y qué sección debe verla como heredada. Cuando el gestor no trae toda la información, la app permite revisar IDs no relacionadas y enlazarlas manualmente.</p>
                                <p><strong>Decisión funcional clave:</strong> las relaciones no se gestionan desde la asignatura como si todo se compartiera globalmente; se gestionan desde la lógica de secciones y grupos de dictación para reflejar mejor el modelo institucional.</p>
                            </section>

                            <section id="dev-planificacion">
                                <h4>Lógica de planificación</h4>
                                <p>La planificación combina criterios manuales y automáticos. La app reconoce que no todo debe automatizarse: hay decisiones humanas sobre transversales, docentes, transporte, jornadas, ayudantías, reprobación y carga académica.</p>
                                <ul>
                                    <li>Las secciones vespertinas suelen planificarse primero para compactar horarios.</li>
                                    <li>Las diurnas se construyen evitando cargar innecesariamente los primeros bloques.</li>
                                    <li>Los bloques virtuales se tratan como autoaprendizaje, pero suman a la carga diaria docente.</li>
                                    <li>Online y virtual no son lo mismo: Online TEAMS es remoto; virtual es bloque simbólico de autoaprendizaje.</li>
                                    <li>Docente NN permite bosquejar horarios ideales sin conocer aún el docente definitivo.</li>
                                </ul>
                            </section>

                            <section id="dev-solver">
                                <h4>Solver y optimización</h4>
                                <p>El solver evolucionó desde una auto-planificación básica hacia un motor heurístico avanzado. No depende de servidor ni de OR-Tools, por lo que funciona localmente y evita costos de infraestructura.</p>
                                <ul>
                                    <li><strong>Pesos configurables:</strong> permiten ajustar prioridades sin modificar código.</li>
                                    <li><strong>Restricciones duras:</strong> bloquean movimientos inviables.</li>
                                    <li><strong>Restricciones blandas:</strong> generan costo, pero no bloquean.</li>
                                    <li><strong>Función objetivo:</strong> costo total = costo duro + costo blando.</li>
                                    <li><strong>Escenarios:</strong> balanceado, estudiantes, docentes, conflictos y recursos.</li>
                                    <li><strong>Vecindarios:</strong> movimientos simples, grupos, asignatura completa, cadena de día, recurso crítico e intercambios.</li>
                                    <li><strong>Búsqueda local:</strong> conserva rutas fuertes y exploratorias para evitar quedar atrapado en mejoras pequeñas.</li>
                                    <li><strong>Solver por etapas:</strong> factibilidad, compactación, docentes y recursos.</li>
                                    <li><strong>Explicabilidad:</strong> cada propuesta muestra qué mejora, qué queda pendiente y por qué se propone.</li>
                                </ul>
                            </section>

                            <section id="dev-reportes">
                                <h4>Reportes, exportación y revisión</h4>
                                <p>Los reportes se pulieron para que la información no aparezca bloque por bloque de manera confusa. Se agrupan bloques por asignatura, sección, docente, sala y día cuando corresponde.</p>
                                <p>La exportación se trabajó en varios formatos: Excel avanzado con SheetJS cuando está disponible, Excel compatible, PDF y JPG. También se cuidó que el tamaño visual de exportación no dependa de una ventana comprimida.</p>
                            </section>

                            <section id="dev-seguridad">
                                <h4>Respaldo, sincronización y auditoría</h4>
                                <p>La app integra respaldo local/JSON y sincronización con Firebase. Además incluye estado de conexión, confirmación visual de guardado, advertencia al cerrar con cambios pendientes y auditoría de acciones.</p>
                                <p>La auditoría registra quién hizo cambios, qué tipo de acción fue ejecutada y detalles relevantes. Para múltiples usuarios, cada correo puede asociarse a un nombre visible.</p>
                            </section>

                            <section id="dev-codigo">
                                <h4>Descripción del código</h4>
                                <p>El código está organizado en módulos autocontenidos que exponen funciones mediante objetos en <strong>window.Planificador...</strong>. Esto permite que el archivo principal inicialice cada módulo y comparta contexto sin un framework externo.</p>
                                <ul>
                                    <li><strong>Estado:</strong> se conserva en un objeto central <code>data</code>, con carreras, niveles, secciones, asignaturas, docentes, salas y planificaciones.</li>
                                    <li><strong>Normalización:</strong> al cargar datos se completan campos faltantes y se aseguran estructuras compatibles.</li>
                                    <li><strong>Renderizado:</strong> cada módulo actualiza su propia vista según el estado actual.</li>
                                    <li><strong>Eventos:</strong> botones y selectores se conectan después de renderizar cada modal o vista.</li>
                                    <li><strong>Persistencia:</strong> los cambios pasan por guardar, reconstruir índices y refrescar vistas.</li>
                                    <li><strong>Solver:</strong> trabaja sobre copias simuladas de planificaciones antes de aplicar cambios reales.</li>
                                </ul>
                            </section>

                            <section id="dev-prompt">
                                <h4>Prompt maestro para crear una app equivalente</h4>
                                <p>Este prompt resume el alcance completo del sistema. Sirve como especificación inicial para reconstruir una app similar desde cero.</p>
                                <pre class="dev-prompt">Crea una aplicación web llamada Planificador Académico para planificación horaria de educación superior. Debe funcionar como app modular en HTML, CSS y JavaScript, con opción de sincronización en Firebase, respaldo JSON e importación/exportación Excel.

La app debe permitir gestionar temporadas, áreas/especialidades, carreras con plan de estudio, niveles, jornadas, secciones regulares, fusionadas y equivalentes. Debe administrar asignaturas con código, nombre, horas presenciales, horas virtuales, modalidad presencial, semipresencial u Online TEAMS, tipo lectiva/práctica, condición normal/crítica/ayudantía, sala sugerida y relaciones con carrera, nivel y sección.

Debe gestionar docentes con nombre, apellido, especialidad, contrato, horas, disponibilidad semanal, asignaturas que puede dictar e idoneidad preferente/apto/apoyo. Debe gestionar salas con número, nombre, capacidad y tipo de espacio: sala de clases, laboratorio de computación, laboratorio de especialidad o taller de especialidad.

Debe incluir una pestaña Gestor Secciones para importar una planilla institucional con periodo, sede, programa, plan, jornada, nivel, código de asignatura, asignatura, ID sección, sección, alumnos, horas, horas presenciales, horas virtuales, tipo asignatura, área, modalidad asignatura y modalidad sección. Debe interpretar IDs, secciones Fusionada, secciones madre, heredadas, equivalencias y relaciones manuales.

Debe tener un planificador visual por carrera, nivel, jornada y sección, con grilla de lunes a sábado y bloques B1 a B18. Debe permitir asignar, eliminar, mover y fijar bloques. Debe distinguir bloques presenciales y virtuales. Online y virtual no son lo mismo: Online TEAMS es remoto; virtual es autoaprendizaje de una asignatura.

Debe incluir Docente NN y TRO2 como recursos provisorios. Debe mostrar asignaturas heredadas desde una sección madre y permitir navegar a la sección que planifica. Debe incluir dashboard, reportes, ficha docente, vista horario y exportación a Excel, PDF y JPG.

Debe incluir auto-planificación por asignatura, sección y general, con criterios configurables. Debe tener solver de optimización local sin backend, con restricciones duras y blandas, pesos configurables, función objetivo costo total = costo duro + costo blando, comparación de escenarios, reoptimización por pasadas, vecindarios de movimiento, búsqueda local mejorada, solver por etapas, auditoría, memoria y explicación de cada propuesta.

Restricciones duras: topes de docente, topes de sala, disponibilidad, descanso docente, jornada, bloque fijo, sección ocupada y máximo diario docente de 13 bloques totales incluyendo presenciales y virtuales. Restricciones blandas: ventanas de estudiantes, ventanas docentes, compactación de asignatura, distribución semanal, Docente NN, TRO2, virtuales fuera de preferencia y carga diaria alta.

La interfaz debe ser profesional, sobria, modular, con desplazamiento horizontal/vertical cuando sea necesario, sin romper la estructura al reducir ventana. Debe incluir ayuda de usuario y documentación de desarrollo dentro del menú Configuración.</pre>
                            </section>

                            <section id="dev-creditos">
                                <h4>Créditos y dirección del proyecto</h4>
                                <p>Proyecto dirigido funcionalmente por <strong>Gerald Andrade</strong>, construido a partir de necesidades reales de planificación académica y madurado mediante más de 200 iteraciones de prueba, corrección y mejora.</p>
                                <p>La primera base fue explorada con apoyo de DeepSeek. La evolución posterior incorporó criterios de planificación reales, arquitectura modular, validaciones, exportaciones, gestor institucional, dashboard, reportes, memoria, auditoría y un solver local avanzado.</p>
                                <p>El valor principal del proyecto está en convertir conocimiento experto de coordinación académica en reglas, interfaces y automatizaciones utilizables por otras personas.</p>
                            </section>
                        </div>
                    </div>
                </div>`;
            document.getElementById('modalContainer').appendChild(cont);
            const cerrar=()=>cont.remove();
            cont.addEventListener('click',(e)=>{if(e.target===cont) cerrar();});
            cont.querySelector('#btnCerrarDesarrollo')?.addEventListener('click',cerrar);
            cont.querySelectorAll('.help-nav a').forEach(a=>a.addEventListener('click',()=>{
                cont.querySelectorAll('.help-nav a').forEach(x=>x.classList.remove('active'));
                a.classList.add('active');
            }));
        }

        function abrirConfiguracion(){
            const data = getData();
            const cfg=data.configuracion;
            const emailActual=window._fb?.auth?.currentUser?.email || window._usuarioActual || '';
            cfg.perfilesUsuarios=cfg.perfilesUsuarios||{};
            cfg.memoriaPlanificacion=Object.assign({activa:true,usarEnAuto:false,fuerza:'baja',senales:[],maxSenales:500},cfg.memoriaPlanificacion||{});
            const solverDefault={
                topesDuros:'muy-alto',
                bloquesFaltantes:'muy-alto',
                ventanasEstudiantes:'alto',
                ventanasDocentes:'medio',
                compactacionAsignatura:'alto',
                distribucionSemanal:'medio',
                salasCorrectas:'medio',
                excesoDiarioDocente:'alto',
                respetoJornada:'muy-alto',
                virtuales:'medio',
                transversalesHeredadas:'medio'
            };
            cfg.solverPesos=Object.assign({},solverDefault,cfg.solverPesos||{});
            const solverLabels={
                topesDuros:'Topes duros',
                bloquesFaltantes:'Bloques faltantes',
                ventanasEstudiantes:'Ventanas estudiantes',
                ventanasDocentes:'Ventanas docentes',
                compactacionAsignatura:'Compactación asignatura',
                distribucionSemanal:'Distribución semanal',
                salasCorrectas:'Salas definitivas',
                excesoDiarioDocente:'Exceso diario docente',
                respetoJornada:'Respeto de jornada',
                virtuales:'Bloques virtuales',
                transversalesHeredadas:'Herencias y transversales'
            };
            const solverOpciones=[
                ['desactivado','Desactivado'],
                ['bajo','Bajo'],
                ['medio','Medio'],
                ['alto','Alto'],
                ['muy-alto','Muy alto']
            ];
            const selectorPesoSolver=(key)=>`
                <div class="form-group">
                    <label class="form-label">${solverLabels[key]}</label>
                    <select class="form-select cfg-solver-peso" id="cfgSolver_${key}" data-solver-key="${key}">
                        ${solverOpciones.map(([v,l])=>`<option value="${v}" ${cfg.solverPesos[key]===v?'selected':''}>${l}</option>`).join('')}
                    </select>
                </div>`;
            const perfilActual=cfg.perfilesUsuarios[emailActual]||{};
            const memoria=resumenMemoriaPlanificacion();
            const dashboardLabels={
                totalBloques:'Bloques planificados',
                totalAsignaturas:'Asignaturas',
                totalDocentes:'Docentes',
                presencialVirtual:'Presencial / virtual',
                incompletas:'Asignaturas incompletas',
                docenteNN:'Asignaturas con Docente NN',
                tro2:'Asignaturas en TRO2',
                criticas:'Asignaturas críticas',
                transversales:'Transversales / externas',
                criteriosAsignatura:'Resumen por criterios',
                docentesEsp:'Docentes por especialidad',
                conflictos:'Conflictos',
                seccionesATiempo:'Progreso por sección',
                calidadHorario:'Calidad de horario'
            };
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Configuración</h3>
                    <p>Ajustes generales del planificador.</p>
                </div>
                <div class="config-section config-help-entry">
                    <div>
                        <h4>Ayuda y desarrollo</h4>
                        <p>Abre guías completas de uso y documentación del proceso de creación de la app.</p>
                    </div>
                    <div class="config-help-actions">
                        <button class="btn btn-primary btn-sm" id="btnAbrirAyudaApp" type="button">Ayuda</button>
                        <button class="btn btn-sm" id="btnAbrirDesarrolloApp" type="button">Desarrollo</button>
                    </div>
                </div>
                <div class="config-section">
                    <h4>Planificación</h4>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Bloques diarios máximos</label><input class="form-input" type="number" id="cfgBloquesDiarios" value="${cfg.bloquesDiariosMax}" min="1"></div>
                        <div class="form-group"><label class="form-label">Bloques semestrales máximos</label><input class="form-input" type="number" id="cfgBloquesSemestral" value="${cfg.bloquesSemestralesMax}" min="1"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Horas mínimas de descanso</label><input class="form-input" type="number" id="cfgHorasDescanso" value="${cfg.horasDescanso}" min="0"></div>
                        <div class="form-group"><label class="form-label">Sábado hasta bloque</label><input class="form-input" type="number" id="cfgSabadoBloque" value="${cfg.sabadoHastaBloque}" max="18" min="1"></div>
                    </div>
                    <label class="check-line"><input type="checkbox" id="cfgConfirmarElim" ${cfg.confirmarEliminacion?'checked':''}> Confirmar antes de eliminar datos</label>
                </div>
                <div class="config-section">
                    <h4>Auto-planificación</h4>
                    <div class="form-group">
                        <label class="form-label">Estrategia predeterminada</label>
                        <select class="form-select" id="cfgAutoEstrategia">
                            <option value="balanceada" ${((cfg.autoPlanificacion||{}).estrategiaPredeterminada||'balanceada')==='balanceada'?'selected':''}>Balanceada</option>
                            <option value="compacta" ${(cfg.autoPlanificacion||{}).estrategiaPredeterminada==='compacta'?'selected':''}>Compacta</option>
                            <option value="docente" ${(cfg.autoPlanificacion||{}).estrategiaPredeterminada==='docente'?'selected':''}>Docente preferente</option>
                        </select>
                    </div>
                    <div class="checkbox-grid">
                        <label><input type="checkbox" id="cfgAutoPrioridad" ${(cfg.autoPlanificacion||{}).usarPrioridadDocente!==false?'checked':''}> Usar prioridad docente</label>
                        <label><input type="checkbox" id="cfgAutoBalance" ${(cfg.autoPlanificacion||{}).balancearDias!==false?'checked':''}> Balancear días</label>
                        <label><input type="checkbox" id="cfgAutoSabado" ${(cfg.autoPlanificacion||{}).permitirSabadoPresencial?'checked':''}> Permitir sábado presencial</label>
                        <label><input type="checkbox" id="cfgAutoNN" ${(cfg.autoPlanificacion||{}).permitirDocenteNN!==false?'checked':''}> Permitir Docente NN</label>
                        <label><input type="checkbox" id="cfgAutoTransversales" ${(cfg.autoPlanificacion||{}).incluirTransversales!==false?'checked':''}> Incluir transversales/externas</label>
                        <label><input type="checkbox" id="cfgAutoVirtuales" ${(cfg.autoPlanificacion||{}).incluirVirtuales!==false?'checked':''}> Incluir bloques virtuales</label>
                        <label><input type="checkbox" id="cfgAutoVirtualSabado" ${(cfg.autoPlanificacion||{}).priorizarVirtualSabado!==false?'checked':''}> Priorizar virtuales sábado</label>
                        <label><input type="checkbox" id="cfgAutoN1" ${(cfg.autoPlanificacion||{}).evitarTempranoN1!==false?'checked':''}> Evitar B1-B2 en N1</label>
                        <label><input type="checkbox" id="cfgAutoCriticas" ${(cfg.autoPlanificacion||{}).cuidarCriticas!==false?'checked':''}> Cuidar asignaturas críticas</label>
                        <label><input type="checkbox" id="cfgAutoAyudantias" ${(cfg.autoPlanificacion||{}).cuidarAyudantias!==false?'checked':''}> Reservar margen para ayudantías</label>
                    </div>
                </div>
                <div class="config-section">
                    <h4>Criterios del solver</h4>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 10px;">Define cuánto pesa cada criterio al evaluar y optimizar un horario. No cambia tus datos; cambia la forma en que el sistema decide qué propuesta es mejor.</p>
                    <div class="form-row">
                        ${selectorPesoSolver('topesDuros')}
                        ${selectorPesoSolver('bloquesFaltantes')}
                    </div>
                    <div class="form-row">
                        ${selectorPesoSolver('ventanasEstudiantes')}
                        ${selectorPesoSolver('ventanasDocentes')}
                    </div>
                    <div class="form-row">
                        ${selectorPesoSolver('compactacionAsignatura')}
                        ${selectorPesoSolver('distribucionSemanal')}
                    </div>
                    <div class="form-row">
                        ${selectorPesoSolver('salasCorrectas')}
                        ${selectorPesoSolver('excesoDiarioDocente')}
                    </div>
                    <div class="form-row">
                        ${selectorPesoSolver('respetoJornada')}
                        ${selectorPesoSolver('virtuales')}
                    </div>
                    <div class="form-row">
                        ${selectorPesoSolver('transversalesHeredadas')}
                    </div>
                </div>
                <div class="config-section">
                    <h4>App y sincronización</h4>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Autoguardado (segundos)</label><input class="form-input" type="number" id="cfgAutoguardado" value="${cfg.autoguardadoIntervalo}" min="5"></div>
                        <div class="form-group"><label class="form-label">Excel predeterminado</label><select class="form-select" id="cfgExportacionExcel">
                            <option value="xlsx" ${(cfg.exportacionExcel||'xlsx')==='xlsx'?'selected':''}>Avanzado (.xlsx)</option>
                            <option value="html" ${cfg.exportacionExcel==='html'?'selected':''}>Compatible (.xls)</option>
                        </select></div>
                    </div>
                    <div class="form-group"><label class="form-label">Tipografía</label><select class="form-select" id="cfgFuenteApp">
                        ${Object.entries(ctx.FUENTES_APP||{}).map(([id,fuente])=>ctx.optionHTML(id,fuente.nombre,(cfg.fuenteApp||'segoe')===id)).join('')}
                    </select></div>
                </div>
                <div class="config-section">
                    <h4>Perfil de usuario</h4>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Correo</label><input class="form-input" id="cfgPerfilEmail" value="${ctx.escapeAttr(emailActual)}" disabled></div>
                        <div class="form-group"><label class="form-label">Nombre visible</label><input class="form-input" id="cfgPerfilNombre" value="${ctx.escapeAttr(perfilActual.nombre||'')}" placeholder="Ej. Gerald Andrade"></div>
                    </div>
                    <p style="font-size:0.78rem;color:var(--text-secondary);margin:0;">Este nombre aparecerá en el historial de acciones junto al correo.</p>
                </div>
                <div class="config-section">
                    <h4>Memoria de planificación</h4>
                    <div class="memory-toolbar">
                        <label class="check-line"><input type="checkbox" id="cfgMemoriaActiva" ${cfg.memoriaPlanificacion.activa!==false?'checked':''}> Registrar señales aprendibles</label>
                        <div class="form-group memory-limit"><label class="form-label">Máximo</label><input class="form-input" type="number" id="cfgMemoriaMax" value="${Number(cfg.memoriaPlanificacion.maxSenales)||500}" min="50" max="2000"></div>
                    </div>
                    <div class="form-row">
                        <label class="check-line"><input type="checkbox" id="cfgMemoriaUsarAuto" ${cfg.memoriaPlanificacion.usarEnAuto?'checked':''}> Usar memoria en auto-planificación</label>
                        <div class="form-group"><label class="form-label">Fuerza</label><select class="form-select" id="cfgMemoriaFuerza">
                            <option value="baja" ${(cfg.memoriaPlanificacion.fuerza||'baja')==='baja'?'selected':''}>Baja</option>
                            <option value="media" ${cfg.memoriaPlanificacion.fuerza==='media'?'selected':''}>Media</option>
                            <option value="alta" ${cfg.memoriaPlanificacion.fuerza==='alta'?'selected':''}>Alta</option>
                        </select></div>
                    </div>
                    <div class="memory-summary">
                        <div><strong>${memoria.senales.length}</strong><span>señales guardadas</span></div>
                        <div><strong>${memoria.filas.length}</strong><span>asignaturas observadas</span></div>
                    </div>
                    <div id="cfgMemoriaLista" class="memory-list">
                        ${memoria.filas.length?memoria.filas.slice(0,8).map(g=>`
                            <div class="memory-row">
                                <div>
                                    <strong>${ctx.escapeHTML(g.asignatura)}</strong>
                                    <small>${Object.entries(g.tipos).map(([tipo,c])=>`${ctx.escapeHTML(memoria.labelTipo[tipo]||tipo)}: ${c}`).join(' · ')}</small>
                                </div>
                                <div class="memory-row-actions">
                                    <span>${g.total}</span>
                                    <button class="btn btn-xs btn-limpiar-memoria-asig" data-asignatura="${ctx.escapeAttr(g.asignaturaId)}" type="button">Limpiar</button>
                                </div>
                            </div>
                        `).join(''):'<p class="memory-empty">Aún no hay memoria registrada. Se irá llenando cuando corrijas bloques automáticos.</p>'}
                        ${memoria.filas.length>8?`<p class="memory-empty">Se muestran 8 de ${memoria.filas.length} asignaturas con señales.</p>`:''}
                    </div>
                    <div class="memory-actions">
                        <button class="btn btn-xs" id="cfgLimpiarMemoria">Limpiar toda la memoria</button>
                    </div>
                </div>
                <div class="config-section">
                    <h4>Especialidades</h4>
                    <div id="cfgEspecialidades" class="chip-list"></div>
                    <button class="btn btn-xs" id="cfgAgregarEspecialidad">+ Agregar especialidad</button>
                </div>
                <div class="config-section">
                    <h4>Dashboard</h4>
                    <div class="checkbox-grid">${Object.entries(dashboardLabels).map(([k,label])=>`<label><input type="checkbox" id="cfgDash_${k}" ${(cfg.dashboard||{})[k]!==false?'checked':''}> ${label}</label>`).join('')}</div>
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCancelarConfig">Cancelar</button>
                    <button class="btn btn-primary" id="btnGuardarConfig">Guardar cambios</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();});
            document.getElementById('btnCancelarConfig').addEventListener('click',ctx.cerrarModal);
            document.getElementById('btnAbrirAyudaApp')?.addEventListener('click',abrirAyudaApp);
            document.getElementById('btnAbrirDesarrolloApp')?.addEventListener('click',abrirDesarrolloApp);
            function renderCfgEspecialidades(){
                const cont=document.getElementById('cfgEspecialidades'); if(!cont) return;
                cont.innerHTML=(data.configuracion.especialidades||[]).map((e,i)=>`<span class="item-chip">${ctx.escapeHTML(e)} <button class="btn btn-xs btn-eliminar-esp" data-idx="${i}" title="Eliminar especialidad">x</button></span>`).join('');
                cont.querySelectorAll('.btn-eliminar-esp').forEach(btn=>btn.addEventListener('click',function(){
                    const idx=parseInt(this.dataset.idx);
                    data.configuracion.especialidades.splice(idx,1);
                    renderCfgEspecialidades();
                }));
            }
            renderCfgEspecialidades();
            document.getElementById('cfgAgregarEspecialidad').addEventListener('click',()=>{
                const nombre=prompt('Nombre de la nueva especialidad:');
                if(nombre&&nombre.trim()){ data.configuracion.especialidades.push(nombre.trim()); renderCfgEspecialidades(); }
            });
            document.querySelectorAll('.btn-limpiar-memoria-asig').forEach(btn=>btn.addEventListener('click',()=>{
                const asigId=btn.dataset.asignatura;
                if(!confirm('¿Limpiar la memoria de esta asignatura?')) return;
                data.configuracion.memoriaPlanificacion.senales=(data.configuracion.memoriaPlanificacion.senales||[]).filter(s=>(s.asignaturaId||'')!==asigId);
                abrirConfiguracion();
            }));
            document.getElementById('cfgLimpiarMemoria')?.addEventListener('click',()=>{
                if(!confirm('¿Limpiar toda la memoria de planificación?')) return;
                data.configuracion.memoriaPlanificacion.senales=[];
                abrirConfiguracion();
            });
            document.getElementById('btnGuardarConfig').addEventListener('click',()=>{
                data.configuracion.bloquesDiariosMax=parseInt(document.getElementById('cfgBloquesDiarios').value)||13;
                data.configuracion.bloquesSemestralesMax=parseInt(document.getElementById('cfgBloquesSemestral').value)||47;
                data.configuracion.horasDescanso=parseInt(document.getElementById('cfgHorasDescanso').value)||12;
                data.configuracion.sabadoHastaBloque=parseInt(document.getElementById('cfgSabadoBloque').value)||16;
                data.configuracion.autoguardadoIntervalo=parseInt(document.getElementById('cfgAutoguardado').value)||30;
                data.configuracion.exportacionExcel=document.getElementById('cfgExportacionExcel').value;
                data.configuracion.fuenteApp=document.getElementById('cfgFuenteApp').value;
                const perfilEmail=document.getElementById('cfgPerfilEmail')?.value||emailActual;
                const perfilNombre=(document.getElementById('cfgPerfilNombre')?.value||'').trim();
                data.configuracion.perfilesUsuarios=data.configuracion.perfilesUsuarios||{};
                if(perfilEmail) data.configuracion.perfilesUsuarios[perfilEmail]={nombre:perfilNombre||perfilEmail};
                data.configuracion.memoriaPlanificacion=data.configuracion.memoriaPlanificacion||{senales:[]};
                data.configuracion.memoriaPlanificacion.activa=document.getElementById('cfgMemoriaActiva')?.checked!==false;
                data.configuracion.memoriaPlanificacion.usarEnAuto=!!document.getElementById('cfgMemoriaUsarAuto')?.checked;
                data.configuracion.memoriaPlanificacion.fuerza=document.getElementById('cfgMemoriaFuerza')?.value||'baja';
                data.configuracion.memoriaPlanificacion.maxSenales=Math.max(50,Math.min(2000,parseInt(document.getElementById('cfgMemoriaMax')?.value)||500));
                data.configuracion.memoriaPlanificacion.senales=(data.configuracion.memoriaPlanificacion.senales||[]).slice(-data.configuracion.memoriaPlanificacion.maxSenales);
                data.configuracion.confirmarEliminacion=document.getElementById('cfgConfirmarElim').checked;
                data.configuracion.autoPlanificacion={
                    usarPrioridadDocente:document.getElementById('cfgAutoPrioridad').checked,
                    balancearDias:document.getElementById('cfgAutoBalance').checked,
                    permitirSabadoPresencial:document.getElementById('cfgAutoSabado').checked,
                    estrategiaPredeterminada:document.getElementById('cfgAutoEstrategia').value,
                    permitirDocenteNN:document.getElementById('cfgAutoNN').checked,
                    incluirTransversales:document.getElementById('cfgAutoTransversales').checked,
                    incluirVirtuales:document.getElementById('cfgAutoVirtuales').checked,
                    priorizarVirtualSabado:document.getElementById('cfgAutoVirtualSabado').checked,
                    evitarTempranoN1:document.getElementById('cfgAutoN1').checked,
                    cuidarCriticas:document.getElementById('cfgAutoCriticas').checked,
                    cuidarAyudantias:document.getElementById('cfgAutoAyudantias').checked
                };
                data.configuracion.solverPesos={};
                Object.keys(solverDefault).forEach(k=>{
                    const valor=document.getElementById('cfgSolver_'+k)?.value||solverDefault[k];
                    data.configuracion.solverPesos[k]=solverOpciones.some(([v])=>v===valor)?valor:solverDefault[k];
                });
                const dash=data.configuracion.dashboard=data.configuracion.dashboard||{};
                ['totalBloques','totalAsignaturas','totalDocentes','presencialVirtual','incompletas','docenteNN','tro2','criticas','transversales','criteriosAsignatura','docentesEsp','conflictos','seccionesATiempo','calidadHorario'].forEach(k=>dash[k]=document.getElementById('cfgDash_'+k).checked);
                ctx.aplicarFuente();
                ctx.guardar();
                ctx.cerrarModal();
                ctx.renderDashboard();
                ctx.detectarConflictos();
                ctx.toast('Configuración actualizada','success');
            });
        }

        function actualizarSelectorTemporada() {
            const data = getData();
            const sel=document.getElementById('selectorTemporada');
            if(!sel) return;
            sel.innerHTML=data.temporadas.map(t=>ctx.optionHTML(t.id, `${t.temporada} ${t.anio}`, t.id===data.sel.temporadaId)).join('');
            sel.onchange=()=>{
                ctx.switchTemporada(sel.value);
                ctx.aplicarPaleta();
                actualizarIndicadorPaleta();
                ctx.guardar();
                ctx.reconstruirIndices();
                ctx.refrescarTodo();
            };
        }

        function actualizarIndicadorPaleta() {
            const data = getData();
            const el=document.getElementById('indicadorPaleta');
            if(!el) return;
            const id=data.sel.temporadaId||data.configuracion.temporadaActualId||data.temporadas[0]?.id;
            const t=data.temporadas.find(tmp=>tmp.id===id);
            const iconos={Otoño:'🍂',Invierno:'❄️',Primavera:'🌿',Verano:'☀️'};
            el.textContent=t?`${iconos[t.temporada]||''} ${t.temporada} ${t.anio}`:'';
        }

        function abrirGestionTemporadas(){
            const data = getData();
            let html='<div class="modal-overlay" id="modalOverlay"><div class="modal"><h3>📅 Gestionar Temporadas</h3><table style="width:100%;border-collapse:collapse;"><tr><th style="text-align:left;padding:6px;">Temporada</th><th style="text-align:left;padding:6px;">Año</th><th></th></tr>';
            data.temporadas.forEach((t,i)=>html+=`<tr><td style="padding:4px;"><select class="form-select" data-idx="${i}" id="tempSel_${i}">${ctx.TEMPORADAS.map(tt=>`<option value="${tt}" ${tt===t.temporada?'selected':''}>${tt}</option>`).join('')}</select></td><td style="padding:4px;"><input class="form-input" type="number" id="tempAnio_${i}" value="${t.anio}" style="width:80px;"></td><td style="padding:4px;"><button class="btn btn-xs btn-eliminar-temp" data-idx="${i}">🗑️</button></td></tr>`);
            html+=`</table><button class="btn btn-sm" id="btnAgregarTemp">+ Agregar temporada</button><button class="btn btn-primary btn-sm" id="btnGuardarTemps" style="margin-left:8px;">Guardar</button></div></div>`;
            document.getElementById('modalContainer').innerHTML=html;
            document.getElementById('btnAgregarTemp').onclick=()=>{
                const temp=prompt('Temporada (Otoño/Invierno/Primavera/Verano):','Otoño');
                if(!temp||!ctx.TEMPORADAS.includes(temp)) return ctx.toast('Temporada inválida','error');
                const anio=parseInt(prompt('Año:',String(new Date().getFullYear())));
                if(!anio) return;
                const id=ctx.genId();
                const nuevaTemp={id, temporada:temp, anio};
                const homologo = data.temporadas.find(t => t.temporada === temp && t.anio === anio - 1);
                let origen = homologo && data.temporadaData[homologo.id] ? homologo : null;
                if (!origen) origen = data.temporadas.find(t => t.id === data.sel.temporadaId);
                let copiar = false;
                if (origen && data.temporadaData[origen.id]) copiar = confirm('¿Copiar datos desde ' + origen.temporada + ' ' + origen.anio + '?');
                if (copiar) {
                    const src = data.temporadaData[origen.id];
                    data.temporadaData[id] = { carreras:JSON.parse(JSON.stringify(src.carreras)), niveles:JSON.parse(JSON.stringify(src.niveles)), secciones:JSON.parse(JSON.stringify(src.secciones)), asignaturas:JSON.parse(JSON.stringify(src.asignaturas)), docentes:JSON.parse(JSON.stringify(src.docentes)), salas:JSON.parse(JSON.stringify(src.salas)), asignaturaCarreraNivel:JSON.parse(JSON.stringify(src.asignaturaCarreraNivel)), planificaciones:[], gruposDictacion:JSON.parse(JSON.stringify(src.gruposDictacion||[])) };
                    ctx.toast('Datos copiados desde ' + origen.temporada + ' ' + origen.anio,'success');
                } else {
                    data.temporadaData[id] = { carreras:[], niveles:[], secciones:[], asignaturas:[], docentes:[], salas:[], asignaturaCarreraNivel:[], planificaciones:[], gruposDictacion:[] };
                    ctx.toast('Nueva temporada vacía','info');
                }
                data.temporadas.push(nuevaTemp);
                actualizarSelectorTemporada();
                abrirGestionTemporadas();
            };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.querySelectorAll('.btn-eliminar-temp').forEach(b=>b.onclick=()=>{
                if(confirm('Eliminar temporada? Se borrarán todos sus datos.')){
                    const idx=parseInt(b.dataset.idx);
                    const idElim=data.temporadas[idx]?.id;
                    if(idElim) delete data.temporadaData[idElim];
                    data.temporadas.splice(idx,1);
                    if(data.sel.temporadaId===idElim) data.sel.temporadaId=data.temporadas[0]?.id;
                    actualizarSelectorTemporada();
                    abrirGestionTemporadas();
                }
            });
            document.getElementById('btnGuardarTemps').onclick=()=>{
                data.temporadas.forEach((t,i)=>{
                    const sel2=document.getElementById(`tempSel_${i}`);
                    const anio2=document.getElementById(`tempAnio_${i}`);
                    if(sel2) t.temporada=sel2.value;
                    if(anio2) t.anio=parseInt(anio2.value);
                });
                ctx.guardar();
                actualizarSelectorTemporada();
                ctx.cerrarModal();
                ctx.reconstruirIndices();
                ctx.refrescarTodo();
            };
        }

        function init(){
            const btn=document.getElementById('btnGestionarTemps');
            if(btn) btn.onclick=abrirGestionTemporadas;
        }

        return { abrirConfiguracion, actualizarSelectorTemporada, actualizarIndicadorPaleta, init };
    }

    window.PlanificadorConfiguracion = { create: createConfiguracion };
})();
