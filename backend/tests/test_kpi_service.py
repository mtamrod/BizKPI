"""
Tests unitarios para app.services.kpi_service.

Cubre:
- _pct: aritmética de porcentajes y caso borde divisor = 0
- _round2: redondeo a dos decimales con ROUND_HALF_UP
- calculate_and_store: cálculo completo de KPIs verificando el payload
  enviado a la base de datos con un cliente PostgREST simulado (mock).
"""

from decimal import Decimal
from unittest.mock import MagicMock, call

import pytest

from app.services.kpi_service import _pct, _round2, calculate_and_store


# ─── Tests para _pct ─────────────────────────────────────────────────────────

class TestPct:
    """Verifica que _pct calcula porcentajes correctamente."""

    def test_porcentaje_basico(self):
        """25 / 100 = 25 %"""
        assert _pct(Decimal("25"), Decimal("100")) == Decimal("25.0000")

    def test_margen_beneficio_tipico(self):
        """1200 € de beneficio sobre 8000 € de ingresos = 15 %"""
        resultado = _pct(Decimal("1200"), Decimal("8000"))
        assert resultado == Decimal("15.0000")

    def test_divisor_cero_devuelve_cero(self):
        """Si los ingresos son 0, el margen no puede calcularse: devuelve 0."""
        assert _pct(Decimal("500"), Decimal("0")) == Decimal("0.0000")

    def test_redondeo_cuatro_decimales(self):
        """El resultado se redondea a 4 decimales con ROUND_HALF_UP."""
        # 1/3 * 100 = 33.3333...
        resultado = _pct(Decimal("1"), Decimal("3"))
        assert resultado == Decimal("33.3333")

    def test_cien_por_cien(self):
        """Cuando beneficio = ingresos, margen = 100 %."""
        assert _pct(Decimal("5000"), Decimal("5000")) == Decimal("100.0000")

    def test_margen_negativo(self):
        """Un negocio con pérdidas tiene margen negativo."""
        resultado = _pct(Decimal("-1000"), Decimal("5000"))
        assert resultado == Decimal("-20.0000")


# ─── Tests para _round2 ───────────────────────────────────────────────────────

class TestRound2:
    """Verifica el redondeo a dos decimales."""

    def test_sin_cambio(self):
        assert _round2(Decimal("3.14")) == Decimal("3.14")

    def test_trunca_decimales_extra(self):
        assert _round2(Decimal("3.141592")) == Decimal("3.14")

    def test_redondea_hacia_arriba(self):
        """ROUND_HALF_UP: 3.145 → 3.15 (no 3.14)."""
        assert _round2(Decimal("3.145")) == Decimal("3.15")

    def test_entero(self):
        assert _round2(Decimal("100")) == Decimal("100.00")

    def test_cero(self):
        assert _round2(Decimal("0")) == Decimal("0.00")


# ─── Tests para calculate_and_store ──────────────────────────────────────────

class TestCalculateAndStore:
    """
    Verifica que calculate_and_store calcula los KPIs correctamente
    y llama al cliente de base de datos con el payload esperado.
    El cliente se simula con un MagicMock para evitar llamadas reales a Supabase.
    """

    def _make_mock_db(self, row: dict) -> MagicMock:
        """Crea un mock de SyncPostgrestClient que devuelve `row` al hacer upsert."""
        mock_db = MagicMock()
        mock_db.table.return_value.upsert.return_value.execute.return_value.data = [row]
        return mock_db

    def _get_upsert_payload(self, mock_db: MagicMock) -> dict:
        """Extrae el primer argumento posicional de la llamada a .upsert()."""
        return mock_db.table.return_value.upsert.call_args.args[0]

    # ── Caso base ────────────────────────────────────────────────────────────

    def test_calculo_basico(self):
        """
        Caso normal: 8 000 € ingresos, 6 800 € gastos, 150 ventas, 120 clientes.
        Verifica beneficio neto, margen, ticket medio.
        """
        fila_esperada = {"id": "kpi-1", "revenue": 8000.0}
        mock_db = self._make_mock_db(fila_esperada)

        datos = {
            "total_revenue": 8000,
            "total_expenses": 6800,
            "num_sales": 150,
            "num_customers": 120,
        }

        resultado = calculate_and_store(mock_db, "periodo-1", "usuario-1", datos)
        payload = self._get_upsert_payload(mock_db)

        assert resultado == fila_esperada
        assert payload["revenue"] == pytest.approx(8000.0)
        assert payload["expenses"] == pytest.approx(6800.0)
        assert payload["net_profit"] == pytest.approx(1200.0)
        assert payload["profit_margin"] == pytest.approx(15.0, rel=1e-3)
        assert payload["avg_ticket"] == pytest.approx(8000 / 150, rel=1e-3)
        assert payload["num_sales"] == 150
        assert payload["num_customers"] == 120
        assert payload["period_id"] == "periodo-1"
        assert payload["user_id"] == "usuario-1"

    def test_ingresos_igualan_gastos(self):
        """Beneficio cero → margen 0 %."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 5000,
            "total_expenses": 5000,
            "num_sales": 100,
            "num_customers": 80,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert payload["net_profit"] == pytest.approx(0.0)
        assert payload["profit_margin"] == pytest.approx(0.0)

    def test_ingresos_cero_ticket_medio_cero(self):
        """Si num_sales == 0, avg_ticket debe ser 0 (sin ZeroDivisionError)."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 0,
            "total_expenses": 0,
            "num_sales": 0,
            "num_customers": 0,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert payload["avg_ticket"] == pytest.approx(0.0)
        assert payload["profit_margin"] == pytest.approx(0.0)

    # ── Campos opcionales ────────────────────────────────────────────────────

    def test_margen_bruto_con_cogs(self):
        """
        Con coste de ventas (COGS), se calcula el margen bruto.
        Ingresos 10 000, COGS 4 000 → margen bruto 60 %.
        """
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 10_000,
            "total_expenses": 7_000,
            "num_sales": 200,
            "num_customers": 180,
            "cost_of_goods_sold": 4_000,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert "gross_margin" in payload
        assert payload["gross_margin"] == pytest.approx(60.0, rel=1e-3)

    def test_sin_cogs_no_incluye_margen_bruto(self):
        """Si no se proporciona COGS, gross_margin no debe estar en el payload."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 5000,
            "total_expenses": 3000,
            "num_sales": 50,
            "num_customers": 40,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert "gross_margin" not in payload

    def test_tasa_clientes_nuevos(self):
        """30 nuevos / 120 total = 25 % de tasa de adquisición."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 6000,
            "total_expenses": 4000,
            "num_sales": 100,
            "num_customers": 120,
            "new_customers": 30,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert "customer_acquisition_rate" in payload
        assert payload["customer_acquisition_rate"] == pytest.approx(25.0, rel=1e-3)

    def test_tasa_clientes_recurrentes(self):
        """90 recurrentes / 120 total = 75 % de tasa de retención."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 6000,
            "total_expenses": 4000,
            "num_sales": 100,
            "num_customers": 120,
            "returning_customers": 90,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert "returning_customer_rate" in payload
        assert payload["returning_customer_rate"] == pytest.approx(75.0, rel=1e-3)

    def test_todos_los_campos_opcionales(self):
        """Todos los campos opcionales presentes → todos incluidos en el payload."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 10_000,
            "total_expenses": 7_000,
            "num_sales": 200,
            "num_customers": 180,
            "cost_of_goods_sold": 3_000,
            "new_customers": 36,
            "returning_customers": 144,
        }
        calculate_and_store(mock_db, "p", "u", datos)
        payload = self._get_upsert_payload(mock_db)

        assert "gross_margin" in payload
        assert "customer_acquisition_rate" in payload
        assert "returning_customer_rate" in payload

    # ── Llamada a la base de datos ────────────────────────────────────────────

    def test_upsert_con_on_conflict_period_id(self):
        """El upsert debe usar on_conflict='period_id' para evitar duplicados."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 1000,
            "total_expenses": 800,
            "num_sales": 20,
            "num_customers": 15,
        }
        calculate_and_store(mock_db, "periodo-x", "usuario-x", datos)

        upsert_kwargs = mock_db.table.return_value.upsert.call_args.kwargs
        assert upsert_kwargs.get("on_conflict") == "period_id"

    def test_tabla_correcta(self):
        """La función debe escribir en la tabla 'kpis'."""
        mock_db = self._make_mock_db({})
        datos = {
            "total_revenue": 1000,
            "total_expenses": 800,
            "num_sales": 20,
            "num_customers": 15,
        }
        calculate_and_store(mock_db, "p", "u", datos)

        mock_db.table.assert_called_once_with("kpis")
