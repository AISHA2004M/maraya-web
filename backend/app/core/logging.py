"""
Structured Logging — Enterprise-grade JSON logging with structlog
=================================================================
Produces machine-readable JSON logs suitable for log aggregation services
(Datadog, CloudWatch, Logtail, etc.).

Each log entry includes:
  - timestamp (ISO 8601)
  - level (debug/info/warning/error)
  - event (the log message)
  - request_id (UUID per request, for tracing)
  - Any extra context passed by the caller
"""
import logging
import sys
from typing import Any

try:
    import structlog
    from structlog.types import EventDict, WrappedLogger
    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False


def _add_severity(logger: Any, method: str, event_dict: dict) -> dict:
    """Map structlog level names to uppercase severity for log aggregators."""
    event_dict["severity"] = method.upper()
    return event_dict


def configure_logging(json_logs: bool = True, log_level: str = "INFO") -> None:
    """
    Call once at application startup to configure structlog + stdlib logging.

    Args:
        json_logs: If True (production default), emit JSON. If False, emit
                   pretty-printed coloured output (development).
        log_level: Minimum log level string, e.g. "INFO", "DEBUG", "WARNING".
    """
    if not HAS_STRUCTLOG:
        # Fallback to basic stdlib logging if structlog not installed yet
        logging.basicConfig(
            level=getattr(logging, log_level.upper(), logging.INFO),
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
            stream=sys.stdout,
        )
        return

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        _add_severity,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if json_logs:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "sqlalchemy.engine", "celery"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


class _StdlibLoggerAdapter:
    """Wraps standard logging.Logger so keyword arguments are formatted cleanly."""
    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def _format(self, msg: str, kwargs: dict) -> str:
        if kwargs:
            extra_str = " ".join(f"{k}={v}" for k, v in kwargs.items())
            return f"{msg} ({extra_str})"
        return msg

    def info(self, msg: str, *args, **kwargs):
        self._logger.info(self._format(msg, kwargs), *args)

    def warning(self, msg: str, *args, **kwargs):
        self._logger.warning(self._format(msg, kwargs), *args)

    def error(self, msg: str, *args, **kwargs):
        self._logger.error(self._format(msg, kwargs), *args)

    def debug(self, msg: str, *args, **kwargs):
        self._logger.debug(self._format(msg, kwargs), *args)

    def exception(self, msg: str, *args, **kwargs):
        self._logger.exception(self._format(msg, kwargs), *args)


def get_logger(name: str = __name__) -> Any:
    """Return a structlog logger (or stdlib fallback). Use instead of logging.getLogger()."""
    if HAS_STRUCTLOG:
        return structlog.get_logger(name)
    return _StdlibLoggerAdapter(logging.getLogger(name))

