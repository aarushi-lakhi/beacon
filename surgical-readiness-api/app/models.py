from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ReadinessStatus(str, Enum):
    READY = "READY"
    AT_RISK = "AT_RISK"
    NOT_READY = "NOT_READY"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class HealthResponse(BaseModel):
    status: str
    service: str


class Surgery(BaseModel):
    surgery_id: str
    patient_id: str
    patient_name: str
    procedure: str
    surgeon: str
    scheduled_time: datetime
    or_room: str
    status: str


class PatientDemographics(BaseModel):
    patient_id: str
    name: str
    age: int
    allergies: List[str]
    conditions: List[str]
    medications: List[str]
    asa_class: str
    notes: str


class LabsData(BaseModel):
    cbc_completed: bool
    bmp_completed: bool
    type_and_screen_completed: bool
    last_lab_date: date


class DocumentsData(BaseModel):
    surgical_consent_signed: bool
    anesthesia_consent_signed: bool
    h_and_p_completed: bool


class ImagingData(BaseModel):
    required_imaging: Optional[str] = None
    completed: bool
    report_available: bool
    summary: str


class ClearancesData(BaseModel):
    cardiology: str
    anesthesia: str


class SurgicalReadinessData(BaseModel):
    patient_id: str
    surgery_id: str
    procedure: str
    labs: LabsData
    documents: DocumentsData
    imaging: ImagingData
    medications: List[str]
    clearances: ClearancesData
    risk_flags: List[str]


class PolicySearchRequest(BaseModel):
    query: str = Field(..., min_length=3)


class PolicySearchResponse(BaseModel):
    query: str
    requirements: List[str]
    source: str


class ReadinessCheckRequest(BaseModel):
    patient_id: str
    surgery_id: str


class ReadinessCheckResponse(BaseModel):
    patient_id: str
    surgery_id: str
    readiness_status: ReadinessStatus
    missing_items: List[str]
    risk_level: RiskLevel
    recommended_actions: List[str]


class TaskCreateRequest(BaseModel):
    assigned_to: str
    patient_id: str
    surgery_id: str
    priority: TaskPriority
    task: str


class TaskResponse(BaseModel):
    task_id: str
    assigned_to: str
    patient_id: str
    surgery_id: str
    priority: TaskPriority
    task: str
    status: TaskStatus
    created_at: datetime


class NotificationRequest(BaseModel):
    channel: str
    message: str


class NotificationResponse(BaseModel):
    notification_id: str
    channel: str
    message: str
    status: str
    created_at: datetime


class ReadinessDashboardItem(BaseModel):
    surgery_id: str
    patient_id: str
    patient_name: str
    procedure: str
    scheduled_time: datetime
    or_room: str
    readiness_status: ReadinessStatus
    risk_level: RiskLevel
    missing_items: List[str]
    actions_created: int


class BriefingGenerateRequest(BaseModel):
    patient_id: str
    surgery_id: str


class BriefingResponse(BaseModel):
    briefing_id: str
    patient_summary: str
    procedure_summary: str
    key_risks: List[str]
    missing_items: List[str]
    recommended_actions: List[str]
    one_minute_briefing: str


class WorkflowResultItem(BaseModel):
    surgery_id: str
    patient_id: str
    readiness_status: ReadinessStatus
    risk_level: RiskLevel
    missing_items: List[str]
    tasks_created: int
    notification_sent: bool


class WorkflowSummaryResponse(BaseModel):
    workflow_id: str
    surgeries_checked: int
    ready: int
    at_risk: int
    not_ready: int
    tasks_created: int
    notifications_sent: int
    results: List[WorkflowResultItem]


class DemoStoryResponse(BaseModel):
    title: str
    problem: str
    solution: str
    business_impact: List[str]
