"""
Tests unitarios para app.services.ai_service.

Cubre las funciones puras de construcción del prompt (sin llamadas a la API):
- _get_system_prompt: sustitución del idioma en la plantilla del sistema
- _build_user_prompt: construcción del prompt de usuario con distintos escenarios
  de datos reales (incluyendo el fix del product label: "top seller")
"""

import pytest

from app.services.ai_service import _build_user_prompt, _get_system_prompt


# ─── Fixtures reutilizables ───────────────────────────────────────────────────

@pytest.fixture
def kpi_completo() -> dict:
    """KPI realista de una semana de un pequeño negocio."""
    return {
        "revenue": 8_000.0,
        "expenses": 6_800.0,
        "net_profit": 1_200.0,
        "profit_margin": 15.0,
        "num_sales": 150,
        "num_customers": 120,
        "avg_ticket": 53.33,
        "gross_margin": 42.50,
        "customer_acquisition_rate": 25.0,
        "returning_customer_rate": 75.0,
    }

@pytest.fixture
def kpi_minimo() -> dict:
    """KPI con solo los campos obligatorios."""
    return {
        "revenue": 2_000.0,
        "expenses": 1_800.0,
        "net_profit": 200.0,
        "profit_margin": 10.0,
        "num_sales": 40,
        "num_customers": 35,
        "avg_ticket": 50.0,
    }

@pytest.fixture
def periodo() -> dict:
    return {
        "start_date": "2026-05-11",
        "end_date": "2026-05-17",
        "period_type": "week",
    }

@pytest.fixture
def perfil() -> dict:
    return {
        "business_name": "Bar El Rincón",
        "business_sector": "Hostelería",
    }


# ─── Tests para _get_system_prompt ───────────────────────────────────────────

class TestGetSystemPrompt:
    """Verifica que el prompt de sistema incluye el idioma correcto."""

    def test_idioma_espanol_por_defecto(self):
        # El código "es" mapea a "Spanish" → debe aparecer en el prompt del sistema
        prompt = _get_system_prompt("es")
        assert "Spanish" in prompt

    def test_idioma_ingles(self):
        prompt = _get_system_prompt("en")
        assert "English" in prompt

    def test_idioma_frances(self):
        prompt = _get_system_prompt("fr")
        assert "French" in prompt

    def test_idioma_desconocido_usa_espanol(self):
        """Un código de idioma desconocido debe caer en 'Spanish' por defecto."""
        prompt = _get_system_prompt("xx")
        assert "Spanish" in prompt

    def test_placeholder_sustituido(self):
        """El placeholder {language} no debe aparecer en el prompt final."""
        for lang in ("es", "en", "fr", "pt", "it", "de"):
            prompt = _get_system_prompt(lang)
            assert "{language}" not in prompt

    def test_formato_json_en_instrucciones(self):
        """Las instrucciones siempre deben pedir respuesta en JSON."""
        prompt = _get_system_prompt("es")
        assert "JSON" in prompt


# ─── Tests para _build_user_prompt ───────────────────────────────────────────

class TestBuildUserPrompt:
    """
    Verifica que el prompt de usuario contiene la información correcta
    y que los campos se formatean como espera el modelo de IA.
    """

    # ── Datos financieros básicos ─────────────────────────────────────────────

    def test_contiene_ingresos(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "8000.00" in prompt

    def test_contiene_gastos(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "6800.00" in prompt

    def test_contiene_beneficio_neto(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "1200.00" in prompt

    def test_contiene_margen_beneficio(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "15.00%" in prompt

    def test_contiene_margen_bruto_si_disponible(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "42.50" in prompt

    def test_sin_margen_bruto_si_no_disponible(self, kpi_minimo, periodo, perfil):
        """Si gross_margin no está en los KPIs, no debe aparecer en el prompt."""
        prompt = _build_user_prompt(kpi_minimo, {}, perfil, periodo)
        assert "Margen bruto" not in prompt

    # ── Información del negocio ───────────────────────────────────────────────

    def test_contiene_nombre_y_sector(self, kpi_minimo, periodo, perfil):
        prompt = _build_user_prompt(kpi_minimo, {}, perfil, periodo)
        assert "Bar El Rincón" in prompt
        assert "Hostelería" in prompt

    def test_solo_sector_sin_nombre(self, kpi_minimo, periodo):
        perfil = {"business_sector": "Peluquería"}
        prompt = _build_user_prompt(kpi_minimo, {}, perfil, periodo)
        assert "Peluquería" in prompt

    def test_sin_perfil_no_rompe(self, kpi_minimo, periodo):
        """Con profile=None el prompt debe generarse sin errores."""
        prompt = _build_user_prompt(kpi_minimo, {}, None, periodo)
        assert "no especificado" in prompt

    # ── Período ───────────────────────────────────────────────────────────────

    def test_contiene_fechas_del_periodo(self, kpi_minimo, periodo, perfil):
        prompt = _build_user_prompt(kpi_minimo, {}, perfil, periodo)
        assert "2026-05-11" in prompt
        assert "2026-05-17" in prompt

    def test_sin_periodo_no_rompe(self, kpi_minimo, perfil):
        """Con period=None el prompt debe generarse sin errores."""
        prompt = _build_user_prompt(kpi_minimo, {}, perfil, None)
        assert "no especificado" in prompt

    # ── Producto más vendido (FIX CRÍTICO) ───────────────────────────────────

    def test_producto_sin_revenue_muestra_etiqueta_top_seller(self, kpi_completo, periodo, perfil):
        """
        Caso principal del fix: cuando el usuario introduce el mejor producto
        pero NO su facturación, el prompt debe etiquetar el campo como
        "más vendido del período (top seller)" y NO mostrar "0.00 €".

        Si el modelo ve "0 €", lo interpreta como que el producto no vende.
        La etiqueta correcta le indica que es el artículo con más ventas.
        """
        bdata = {"top_product_name": "Camiseta azul"}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)

        assert "Camiseta azul" in prompt
        assert "top seller" in prompt
        assert "más vendido" in prompt
        # El producto NO debe ir seguido de "(0.00 €)" — era el bug original
        # (no comparamos "0.00 €" genérico porque aparece como subcadena de "8000.00 €")
        assert "Camiseta azul (0" not in prompt

    def test_producto_con_revenue_muestra_importe_y_porcentaje(self, kpi_completo, periodo, perfil):
        """
        Cuando se proporciona la facturación del producto, el prompt debe
        incluir el importe y el porcentaje sobre los ingresos totales.
        """
        bdata = {"top_product_name": "Camiseta azul", "top_product_revenue": 2000.0}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)

        assert "Camiseta azul" in prompt
        assert "2000.00" in prompt
        # 2000 / 8000 = 25.0%
        assert "25.0%" in prompt
        assert "top seller" in prompt

    def test_sin_producto_no_incluye_linea_de_producto(self, kpi_completo, periodo, perfil):
        """Si top_product_name no está en bdata, no debe aparecer en el prompt."""
        bdata = {}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)
        assert "top seller" not in prompt

    # ── Datos adicionales opcionales ─────────────────────────────────────────

    def test_gasto_marketing_aparece_en_prompt(self, kpi_completo, periodo, perfil):
        bdata = {"marketing_expenses": 400.0}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)
        assert "400.00" in prompt
        assert "marketing" in prompt.lower() or "publicidad" in prompt.lower()

    def test_devoluciones_aparecen_en_prompt(self, kpi_completo, periodo, perfil):
        bdata = {"refunds": 150.0}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)
        assert "150.00" in prompt

    def test_nota_propietario_aparece_en_prompt(self, kpi_completo, periodo, perfil):
        bdata = {"notes": "Semana de rebajas, mucho movimiento."}
        prompt = _build_user_prompt(kpi_completo, bdata, perfil, periodo)
        assert "Semana de rebajas" in prompt

    def test_sin_datos_adicionales_no_rompe(self, kpi_completo, periodo, perfil):
        """bdata vacío → el prompt debe generarse sin errores."""
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "Sin datos adicionales" in prompt

    # ── Clientes ─────────────────────────────────────────────────────────────

    def test_tasa_clientes_nuevos_aparece(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "25.0%" in prompt  # customer_acquisition_rate

    def test_tasa_clientes_recurrentes_aparece(self, kpi_completo, periodo, perfil):
        prompt = _build_user_prompt(kpi_completo, {}, perfil, periodo)
        assert "75.0%" in prompt  # returning_customer_rate
