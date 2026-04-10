# ABOUTME: HTTP client for the ReportCardAPI with auth, pagination, and schema discovery
# ABOUTME: All outbound calls to the ReportCardAPI go through this class

from __future__ import annotations

import time
from typing import Any

import httpx


class ReportCardAPIClient:
    """Wraps the ReportCardAPI REST interface with auth and pagination helpers."""

    def __init__(self, api_key: str, base_url: str) -> None:
        self._client = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=120.0,
        )

    def _with_retry(self, fn, retries: int = 3):
        """Call fn(), retrying on transient network errors with exponential backoff."""
        for attempt in range(retries):
            try:
                return fn()
            except (httpx.ReadError, httpx.ConnectError, httpx.TimeoutException):
                if attempt == retries - 1:
                    raise
                time.sleep(2 ** attempt)

    def get_years(self) -> list[int]:
        """Return list of available data years."""
        resp = self._with_retry(lambda: self._client.get("/years"))
        resp.raise_for_status()
        return resp.json()["data"]

    def get_schema(self, year: int) -> list[dict]:
        """Return field metadata list for a given year."""
        resp = self._with_retry(lambda: self._client.get(f"/schema/{year}"))
        resp.raise_for_status()
        return resp.json()["data"]

    def query(
        self,
        year: int,
        entity_type: str,
        fields: list[str] | None = None,
        table_suffix: str | None = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> dict[str, Any]:
        """POST /query and return the raw response dict."""
        payload: dict[str, Any] = {
            "year": year,
            "entity_type": entity_type,
            "limit": limit,
            "offset": offset,
        }
        if fields is not None:
            payload["fields"] = fields
        if table_suffix:
            payload["table_suffix"] = table_suffix
        resp = self._with_retry(lambda: self._client.post("/query", json=payload))
        resp.raise_for_status()
        return resp.json()

    def query_all(
        self,
        year: int,
        entity_type: str,
        fields: list[str] | None = None,
        table_suffix: str | None = None,
    ) -> list[dict]:
        """Paginate through all results and return the combined list."""
        all_data: list[dict] = []
        offset = 0
        limit = 1000
        while True:
            result = self.query(year, entity_type, fields, table_suffix, limit, offset)
            batch = result["data"]
            all_data.extend(batch)
            if len(batch) < limit:
                break
            offset += limit
        return all_data

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "ReportCardAPIClient":
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()
