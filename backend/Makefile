PYTHON  ?= python
UVICORN ?= uvicorn

.PHONY: install dev prod lint

install:
	$(PYTHON) -m pip install -r requirements.txt

dev:
	$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

prod:
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --workers 2

lint:
	$(PYTHON) -m ruff check app/
