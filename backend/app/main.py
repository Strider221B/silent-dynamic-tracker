"""FastAPI application server entry point for Silent Dynamic Tracker."""

from typing import ClassVar

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.weather_controller import WeatherController
from app.services.weather_service import WeatherService


class ApplicationServer:
    """Encapsulates FastAPI application configuration, middleware, and lifecycle."""

    _APP_TITLE: ClassVar[str] = "Silent Dynamic Tracker Backend"
    _APP_VERSION: ClassVar[str] = "0.1.0"
    _DEFAULT_HOST: ClassVar[str] = "0.0.0.0"
    _DEFAULT_PORT: ClassVar[int] = 8000
    _HEALTH_ENDPOINT: ClassVar[str] = "/api/health"
    _CORS_ALLOW_ALL: ClassVar[str] = "*"
    _HEALTH_RESPONSE: ClassVar[dict[str, str]] = {"status": "ok"}

    def __init__(self, weather_service: WeatherService | None = None) -> None:
        """Initialize FastAPI application with middleware and API routes."""
        self._app = FastAPI(title=self._APP_TITLE, version=self._APP_VERSION)
        self._setup_middleware()
        self._setup_routes(weather_service)

    def get_app(self) -> FastAPI:
        """Return the initialized FastAPI application instance."""
        return self._app

    async def health_check(self) -> dict[str, str]:
        """Return health status response dictionary."""
        return dict(self._HEALTH_RESPONSE)

    def run(self, host: str = _DEFAULT_HOST, port: int = _DEFAULT_PORT) -> None:
        """Start the Uvicorn ASGI server with the encapsulated FastAPI app."""
        uvicorn.run(self._app, host=host, port=port)

    def _setup_middleware(self) -> None:
        """Attach CORS middleware allowing cross-origin requests from frontend."""
        self._app.add_middleware(
            CORSMiddleware,
            allow_origins=[self._CORS_ALLOW_ALL],
            allow_credentials=True,
            allow_methods=[self._CORS_ALLOW_ALL],
            allow_headers=[self._CORS_ALLOW_ALL],
        )

    def _setup_routes(self, weather_service: WeatherService | None) -> None:
        """Register application routes including health check and weather router."""
        self._app.add_api_route(
            self._HEALTH_ENDPOINT,
            self.health_check,
            methods=["GET"],
            status_code=200,
            summary="Service health check",
        )
        service = weather_service if weather_service is not None else WeatherService()
        controller = WeatherController(weather_service=service)
        self._app.include_router(controller.get_router())


if __name__ == "__main__":
    ApplicationServer().run()
