from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class KpiRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    period_id: str
    user_id: str

    revenue: Decimal
    expenses: Decimal
    net_profit: Decimal
    profit_margin: Decimal           # percentage, e.g. 23.45
    num_sales: int
    num_customers: int
    avg_ticket: Decimal
    gross_margin: Decimal | None = None
    customer_acquisition_rate: Decimal | None = None
    returning_customer_rate: Decimal | None = None

    calculated_at: datetime | None = None
