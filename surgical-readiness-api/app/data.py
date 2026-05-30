from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, time, timedelta
from itertools import count
from typing import Any, Dict, List, Optional


def _tomorrow_at(hour: int, minute: int) -> datetime:
    tomorrow = date.today() + timedelta(days=1)
    return datetime.combine(tomorrow, time(hour=hour, minute=minute))


SURGERIES: List[Dict[str, Any]] = [
    {
        "surgery_id": "S001",
        "patient_id": "P001",
        "patient_name": "Synthetic Patient A",
        "procedure": "Laparoscopic Colectomy",
        "surgeon": "Dr. Lee",
        "scheduled_time": _tomorrow_at(8, 0),
        "or_room": "OR-3",
        "status": "scheduled",
    },
    {
        "surgery_id": "S002",
        "patient_id": "P002",
        "patient_name": "Synthetic Patient B",
        "procedure": "Total Knee Arthroplasty",
        "surgeon": "Dr. Patel",
        "scheduled_time": _tomorrow_at(9, 30),
        "or_room": "OR-5",
        "status": "scheduled",
    },
    {
        "surgery_id": "S003",
        "patient_id": "P003",
        "patient_name": "Synthetic Patient C",
        "procedure": "Laparoscopic Cholecystectomy",
        "surgeon": "Dr. Nguyen",
        "scheduled_time": _tomorrow_at(11, 0),
        "or_room": "OR-2",
        "status": "scheduled",
    },
    {
        "surgery_id": "S004",
        "patient_id": "P004",
        "patient_name": "Synthetic Patient D",
        "procedure": "Hip Revision Surgery",
        "surgeon": "Dr. Martinez",
        "scheduled_time": _tomorrow_at(13, 0),
        "or_room": "OR-6",
        "status": "scheduled",
    },
    {
        "surgery_id": "S005",
        "patient_id": "P005",
        "patient_name": "Synthetic Patient E",
        "procedure": "Open Abdominal Aortic Aneurysm Repair",
        "surgeon": "Dr. O'Connor",
        "scheduled_time": _tomorrow_at(15, 30),
        "or_room": "OR-1",
        "status": "scheduled",
    },
]


PATIENTS: Dict[str, Dict[str, Any]] = {
    "P001": {
        "patient_id": "P001",
        "name": "Synthetic Patient A",
        "age": 55,
        "allergies": ["Penicillin"],
        "conditions": ["Colon neoplasm"],
        "medications": ["Lisinopril"],
        "asa_class": "ASA II",
        "notes": "Good functional status. No prior anesthesia complications.",
    },
    "P002": {
        "patient_id": "P002",
        "name": "Synthetic Patient B",
        "age": 67,
        "allergies": ["No known drug allergies"],
        "conditions": ["Osteoarthritis", "Type 2 diabetes mellitus"],
        "medications": ["Metformin"],
        "asa_class": "ASA III",
        "notes": "Diabetes controlled, but pre-op labs are stale.",
    },
    "P003": {
        "patient_id": "P003",
        "name": "Synthetic Patient C",
        "age": 43,
        "allergies": ["Latex"],
        "conditions": ["Symptomatic cholelithiasis"],
        "medications": ["Omeprazole"],
        "asa_class": "ASA II",
        "notes": "Awaiting completion of formal consent packet.",
    },
    "P004": {
        "patient_id": "P004",
        "name": "Synthetic Patient D",
        "age": 72,
        "allergies": ["Sulfa"],
        "conditions": ["Atrial fibrillation", "Hyperlipidemia"],
        "medications": ["Warfarin", "Atorvastatin"],
        "asa_class": "ASA III",
        "notes": "Anticoagulation management note has not been documented.",
    },
    "P005": {
        "patient_id": "P005",
        "name": "Synthetic Patient E",
        "age": 76,
        "allergies": ["Iodinated contrast (mild prior reaction)"],
        "conditions": ["Coronary artery disease", "Atrial fibrillation", "Chronic kidney disease"],
        "medications": ["Apixaban", "Metoprolol"],
        "asa_class": "ASA IV",
        "notes": "High-acuity case requiring multidisciplinary clearance.",
    },
}


READINESS_DATA: Dict[str, Dict[str, Any]] = {
    "P001": {
        "patient_id": "P001",
        "surgery_id": "S001",
        "procedure": "Laparoscopic Colectomy",
        "labs": {
            "cbc_completed": True,
            "bmp_completed": True,
            "type_and_screen_completed": True,
            "last_lab_date": date.today() - timedelta(days=1),
        },
        "documents": {
            "surgical_consent_signed": True,
            "anesthesia_consent_signed": True,
            "h_and_p_completed": True,
        },
        "imaging": {
            "required_imaging": "CT Abdomen",
            "completed": True,
            "report_available": True,
            "summary": "No obstruction. Prior surgical clips noted.",
        },
        "medications": ["Lisinopril"],
        "clearances": {"cardiology": "not_required", "anesthesia": "cleared"},
        "risk_flags": [],
        "anticoagulation_plan_documented": True,
    },
    "P002": {
        "patient_id": "P002",
        "surgery_id": "S002",
        "procedure": "Total Knee Arthroplasty",
        "labs": {
            "cbc_completed": False,
            "bmp_completed": True,
            "type_and_screen_completed": False,
            "last_lab_date": date.today() - timedelta(days=8),
        },
        "documents": {
            "surgical_consent_signed": True,
            "anesthesia_consent_signed": True,
            "h_and_p_completed": True,
        },
        "imaging": {
            "required_imaging": "Knee X-ray",
            "completed": True,
            "report_available": True,
            "summary": "Severe medial compartment osteoarthritis.",
        },
        "medications": ["Metformin"],
        "clearances": {"cardiology": "not_required", "anesthesia": "cleared"},
        "risk_flags": ["Missing pre-op labs"],
        "anticoagulation_plan_documented": True,
    },
    "P003": {
        "patient_id": "P003",
        "surgery_id": "S003",
        "procedure": "Laparoscopic Cholecystectomy",
        "labs": {
            "cbc_completed": True,
            "bmp_completed": True,
            "type_and_screen_completed": True,
            "last_lab_date": date.today() - timedelta(days=2),
        },
        "documents": {
            "surgical_consent_signed": False,
            "anesthesia_consent_signed": False,
            "h_and_p_completed": True,
        },
        "imaging": {
            "required_imaging": "Ultrasound Abdomen",
            "completed": True,
            "report_available": True,
            "summary": "Multiple gallstones without ductal dilation.",
        },
        "medications": ["Omeprazole"],
        "clearances": {"cardiology": "not_required", "anesthesia": "pending"},
        "risk_flags": ["Missing required consents"],
        "anticoagulation_plan_documented": True,
    },
    "P004": {
        "patient_id": "P004",
        "surgery_id": "S004",
        "procedure": "Hip Revision Surgery",
        "labs": {
            "cbc_completed": True,
            "bmp_completed": True,
            "type_and_screen_completed": True,
            "last_lab_date": date.today() - timedelta(days=1),
        },
        "documents": {
            "surgical_consent_signed": True,
            "anesthesia_consent_signed": True,
            "h_and_p_completed": True,
        },
        "imaging": {
            "required_imaging": "Pelvic X-ray",
            "completed": True,
            "report_available": True,
            "summary": "Femoral stem loosening noted.",
        },
        "medications": ["Warfarin", "Atorvastatin"],
        "clearances": {"cardiology": "cleared", "anesthesia": "pending"},
        "risk_flags": ["Patient is on anticoagulation"],
        "anticoagulation_plan_documented": False,
    },
    "P005": {
        "patient_id": "P005",
        "surgery_id": "S005",
        "procedure": "Open Abdominal Aortic Aneurysm Repair",
        "labs": {
            "cbc_completed": False,
            "bmp_completed": False,
            "type_and_screen_completed": True,
            "last_lab_date": date.today() - timedelta(days=9),
        },
        "documents": {
            "surgical_consent_signed": True,
            "anesthesia_consent_signed": True,
            "h_and_p_completed": False,
        },
        "imaging": {
            "required_imaging": "CT Angiography",
            "completed": False,
            "report_available": False,
            "summary": "Repeat CTA pending contrast-risk protocol.",
        },
        "medications": ["Apixaban", "Metoprolol"],
        "clearances": {"cardiology": "missing", "anesthesia": "pending"},
        "risk_flags": [
            "High cardiac risk history",
            "Patient is on anticoagulation",
            "Missing cardiology clearance",
        ],
        "anticoagulation_plan_documented": False,
    },
}


TASKS: List[Dict[str, Any]] = []
NOTIFICATIONS: List[Dict[str, Any]] = []

_task_counter = count(1)
_notification_counter = count(1)
_briefing_counter = count(1)
_workflow_counter = count(1)


def list_tomorrow_surgeries() -> List[Dict[str, Any]]:
    return deepcopy(SURGERIES)


def get_surgery(surgery_id: str) -> Optional[Dict[str, Any]]:
    for surgery in SURGERIES:
        if surgery["surgery_id"] == surgery_id:
            return deepcopy(surgery)
    return None


def get_surgery_for_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    for surgery in SURGERIES:
        if surgery["patient_id"] == patient_id:
            return deepcopy(surgery)
    return None


def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    patient = PATIENTS.get(patient_id)
    return deepcopy(patient) if patient else None


def get_readiness_data(patient_id: str) -> Optional[Dict[str, Any]]:
    readiness = READINESS_DATA.get(patient_id)
    return deepcopy(readiness) if readiness else None


def create_task(task: Dict[str, Any]) -> Dict[str, Any]:
    TASKS.append(deepcopy(task))
    return deepcopy(task)


def list_tasks(
    patient_id: Optional[str] = None,
    surgery_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    items = TASKS
    if patient_id:
        items = [task for task in items if task["patient_id"] == patient_id]
    if surgery_id:
        items = [task for task in items if task["surgery_id"] == surgery_id]
    if status:
        items = [task for task in items if task["status"] == status]
    return deepcopy(items)


def create_notification(notification: Dict[str, Any]) -> Dict[str, Any]:
    NOTIFICATIONS.append(deepcopy(notification))
    return deepcopy(notification)


def list_notifications() -> List[Dict[str, Any]]:
    return deepcopy(NOTIFICATIONS)


def next_task_id() -> str:
    return f"T{next(_task_counter):03d}"


def next_notification_id() -> str:
    return f"N{next(_notification_counter):03d}"


def next_briefing_id() -> str:
    return f"B{next(_briefing_counter):03d}"


def next_workflow_id() -> str:
    return f"W{next(_workflow_counter):03d}"
