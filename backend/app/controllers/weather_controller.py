"""Weather proxy controller encapsulating FastAPI routing and request dispatch."""

from typing import ClassVar

from fastapi import APIRouter, HTTPException, Query, status

from app.models.environmental_model import EnvironmentalModel
from app.services.weather_service import WeatherService


class WeatherController:
    """FastAPI controller exposing endpoints for environmental and weather queries."""

    _ROUTE_PREFIX: ClassVar[str] = "/api/weather"
    _WEATHER_ENDPOINT: ClassVar[str] = ""
    _LOCATION_MIN_LENGTH: ClassVar[int] = 1
    _LOCATION_PARAM_DESCRIPTION: ClassVar[str] = "Target location for weather and AQI"
    _NOT_FOUND_DETAIL: ClassVar[str] = "Weather data unavailable"
    _ROUTER_TAG: ClassVar[str] = "weather"
    _ENDPOINT_SUMMARY: ClassVar[str] = "Get current weather and AQI for a location"

    def __init__(self, weather_service: WeatherService) -> None:
        """Initialize controller with injected WeatherService and register endpoints."""
        self._weather_service = weather_service
        self._router = APIRouter(prefix=self._ROUTE_PREFIX, tags=[self._ROUTER_TAG])
        self._register_routes()

    def get_router(self) -> APIRouter:
        """Return the configured FastAPI APIRouter instance."""
        return self._router

    async def get_weather(
        self,
        location: str = Query(
            ...,
            min_length=_LOCATION_MIN_LENGTH,
            description=_LOCATION_PARAM_DESCRIPTION,
        ),
    ) -> EnvironmentalModel:
        """Fetch real-time weather and AQI for a location query parameter."""
        data = await self._weather_service.fetch_weather_and_aqi(location)
        if data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=self._NOT_FOUND_DETAIL,
            )
        return data

    def _register_routes(self) -> None:
        """Register weather route handlers with the internal router."""
        self._router.add_api_route(
            self._WEATHER_ENDPOINT,
            self.get_weather,
            methods=["GET"],
            response_model=EnvironmentalModel,
            status_code=status.HTTP_200_OK,
            summary=self._ENDPOINT_SUMMARY,
        )

