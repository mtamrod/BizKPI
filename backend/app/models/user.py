from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_name: str
    business_sector: str | None = None
    created_at: datetime | None = None


class UserProfileUpdate(BaseModel):
    business_name: str | None = None
    business_sector: str | None = None
