# Planificador modulos

Esta carpeta contiene los módulos de `index.html` para que la app sea más fácil de mantener.

- `estilos.css`: estilos visuales de la app.
- `utils.js`: helpers compartidos de texto, ids, colores y limpieza de datos.
- `sync.js`: carga, guardado, sincronizacion Firestore y deteccion de conflictos.
- `exportaciones.js`: exportaciones generales a Excel y respaldo JSON.
- `vista-horario.js`: busqueda, filtros, grilla y exportacion de la vista horario.
- `reportes.js`: reportes, dashboard e indicadores de conflictos.
- `ficha-docente.js`: selector, render y exportacion de ficha docente.
- `entidades.js`: gestion modular de entidades base: carreras, niveles, secciones, asignaturas, docentes y salas.
- `planificacion.js`: selectores, progreso, grilla principal, disponibilidad, acciones sobre bloques y autoasignación.
- `configuracion.js`: ajustes generales, selector de temporada y gestion de temporadas.
- `app.js`: logica principal del planificador.

La copia estable previa quedo en `../planificador_v5_9_estable.html`.
El archivo principal de despliegue es `../index.html`.

Notas de mantenimiento:
- El HTML carga solo los estilos y modulos; la logica vive en `planificador_modulos/`.
- `app.js` coordina datos, sesion, menus y arranque de modulos.
- Las funciones expuestas en `window` se conservan como compatibilidad para acciones existentes.
