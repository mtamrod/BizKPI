from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator


class BusinessDataCreate(BaseModel):
    period_id: str

    # Required
    total_revenue: Decimal
    total_expenses: Decimal
    num_sales: int
    num_customers: int

    # Optional — enrich AI analysis
    cost_of_goods_sold: Decimal | None = None
    marketing_expenses: Decimal | None = None
    refunds: Decimal | None = None
    new_customers: int | None = None
    returning_customers: int | None = None
    top_product_name: str | None = None
    top_product_revenue: Decimal | None = None
    notes: str | None = None

    @field_validator("total_revenue", "total_expenses")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El valor no puede ser negativo")
        return v

    @field_validator("num_sales", "num_customers")
    @classmethod
    def positive_int(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("El valor debe ser mayor que 0")
        return v


class BusinessDataUpdate(BaseModel):
    total_revenue: Decimal | None = None
    total_expenses: Decimal | None = None
    num_sales: int | None = None
    num_customers: int | None = None
    cost_of_goods_sold: Decimal | None = None
    marketing_expenses: Decimal | None = None
    refunds: Decimal | None = None
    new_customers: int | None = None
    returning_customers: int | None = None
    top_product_name: str | None = None
    top_product_revenue: Decimal | None = None
    notes: str | None = None


class BusinessDataRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    period_id: str
    user_id: str
    total_revenue: Decimal
    total_expenses: Decimal
    num_sales: int
    num_customers: int
    cost_of_goods_sold: Decimal | None = None
    marketing_expenses: Decimal | None = None
    refunds: Decimal | None = None
    new_customers: int | None = None
    returning_customers: int | None = None
    top_product_name: str | None = None
    top_product_revenue: Decimal | None = None
    notes: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
