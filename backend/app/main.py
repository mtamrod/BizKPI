from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import business_data, kpis, periods, recommendations, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up OpenAI singleton (PostgREST client is lazy-safe)
    from app.core.openai_client import get_openai
    get_openai()
    yield
    # Shutdown: nothing to close (clients are stateless HTTP)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# In production, replace "*" with your Expo / web frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(users.router,          prefix=API_PREFIX)
app.include_router(periods.router,        prefix=API_PREFIX)
app.include_router(business_data.router,  prefix=API_PREFIX)
app.include_router(kpis.router,           prefix=API_PREFIX)
app.include_router(recommendations.router, prefix=API_PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": settings.app_version, "env": settings.app_env}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
