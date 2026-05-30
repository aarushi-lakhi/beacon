from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Sequence, Tuple

from app import data
from app.models import (
    BriefingResponse,
    DemoStoryResponse,
    NotificationRequest,
    NotificationResponse,
    PatientDemographics,
    PolicySearchResponse,
    ReadinessCheckResponse,
    ReadinessStatus,
    ReadinessDashboardItem,
    RiskLevel,
    Surgery,
    SurgicalReadinessData,
    TaskCreateRequest,
    TaskPriority,
    TaskResponse,
    TaskStatus,
    WorkflowResultItem,
    WorkflowSummaryResponse,
)


ANTICOAGULANTS = {"warfarin", "apixaban", "rivaroxaban"}
CARDIAC_KEYWORDS = {
    "cardiac",
    "coronary",
    "atrial fibrillation",
    "heart failure",
    "arrhythmia",
    "cad",
}
CRITICAL_MISSING_ITEMS = {
    "Type and Screen",
    "Surgical Consent",
    "Anesthesia Consent",
    "Cardiology Clearance",
    "Anticoagulation Plan",
    "Required Imaging",
}


class NotFoundError(Exception):
    pass


class ValidationError(Exception):
    pass


def get_tomorrow_surgeries() -> List[Surgery]:
    return [Surgery(**item) for item in data.list_tomorrow_surgeries()]


def get_patient_demographics(patient_id: str) -> PatientDemographics:
    patient = data.get_patient(patient_id)
    if not patient:
        raise NotFoundError(f"Unknown patient_id: {patient_id}")
    return PatientDemographics(**patient)


def get_patient_surgical_readiness(patient_id: str) -> SurgicalReadinessData:
    patient = data.get_patient(patient_id)
    if not patient:
        raise NotFoundError(f"Unknown patient_id: {patient_id}")

    readiness = data.get_readiness_data(patient_id)
    if not readiness:
        raise NotFoundError(f"No readiness data found for patient_id: {patient_id}")

    return SurgicalReadinessData(**readiness)


def search_policy(query: str) -> PolicySearchResponse:
    normalized = query.lower()

    if "colectomy" in normalized:
        requirements = [
            "CBC within 7 days",
            "BMP within 7 days",
            "Type and screen within 72 hours",
            "Signed surgical consent",
            "Signed anesthesia consent",
            "Anesthesia evaluation",
            "Anticoagulation plan if patient is on Warfarin",
        ]
    elif "knee" in normalized or "arthroplasty" in normalized:
        requirements = [
            "CBC within 7 days",
            "BMP within 7 days",
            "Type and screen within 72 hours",
            "Pre-op knee imaging report",
            "Signed surgical consent",
            "Signed anesthesia consent",
            "Updated H&P",
        ]
    elif "aneurysm" in normalized or "vascular" in normalized:
        requirements = [
            "CBC, BMP, and coagulation panel within 48 hours",
            "Type and screen with crossmatch",
            "Cardiology clearance",
            "Anesthesia evaluation",
            "CTA report available",
            "Documented anticoagulation/periprocedural plan",
        ]
    else:
        requirements = [
            "CBC within 7 days",
            "BMP within 7 days",
            "Type and screen within 72 hours",
            "Signed surgical consent",
            "Signed anesthesia consent",
            "Completed H&P",
            "Procedure-specific imaging and specialty clearance as indicated",
        ]

    return PolicySearchResponse(
        query=query,
        requirements=requirements,
        source="Synthetic Hospital Pre-Op Policy",
    )


def run_readiness_check(patient_id: str, surgery_id: str) -> ReadinessCheckResponse:
    patient, surgery, readiness = _validate_patient_surgery(patient_id, surgery_id)
    missing_items = _compute_missing_items(patient, readiness)
    readiness_status, risk_level = _derive_status_and_risk(missing_items)
    recommended_actions = _build_recommended_actions(missing_items)

    return ReadinessCheckResponse(
        patient_id=patient_id,
        surgery_id=surgery_id,
        readiness_status=readiness_status,
        missing_items=missing_items,
        risk_level=risk_level,
        recommended_actions=recommended_actions,
    )


def create_task(request: TaskCreateRequest) -> TaskResponse:
    _validate_patient_surgery(request.patient_id, request.surgery_id)

    task_record = {
        "task_id": data.next_task_id(),
        "assigned_to": request.assigned_to,
        "patient_id": request.patient_id,
        "surgery_id": request.surgery_id,
        "priority": request.priority,
        "task": request.task,
        "status": TaskStatus.OPEN,
        "created_at": datetime.utcnow(),
    }
    saved = data.create_task(task_record)
    return TaskResponse(**saved)


def list_tasks(patient_id: str | None, surgery_id: str | None, status: str | None) -> List[TaskResponse]:
    if patient_id and not data.get_patient(patient_id):
        raise NotFoundError(f"Unknown patient_id: {patient_id}")
    if surgery_id and not data.get_surgery(surgery_id):
        raise NotFoundError(f"Unknown surgery_id: {surgery_id}")

    rows = data.list_tasks(patient_id=patient_id, surgery_id=surgery_id, status=status)
    return [TaskResponse(**row) for row in rows]


def send_notification(request: NotificationRequest) -> NotificationResponse:
    notification = {
        "notification_id": data.next_notification_id(),
        "channel": request.channel,
        "message": request.message,
        "status": "sent_mock",
        "created_at": datetime.utcnow(),
    }
    saved = data.create_notification(notification)
    return NotificationResponse(**saved)


def list_notifications() -> List[NotificationResponse]:
    return [NotificationResponse(**row) for row in data.list_notifications()]


def get_readiness_dashboard() -> List[ReadinessDashboardItem]:
    dashboard_items: List[ReadinessDashboardItem] = []
    for surgery in get_tomorrow_surgeries():
        check = run_readiness_check(surgery.patient_id, surgery.surgery_id)
        dashboard_items.append(
            ReadinessDashboardItem(
                surgery_id=surgery.surgery_id,
                patient_id=surgery.patient_id,
                patient_name=surgery.patient_name,
                procedure=surgery.procedure,
                scheduled_time=surgery.scheduled_time,
                or_room=surgery.or_room,
                readiness_status=check.readiness_status,
                risk_level=check.risk_level,
                missing_items=check.missing_items,
                actions_created=len(check.recommended_actions),
            )
        )
    return dashboard_items


def generate_surgical_briefing(patient_id: str, surgery_id: str) -> BriefingResponse:
    patient, surgery, readiness = _validate_patient_surgery(patient_id, surgery_id)
    check = run_readiness_check(patient_id, surgery_id)

    key_risks: List[str] = list(readiness.get("risk_flags", []))
    if check.missing_items:
        key_risks.append("Outstanding pre-op requirements may delay surgery")

    patient_summary = (
        f"{patient['name']} is a {patient['age']}-year-old ({patient['asa_class']}) with "
        f"conditions: {', '.join(patient['conditions'])}."
    )
    procedure_summary = (
        f"{surgery['procedure']} is scheduled at {surgery['scheduled_time'].isoformat()} "
        f"in {surgery['or_room']} with {surgery['surgeon']}."
    )

    if check.missing_items:
        one_minute_briefing = (
            f"{patient['name']} is {check.readiness_status.value.replace('_', ' ').lower()} for "
            f"{surgery['procedure']}. Missing items: {', '.join(check.missing_items)}. "
            f"Immediate focus: {check.recommended_actions[0]}."
        )
    else:
        one_minute_briefing = (
            f"{patient['name']} is ready for {surgery['procedure']} with no outstanding "
            "pre-op blockers."
        )

    return BriefingResponse(
        briefing_id=data.next_briefing_id(),
        patient_summary=patient_summary,
        procedure_summary=procedure_summary,
        key_risks=key_risks,
        missing_items=check.missing_items,
        recommended_actions=check.recommended_actions,
        one_minute_briefing=one_minute_briefing,
    )


def run_preop_check_workflow() -> WorkflowSummaryResponse:
    surgeries = get_tomorrow_surgeries()
    ready_count = 0
    at_risk_count = 0
    not_ready_count = 0
    total_tasks_created = 0
    total_notifications_sent = 0
    results: List[WorkflowResultItem] = []

    for surgery in surgeries:
        check = run_readiness_check(surgery.patient_id, surgery.surgery_id)

        if check.readiness_status == ReadinessStatus.READY:
            ready_count += 1
        elif check.readiness_status == ReadinessStatus.AT_RISK:
            at_risk_count += 1
        else:
            not_ready_count += 1

        case_tasks_created = 0
        for missing_item in check.missing_items:
            template = _task_template_for_missing_item(missing_item)
            create_task(
                TaskCreateRequest(
                    assigned_to=template["assigned_to"],
                    patient_id=surgery.patient_id,
                    surgery_id=surgery.surgery_id,
                    priority=template["priority"],
                    task=template["task"],
                )
            )
            case_tasks_created += 1
            total_tasks_created += 1

        notification_sent = False
        if check.readiness_status in {ReadinessStatus.AT_RISK, ReadinessStatus.NOT_READY}:
            send_notification(
                NotificationRequest(
                    channel="#surgery-preop",
                    message=(
                        f"Patient {surgery.patient_id} is at risk for cancellation: "
                        f"missing {', '.join(check.missing_items)}."
                    ),
                )
            )
            notification_sent = True
            total_notifications_sent += 1

        results.append(
            WorkflowResultItem(
                surgery_id=surgery.surgery_id,
                patient_id=surgery.patient_id,
                readiness_status=check.readiness_status,
                risk_level=check.risk_level,
                missing_items=check.missing_items,
                tasks_created=case_tasks_created,
                notification_sent=notification_sent,
            )
        )

    return WorkflowSummaryResponse(
        workflow_id=data.next_workflow_id(),
        surgeries_checked=len(surgeries),
        ready=ready_count,
        at_risk=at_risk_count,
        not_ready=not_ready_count,
        tasks_created=total_tasks_created,
        notifications_sent=total_notifications_sent,
        results=results,
    )


def get_demo_story() -> DemoStoryResponse:
    return DemoStoryResponse(
        title="Surgical Readiness Agent",
        problem="Pre-op teams manually review charts and often discover missing items too late.",
        solution=(
            "An agent monitors tomorrow's surgeries, checks readiness, creates tasks, "
            "and notifies teams."
        ),
        business_impact=[
            "Reduce day-of-surgery cancellations",
            "Improve OR utilization",
            "Reduce manual chart review time",
            "Improve surgical team coordination",
        ],
    )


def _validate_patient_surgery(patient_id: str, surgery_id: str | None = None) -> Tuple[Dict, Dict, Dict]:
    patient = data.get_patient(patient_id)
    if not patient:
        raise NotFoundError(f"Unknown patient_id: {patient_id}")

    readiness = data.get_readiness_data(patient_id)
    if not readiness:
        raise NotFoundError(f"No readiness data found for patient_id: {patient_id}")

    if surgery_id:
        surgery = data.get_surgery(surgery_id)
        if not surgery:
            raise NotFoundError(f"Unknown surgery_id: {surgery_id}")
    else:
        surgery = data.get_surgery_for_patient(patient_id)
        if not surgery:
            raise NotFoundError(f"No surgery found for patient_id: {patient_id}")

    if surgery["patient_id"] != patient_id:
        raise ValidationError(
            f"Surgery {surgery['surgery_id']} does not belong to patient {patient_id}"
        )

    return patient, surgery, readiness


def _compute_missing_items(patient: Dict, readiness: Dict) -> List[str]:
    missing: List[str] = []

    labs = readiness["labs"]
    documents = readiness["documents"]
    imaging = readiness["imaging"]
    clearances = readiness["clearances"]

    if not labs["cbc_completed"]:
        missing.append("CBC")
    if not labs["bmp_completed"]:
        missing.append("BMP")
    if not labs["type_and_screen_completed"]:
        missing.append("Type and Screen")

    if not documents["surgical_consent_signed"]:
        missing.append("Surgical Consent")
    if not documents["anesthesia_consent_signed"]:
        missing.append("Anesthesia Consent")
    if not documents["h_and_p_completed"]:
        missing.append("H&P")

    requires_imaging = bool(imaging.get("required_imaging"))
    if requires_imaging and (not imaging["completed"] or not imaging["report_available"]):
        missing.append("Required Imaging")

    if _has_cardiac_history(patient["conditions"]) and clearances["cardiology"] != "cleared":
        missing.append("Cardiology Clearance")

    medication_set = {med.lower() for med in readiness.get("medications", [])}
    on_anticoagulant = bool(medication_set & ANTICOAGULANTS)
    if on_anticoagulant and not readiness.get("anticoagulation_plan_documented", False):
        missing.append("Anticoagulation Plan")

    return missing


def _derive_status_and_risk(missing_items: Sequence[str]) -> Tuple[ReadinessStatus, RiskLevel]:
    if not missing_items:
        return ReadinessStatus.READY, RiskLevel.LOW

    critical_count = sum(item in CRITICAL_MISSING_ITEMS for item in missing_items)

    if len(missing_items) >= 4 or critical_count >= 3:
        return ReadinessStatus.NOT_READY, RiskLevel.HIGH

    if critical_count >= 1:
        return ReadinessStatus.AT_RISK, RiskLevel.HIGH

    if len(missing_items) >= 2:
        return ReadinessStatus.AT_RISK, RiskLevel.MEDIUM

    return ReadinessStatus.AT_RISK, RiskLevel.MEDIUM


def _build_recommended_actions(missing_items: Sequence[str]) -> List[str]:
    action_map = {
        "CBC": "Create task for pre-op nurse to order CBC",
        "BMP": "Create task for pre-op nurse to order BMP",
        "Type and Screen": "Create task for pre-op nurse to order Type and Screen",
        "Surgical Consent": "Create task for surgical coordinator to obtain surgical consent",
        "Anesthesia Consent": "Notify anesthesia team for missing consent",
        "H&P": "Request surgeon team to complete H&P",
        "Required Imaging": "Coordinate radiology to complete required imaging and release report",
        "Cardiology Clearance": "Escalate cardiology clearance",
        "Anticoagulation Plan": "Escalate anticoagulation plan with perioperative team",
    }

    actions: List[str] = []
    for item in missing_items:
        action = action_map.get(item, f"Create follow-up task for missing item: {item}")
        if action not in actions:
            actions.append(action)
    return actions


def _task_template_for_missing_item(missing_item: str) -> Dict[str, str | TaskPriority]:
    mapping = {
        "CBC": {
            "assigned_to": "Pre-op Nurse",
            "priority": TaskPriority.HIGH,
            "task": "Order CBC and ensure result is available before end of day",
        },
        "BMP": {
            "assigned_to": "Pre-op Nurse",
            "priority": TaskPriority.HIGH,
            "task": "Order BMP and ensure result is available before end of day",
        },
        "Type and Screen": {
            "assigned_to": "Pre-op Nurse",
            "priority": TaskPriority.HIGH,
            "task": "Order Type and Screen and verify blood bank readiness",
        },
        "Surgical Consent": {
            "assigned_to": "Surgical Coordinator",
            "priority": TaskPriority.HIGH,
            "task": "Obtain signed surgical consent",
        },
        "Anesthesia Consent": {
            "assigned_to": "Anesthesia Team",
            "priority": TaskPriority.HIGH,
            "task": "Complete and upload anesthesia consent",
        },
        "H&P": {
            "assigned_to": "Surgeon Team",
            "priority": TaskPriority.MEDIUM,
            "task": "Complete updated H&P documentation",
        },
        "Required Imaging": {
            "assigned_to": "Radiology Coordinator",
            "priority": TaskPriority.HIGH,
            "task": "Complete required imaging and release radiology report",
        },
        "Cardiology Clearance": {
            "assigned_to": "Cardiology Liaison",
            "priority": TaskPriority.HIGH,
            "task": "Obtain cardiology clearance note before surgery",
        },
        "Anticoagulation Plan": {
            "assigned_to": "Perioperative Pharmacist",
            "priority": TaskPriority.HIGH,
            "task": "Document perioperative anticoagulation hold/bridge plan",
        },
    }

    return mapping.get(
        missing_item,
        {
            "assigned_to": "Pre-op Nurse",
            "priority": TaskPriority.MEDIUM,
            "task": f"Resolve missing item: {missing_item}",
        },
    )


def _has_cardiac_history(conditions: Sequence[str]) -> bool:
    for condition in conditions:
        normalized = condition.lower()
        if any(keyword in normalized for keyword in CARDIAC_KEYWORDS):
            return True
    return False
