from fastapi import APIRouter, HTTPException, status

from app.core.supabase_client import get_supabase
from app.dependencies.auth import CurrentUser
from app.models.business_data import BusinessDataCreate, BusinessDataRead, BusinessDataUpdate
from app.services import kpi_service

router = APIRouter(prefix="/business-data", tags=["business-data"])


def _fetch_period(db, period_id: str, user_id: str):
    result = (
        db.table("periods")
        .select("id")
        .eq("id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período no encontrado o no pertenece al usuario.",
        )


@router.get("/", response_model=list[BusinessDataRead])
def list_business_data(user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("business_data")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/", response_model=BusinessDataRead, status_code=status.HTTP_201_CREATED)
def create_business_data(body: BusinessDataCreate, user_id: CurrentUser):
    db = get_supabase()
    _fetch_period(db, body.period_id, user_id)

    payload = body.model_dump(exclude_none=True)
    # Decimal → float for JSON serialisation
    for k, v in payload.items():
        from decimal import Decimal
        if isinstance(v, Decimal):
            payload[k] = float(v)
    payload["user_id"] = user_id

    result = db.table("business_data").insert(payload).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el registro.",
        )
    row = result.data[0]

    # Auto-calculate KPIs right after persisting data
    try:
        kpi_service.calculate_and_store(db, row["period_id"], user_id, row)
    except Exception:
        pass  # KPI calculation is best-effort; data is already saved

    return row


@router.get("/{entry_id}", response_model=BusinessDataRead)
def get_business_data(entry_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("business_data")
        .select("*")
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado.")
    return result.data


@router.patch("/{entry_id}", response_model=BusinessDataRead)
def update_business_data(entry_id: str, body: BusinessDataUpdate, user_id: CurrentUser):
    db = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No se enviaron campos para actualizar.",
        )
    from decimal import Decimal
    for k, v in updates.items():
        if isinstance(v, Decimal):
            updates[k] = float(v)

    result = (
        db.table("business_data")
        .update(updates)
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado.")
    row = result.data[0]

    # Recalculate KPIs after update
    try:
        kpi_service.calculate_and_store(db, row["period_id"], user_id, row)
    except Exception:
        pass

    return row


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_data(entry_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("business_data")
        .delete()
        .eq("id", entry_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado.")
