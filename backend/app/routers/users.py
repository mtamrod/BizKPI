from fastapi import APIRouter, HTTPException, status

from app.core.supabase_client import get_supabase
from app.dependencies.auth import CurrentUser
from app.models.user import UserProfileRead, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfileRead)
def get_my_profile(user_id: CurrentUser):
    db = get_supabase()
    result = db.table("user_profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado.")
    return result.data


@router.patch("/me", response_model=UserProfileRead)
def update_my_profile(body: UserProfileUpdate, user_id: CurrentUser):
    db = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No se enviaron campos para actualizar.",
        )
    result = (
        db.table("user_profiles")
        .update(updates)
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado.")
    return result.data[0]
