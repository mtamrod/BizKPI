# Evaluación heurística — BizKPI

> Autoevaluación experta siguiendo las **10 heurísticas de usabilidad de Jakob Nielsen** (1994, actualizadas 2020 por NN/g). Cada heurística se valora con el código completo a la vista, sobre la versión 1.0.0 de la app.

---

## Metodología

Para cada una de las 10 heurísticas:

1. Se enuncia el principio.
2. Se identifica **cómo se aplica a BizKPI** con ejemplos concretos del código y de la interfaz.
3. Se evalúa el nivel de cumplimiento:
   - ✅ **Cumple** — implementado correctamente.
   - ⚠️ **Cumple parcialmente** — implementado con limitaciones o lagunas.
   - ❌ **No cumple** — falta o está mal implementado.
4. Se enumeran los **problemas detectados**, con la severidad en escala de Nielsen:

| Nivel | Significado |
|---|---|
| **0** | No es un problema de usabilidad |
| **1** | Cosmético — solo si hay tiempo extra |
| **2** | Menor — baja prioridad de corrección |
| **3** | Mayor — alta prioridad de corrección |
| **4** | Catástrofe — hay que corregirlo antes de lanzar |

---

## H1 · Visibilidad del estado del sistema

> *"El sistema debe mantener informados a los usuarios de lo que está ocurriendo, mediante retroalimentación apropiada en un tiempo razonable."*

### Aplicación a BizKPI

- ¿Se indica cuándo se está cargando una pantalla?
- ¿Se notifica al guardar un registro?
- ¿Se informa durante la generación de IA (10-20 segundos)?
- ¿Se ve el estado de autenticación en cada pantalla?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- `ActivityIndicator` en pantallas de carga (Dashboard, Recomendaciones).
- Mensaje verde de confirmación al guardar datos (`data.tsx:411`).
- Estado `loading={status === 'loading'}` en botones.
- Texto "Generando recomendación..." durante la espera de la IA.
- *Pull-to-refresh* en Dashboard, Historial y Datos.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |
| 2 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H2 · Conexión entre el sistema y el mundo real

> *"El sistema debe hablar el idioma del usuario, con palabras, frases y conceptos familiares, en lugar de términos técnicos."*

### Aplicación a BizKPI

- ¿Los términos (ingresos, gastos, beneficio, margen) son comprensibles para alguien sin formación contable?
- ¿Las acciones del usuario coinciden con su mental model (semana = lunes a domingo)?
- ¿Las recomendaciones de IA usan lenguaje natural y cercano?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Glosario de KPIs en el manual de usuario.
- *Prompt* de la IA instruye explícitamente: *"Avoid corporate language: no 'optimise synergies', 'scale the business model'..."* (`ai_service.py:30-31`).
- Iconos universales (cash, people, cart) acompañando a cada KPI.
- Selector de semana usa rangos de fechas legibles ("S22 · 25 - 31 mayo").

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H3 · Control y libertad del usuario

> *"Los usuarios suelen elegir funciones del sistema por error y necesitan una salida claramente marcada para abandonar el estado no deseado sin tener que pasar por un diálogo extenso."*

### Aplicación a BizKPI

- ¿El usuario puede cancelar una acción a medio hacer?
- ¿Puede deshacer cambios (editar / eliminar)?
- ¿Hay confirmación antes de operaciones destructivas?
- ¿El botón "Atrás" funciona como se espera?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Confirmación antes de **reemplazar** una semana ya registrada.
- Confirmación antes de **eliminar** una semana o una recomendación.
- Botón **"Cancelar"** en todos los modales con acción destructiva.
- *Swipe back* nativo en iOS y botón atrás en Android.
- Logout vuelve al login sin pérdida de datos en servidor.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H4 · Consistencia y estándares

> *"Los usuarios no deberían tener que preguntarse si diferentes palabras, situaciones o acciones significan lo mismo. Sigue las convenciones de la plataforma."*

### Aplicación a BizKPI

- ¿Los iconos significan lo mismo en toda la app?
- ¿Los colores tienen significado consistente (verde = positivo, rojo = negativo)?
- ¿Se siguen las convenciones de iOS / Android?
- ¿Los nombres de los KPIs son uniformes en toda la app?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Iconos de Ionicons consistentes (filled cuando activo, outline cuando inactivo) — patrón HIG.
- Paleta de colores con tokens centralizados en `theme/colors.ts`.
- Verde = beneficio positivo / tendencia al alza · Rojo = pérdidas / tendencia a la baja, consistente en Dashboard y Historial.
- 5 pestañas inferiores siguiendo iOS HIG y Material Design (3-5 destinos máximo).
- Todas las pantallas usan el mismo componente `GlassCard` para tarjetas.
- Todos los formularios usan el mismo componente `Input`.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H5 · Prevención de errores

> *"Mejor que un buen mensaje de error es un diseño cuidadoso que prevenga la aparición de errores."*

### Aplicación a BizKPI

- ¿Se validan los formularios antes de enviarlos?
- ¿Se confirma antes de operaciones irreversibles?
- ¿Los campos numéricos usan teclado numérico?
- ¿Se previene meter datos en períodos inválidos?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Validación triple: cliente (regex email, length password) → API (Pydantic) → BD (CHECK constraints).
- `keyboardType="decimal-pad"` en campos de dinero.
- `keyboardType="number-pad"` en ventas y clientes.
- Email auto-capitalize off + autoCorrect off en password.
- Selector visual de semana en lugar de input libre de fecha.
- Confirmación antes de reemplazar semana existente.
- Imposible elegir el mismo día como "mejor" y "peor" (`excludeDate`).

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H6 · Reconocer mejor que recordar

> *"Minimiza la carga de memoria del usuario haciendo visibles los objetos, acciones y opciones. El usuario no debería tener que recordar información de una parte del diálogo a otra."*

### Aplicación a BizKPI

- ¿Los datos importantes están visibles cuando se necesitan?
- ¿El usuario tiene que memorizar valores entre pantallas?
- ¿Los iconos llevan etiqueta de texto?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Resumen de la última entrada visible **encima del formulario** de Datos, evitando que el usuario tenga que recordar el último valor.
- Cada pestaña del tab bar lleva **icono + texto**.
- KPIs del dashboard siempre visibles con tendencia respecto a la semana anterior.
- Recomendaciones IA almacenadas (no se regeneran, persisten para consulta posterior).

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H7 · Flexibilidad y eficiencia de uso

> *"Los aceleradores —invisibles para usuarios novatos— pueden agilizar la interacción del experto. Permite que los usuarios personalicen acciones frecuentes."*

### Aplicación a BizKPI

- ¿Hay atajos para usuarios habituales?
- ¿Se permite personalización (tema, idioma, moneda)?
- ¿Hay gestos nativos (swipe, pull-to-refresh)?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- *Pull-to-refresh* en Dashboard, Historial y Datos.
- Personalización de **tema** (claro/oscuro/sistema).
- Personalización de **idioma** (6 idiomas).
- Personalización de **moneda** (EUR/USD/GBP/JPY).
- Switch "Recordarme" en login (acelerador para usuarios habituales).
- Selector visual de semana con flechas (más rápido que escribir fechas).

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H8 · Diseño estético y minimalista

> *"Los diálogos no deben contener información irrelevante o que se necesite raramente. Cada unidad extra de información compite con las relevantes."*

### Aplicación a BizKPI

- ¿Las pantallas muestran solo lo necesario?
- ¿Hay jerarquía visual clara?
- ¿Los espacios y tipografías están bien dimensionados?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Dashboard muestra **4 KPIs principales** + 3 gráficos sin saturación.
- Formulario de Datos separa visualmente campos **obligatorios** y **opcionales** con badge.
- Las recomendaciones IA limitan a 3 highlights y 4 acciones (no abruma).
- Paleta de colores limitada (primary, accent, error, neutrals).
- Tema oscuro por defecto con tipografía sans-serif moderna.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H9 · Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de errores

> *"Los mensajes de error deben expresarse en lenguaje sencillo (sin códigos), indicar el problema con precisión y sugerir una solución constructiva."*

### Aplicación a BizKPI

- ¿Los mensajes de error son comprensibles?
- ¿Sugieren cómo solucionar el problema?
- ¿Se distingue entre error del usuario y error del sistema?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- Mensajes de error específicos por campo en validación de formularios.
- Pantalla de "Sin conexión" con icono y botón de reintentar.
- Mensaje claro al fallar la generación de IA.
- Recuperación de contraseña vía email con mensaje confirmatorio.
- Validación inline en el momento de teclear, no al enviar.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## H10 · Ayuda y documentación

> *"Aunque es mejor un sistema que pueda usarse sin documentación, puede ser necesaria. Tal información debe ser fácil de buscar, centrada en la tarea del usuario, enumerar los pasos concretos y no ser demasiado extensa."*

### Aplicación a BizKPI

- ¿Existe manual de usuario?
- ¿Hay ayuda contextual dentro de la app?
- ¿La documentación cubre los flujos más comunes?

### Evaluación

**Nivel de cumplimiento:** ☐ ✅ · ☐ ⚠️ · ☐ ❌

**Evidencias positivas:**
- **`MANUAL_USUARIO.md`** completo con 12 secciones, 9 capturas, FAQ y troubleshooting.
- **README** técnico para desarrolladores.
- Diagramas de arquitectura (general, navegación, ER, clases) en el README.
- Glosario de KPIs en el manual con explicaciones llanas.

**Problemas detectados:**

| # | Descripción | Severidad |
|---|---|---|
| 1 | | ☐0 ☐1 ☐2 ☐3 ☐4 |

**Recomendaciones de mejora:**

```


```

---

## Resumen de la evaluación

### Tabla de cumplimiento por heurística

| # | Heurística | Cumple | Problemas detectados | Severidad máx. |
|---|---|---|---|---|
| H1 | Visibilidad del estado | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H2 | Conexión con el mundo real | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H3 | Control y libertad | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H4 | Consistencia y estándares | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H5 | Prevención de errores | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H6 | Reconocer mejor que recordar | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H7 | Flexibilidad y eficiencia | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H8 | Diseño minimalista | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H9 | Mensajes de error | ☐✅ ☐⚠️ ☐❌ | __ | __ |
| H10 | Ayuda y documentación | ☐✅ ☐⚠️ ☐❌ | __ | __ |

### Top problemas (por severidad)

Listar aquí los problemas detectados ordenados por severidad descendente:

| # | Heurística | Problema | Severidad | Solución propuesta |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

### Conclusión global

```
[Resumen en 4-5 frases: ¿qué heurísticas están bien cubiertas?
 ¿Cuáles son las áreas más débiles?
 ¿Qué prioridades de mejora se identifican?]


```

### Acciones derivadas para la próxima versión

| # | Acción | Heurística vinculada | Prioridad |
|---|---|---|---|
| 1 | | | ☐ Alta · ☐ Media · ☐ Baja |
| 2 | | | ☐ Alta · ☐ Media · ☐ Baja |
| 3 | | | ☐ Alta · ☐ Media · ☐ Baja |
