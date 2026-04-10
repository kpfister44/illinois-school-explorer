# ABOUTME: Tests for the ReportCardAPI HTTP client
# ABOUTME: Covers auth headers, pagination, schema discovery, and error handling

import pytest
import httpx
from unittest.mock import MagicMock, patch

from app.utils.api_client import ReportCardAPIClient


@pytest.fixture
def mock_http():
    """Patch httpx.Client so no real HTTP calls are made."""
    with patch("app.utils.api_client.httpx.Client") as mock_class:
        mock_instance = MagicMock()
        mock_class.return_value = mock_instance
        yield mock_instance


def _resp(data):
    """Build a mock response that returns data via .json()."""
    r = MagicMock()
    r.raise_for_status.return_value = None
    r.json.return_value = data
    return r


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------

def test_client_sends_bearer_auth_header():
    with patch("app.utils.api_client.httpx.Client") as mock_class:
        mock_class.return_value = MagicMock()
        ReportCardAPIClient("mykey", "http://test.com")
        mock_class.assert_called_once()
        kwargs = mock_class.call_args.kwargs
        assert kwargs["headers"]["Authorization"] == "Bearer mykey"
        assert kwargs["base_url"] == "http://test.com"


# ---------------------------------------------------------------------------
# get_years
# ---------------------------------------------------------------------------

def test_get_years_returns_list(mock_http):
    mock_http.get.return_value = _resp({"data": [2025, 2024, 2023], "meta": {"count": 3}})
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.get_years()

    assert result == [2025, 2024, 2023]
    mock_http.get.assert_called_once_with("/years")


def test_get_years_raises_on_http_error(mock_http):
    mock_http.get.return_value.raise_for_status.side_effect = Exception("401")
    client = ReportCardAPIClient("k", "http://test.com")

    with pytest.raises(Exception, match="401"):
        client.get_years()


# ---------------------------------------------------------------------------
# get_schema
# ---------------------------------------------------------------------------

def test_get_schema_returns_field_list(mock_http):
    fields = [
        {"column_name": "student_enrollment", "data_type": "integer", "category": "enrollment"},
        {"column_name": "pct_student_enrollment_low_income", "data_type": "percentage", "category": "demographics"},
    ]
    mock_http.get.return_value = _resp({"data": fields})
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.get_schema(2025)

    assert result == fields
    mock_http.get.assert_called_once_with("/schema/2025")


# ---------------------------------------------------------------------------
# query
# ---------------------------------------------------------------------------

def test_query_posts_correct_payload(mock_http):
    mock_http.post.return_value = _resp({"data": [], "meta": {"total": 0}})
    client = ReportCardAPIClient("k", "http://test.com")

    client.query(2025, "school", ["rcdts", "student_enrollment"])

    mock_http.post.assert_called_once()
    _, kwargs = mock_http.post.call_args
    assert kwargs["json"]["year"] == 2025
    assert kwargs["json"]["entity_type"] == "school"
    assert kwargs["json"]["fields"] == ["rcdts", "student_enrollment"]
    assert "table_suffix" not in kwargs["json"]


def test_query_includes_table_suffix_when_given(mock_http):
    mock_http.post.return_value = _resp({"data": [], "meta": {"total": 0}})
    client = ReportCardAPIClient("k", "http://test.com")

    client.query(2025, "school", ["rcdts"], table_suffix="act")

    _, kwargs = mock_http.post.call_args
    assert kwargs["json"]["table_suffix"] == "act"


def test_query_omits_fields_when_none(mock_http):
    mock_http.post.return_value = _resp({"data": [], "meta": {"total": 0}})
    client = ReportCardAPIClient("k", "http://test.com")

    client.query(2025, "school", fields=None)

    _, kwargs = mock_http.post.call_args
    assert "fields" not in kwargs["json"]


def test_query_returns_data_list(mock_http):
    rows = [{"rcdts": "05-001-0010-17-0001", "student_enrollment": 500}]
    mock_http.post.return_value = _resp({"data": rows, "meta": {"total": 1}})
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.query(2025, "school", ["rcdts", "student_enrollment"])

    assert result["data"] == rows


# ---------------------------------------------------------------------------
# query_all (pagination)
# ---------------------------------------------------------------------------

def test_query_all_returns_single_page_when_under_limit(mock_http):
    rows = [{"rcdts": f"rcdts-{i}"} for i in range(5)]
    mock_http.post.return_value = _resp({"data": rows, "meta": {"total": 5}})
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.query_all(2025, "school", ["rcdts"])

    assert len(result) == 5
    assert mock_http.post.call_count == 1


def test_query_all_paginates_across_multiple_pages(mock_http):
    page1 = [{"rcdts": f"rcdts-{i}"} for i in range(1000)]
    page2 = [{"rcdts": f"rcdts-{i}"} for i in range(1000, 1500)]
    mock_http.post.side_effect = [
        _resp({"data": page1, "meta": {"total": 1500}}),
        _resp({"data": page2, "meta": {"total": 1500}}),
    ]
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.query_all(2025, "school", ["rcdts"])

    assert len(result) == 1500
    assert mock_http.post.call_count == 2


def test_query_all_passes_table_suffix_on_each_page(mock_http):
    mock_http.post.return_value = _resp({"data": [], "meta": {"total": 0}})
    client = ReportCardAPIClient("k", "http://test.com")

    client.query_all(2025, "school", ["rcdts"], table_suffix="act")

    _, kwargs = mock_http.post.call_args
    assert kwargs["json"]["table_suffix"] == "act"


# ---------------------------------------------------------------------------
# Context manager / cleanup
# ---------------------------------------------------------------------------

def test_close_shuts_down_http_client(mock_http):
    client = ReportCardAPIClient("k", "http://test.com")
    client.close()
    mock_http.close.assert_called_once()


def test_context_manager_closes_on_exit(mock_http):
    with ReportCardAPIClient("k", "http://test.com"):
        pass
    mock_http.close.assert_called_once()


# ---------------------------------------------------------------------------
# Retry on transient network errors
# ---------------------------------------------------------------------------

def test_query_retries_on_read_error(mock_http):
    good_resp = _resp({"data": [], "meta": {"total": 0}})
    mock_http.post.side_effect = [httpx.ReadError("reset"), good_resp]
    client = ReportCardAPIClient("k", "http://test.com")

    result = client.query(2025, "school")

    assert result["data"] == []
    assert mock_http.post.call_count == 2


def test_query_raises_after_max_retries(mock_http):
    mock_http.post.side_effect = httpx.ReadError("reset")
    client = ReportCardAPIClient("k", "http://test.com")

    with pytest.raises(httpx.ReadError):
        client.query(2025, "school")
