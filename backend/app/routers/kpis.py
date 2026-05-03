from fastapi import APIRouter, HTTPException, status

from app.core.supabase_client import get_supabase
from app.dependencies.auth import CurrentUser
from app.models.kpi import KpiRead
from app.services import kpi_service

router = APIRouter(prefix="/kpis", tags=["kpis"])


@router.get("/", response_model=list[KpiRead])
def list_kpis(user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("kpis")
        .select("*")
        .eq("user_id", user_id)
        .order("calculated_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{period_id}", response_model=KpiRead)
def get_kpis_for_period(period_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("kpis")
        .select("*")
        .eq("period_id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="KPIs no encontrados para este período.",
        )
    return result.data


@router.post("/{period_id}/recalculate", response_model=KpiRead)
def recalculate_kpis(period_id: str, user_id: CurrentUser):
    """Force-recalculates KPIs from the existing business_data for this period."""
    db = get_supabase()

    bdata_result = (
        db.table("business_data")
        .select("*")
        .eq("period_id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not bdata_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe business_data para este período.",
        )

    row = kpi_service.calculate_and_store(db, period_id, user_id, bdata_result.data)
    return row
