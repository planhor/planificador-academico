# Actualización Planhor · 04-11-2026

Base publicada: f9a9fee46110353c709958ef93cdc8ae994de1b2 (main/docs), consultada nuevamente.

Incluye navegación y escala visual unificadas, componentes por aplicación, Organizar salas, mejoras de interacción y carga del Gestor. No incorpora propuestas futuras de reglas, calendario ni FET.

El bloque Firebase/Auth se conserva literalmente de origin/main. Se retiran el adaptador, cuenta, datos y aviso de simulación. No se cambian reglas Firestore ni se migra información. Se preservan preferencias de temas de los usuarios; la demostración forzada mediante query profesional no se transfiere a datos reales. Caché JS renovada. Los prototipos de propuestas no se publican.

Validación: 102/102 pruebas,24archivosJS sin errores de sintaxis y referencias locales del index existentes. Pendiente prueba autenticada sin escrituras y revisión de publicación. Las pruebas no certifican reglas remotas de seguridad.

Respaldo local completo: ../planhor-respaldo-github-20261104.bundle (git bundle verify aprobado). Respaldo remoto creado: respaldo/antes-actualizacion-20261104, apuntando al commit base. Git local sin credenciales; publicación mediante conexión GitHub.

Restauración de código: volver al commit base respaldado. Esto no restaura datos de Firestore. No afirmar que hay respaldo de datos; bundle solo contiene código e historial.

Respaldo remoto creado antes de subir la actualización. Comprobar despliegue Pages y flujo autenticado tras publicar. Alojamiento Firebase solamente evaluado, no configurado ni desplegado.
