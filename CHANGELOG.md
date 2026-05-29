# Changelog

Todas las novedades destacables de BizKPI se documentan en este fichero.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-05-28

Primera versión pública de BizKPI, entregada como Trabajo de Fin de Grado.

### Added

#### App móvil

- **Dashboard** con 4 KPIs principales (ingresos, clientes, beneficio neto, ventas) y comparativa de tendencia respecto a la semana anterior.
- **3 gráficos** integrados: línea de ingresos (6 semanas), barras de actividad semanal y donut de distribución por categoría.
- **Registro semanal** guiado con 4 campos obligatorios y 4 opcionales que enriquecen el análisis de IA.
- **Recomendaciones con IA** vía GPT-4o-mini con estructura JSON: resumen ejecutivo, hasta 3 highlights y 4 acciones priorizadas, más una previsión para el siguiente período.
- **Historial** de períodos con vista lista + detalle por semana, eliminación con confirmación y refresh manual.
- **Exportación CSV** del historial completo o por rango de fechas, con KPIs calculados.
- **Perfil y preferencias**: cambio de nombre del negocio, tema (claro/oscuro/sistema), idioma (6), moneda (EUR/USD/GBP/JPY), contraseña.
- **Recuperación de contraseña** con código OTP de 8 dígitos enviado por email — pantalla dedicada con 8 casillas estilo Apple Pay.
- **Multiidioma** completo en español, inglés, francés, portugués, italiano y alemán (incluidas las respuestas de la IA).

#### Backend

- API REST con **FastAPI 0.115** y Pydantic v2 para validación tipada.
- 5 routers (`/users`, `/periods`, `/business-data`, `/kpis`, `/recommendations`) protegidos por JWT.
- Servicio `kpi_service` (cálculo puro de KPIs) y `ai_service` (orquestación asíncrona con OpenRouter).
- Desplegado en Render con auto-deploy desde main.

#### Base de datos

- **Supabase PostgreSQL** con 5 tablas: `user_profiles`, `periods`, `business_data`, `kpis`, `ai_recommendations`.
- Constraints `CHECK`, `UNIQUE`, `NOT NULL` y `ON DELETE CASCADE` en todas las relaciones.
- Trigger `handle_new_user` para crear automáticamente el perfil al registrar un usuario.

#### Documentación

- README técnico con 13 secciones y diagramas Mermaid (arquitectura general, grafo de navegación, ER de la BD, clases del backend).
- `MANUAL_USUARIO.md` con 12 secciones y 9 capturas de pantalla reales (iPad).
- `PRUEBAS_USABILIDAD.md` con metodología mixta: test con usuario potencial + evaluación heurística de Nielsen.
- Landing page pública desplegada en GitHub Pages.

### Security

- Autenticación **JWT ES256** con verificación por clave pública (JWK) en cada petición.
- **Row Level Security** activo en las 5 tablas con políticas `auth.uid() = user_id`.
- Validación en **triple capa**: cliente (regex/length) → Pydantic (`field_validator`) → CHECK constraints SQL.
- Hash **bcrypt** para contraseñas (gestionado por Supabase Auth).
- **HTTPS** forzado en backend (Render) y BD (Supabase).
- Service key y JWT secret **solo en backend**, nunca en cliente.
- `.env` ignorado por Git.
- **Swagger UI** deshabilitado en producción.

### Tests

- **115 tests unitarios** en total:
  - 73 en frontend (Jest): formateadores y helpers de período.
  - 42 en backend (pytest): servicios de KPIs e IA.

[1.0.0]: https://github.com/mtamrod/BizKPI/releases/tag/v1.0.0
