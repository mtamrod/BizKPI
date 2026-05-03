from fastapi import APIRouter, HTTPException, status

from app.core.supabase_client import get_supabase
from app.dependencies.auth import CurrentUser
from app.models.period import PeriodCreate, PeriodRead

router = APIRouter(prefix="/periods", tags=["periods"])


@router.get("/", response_model=list[PeriodRead])
def list_periods(user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("periods")
        .select("*")
        .eq("user_id", user_id)
        .order("start_date", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/", response_model=PeriodRead, status_code=status.HTTP_201_CREATED)
def create_period(body: PeriodCreate, user_id: CurrentUser):
    db = get_supabase()
    payload = {
        "user_id": user_id,
        "period_type": body.period_type.value,
        "start_date": body.start_date.isoformat(),
        "end_date": body.end_date.isoformat(),
    }
    result = db.table("periods").insert(payload).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el período.",
        )
    return result.data[0]


@router.get("/{period_id}", response_model=PeriodRead)
def get_period(period_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("periods")
        .select("*")
        .eq("id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Período no encontrado.")
    return result.data


@router.delete("/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_period(period_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("periods")
        .delete()
        .eq("id", period_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Período no encontrado.")
