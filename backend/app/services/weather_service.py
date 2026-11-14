"""Service encapsulating HTTP communication with WeatherAPI.com."""

import os
import urllib.parse
from typing import Any, ClassVar

import httpx

from app.constants.weather_constants import WeatherConstants
from app.models.environmental_model import EnvironmentalModel
from app.models.environmental_source_enum import EnvironmentalSourceEnum
from app.models.epa_index_enum import EpaIndexEnum


class WeatherService:
    """Provides methods to query WeatherAPI.com and normalize environmental metrics."""

    _AQI_QUERY_PARAM: ClassVar[str] = "yes"
    _ENV_API_KEY_NAME: ClassVar[str] = "WEATHER_API_KEY"
    _TEMP_UNIT_SUFFIX: ClassVar[str] = "C"

    def __init__(
        self,
        api_key: str | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        """Initialize service with optional API key and injected HTTP client."""
        self._api_key = (
            api_key if api_key is not None else os.environ.get(self._ENV_API_KEY_NAME, "")
        )
        self._http_client = http_client

    async def fetch_weather_and_aqi(self, location: str) -> EnvironmentalModel | None:
        """Fetch current weather and air quality for a given location query."""
        clean_location = location.strip() if location else ""
        if not clean_location or not self._api_key:
            return None
        url = self._build_request_url(clean_location)
        try:
            payload = await self._execute_request(url)
            if payload is None:
                return None
            return self._parse_response_payload(payload)
        except (httpx.HTTPError, ValueError, KeyError):
            return None

    def map_epa_index_to_text(self, index: int | None) -> str:
        """Map a numeric EPA air quality index to a human-readable text label."""
        return WeatherConstants.map_epa_index(index)

    def _build_request_url(self, location: str) -> str:
        """Construct the full WeatherAPI current weather endpoint URL."""
        base = WeatherConstants.get_base_url()
        endpoint = WeatherConstants.get_current_endpoint()
        encoded = urllib.parse.quote(location)
        return (
            f"{base}{endpoint}?key={self._api_key}&q={encoded}&aqi={self._AQI_QUERY_PARAM}"
        )

    async def _execute_request(self, url: str) -> dict[str, Any] | None:
        """Execute HTTP GET request against WeatherAPI endpoint."""
        timeout = WeatherConstants.get_default_timeout_seconds()
        if self._http_client is not None:
            response = await self._http_client.get(url, timeout=timeout)
            response.raise_for_status()
            return response.json()  # type: ignore[no-any-return]
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()  # type: ignore[no-any-return]

    def _extract_epa_numeric(self, raw_epa: Any) -> int | None:
        """Extract and validate numeric EPA AQI index within 1 to 6."""
        min_epa = int(EpaIndexEnum.GOOD)
        max_epa = int(EpaIndexEnum.HAZARDOUS)
        if isinstance(raw_epa, int) and min_epa <= raw_epa <= max_epa:
            return raw_epa
        return None

    def _extract_pm25(self, raw_pm25: Any) -> float | None:
        """Extract and validate non-negative PM2.5 float value."""
        if isinstance(raw_pm25, (int, float)) and raw_pm25 >= 0.0:
            return float(raw_pm25)
        return None

    def _parse_response_payload(self, data: dict[str, Any]) -> EnvironmentalModel:
        """Parse raw WeatherAPI response payload into EnvironmentalModel."""
        current = data.get("current", {})
        temp_c = current.get("temp_c")
        temp_str = f"{temp_c}{self._TEMP_UNIT_SUFFIX}" if temp_c is not None else None
        condition = current.get("condition", {}).get("text")
        air_quality = current.get("air_quality", {})
        aqi_numeric = self._extract_epa_numeric(air_quality.get("us-epa-index"))
        aqi_text = self.map_epa_index_to_text(aqi_numeric)
        pm25 = self._extract_pm25(air_quality.get("pm2_5"))
        return EnvironmentalModel(
            temperature=temp_str,
            condition=condition,
            aqi=aqi_text,
            aqi_numeric=aqi_numeric,
            pm25=pm25,
            source=EnvironmentalSourceEnum.API,
        )
