from app.models import ReadinessStatus
from app.services import NotFoundError, run_readiness_check


def test_ready_patient_returns_ready_status() -> None:
    result = run_readiness_check("P001", "S001")
    assert result.readiness_status == ReadinessStatus.READY
    assert result.missing_items == []


def test_patient_missing_labs_is_at_risk() -> None:
    result = run_readiness_check("P002", "S002")
    assert result.readiness_status == ReadinessStatus.AT_RISK
    assert "CBC" in result.missing_items
    assert "Type and Screen" in result.missing_items


def test_high_risk_patient_is_not_ready() -> None:
    result = run_readiness_check("P005", "S005")
    assert result.readiness_status == ReadinessStatus.NOT_READY
    assert "Cardiology Clearance" in result.missing_items
    assert "Anticoagulation Plan" in result.missing_items


def test_unknown_patient_raises_not_found() -> None:
    try:
        run_readiness_check("P999", "S001")
        assert False, "Expected NotFoundError"
    except NotFoundError:
        assert True
