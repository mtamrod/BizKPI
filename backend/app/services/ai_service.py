"""
Generates business recommendations using GPT-4o mini via OpenRouter.
Input: kpi row + business_data row + period row + optional user profile context.
Output: structured JSON stored in ai_recommendations.
"""

import json

from openai import AsyncOpenAI
from postgrest import SyncPostgrestClient as Client


_MODEL = "openai/gpt-4o-mini"

_LANGUAGE_NAMES: dict[str, str] = {
    "es": "Spanish",
    "en": "English",
    "fr": "French",
    "pt": "Portuguese",
    "it": "Italian",
    "de": "German",
}

_SYSTEM_PROMPT_BASE = """You are a trusted advisor for small service businesses: bars, restaurants, hair salons, workshops, local shops and similar.

Your job is to analyse business period data and give useful, concrete, actionable recommendations for a single owner or a small team with no large budget.

TONE AND STYLE RULES:
- Speak directly and warmly, as a trusted advisor who knows the business
- Avoid corporate language: no "optimise synergies", "scale the business model" or "implement an omnichannel strategy"
- Recommendations must be concrete actions the owner can do this week or this month, with resources they already have
- If the business sector is available, adapt the entire analysis to the reality of that type of business (hours, seasonality, customer type, typical costs)
- When numbers are good, acknowledge it clearly. When there are problems, be direct but constructive

CONSTRAINTS:
- Maximum 3 highlights and 4 recommendations
- Reply ONLY with a valid JSON object following this exact structure (no markdown, no extra text):
{
  "summary": "2-3 sentence summary of how the business is doing this period",
  "highlights": [
    {"type": "positive" | "negative" | "neutral", "title": "Short title", "description": "1-2 sentence description"}
  ],
  "recommendations": [
    {"priority": "high" | "medium" | "low", "area": "Business area", "action": "Exactly what to do", "rationale": "Why it is worth doing"}
  ],
  "forecast": "What the business can expect next period if it continues like this or applies the suggested changes"
}

LANGUAGE: Write every word of your response in {language}."""


def _get_system_prompt(language: str = "es") -> str:
    lang_name = _LANGUAGE_NAMES.get(language, "Spanish")
    return _SYSTEM_PROMPT_BASE.replace("{language}", lang_name)


def _build_user_prompt(
    kpi: dict,
    bdata: dict,
    profile: dict | None,
    period: dict | None = None,
) -> str:
    # ── Negocio y sector ─────────────────────────────────────────────────────
    sector = profile.get("business_sector") if profile else None
    business_name = profile.get("business_name") if profile else None

    if sector and business_name:
        sector_block = f"Negocio: {business_name} ({sector})"
    elif sector:
        sector_block = f"Tipo de negocio: {sector}"
    elif business_name:
        sector_block = f"Negocio: {business_name}"
    else:
        sector_block = "Tipo de negocio: no especificado"

    # ── Período ───────────────────────────────────────────────────────────────
    start_date = period.get("start_date", "") if period else ""
    end_date = period.get("end_date", "") if period else ""
    period_type = period.get("period_type", "") if period else ""

    if start_date and end_date:
        period_line = f"Período analizado: del {start_date} al {end_date}"
        if period_type:
            period_line += f" ({period_type})"
    else:
        period_line = "Período: no especificado"

    # ── Clientes y ventas ─────────────────────────────────────────────────────
    customer_lines = [
        f"- Número de ventas/transacciones: {kpi.get('num_sales', 0)}",
        f"- Clientes atendidos: {kpi.get('num_customers', 0)}",
        f"- Ticket medio: {kpi.get('avg_ticket', 0):.2f} €",
    ]
    if kpi.get("customer_acquisition_rate") is not None:
        customer_lines.append(
            f"- Clientes nuevos: {kpi['customer_acquisition_rate']:.1f}% del total"
        )
    if kpi.get("returning_customer_rate") is not None:
        customer_lines.append(
            f"- Clientes que repiten: {kpi['returning_customer_rate']:.1f}% del total"
        )

    # ── Datos adicionales opcionales ──────────────────────────────────────────
    optional_lines = []
    revenue = kpi.get("revenue", 0) or 0

    if bdata.get("top_product_name"):
        top_rev = bdata.get("top_product_revenue")
        if top_rev:
            # El usuario proporcionó también el ingreso del producto → mostrarlo con contexto
            pct_line = ""
            if revenue > 0:
                pct_line = f" — {top_rev / revenue * 100:.1f}% de los ingresos totales"
            optional_lines.append(
                f"- Producto/servicio más vendido del período (top seller): {bdata['top_product_name']}"
                f" ({top_rev:.2f} €{pct_line})"
            )
        else:
            # Solo nombre, sin revenue → dejar claro que es el top seller del período
            optional_lines.append(
                f"- Producto/servicio más vendido del período (top seller): {bdata['top_product_name']}"
            )

    if bdata.get("marketing_expenses") is not None:
        mkt = bdata["marketing_expenses"]
        mkt_pct = f" ({mkt / revenue * 100:.1f}% de los ingresos)" if revenue > 0 else ""
        optional_lines.append(f"- Gasto en publicidad/marketing: {mkt:.2f} €{mkt_pct}")

    if bdata.get("refunds") is not None:
        optional_lines.append(f"- Devoluciones o reembolsos: {bdata['refunds']:.2f} €")

    if bdata.get("notes"):
        optional_lines.append(f"- Nota del propietario: {bdata['notes']}")

    optional_block = "\n".join(optional_lines) if optional_lines else "Sin datos adicionales."

    # ── Margen bruto opcional ─────────────────────────────────────────────────
    gross_margin_line = (
        f"\n- Margen bruto: {kpi['gross_margin']:.2f}%"
        if kpi.get("gross_margin") is not None
        else ""
    )

    return f"""{sector_block}
{period_line}

DATOS FINANCIEROS:
- Ingresos totales: {kpi.get('revenue', 0):.2f} €
- Gastos totales: {kpi.get('expenses', 0):.2f} €
- Beneficio neto: {kpi.get('net_profit', 0):.2f} €
- Margen de beneficio: {kpi.get('profit_margin', 0):.2f}%{gross_margin_line}

CLIENTES Y VENTAS:
{chr(10).join(customer_lines)}

DATOS ADICIONALES:
{optional_block}

Analiza estos datos y genera recomendaciones prácticas y accionables para este negocio."""


async def generate_and_store(
    openai: AsyncOpenAI,
    db: Client,
    period_id: str,
    user_id: str,
    kpi: dict,
    bdata: dict,
    profile: dict | None = None,
    period: dict | None = None,
    language: str = "es",
) -> dict:
    """
    Calls GPT-4o mini via OpenRouter, parses the JSON response,
    upserts into ai_recommendations, and returns the stored row.
    """
    user_prompt = _build_user_prompt(kpi, bdata, profile, period)

    response = await openai.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _get_system_prompt(language)},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    recommendations_json: dict = json.loads(raw)

    payload = {
        "period_id": period_id,
        "user_id": user_id,
        "recommendations": recommendations_json,
        "model_used": _MODEL,
    }

    result = (
        db.table("ai_recommendations")
        .upsert(payload, on_conflict="period_id")
        .execute()
    )

    return result.data[0]
