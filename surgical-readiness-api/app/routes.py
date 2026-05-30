from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app import services
from app.models import (
    BriefingGenerateRequest,
    BriefingResponse,
    DemoStoryResponse,
    HealthResponse,
    NotificationRequest,
    NotificationResponse,
    PatientDemographics,
    PolicySearchRequest,
    PolicySearchResponse,
    ReadinessCheckRequest,
    ReadinessCheckResponse,
    ReadinessDashboardItem,
    Surgery,
    SurgicalReadinessData,
    TaskCreateRequest,
    TaskResponse,
    WorkflowSummaryResponse,
)

router = APIRouter()


def _raise_http_error(error: Exception) -> None:
    if isinstance(error, services.NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, services.ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="surgical-readiness-api")


@router.get("/api/surgeries/tomorrow", response_model=List[Surgery])
def get_tomorrow_surgeries() -> List[Surgery]:
    return services.get_tomorrow_surgeries()


@router.get("/api/patients/{patient_id}", response_model=PatientDemographics)
def get_patient(patient_id: str) -> PatientDemographics:
    try:
        return services.get_patient_demographics(patient_id)
    except Exception as error:
        _raise_http_error(error)


@router.get("/api/patients/{patient_id}/surgical-readiness", response_model=SurgicalReadinessData)
def get_patient_surgical_readiness(patient_id: str) -> SurgicalReadinessData:
    try:
        return services.get_patient_surgical_readiness(patient_id)
    except Exception as error:
        _raise_http_error(error)


@router.post("/api/search-policy", response_model=PolicySearchResponse)
def search_policy(payload: PolicySearchRequest) -> PolicySearchResponse:
    return services.search_policy(payload.query)


@router.post("/api/readiness/check", response_model=ReadinessCheckResponse)
def check_readiness(payload: ReadinessCheckRequest) -> ReadinessCheckResponse:
    try:
        return services.run_readiness_check(payload.patient_id, payload.surgery_id)
    except Exception as error:
        _raise_http_error(error)


@router.post("/api/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreateRequest) -> TaskResponse:
    try:
        return services.create_task(payload)
    except Exception as error:
        _raise_http_error(error)


@router.get("/api/tasks", response_model=List[TaskResponse])
def list_tasks(
    patient_id: Optional[str] = Query(default=None),
    surgery_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
) -> List[TaskResponse]:
    try:
        return services.list_tasks(patient_id=patient_id, surgery_id=surgery_id, status=status)
    except Exception as error:
        _raise_http_error(error)


@router.post("/api/notify", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def send_notification(payload: NotificationRequest) -> NotificationResponse:
    return services.send_notification(payload)


@router.get("/api/notifications", response_model=List[NotificationResponse])
def list_notifications() -> List[NotificationResponse]:
    return services.list_notifications()


@router.get("/api/readiness-dashboard", response_model=List[ReadinessDashboardItem])
def readiness_dashboard() -> List[ReadinessDashboardItem]:
    try:
        return services.get_readiness_dashboard()
    except Exception as error:
        _raise_http_error(error)


@router.post("/api/briefing/generate", response_model=BriefingResponse)
def generate_briefing(payload: BriefingGenerateRequest) -> BriefingResponse:
    try:
        return services.generate_surgical_briefing(payload.patient_id, payload.surgery_id)
    except Exception as error:
        _raise_http_error(error)


@router.post("/api/workflows/run-preop-check", response_model=WorkflowSummaryResponse)
def run_preop_check_workflow() -> WorkflowSummaryResponse:
    try:
        return services.run_preop_check_workflow()
    except Exception as error:
        _raise_http_error(error)


@router.get("/api/demo/story", response_model=DemoStoryResponse)
def demo_story() -> DemoStoryResponse:
    return services.get_demo_story()
