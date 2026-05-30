#!/usr/bin/env python3
"""
Generate Beacon-compatible imaging JSON from GLIS-RT NBIA manifest XLSX.

No third-party dependencies are required. The script parses XLSX internals
(zip+xml), creates a deterministic patient crosswalk, and emits:
- src/data/glis-rt-imaging.json
- src/data/glis-rt-patient-map.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS_MAIN = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}


def col_to_idx(col: str) -> int:
    idx = 0
    for ch in col:
        if ch.isalpha():
            idx = idx * 26 + (ord(ch.upper()) - 64)
    return idx - 1


def parse_xlsx_rows(xlsx_path: Path) -> list[list[str | None]]:
    with zipfile.ZipFile(xlsx_path) as zf:
        names = set(zf.namelist())

        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in names:
            shared_root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in shared_root.findall("m:si", NS_MAIN):
                parts = [t.text or "" for t in si.findall(".//m:t", NS_MAIN)]
                shared_strings.append("".join(parts))

        workbook = ET.fromstring(zf.read("xl/workbook.xml"))
        first_sheet = workbook.find(".//m:sheets/m:sheet", NS_MAIN)
        if first_sheet is None:
            raise RuntimeError("Workbook has no sheets")

        rid = first_sheet.attrib.get(
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        )
        if not rid:
            raise RuntimeError("Sheet relationship ID missing")

        rel_root = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        rel_map = {
            r.attrib["Id"]: r.attrib["Target"]
            for r in rel_root.findall("r:Relationship", NS_REL)
        }
        target = rel_map[rid].lstrip("/")
        sheet_path = target if target.startswith("xl/") else f"xl/{target}"

        sheet_root = ET.fromstring(zf.read(sheet_path))
        rows = sheet_root.findall(".//m:sheetData/m:row", NS_MAIN)

        parsed_rows: list[list[str | None]] = []
        for row in rows:
            values: dict[int, str | None] = {}
            max_i = -1
            for cell in row.findall("m:c", NS_MAIN):
                ref = cell.attrib.get("r", "")
                col = "".join(ch for ch in ref if ch.isalpha())
                col_index = col_to_idx(col) if col else max_i + 1

                cell_type = cell.attrib.get("t")
                v = cell.find("m:v", NS_MAIN)
                inline_text = cell.find("m:is/m:t", NS_MAIN)
                raw = v.text if v is not None else (inline_text.text if inline_text is not None else None)

                value: str | None = raw
                if cell_type == "s" and raw is not None:
                    try:
                        value = shared_strings[int(raw)]
                    except Exception:
                        value = raw

                values[col_index] = value
                max_i = max(max_i, col_index)

            parsed_rows.append([values.get(i) for i in range(max_i + 1)] if max_i >= 0 else [])

        return parsed_rows


def safe_get(row: list[str | None], header_index: dict[str, int], key: str) -> str | None:
    idx = header_index.get(key)
    if idx is None or idx >= len(row):
        return None
    return row[idx]


def parse_date(value: str | None) -> dt.date | None:
    if not value:
        return None
    try:
        # values look like: "2008-07-09 00:00:00.0"
        return dt.date.fromisoformat(value.split(" ")[0])
    except Exception:
        return None


def seeded_int(value: str) -> int:
    digest = hashlib.sha1(value.encode("utf-8")).hexdigest()
    return int(digest[:10], 16)


def normalize_text(value: str | None, fallback: str = "unknown") -> str:
    if value is None:
        return fallback
    clean = value.strip()
    return clean if clean else fallback


def build_outputs(rows: list[list[str | None]]) -> tuple[list[dict], list[dict]]:
    if not rows:
        raise RuntimeError("No rows found in workbook")

    header = rows[0]
    header_index = {name: i for i, name in enumerate(header) if name}

    required_cols = [
        "Patient ID",
        "Series Instance UID",
        "Modality",
        "Series Description",
        "Series Date",
        "Body Part Examined",
        "Manufacturer",
        "Manufacturer Model Name",
        "Study Description",
    ]
    missing = [col for col in required_cols if col not in header_index]
    if missing:
        raise RuntimeError(f"Missing required columns: {missing}")

    # Build deterministic mapping: first 50 GLIS patients -> PT-001..PT-050
    glis_patient_ids = sorted(
        {
            safe_get(r, header_index, "Patient ID")
            for r in rows[1:]
            if safe_get(r, header_index, "Patient ID")
        }
    )
    beacon_patients = [f"PT-{i:03d}" for i in range(1, 51)]

    glis_to_beacon = {
        glis_id: beacon_patients[idx]
        for idx, glis_id in enumerate(glis_patient_ids[: len(beacon_patients)])
    }

    patient_map = [
        {
            "beaconPatientId": beacon_id,
            "sourcePatientId": glis_id,
            "sourceDataset": "GLIS-RT NBIA Manifest",
        }
        for glis_id, beacon_id in sorted(glis_to_beacon.items(), key=lambda kv: kv[1])
    ]

    today = dt.date.today()

    per_patient_counter: dict[str, int] = {}
    imaging_rows: list[dict] = []

    for row in rows[1:]:
        glis_patient_id = safe_get(row, header_index, "Patient ID")
        if not glis_patient_id or glis_patient_id not in glis_to_beacon:
            continue

        beacon_patient_id = glis_to_beacon[glis_patient_id]
        series_uid = normalize_text(safe_get(row, header_index, "Series Instance UID"), "no-series-uid")
        modality = normalize_text(safe_get(row, header_index, "Modality"), "UNKNOWN")
        series_desc = normalize_text(safe_get(row, header_index, "Series Description"), "No description")
        study_desc = normalize_text(safe_get(row, header_index, "Study Description"), "No study description")
        body_part = normalize_text(safe_get(row, header_index, "Body Part Examined"), "UNKNOWN")
        manufacturer = normalize_text(safe_get(row, header_index, "Manufacturer"), "Unknown")
        model_name = normalize_text(safe_get(row, header_index, "Manufacturer Model Name"), "Unknown")
        series_date_raw = safe_get(row, header_index, "Series Date")
        source_date = parse_date(series_date_raw)

        seed = seeded_int(series_uid)

        # Synthetic recency for demo readiness workflows.
        days_ago = seed % 86 + 4  # 4..89
        synthetic_date = today - dt.timedelta(days=days_ago)
        expiration_days = 30 if modality in {"REG", "RTSTRUCT"} else 90
        expiration_date = synthetic_date + dt.timedelta(days=expiration_days)

        is_expired = expiration_date < today
        status = "expired" if is_expired else "completed"

        per_patient_counter.setdefault(beacon_patient_id, 0)
        per_patient_counter[beacon_patient_id] += 1
        local_idx = per_patient_counter[beacon_patient_id]

        imaging_rows.append(
            {
                "id": f"GLIS-{beacon_patient_id}-{local_idx:03d}",
                "patientId": beacon_patient_id,
                "type": f"{modality} - {series_desc}",
                "status": status,
                "date": synthetic_date.isoformat(),
                "expirationDate": expiration_date.isoformat(),
                "isExpired": is_expired,
                "findings": (
                    f"GLIS-RT import ({glis_patient_id}). Study: {study_desc}. "
                    f"Series modality {modality}, body part {body_part}. "
                    f"Manufacturer: {manufacturer} {model_name}. "
                    f"Source series date: {source_date.isoformat() if source_date else 'unknown'}."
                ),
            }
        )

    imaging_rows.sort(key=lambda item: (item["patientId"], item["date"], item["id"]))
    return imaging_rows, patient_map


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to GLIS-RT-manifest XLSX")
    parser.add_argument(
        "--out-imaging",
        default="src/data/glis-rt-imaging.json",
        help="Output path for imaging JSON",
    )
    parser.add_argument(
        "--out-map",
        default="src/data/glis-rt-patient-map.json",
        help="Output path for patient crosswalk JSON",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    rows = parse_xlsx_rows(input_path)
    imaging_rows, patient_map = build_outputs(rows)

    out_imaging = Path(args.out_imaging)
    out_map = Path(args.out_map)
    out_imaging.parent.mkdir(parents=True, exist_ok=True)
    out_map.parent.mkdir(parents=True, exist_ok=True)

    out_imaging.write_text(json.dumps(imaging_rows, indent=2) + "\n", encoding="utf-8")
    out_map.write_text(json.dumps(patient_map, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {len(imaging_rows)} imaging records -> {out_imaging}")
    print(f"Wrote {len(patient_map)} patient mappings -> {out_map}")


if __name__ == "__main__":
    main()
