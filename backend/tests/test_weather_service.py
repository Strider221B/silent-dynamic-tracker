"""Unit tests for WeatherService."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.models.environmental_source_enum import EnvironmentalSourceEnum
from app.services.weather_service import WeatherService


class TestWeatherService:
    """Test suite covering WeatherService API interactions and error handling."""

    @pytest.fixture
    def mock_weatherapi_payload(self) -> dict[str, Any]:
        """Provide a sample valid response payload from WeatherAPI.com."""
        return {
            "location": {"name": "Mumbai"},
            "current": {
                "temp_c": 31.5,
                "condition": {"text": "Sunny"},
                "air_quality": {
                    "pm2_5": 36.4,
                    "us-epa-index": 2,
                },
            },
        }

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_happy_path(
        self,
        mock_weatherapi_payload: dict[str, Any],
    ) -> None:
        """Verify successful response parsing with temperature, condition, AQI, and PM2.5."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weatherapi_payload
        mock_response.raise_for_status.return_value = None
        mock_client.get.return_value = mock_response

        service = WeatherService(api_key="test_api_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Mumbai")

        assert result is not None
        assert result.temperature == "31.5C"
        assert result.condition == "Sunny"
        assert result.aqi == "Moderate"
        assert result.aqi_numeric == 2
        assert result.pm25 == 36.4
        assert result.source == EnvironmentalSourceEnum.API

    @pytest.mark.asyncio
    @pytest.mark.parametrize("empty_location", ["", "   ", None])  # type: ignore[arg-type]
    async def test_fetch_weather_and_aqi_empty_location_returns_none(
        self,
        empty_location: str,
    ) -> None:
        """Verify empty or blank location returns None immediately without network call."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = WeatherService(api_key="test_api_key", http_client=mock_client)

        result = await service.fetch_weather_and_aqi(empty_location)

        assert result is None
        mock_client.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_missing_api_key_returns_none(self) -> None:
        """Verify missing API key returns None immediately."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        with patch.dict("os.environ", {}, clear=True):
            service = WeatherService(api_key=None, http_client=mock_client)
            result = await service.fetch_weather_and_aqi("Mumbai")

        assert result is None
        mock_client.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_reads_key_from_environment(
        self,
        mock_weatherapi_payload: dict[str, Any],
    ) -> None:
        """Verify API key is picked up from WEATHER_API_KEY environment variable."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weatherapi_payload
        mock_response.raise_for_status.return_value = None
        mock_client.get.return_value = mock_response

        with patch.dict("os.environ", {"WEATHER_API_KEY": "env_secret_key"}):
            service = WeatherService(http_client=mock_client)
            result = await service.fetch_weather_and_aqi("Delhi")

        assert result is not None
        mock_client.get.assert_called_once()
        call_url = mock_client.get.call_args[0][0]
        assert "key=env_secret_key" in call_url

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("epa_raw", "expected_numeric", "expected_text"),
        [
            (1, 1, "Good"),
            (6, 6, "Hazardous"),
            (7, None, "Unknown"),
            (0, None, "Unknown"),
            (None, None, "Unknown"),
            ("invalid", None, "Unknown"),
        ],
    )
    async def test_fetch_weather_and_aqi_epa_index_boundaries(
        self,
        epa_raw: Any,
        expected_numeric: int | None,
        expected_text: str,
    ) -> None:
        """Verify EPA index values map correctly to numeric bounds and text labels."""
        payload: dict[str, Any] = {
            "current": {
                "temp_c": 22.0,
                "condition": {"text": "Cloudy"},
                "air_quality": {"us-epa-index": epa_raw, "pm2_5": 10.0},
            }
        }
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = payload
        mock_response.raise_for_status.return_value = None
        mock_client.get.return_value = mock_response

        service = WeatherService(api_key="test_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Pune")

        assert result is not None
        assert result.aqi_numeric == expected_numeric
        assert result.aqi == expected_text

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "pm25_raw",
        [-5.0, "invalid", None],
    )
    async def test_fetch_weather_and_aqi_invalid_pm25_yields_none(self, pm25_raw: Any) -> None:
        """Verify invalid or negative PM2.5 values are set to None."""
        payload: dict[str, Any] = {
            "current": {
                "temp_c": 20.0,
                "condition": {"text": "Clear"},
                "air_quality": {"us-epa-index": 1, "pm2_5": pm25_raw},
            }
        }
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = payload
        mock_response.raise_for_status.return_value = None
        mock_client.get.return_value = mock_response

        service = WeatherService(api_key="test_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Pune")

        assert result is not None
        assert result.pm25 is None

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_timeout_returns_none(self) -> None:
        """Verify timeout exception is caught and returns None."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get.side_effect = httpx.TimeoutException("Connection timed out")

        service = WeatherService(api_key="test_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Goa")

        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_http_status_error_returns_none(self) -> None:
        """Verify HTTP 4xx/5xx status error is caught and returns None."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        request = httpx.Request("GET", "https://api.weatherapi.com/v1/current.json")
        response = httpx.Response(status_code=401, request=request)
        mock_client.get.side_effect = httpx.HTTPStatusError(
            "Unauthorized",
            request=request,
            response=response,
        )

        service = WeatherService(api_key="test_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Goa")

        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_json_decode_error_returns_none(self) -> None:
        """Verify invalid JSON payload from server returns None."""
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.raise_for_status.return_value = None
        mock_response.json.side_effect = ValueError("Malformed JSON")
        mock_client.get.return_value = mock_response

        service = WeatherService(api_key="test_key", http_client=mock_client)
        result = await service.fetch_weather_and_aqi("Goa")

        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_none_payload_returns_none(self) -> None:
        """Verify None response payload from execution helper returns None."""
        service = WeatherService(api_key="test_key")
        with patch.object(service, "_execute_request", new_callable=AsyncMock) as mock_exec:
            mock_exec.return_value = None
            result = await service.fetch_weather_and_aqi("Pune")

        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_weather_and_aqi_default_client_lifecycle(
        self,
        mock_weatherapi_payload: dict[str, Any],
    ) -> None:
        """Verify default AsyncClient context is used when no client is injected."""
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weatherapi_payload
        mock_response.raise_for_status.return_value = None

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            service = WeatherService(api_key="default_client_key")
            result = await service.fetch_weather_and_aqi("London")

        assert result is not None
        assert result.temperature == "31.5C"
        mock_get.assert_called_once()
