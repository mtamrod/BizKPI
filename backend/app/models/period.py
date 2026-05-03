from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator


class PeriodType(str, Enum):
    day = "day"
    week = "week"
    month = "month"
    quarter = "quarter"
    year = "year"


class PeriodCreate(BaseModel):
    period_type: PeriodType
    start_date: date
    end_date: date

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date debe ser >= start_date")
        return v


class PeriodRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    period_type: PeriodType
    start_date: date
    end_date: date
    created_at: datetime | None = None
