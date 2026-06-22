# Pruebas De Planhor

Infraestructura sin dependencias externas basada en `node:test`.

Desde `planificador-academico-deploy`:

```bash
node --test tests/*.test.js
```

`fixtures/datos-base.js` entrega un estado academico pequeno y reutilizable. Los helpers evalúan los módulos del navegador y crean un contexto controlado sin iniciar la app ni Firebase.

Cobertura actual:

- Infraestructura y contratos públicos de módulos.
- Reglas académicas de selección manual, virtual/presencial, herencias, disponibilidad, límites diarios, fusiones y electivas vinculadas.
- Restricciones de simultaneidad por sección, docente y sala; máximo semestral, descanso, Docente NN y confirmación por capacidad.
- Gestor con filas informativas, planes completos y relaciones externas por ID.
- Integridad, fragmentación, combinación de tres vías y protección regresiva de Firebase.
- Pruebas de humo de pestañas, IDs, orden de módulos, controles visuales y exportaciones Excel.

Las exportaciones JPG/PDF y la navegación autenticada requieren validación visual en navegador porque dependen de Firebase, canvas y descarga de archivos.

## Escenario Masivo

La Fase 3.1 incluye un escenario sintético de 500 secciones, 300 asignaturas y 12.000 bloques. Para medirlo sin convertir tiempos variables en fallos estrictos:

```bash
node tests/benchmarks/escenario-masivo.js
```

La Fase 3.2 mide reportes y solver reales:

```bash
node tests/benchmarks/modulos-masivos.js
```

La Fase 3.3 conserva ese benchmark para comparar los índices del score y valida el contrato del Worker, su fallback y la cobertura de asignaturas heredadas.
