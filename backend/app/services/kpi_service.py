"""
Calculates KPIs from a business_data record and persists them to the kpis table.
All math is pure Python — no external calls needed.
"""

from decimal import Decimal, ROUND_HALF_UP

from postgrest import SyncPostgrestClient as Client


def _pct(numerator: Decimal, denominator: Decimal) -> Decimal:
    """Returns percentage with 4 decimal places, or 0 if denominator is 0."""
    if denominator == 0:
        return Decimal("0.0000")
    return (numerator / denominator * 100).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_and_store(db: Client, period_id: str, user_id: str, data: dict) -> dict:
    """
    Receives a business_data dict (already persisted), calculates all KPIs,
    upserts into the kpis table, and returns the resulting kpi row.
    """
    revenue = Decimal(str(data["total_revenue"]))
    expenses = Decimal(str(data["total_expenses"]))
    num_sales = int(data["num_sales"])
    num_customers = int(data["num_customers"])

    net_profit = _round2(revenue - expenses)
    profit_margin = _pct(net_profit, revenue)
    avg_ticket = _round2(revenue / num_sales) if num_sales else Decimal("0.00")

    # Gross margin — only if cost_of_goods_sold is provided
    gross_margin = None
    cogs = data.get("cost_of_goods_sold")
    if cogs is not None:
        gross_margin = _pct(revenue - Decimal(str(cogs)), revenue)

    # Customer acquisition rate (new customers as % of total)
    customer_acquisition_rate = None
    new_c = data.get("new_customers")
    if new_c is not None:
        customer_acquisition_rate = _pct(Decimal(str(new_c)), Decimal(str(num_customers)))

    # Returning customer rate
    returning_customer_rate = None
    ret_c = data.get("returning_customers")
    if ret_c is not None:
        returning_customer_rate = _pct(Decimal(str(ret_c)), Decimal(str(num_customers)))

    kpi_payload: dict = {
        "period_id": period_id,
        "user_id": user_id,
        "revenue": float(revenue),
        "expenses": float(expenses),
        "net_profit": float(net_profit),
        "profit_margin": float(profit_margin),
        "num_sales": num_sales,
        "num_customers": num_customers,
        "avg_ticket": float(avg_ticket),
    }

    if gross_margin is not None:
        kpi_payload["gross_margin"] = float(gross_margin)
    if customer_acquisition_rate is not None:
        kpi_payload["customer_acquisition_rate"] = float(customer_acquisition_rate)
    if returning_customer_rate is not None:
        kpi_payload["returning_customer_rate"] = float(returning_customer_rate)

    response = (
        db.table("kpis")
        .upsert(kpi_payload, on_conflict="period_id")
        .execute()
    )

    return response.data[0]
