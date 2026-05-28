<div align="center">

# Pruebas de usabilidad — BizKPI

### Evaluación mixta: test con usuario potencial + evaluación heurística

*Trabajo de Fin de Grado · IES Rafael Alberti · Versión 1.0*

</div>

---

## Tabla de contenidos

1. [Introducción y metodología](#1-introducción-y-metodología)
2. [Test con usuario potencial](#2-test-con-usuario-potencial)
3. [Evaluación heurística (Nielsen)](#3-evaluación-heurística-nielsen)
4. [Síntesis y plan de acción](#4-síntesis-y-plan-de-acción)
5. [Anexo metodológico](#5-anexo-metodológico)

---

## 1. Introducción y metodología

Para evaluar la usabilidad de BizKPI se ha aplicado una **metodología mixta** que combina dos perspectivas complementarias:

| Método | Perspectiva | Aporta |
|---|---|---|
| **Test con usuario potencial** | Persona externa sin conocimiento previo de la app | Detecta problemas reales de descubribilidad y comprensión |
| **Evaluación heurística de Nielsen** | Desarrollador con visión experta | Sistematiza el cumplimiento de los 10 principios universales |

La triangulación de ambos métodos permite contrastar lo que el usuario realmente experimenta con lo que el diseño formalmente cumple, identificando tanto puntos ciegos del desarrollador como falsos problemas que solo existen sobre el papel.

---

## 2. Test con usuario potencial

### 2.1 Perfil de la participante

| Campo | Valor |
|---|---|
| Identificador | P01 |
| Género | Mujer |
| Rango de edad | 20-25 años |
| ¿Tiene negocio propio? | No |
| Frecuencia de uso del móvil | Alta (uso diario intensivo) |
| Familiaridad con apps móviles en general | Alta |
| Familiaridad con apps financieras | Baja |
| ¿Conocía BizKPI antes? | No |

**Justificación del perfil:** se buscó deliberadamente una persona externa, no técnica, sin experiencia previa con la app ni con software de gestión financiera, representativa del segmento "usuario digital habitual sin formación contable".

### 2.2 Sesión

| Campo | Valor |
|---|---|
| Fecha | 28 de mayo de 2026 |
| Hora de inicio | 18:25 |
| Dispositivo | iPad propio de la participante |
| Modo de ejecución | Expo Go (build de desarrollo) |
| Versión de la app | 1.0.0 |
| Observador | Desarrollador (autor del TFG) |

### 2.3 Tareas evaluadas

Se planteó un escenario contextualizado ("imagina que tienes un bar llamado *La Esquina*") y se entregaron por escrito 5 tareas consecutivas, sin indicaciones de cómo realizarlas. El observador permaneció en silencio salvo para neutralizar preguntas con la fórmula *"¿qué crees tú que hay que hacer?"*.

| # | Tarea | Tiempo | Éxito | Severidad |
|---|---|---|---|---|
| **T1** | Crear cuenta y entrar en la app | 0:56 | ✅ | 0 |
| **T2** | Registrar los datos de la semana (2 450 € / 1 320 € / 87 ventas / 64 clientes) | 0:35 | ✅ | 0 |
| **T3** | Consultar el beneficio neto de esa semana | 0:05 | ✅ | 0 |
| **T4** | Pedir una recomendación de IA para esa semana | 0:21 | ✅ | 0 |
| **T5** | Exportar el historial en CSV | 0:55 | ✅ | 1 |

**Tiempo total en tareas:** 2 minutos y 52 segundos.

### 2.4 Observaciones por tarea

**T1 — Crear cuenta y entrar.** Localizó el enlace *"¿No tienes cuenta? Regístrate"* de forma **inmediata**, sin titubear. Completó el registro y la confirmación de email sin necesidad de explicación adicional. Tiempo total: 56 segundos.

**T2 — Registrar datos.** Encontró la pestaña *Datos* (icono "+") al primer intento. **Entendió correctamente el selector de semana**, **detectó los campos opcionales** sin confundirlos con los obligatorios, y no confundió "ventas" con "clientes" — distinción crítica que un usuario novato podría errar. Pulsó *Guardar* inmediatamente al terminar. Tiempo: 35 segundos.

**T3 — Consultar beneficio.** Resultado especialmente interesante: la participante **localizó el dato en el panel de "Entradas recientes"** del propio Dashboard (que muestra las últimas semanas con sus KPIs calculados), sin necesidad de navegar al Historial. Identificó correctamente el campo "beneficio" sin confundirlo con "ingresos". Tiempo: **5 segundos**.

**T4 — Generar recomendación IA.** Encontró la pestaña *IA* (bombilla) al primer intento, entendió el sistema de chips de selección de semana sin ayuda, y la espera de la generación de IA **no le pareció anormal** — comportamiento esperado para alguien acostumbrado a apps modernas. Leyó las recomendaciones por encima. Tiempo: 21 segundos.

**T5 — Exportar CSV (único punto de fricción).** Necesitó **buscar el icono de descarga** en lugar de identificarlo inmediatamente, y dudó momentáneamente al considerar si la pestaña *Datos* podía ser el lugar de la exportación. Una vez localizado el icono en la cabecera del Historial, comprendió el modal de exportación sin dificultad y completó la tarea. Tiempo: 55 segundos. **Severidad asignada: 1** (cosmético — el flujo se completa, pero el icono podría ser más descubrible).

### 2.5 Cuestionario post-test

**¿Qué te ha gustado más?**
> *"Aplicación bastante intuitiva junto con el diseño."*

**¿Qué te ha resultado más difícil?**
> *"Exportar CSV."*

**¿Usarías esta app si tuvieras un negocio?**
> *"Sí. Es una forma bastante eficiente y sencilla de llevar las cuentas de un negocio y de fácil acceso."*

**¿Qué cambiarías?**
> *"Nada."*

**¿Hubo algo que esperabas y no había?**
> *"No."*

### 2.6 Escala SUS simplificada

| Pregunta | Puntuación (1-10) |
|---|---|
| ¿Cómo de fácil te ha resultado en general? | 9 |
| ¿Cómo de profesional te ha parecido visualmente? | 10 |
| ¿Confiarías tus datos económicos a esta app? | 10 |
| ¿Cómo de útiles te han parecido las recomendaciones de IA? | 9 |
| ¿La recomendarías a alguien con un negocio pequeño? | 10 |
| **MEDIA TOTAL** | **9.6 / 10** |

### 2.7 Conclusiones del test

**Puntos fuertes detectados:**

1. **Intuitividad de la navegación** — la participante completó las 5 tareas en menos de 3 minutos sin necesidad de pista alguna en 4 de ellas.
2. **Diseño visual percibido como profesional** — máxima puntuación SUS (10/10) en "apariencia profesional" y "confianza para confiar datos económicos".
3. **Flujo de registro de datos optimizado** — 35 segundos para meter una semana completa, con todos los campos correctamente identificados al primer intento.
4. **Recomendaciones IA bien valoradas** — 9/10 en utilidad percibida.

**Problemas detectados:**

| # | Problema | Severidad | Acción propuesta |
|---|---|---|---|
| 1 | El icono de descarga en la cabecera del Historial no es descubrible al primer vistazo; obliga al usuario a buscar | **1** | Añadir texto "Exportar" junto al icono, o destacarlo más visualmente |

Cabe señalar que la participante valoró la app como **9.6/10** y respondió *"nada"* a la pregunta de qué cambiaría. Aunque esto sugiere una experiencia muy positiva, también introduce un sesgo posible (familiaridad de la participante con el dispositivo, o tendencia a la deseabilidad social al evaluar el trabajo de una persona cercana). Para compensar este sesgo se aplica una evaluación heurística sistemática.

---

## 3. Evaluación heurística (Nielsen)

### 3.1 Metodología

Se ha aplicado el método clásico de Jakob Nielsen, evaluando la app contra las **10 heurísticas de usabilidad** (Nielsen 1994, actualizadas por NN/g en 2020). Para cada heurística se ha valorado:

- **Nivel de cumplimiento:** ✅ cumple · ⚠️ cumple parcialmente · ❌ no cumple
- **Severidad de los problemas detectados** en escala de 0 (no problema) a 4 (catástrofe)

### 3.2 Tabla resumen

| # | Heurística | Cumplimiento | Severidad máx. |
|---|---|---|---|
| H1 | Visibilidad del estado del sistema | ✅ | 0 |
| H2 | Conexión con el mundo real | ✅ | 1 |
| H3 | Control y libertad del usuario | ⚠️ | 1 |
| H4 | Consistencia y estándares | ✅ | 0 |
| H5 | Prevención de errores | ✅ | 0 |
| H6 | Reconocer mejor que recordar | ✅ | 1 |
| H7 | Flexibilidad y eficiencia | ⚠️ | 2 |
| H8 | Diseño minimalista | ✅ | 0 |
| H9 | Mensajes de error | ⚠️ | 2 |
| H10 | Ayuda y documentación | ⚠️ | 2 |

**Conformidad global:** 7 de 10 heurísticas plenamente cumplidas, 3 parcialmente. **Ningún problema de severidad 3 o 4** (los que exigirían corrección antes de un lanzamiento real).

### 3.3 Detalle por heurística

#### H1 · Visibilidad del estado del sistema · ✅

**Cumple plenamente.** `ActivityIndicator` en pantallas de carga, mensaje verde de confirmación al guardar (`data.tsx:411`), estado `loading` propagado a los botones, texto explicativo durante la generación de IA, y *pull-to-refresh* en las tres pestañas principales. El usuario siempre sabe qué está ocurriendo.

#### H2 · Conexión con el mundo real · ✅ (problema menor)

**Cumple bien.** El prompt de la IA instruye explícitamente evitar jerga corporativa (`ai_service.py:30-31`). Selector de semana en lenguaje natural ("S22 · 25 - 31 mayo"). Iconos universales (cash, people, cart).

**Problema 1 (severidad 1):** términos como "margen bruto" o "ticket medio" pueden no ser inmediatamente comprensibles para usuarios sin formación financiera. *Mitigación parcial:* existen en el `MANUAL_USUARIO.md`, pero no en la app.

#### H3 · Control y libertad del usuario · ⚠️

**Cumple parcialmente.** Confirmaciones antes de reemplazar o eliminar, *swipe back* nativo en iOS, logout sin pérdida de datos. Pero:

**Problema 2 (severidad 1):** los cambios en preferencias (tema, idioma, moneda) son **inmediatos sin opción de deshacer**. Si el usuario los cambia por error, debe volver a buscarlos y revertirlos manualmente. Aceptable pero mejorable.

#### H4 · Consistencia y estándares · ✅

**Cumple plenamente.** Iconos Ionicons con patrón filled/outline coherente con HIG. Paleta centralizada en `theme/colors.ts`. Verde = positivo, rojo = negativo aplicado de forma uniforme. Componentes reutilizables (`GlassCard`, `Input`, `Button`) garantizan consistencia visual.

#### H5 · Prevención de errores · ✅

**Cumple plenamente.** Validación triple (UI → Pydantic → CHECK constraints SQL). Teclados específicos por tipo de campo. Selectores visuales en lugar de inputs libres para fechas. Imposible elegir el mismo día como "mejor" y "peor" (`excludeDate`). Confirmación antes de operaciones destructivas.

#### H6 · Reconocer mejor que recordar · ✅ (problema menor)

**Cumple bien.** Resumen de la última entrada visible encima del formulario de Datos. Iconos + texto en el tab bar. KPIs siempre visibles con tendencia comparada. El panel de "Entradas recientes" del Dashboard fue, de hecho, donde la participante encontró el dato del beneficio en la tarea T3, validando esta heurística en la práctica.

**Problema 3 (severidad 1):** los iconos de las tarjetas del Dashboard no llevan etiqueta visible salvo el nombre del KPI; un nuevo usuario debe inferir que el icono de la moneda corresponde a "Ingresos". Mitigado por el texto inmediatamente debajo.

#### H7 · Flexibilidad y eficiencia · ⚠️

**Cumple parcialmente.** Personalización completa (tema, idioma, moneda), *pull-to-refresh*, "Recordarme" en login, selector visual de semana. Pero:

**Problema 4 (severidad 2):** **no existe un *onboarding* para nuevos usuarios**. El primer arranque deja directamente en el Dashboard vacío sin un tour de bienvenida ni indicación de por dónde empezar. Para usuarios expertos no es problema; para usuarios menos digitales sí podría serlo.

#### H8 · Diseño estético y minimalista · ✅

**Cumple plenamente.** Dashboard limitado a 4 KPIs principales + 3 gráficos. Formulario de Datos separa visualmente obligatorios y opcionales. IA limitada a 3 highlights + 4 acciones máximo. Paleta de colores contenida. Validado por la participante: *"aplicación bastante intuitiva junto con el diseño"*.

#### H9 · Mensajes de error · ⚠️

**Cumple parcialmente.** Mensajes específicos por campo en formularios. Pantalla de "sin conexión" con icono y botón de reintentar. Validación inline al teclear.

**Problema 5 (severidad 2):** **los errores de la generación de IA no sugieren acción concreta de recuperación**. Si la llamada falla por timeout o por cuota agotada de OpenRouter, el usuario ve un genérico *"Error al generar la recomendación"* sin diferenciar causas ni proponer reintentar más tarde.

#### H10 · Ayuda y documentación · ⚠️

**Cumple parcialmente.** Existe `MANUAL_USUARIO.md` completo y exhaustivo (12 secciones, 9 capturas, FAQ, troubleshooting) y un README técnico para desarrolladores.

**Problema 6 (severidad 2):** **no existe ayuda contextual dentro de la app**. Un usuario que abre BizKPI por primera vez no tiene forma de acceder a explicaciones desde la propia interfaz sin abandonarla. Tarea pendiente para una próxima iteración: añadir una sección *Ayuda / FAQ* dentro de la pestaña Perfil.

### 3.4 Top problemas ordenados por severidad

| Rango | Heurística | Problema | Severidad | Solución propuesta |
|---|---|---|---|---|
| 1 | H7 | Sin onboarding para primer arranque | 2 | Tour de 3-4 pantallas la primera vez o estado vacío descriptivo |
| 2 | H10 | Sin ayuda contextual dentro de la app | 2 | Sección "Ayuda" en Perfil con FAQ y glosario integrados |
| 3 | H9 | Mensajes de error de IA genéricos | 2 | Diferenciar tipos de error y sugerir acción concreta |
| 4 | H2 | "Margen bruto" / "ticket medio" sin definición in-app | 1 | Tooltip al pulsar largo sobre el nombre del KPI |
| 5 | H3 | Cambios de preferencias sin opción de deshacer | 1 | Snackbar con "Deshacer" durante 5 s tras cada cambio |
| 6 | Test | Icono de exportar CSV poco descubrible | 1 | Añadir etiqueta "Exportar" junto al icono |

---

## 4. Síntesis y plan de acción

### 4.1 Conclusiones globales

La evaluación mixta confirma que **BizKPI es una aplicación con un nivel de usabilidad muy alto** para su estado actual (v1.0). La participante del test completó las cinco tareas con éxito en menos de tres minutos sin instrucciones previas, otorgando una valoración SUS media de **9.6 / 10**. La evaluación heurística sistemática confirma que **7 de las 10 heurísticas de Nielsen se cumplen plenamente, y las 3 restantes parcialmente**, sin ningún problema clasificable como mayor o catastrófico.

El test con usuario y la evaluación heurística coinciden en una conclusión común: la interfaz es **descubrible, consistente y visualmente cuidada**, y la única fricción real detectada es la **descubribilidad del botón de exportar**, que ambos métodos identifican.

La evaluación heurística añade tres áreas de mejora que el test puntual no podía detectar (onboarding, ayuda contextual y mensajes de error de IA), todas ellas de severidad media y corregibles en una próxima iteración sin afectar a la base del producto.

### 4.2 Plan de acción priorizado

Acciones propuestas para una próxima iteración (v1.1), priorizadas por impacto en la usabilidad:

| # | Acción | Heurística vinculada | Impacto estimado | Prioridad |
|---|---|---|---|---|
| 1 | Añadir sección **Ayuda / FAQ** dentro de la app (Perfil → Ayuda) con glosario de KPIs | H10, H2 | Alto | 🔴 Alta |
| 2 | Etiquetar el botón de **exportar** con texto explícito junto al icono | Test usuario | Alto | 🔴 Alta |
| 3 | Implementar un **onboarding** de 3 pantallas en el primer arranque | H7 | Medio | 🟡 Media |
| 4 | Mejorar **mensajes de error de IA** diferenciando causas y sugiriendo reintento | H9 | Medio | 🟡 Media |
| 5 | Añadir **tooltip** al pulsar largo sobre el nombre de cada KPI | H2, H6 | Bajo | 🟢 Baja |
| 6 | Snackbar **"Deshacer"** tras cambios de preferencias | H3 | Bajo | 🟢 Baja |

Las dos primeras acciones cubrirían el 100 % de los problemas detectados en el test con usuario real y elevarían el cumplimiento heurístico a 9/10 plenamente cumplidas.

### 4.3 Limitaciones del estudio

- **Tamaño muestral:** una sola participante en la prueba con usuario. Aunque la literatura (Nielsen, 2000) demuestra que con 5 participantes se detecta aproximadamente el 85 % de los problemas, un solo test no permite generalizar. Se ha compensado con la evaluación heurística sistemática.
- **Posible sesgo de cercanía:** la participante es una persona del entorno cercano del desarrollador, lo que puede introducir un sesgo positivo (tendencia a la deseabilidad social). Esto se ha tenido en cuenta al interpretar la puntuación SUS de 9.6 y se ha compensado manteniendo el rigor de la evaluación heurística, que identifica problemas reales no surgidos en el test.
- **Sesgo del observador:** el observador es el propio desarrollador, lo que puede introducir sesgo en la interpretación. Mitigado mediante la norma de mantener silencio durante las tareas y registrar literalmente lo verbalizado.
- **Ámbito:** se han evaluado los flujos principales (registro, datos, dashboard, IA, exportación). Funciones secundarias como recuperación de contraseña, cambio de moneda o eliminación de períodos no han sido objeto de prueba directa con usuario.

Estas limitaciones se documentan honestamente para que las conclusiones se interpreten en su contexto. Estudios posteriores deberían ampliar la muestra a 5 participantes con perfiles diversos (incluyendo propietarios reales de negocios pequeños).

---

## 5. Anexo metodológico

### 5.1 Referencias

- Nielsen, J. (1994). *10 Usability Heuristics for User Interface Design.* Nielsen Norman Group.
- Nielsen Norman Group (2020). *10 Usability Heuristics for User Interface Design* (revised edition).
- Nielsen, J. (2000). *Why You Only Need to Test with 5 Users.* NN/g.
- Brooke, J. (1996). *SUS: A "quick and dirty" usability scale.* Usability Evaluation in Industry.

### 5.2 Escala de severidad de Nielsen

| Nivel | Significado |
|---|---|
| 0 | No es un problema de usabilidad |
| 1 | Cosmético — solo si hay tiempo extra |
| 2 | Menor — baja prioridad de corrección |
| 3 | Mayor — alta prioridad de corrección |
| 4 | Catástrofe — corregir antes de lanzar |

### 5.3 Protocolo del test con usuario

1. **Preparación:** dispositivo personal de la participante con la app cargada vía Expo Go y sin sesión iniciada.
2. **Instrucciones iniciales:** se le explicó que **falla la app, no ella**, y que debía pensar en voz alta.
3. **Tareas:** entregadas por escrito, sin pistas. El observador permaneció en silencio.
4. **Neutralización de preguntas:** ante cualquier consulta el observador respondía *"¿qué crees tú que hay que hacer?"* para no influir.
5. **Registro:** cronometraje por tarea y registro de las observaciones por tarea (encontró/no encontró, confundió/no confundió, etc.).
6. **Cuestionario:** 5 preguntas abiertas + escala SUS simplificada de 5 ítems.

---

<div align="center">

*Pruebas de usabilidad realizadas como parte del Trabajo de Fin de Grado*  
*Desarrollo de Aplicaciones Multiplataforma · IES Rafael Alberti · Curso 2025-2026*

</div>
