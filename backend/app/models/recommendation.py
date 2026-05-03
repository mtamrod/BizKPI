from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class RecommendationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    period_id: str
    user_id: str
    recommendations: dict[str, Any]
    model_used: str
    generated_at: datetime | None = None
