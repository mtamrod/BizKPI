# BizTrack — Plataforma de Business Intelligence para PYMEs

Aplicación móvil multiplataforma (iOS / Android) que permite a pequeños y medianos negocios registrar sus datos operativos semanales, visualizar KPIs en tiempo real y obtener recomendaciones de mejora generadas por inteligencia artificial.

Desarrollado como Trabajo de Fin de Grado (TFG).

---

## Características principales

- **Dashboard de KPIs** — ingresos, clientes, margen neto y ventas con tendencias comparadas a la semana anterior
- **Registro semanal** — formulario guiado para capturar datos del período (ingresos, gastos, ventas, clientes, producto estrella)
- **Recomendaciones IA** — análisis generado por LLM con resumen, puntos clave, acciones concretas y previsión de la próxima semana
- **Historial navegable** — listado de todas las semanas registradas con detalle de métricas y gráfico de distribución
- **Exportación CSV** — exportación del historial con filtro de rango de fechas
- **Multiidioma** — español, inglés, francés, portugués, italiano y alemán
- **Multidivisa** — EUR, USD, GBP, JPY
- **Temas claro / oscuro**

---

## Stack tecnológico

### Frontend (móvil)
| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.76 | Base de la app |
| Expo SDK | 54 | Toolchain y APIs nativas |
| expo-router | 4 | Navegación (tabs + stack) |
| TypeScript | 5 | Tipado estático |
| react-i18next | — | Internacionalización |

### Backend (API REST)
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | — | Framework HTTP |
| Supabase | — | Base de datos (PostgreSQL) + autenticación |
| OpenRouter | — | Acceso a modelos LLM (vía API OpenAI-compatible) |

---

## Arquitectura de navegación

```
app/
├── (auth)/          ← Stack de autenticación (login / registro)
└── (tabs)/          ← Tabs principales (autenticadas)
    ├── index.tsx        → Dashboard
    ├── data.tsx         → Añadir / editar datos semanales
    ├── recommendations.tsx → Recomendaciones IA por semana
    ├── profile.tsx      → Perfil y preferencias
    └── history/         ← Stack anidado
        ├── _layout.tsx      → Stack navigator del historial
        ├── index.tsx        → Lista de semanas
        └── [id].tsx         → Detalle de una semana
```

---

## Estructura del proyecto

```
TFG-1.0/
├── app/                    # Pantallas (expo-router)
├── src/
│   ├── components/
│   │   ├── charts/         # LineChart, BarChart, DonutChart
│   │   ├── layout/         # ScreenWrapper, Header, AppBackground
│   │   └── ui/             # Button, GlassCard, Input, Badge, RecoBody…
│   ├── hooks/              # useKPIs, useDataEntries, useRecommendations, useHistory
│   ├── lib/                # apiClient (wrapper Axios con auth)
│   ├── mocks/              # Datos semilla para desarrollo
│   ├── services/           # authService, kpiService, recommendationService…
│   ├── store/              # AuthContext
│   ├── theme/              # ThemeContext, colores, tipografía
│   ├── types/              # Tipos globales (DataEntry, KpiMetric, AsyncStatus…)
│   ├── utils/              # formatters.ts, periodHelpers.ts, storage.ts
│   └── __tests__/          # Tests unitarios Jest
└── backend/
    ├── app/
    │   ├── routers/        # Endpoints FastAPI
    │   └── services/       # kpi_service, ai_service, auth_service
    └── tests/              # Tests unitarios pytest
```

---

## Puesta en marcha

### Requisitos previos
- Node.js 18+
- Python 3.11+
- Expo Go en el dispositivo móvil (o emulador iOS/Android)
- Cuenta Supabase con las tablas creadas (ver `backend/supabase/`)

### Variables de entorno

Crear `.env` en la raíz del proyecto (nunca se sube al repositorio):

```env
EXPO_PUBLIC_API_URL=http://<IP_LOCAL>:8000
```

Crear `.env` en `backend/`:

```env
SUPABASE_URL=https://<proyecto>.supabase.co
SUPABASE_KEY=<service_role_key>
OPENROUTER_API_KEY=sk-or-...
```

### Frontend

```bash
# Instalar dependencias
npm install

# Arrancar el servidor de desarrollo
npx expo start

# Escanear el QR con Expo Go o abrir en emulador
```

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Arrancar el servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Tests

### Frontend (Jest)

```bash
# Ejecutar todos los tests unitarios
npx jest

# Con cobertura
npx jest --coverage
```

Los tests cubren `src/utils/formatters.ts` (33 tests) y `src/utils/periodHelpers.ts` (40 tests).

### Backend (pytest)

```bash
cd backend
pytest -v
```

Los tests cubren `app/services/kpi_service.py` (16 tests) y `app/services/ai_service.py` (26 tests).

---

## Flujo de datos

```
Usuario registra datos semanales
        ↓
POST /business-data/  →  Supabase (business_data)
        ↓
POST /kpis/calculate/ →  kpi_service calcula y guarda KPIs
        ↓
[opcional] POST /recommendations/generate/
        ↓
ai_service construye prompt con KPIs + datos del período
        ↓
OpenRouter (LLM) devuelve JSON estructurado
        ↓
Recomendación guardada en Supabase (recommendations)
        ↓
App muestra: resumen · puntos clave · acciones · previsión
```

---

## Comandos útiles

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Lint
npx expo lint

# Limpiar caché Expo
npx expo start --clear
```
