# Pruebas de usabilidad — BizKPI

Esta carpeta contiene los materiales para evaluar la usabilidad de BizKPI siguiendo una **metodología mixta**:

| Método | Documento | Quién lo ejecuta |
|---|---|---|
| Test con usuario potencial | `guion_participante.md` + `plantilla_observacion.md` | Participante externa (sin conocimientos previos de la app) |
| Evaluación heurística de Nielsen | `evaluacion_heuristica.md` | Desarrollador (autoevaluación experta) |

La combinación de ambos métodos cubre dos perspectivas complementarias: la del **usuario real** descubriendo la app por primera vez, y la del **diseñador** comprobando el cumplimiento de principios universales de usabilidad.

---

## Cómo ejecutar el test con usuario

### Preparación (15 min antes)

1. Instala la app en el dispositivo de la participante (Expo Go con QR del PC, o APK).
2. Asegúrate de que **NO** hay sesión iniciada (la pantalla de login debe aparecer al abrir).
3. Ten preparado:
   - Cronómetro (móvil)
   - Papel + boli o un dispositivo con `plantilla_observacion.md` abierto
   - Vaso de agua, ambiente tranquilo, sin distracciones

### Durante la sesión (~45 min)

1. **NO le enseñes la app de antemano.**
2. Lee en voz alta o entrégale impreso el `guion_participante.md`.
3. Durante cada tarea, **mantén silencio** salvo si te pregunta. Si te pregunta, responde solo: *"¿Qué crees tú que hay que hacer?"* — esto fuerza a la participante a verbalizar su razonamiento sin que tú la guíes.
4. Cronometra cada tarea y rellena `plantilla_observacion.md` en tiempo real.
5. Al terminar las tareas, hazle las preguntas finales de la plantilla.

### Después (15 min)

1. Agradécele su tiempo.
2. Repasa tus notas mientras la sesión está fresca.
3. Marca como completado este checklist.

---

## Cómo ejecutar la evaluación heurística

1. Abre `evaluacion_heuristica.md`.
2. Repasa las 10 heurísticas una a una con la app delante (en emulador, dispositivo, o capturas del manual).
3. Para cada heurística rellena:
   - Si la app la cumple total / parcial / nada
   - Ejemplos concretos donde se cumple o se incumple
   - Severidad de los incumplimientos (escala Nielsen 0-4)

Tiempo total: ~1.5 h.

---

## Después de completar ambos métodos

Cuando tengas las dos partes rellenas, los resultados se compilarán en `PRUEBAS_USABILIDAD.md` en la raíz del repositorio para entregarlos como parte del TFG.
