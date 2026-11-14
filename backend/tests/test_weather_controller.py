"""Unit tests for WeatherController."""

from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.controllers.weather_controller import WeatherController
from app.models.environmental_model import EnvironmentalModel
from app.models.environmental_source_enum import EnvironmentalSourceEnum
from app.services.weather_service import WeatherService


class TestWeatherController:
    """Test suite verifying WeatherController routing, status codes, and responses."""

    @pytest.fixture
    def mock_weather_service(self) -> AsyncMock:
        """Provide an AsyncMock of WeatherService."""
        return AsyncMock(spec=WeatherService)

    @pytest.fixture
    def test_client(self, mock_weather_service: AsyncMock) -> TestClient:
        """Create a TestClient with WeatherController mounted on a FastAPI instance."""
        controller = WeatherController(weather_service=mock_weather_service)
        app = FastAPI()
        app.include_router(controller.get_router())
        return TestClient(app)

    def test_get_weather_happy_path(
        self,
        test_client: TestClient,
        mock_weather_service: AsyncMock,
    ) -> None:
        """Verify GET /api/weather?location=Mumbai returns 200 OK and expected JSON."""
        expected_model = EnvironmentalModel(
            temperature="31C",
            condition="Clear",
            aqi="Moderate",
            aqi_numeric=2,
            pm25=36.4,
            source=EnvironmentalSourceEnum.API,
        )
        mock_weather_service.fetch_weather_and_aqi.return_value = expected_model

        response = test_client.get("/api/weather?location=Mumbai")

        assert response.status_code == 200
        payload = response.json()
        assert payload["temperature"] == "31C"
        assert payload["condition"] == "Clear"
        assert payload["aqi"] == "Moderate"
        assert payload["aqi_numeric"] == 2
        assert payload["pm25"] == 36.4
        assert payload["source"] == "api"
        mock_weather_service.fetch_weather_and_aqi.assert_called_once_with("Mumbai")

    def test_get_weather_service_returns_none_yields_404(
        self,
        test_client: TestClient,
        mock_weather_service: AsyncMock,
    ) -> None:
        """Verify GET /api/weather returns 404 when service returns None."""
        mock_weather_service.fetch_weather_and_aqi.return_value = None

        response = test_client.get("/api/weather?location=UnknownCity")

        assert response.status_code == 404
        assert response.json()["detail"] == "Weather data unavailable"

    def test_get_weather_missing_location_yields_422(
        self,
        test_client: TestClient,
    ) -> None:
        """Verify missing location query parameter returns 422 Unprocessable Entity."""
        response = test_client.get("/api/weather")
        assert response.status_code == 422

    def test_get_weather_empty_location_yields_422(
        self,
        test_client: TestClient,
    ) -> None:
        """Verify empty location query parameter returns 422 Unprocessable Entity."""
        response = test_client.get("/api/weather?location=")
        assert response.status_code == 422
