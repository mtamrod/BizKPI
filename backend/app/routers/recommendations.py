from fastapi import APIRouter, HTTPException, status

from app.core.openai_client import get_openai
from app.core.supabase_client import get_supabase
from app.dependencies.auth import CurrentUser
from app.models.recommendation import RecommendationRead
from app.services import ai_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/", response_model=list[RecommendationRead])
def list_recommendations(user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("ai_recommendations")
        .select("*")
        .eq("user_id", user_id)
        .order("generated_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{period_id}", response_model=RecommendationRead)
def get_recommendation(period_id: str, user_id: CurrentUser):
    db = get_supabase()
    result = (
        db.table("ai_recommendations")
        .select("*")
        .eq("period_id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recomendaciones no encontradas para este período. Genera una nueva con POST.",
        )
    return result.data


@router.delete("/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recommendation(period_id: str, user_id: CurrentUser):
    """Deletes the stored recommendation for a period (e.g. when its data is replaced)."""
    db = get_supabase()
    db.table("ai_recommendations").delete().eq("period_id", period_id).eq("user_id", user_id).execute()


@router.post("/{period_id}/generate", response_model=RecommendationRead, status_code=status.HTTP_201_CREATED)
async def generate_recommendation(period_id: str, user_id: CurrentUser):
    """
    Generates (or regenerates) AI recommendations for the given period.
    Requires that both business_data and kpis exist for the period.
    """
    db = get_supabase()
    openai_client = get_openai()

    # Fetch KPIs
    kpi_result = (
        db.table("kpis")
        .select("*")
        .eq("period_id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not kpi_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calcula primero los KPIs para este período.",
        )

    # Fetch business data
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

    # Fetch period (for dates and period_type — used in prompt for seasonality context)
    period_result = (
        db.table("periods")
        .select("*")
        .eq("id", period_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    period = period_result.data  # may be None

    # Optionally enrich with user profile (name + sector)
    profile_result = (
        db.table("user_profiles")
        .select("business_name, business_sector")
        .eq("id", user_id)
        .single()
        .execute()
    )
    profile = profile_result.data  # may be None

    row = await ai_service.generate_and_store(
        openai=openai_client,
        db=db,
        period_id=period_id,
        user_id=user_id,
        kpi=kpi_result.data,
        bdata=bdata_result.data,
        profile=profile,
        period=period,
    )
    return row
