"""Unit tests for ApplicationServer in app.main."""

from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import ApplicationServer
from app.services.weather_service import WeatherService


class TestApplicationServer:
    """Test suite verifying ApplicationServer setup, routes, middleware, and lifecycle."""

    def test_get_app_returns_fastapi_instance(self) -> None:
        """Verify get_app returns an initialized FastAPI instance."""
        server = ApplicationServer()
        app = server.get_app()
        assert isinstance(app, FastAPI)
        assert app.title == "Silent Dynamic Tracker Backend"

    def test_health_check_endpoint_returns_ok(self) -> None:
        """Verify GET /api/health returns 200 OK with expected JSON payload."""
        server = ApplicationServer()
        client = TestClient(server.get_app())

        response = client.get("/api/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_cors_middleware_headers_present(self) -> None:
        """Verify CORS preflight request receives appropriate access-control headers."""
        server = ApplicationServer()
        client = TestClient(server.get_app())

        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
        response = client.options("/api/health", headers=headers)

        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_run_invokes_uvicorn_with_configured_host_and_port(self) -> None:
        """Verify run() delegates to uvicorn.run with specified or default arguments."""
        server = ApplicationServer()
        with patch("uvicorn.run") as mock_uvicorn_run:
            server.run(host="127.0.0.1", port=9000)
            mock_uvicorn_run.assert_called_once_with(server.get_app(), host="127.0.0.1", port=9000)

    def test_main_execution_entrypoint(self) -> None:
        """Verify running module directly executes ApplicationServer.run()."""
        import runpy

        with patch("uvicorn.run") as mock_uvicorn_run:
            runpy.run_module("app.main", run_name="__main__")
            mock_uvicorn_run.assert_called_once()

    def test_custom_weather_service_injection(self) -> None:
        """Verify custom WeatherService can be injected during initialization."""
        mock_service = MagicMock(spec=WeatherService)
        server = ApplicationServer(weather_service=mock_service)
        client = TestClient(server.get_app())

        # Weather route should be accessible
        response = client.get("/api/weather")
        assert response.status_code == 422
