# -*- coding: utf-8 -*-
"""
RAG (Retrieval-Augmented Generation) & Knowledge Retrieval Engine
Strict, evidence-grounded technical assistant for industrial rolling bearings.
Enforces zero-hallucination, strict source attribution, and actionable field guidance.
"""
import json
import os
import re
from typing import Optional, List, Dict, Any
from src.bearing_assistant import config


class BearingKnowledgeStore:
    def __init__(self):
        self.assets: List[Dict[str, Any]] = []
        self.fault_catalog: List[Dict[str, Any]] = []
        self.history: List[Dict[str, Any]] = []
        self.manual_text: str = ""
        self._load_data()

    def _load_data(self):
        try:
            if os.path.exists(config.ASSETS_PATH):
                with open(config.ASSETS_PATH, "r", encoding="utf-8") as f:
                    self.assets = json.load(f)
            if os.path.exists(config.CATALOG_PATH):
                with open(config.CATALOG_PATH, "r", encoding="utf-8") as f:
                    self.fault_catalog = json.load(f)
            if os.path.exists(config.HISTORY_PATH):
                with open(config.HISTORY_PATH, "r", encoding="utf-8") as f:
                    self.history = json.load(f)
            if os.path.exists(config.MANUAL_PATH):
                with open(config.MANUAL_PATH, "r", encoding="utf-8") as f:
                    self.manual_text = f.read()
        except Exception as e:
            print(f"[BearingKnowledgeStore] Error loading knowledge base: {e}")

    def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        target = asset_id.strip().upper()
        for a in self.assets:
            if a["asset_id"].upper() == target or target in [al.upper() for al in a.get("aliases", [])]:
                return a
        return None

    def get_fault_by_code(self, fault_code: str) -> Optional[Dict[str, Any]]:
        target = fault_code.strip().upper()
        for f in self.fault_catalog:
            if f["fault_code"].upper() == target:
                return f
        return None

    def get_faults_by_category(self, category: str) -> List[Dict[str, Any]]:
        target = category.strip().lower()
        return [f for f in self.fault_catalog if f.get("fault_category", "").lower() == target]

    def get_history_for_asset(self, asset_id: str) -> List[Dict[str, Any]]:
        target = asset_id.strip().upper()
        return [h for h in self.history if h["asset_id"].upper() == target]

    def resolve_query_context(self, question: str, target_asset_id: Optional[str] = None, target_fault_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Determines the relevant assets, fault catalog entries, maintenance records, and manual snippets.
        """
        q_upper = question.upper()
        resolved_asset_id = target_asset_id

        # 1. Detect Asset ID if not explicitly provided
        if not resolved_asset_id:
            match = re.search(r"\b(M-?0?[1-9]|M-?1[0-2])\b", q_upper)
            if match:
                raw_id = match.group(1).replace("-", "")
                if len(raw_id) == 2 and raw_id.startswith("M") and raw_id[1].isdigit():
                    resolved_asset_id = f"M0{raw_id[1]}"
                else:
                    resolved_asset_id = raw_id

        asset_data = self.get_asset(resolved_asset_id) if resolved_asset_id else None

        # 2. Detect Fault Code or Category
        fault_data = None
        if target_fault_code:
            fault_data = self.get_fault_by_code(target_fault_code)
        else:
            code_match = re.search(r"(FLT-[A-Z]+-[A-Z]+-\d{2})", q_upper)
            if code_match:
                fault_data = self.get_fault_by_code(code_match.group(1))

        # If no exact code, search keywords in catalog
        matching_faults = []
        if fault_data:
            matching_faults.append(fault_data)
        else:
            q_lower = question.lower()
            for f in self.fault_catalog:
                if (
                    any(kw in q_lower for kw in ["iç bilezik", "bpfi", "inner race", "iç halka"]) and f["fault_category"] == "inner_race"
                    or any(kw in q_lower for kw in ["dış bilezik", "bpfo", "outer race", "dış halka"]) and f["fault_category"] == "outer_race"
                    or any(kw in q_lower for kw in ["bilye", "makara", "roller", "bsf", "cage", "kafes"]) and f["fault_category"] == "roller_element"
                    or any(kw in q_lower for kw in ["yağ", "grease", "lubrication", "starvation", "yağsız", "gres"]) and f["fault_category"] == "lubrication"
                    or any(kw in q_lower for kw in ["balans", "unbalance", "misalignment", "hizasızlık", "gevşeklik"]) and f["fault_category"] == "mechanical_stress"
                ):
                    matching_faults.append(f)

        # 3. Retrieve Maintenance History
        history_records = self.get_history_for_asset(resolved_asset_id) if resolved_asset_id else []

        return {
            "asset": asset_data,
            "faults": matching_faults[:3],
            "history": history_records[:4],
        }


# Singleton instance
store = BearingKnowledgeStore()

SYSTEM_PROMPT_CHATBOT = """You are an expert Industrial Bearing Troubleshooting & Maintenance Copilot.

STRICT RULES - follow these exactly:
1. Use ONLY the information provided in the "SOURCES" section below. Do not use any outside general knowledge, assumptions, or fabricated specifications.
2. If the provided sources do not contain enough information to answer the question, state plainly: "Verilen kaynaklarda bu bilgi bulunmamaktadır." instead of guessing or filling gaps.
3. Every claim you make must be traceable to a specific source in the context (e.g. "[Kaynak: Varlık Özellik Kartı | M01]" or "[Kaynak: Arıza Kataloğu & SOP | FLT-INNER-FAT-01]" or "[Kaynak: Bakım Geçmişi]").
4. Clearly distinguish between two kinds of evidence:
   - Official technical documentation & manufacturer SOPs (binding technical facts, mounting temp 110°C, grease type, torque, procedures).
   - Maintenance history records (what happened previously on THIS specific machine - historical work order logs).
5. If maintenance history shows "no record found" for an asset, state that plainly - do NOT interpret "no record" as "this asset has never had any issues." Absence of a record is not evidence of absence of a problem.
6. GREETINGS & CASUAL CONVERSATION:
   - If the user is greeting, saying hi, or making general conversation ("naber", "selam", "merhaba", "sen kimsin", "nasılsın", "hello", "hi"):
   - Do NOT produce a fault diagnosis, repair steps, or symptom list.
   - Reply warmly and concisely in 1-2 polite sentences, introduce yourself as the Industrial Bearing Copilot, and invite questions about machine specs, failure diagnosis, mounting procedures (e.g. induction heating to 110°C), grease charges, or SOP steps.
7. TECHNICAL INQUIRIES & FAULT DIAGNOSIS:
   - Keep answers concise, direct, and actionable (maximum 100-120 words).
   - Present technical guidance in 3 structured sections:
     • 1. Teşhis & Kök Neden: (1-2 sentences identifying the issue and root cause from sources).
     • 2. Temel Müdahale Adımları: (2-3 bullet points: replacement part, mounting temperature e.g. 110°C induction, exact grease type and grams).
     • 3. Ekip Bilgilendirme Notu (MANDATORY):
       "Ekibi kısaca şu şekilde bilgilendirebilirsiniz: '[1-2 sentence actionable summary mentioning target machine, LOTO, mounting temp, and grease charge.]'"
8. TECHNICAL TERMINOLOGY:
   - Use correct Turkish engineering terminology: 'Derin oluklu bilyalı rulman' (Deep groove ball bearing), 'Silindirik makaralı rulman' (Cylindrical roller bearing). Never use literal machine translations like 'derin gözü bal'.
"""


def format_asset_chunk(asset: Dict[str, Any]) -> str:
    factors = asset.get("fault_frequency_factors", {})
    return (
        f"[Kaynak: Varlık Özellik Kartı | {asset.get('asset_id')} - {asset.get('display_name')}]\n"
        f"- Makine & Konum: {asset.get('machine_type')} | {asset.get('location_in_plant')} ({asset.get('bearing_position')})\n"
        f"- Rulman Modeli: {asset.get('bearing_model')} ({asset.get('bearing_type')})\n"
        f"- Boyutlar: Mil Çapı: {asset.get('shaft_diameter_mm')} mm, Dış Çap: {asset.get('outer_diameter_mm')} mm, Genişlik: {asset.get('width_mm')} mm\n"
        f"- Çalışma Şartları: {asset.get('nominal_rpm')} RPM | Radyal Yük: {asset.get('radial_load_kn')} kN | Eksenel Yük: {asset.get('axial_load_kn')} kN | Nominal Sıcaklık: {asset.get('operating_temp_nominal_c')}°C\n"
        f"- Yağlama Spesifikasyonu: {asset.get('lubricant_type')} | Dolum: {asset.get('grease_charge_grams')} g | Aralık: {asset.get('lubrication_interval_hours')} saat\n"
        f"- Kinematik Frekans Çarpanları: BPFI: {factors.get('bpfi_factor', '-')}x, BPFO: {factors.get('bpfo_factor', '-')}x, BSF: {factors.get('bsf_factor', '-')}x, FTF: {factors.get('ftf_factor', '-')}x\n"
    )


def format_fault_chunk(fault: Dict[str, Any]) -> str:
    root_causes = ", ".join(fault.get("root_causes", []))
    return (
        f"[Kaynak: Arıza Kataloğu & SOP | Kod: {fault.get('fault_code')} - {fault.get('fault_name')}]\n"
        f"- Kategori: {fault.get('fault_category')} | Şiddet: {fault.get('severity')} ({fault.get('iso_10816_zone')})\n"
        f"- Spektral İz: {fault.get('spectral_signature')}\n"
        f"- Kurtosis Aralığı: {fault.get('kurtosis_range')} | Termal Artış: +{fault.get('thermal_rise_c')}°C\n"
        f"- Kök Nedenler: {root_causes}\n"
        f"- Acil Eylem: {fault.get('immediate_action')}\n"
        f"- STANDART OPERASYON PROSEDÜRÜ (SOP):\n{fault.get('standard_operating_procedure')}\n"
    )


def format_history_record(record: Dict[str, Any]) -> str:
    return (
        f"[Kaynak: Bakım Geçmişi | Varlık {record.get('asset_id')} | İş Emri {record.get('record_id')} ({record.get('event_date')}) - {record.get('shift')}]\n"
        f"- Bildirilen Belirti: {record.get('reported_symptom')}\n"
        f"- Teşhis Edilen Arıza: {record.get('fault_code_diagnosed')} | Duruş Süresi: {record.get('downtime_minutes')} dk\n"
        f"- Yapılan İşlem: {record.get('actions_taken')}\n"
        f"- Kök Neden Özeti: {record.get('root_cause_summary')}\n"
    )


def build_chat_user_prompt(question: str, context: Dict[str, Any]) -> str:
    parts = [f"USER QUESTION: {question}\n"]

    asset = context.get("asset")
    if asset:
        parts.append(f"RESOLVED ASSET: {asset.get('asset_id')} - {asset.get('display_name')}\n")

    parts.append("=== SOURCES ===\n")

    # 1. Official Asset Specifications
    if asset:
        parts.append("--- Official Asset Specification & Technical Standards ---")
        parts.append(format_asset_chunk(asset))
        parts.append("")
    else:
        parts.append("--- Official Asset Specification & Technical Standards ---\n(No specific asset identified.)\n")

    # 2. Fault Catalog & SOPs
    faults = context.get("faults", [])
    if faults:
        parts.append("--- Fault Catalog & Standard Operating Procedures (SOP) ---")
        for f in faults:
            parts.append(format_fault_chunk(f))
        parts.append("")
    else:
        parts.append("--- Fault Catalog & Standard Operating Procedures (SOP) ---\n(No direct matching fault catalog entry for this query.)\n")

    # 3. Maintenance History
    history = context.get("history", [])
    if asset and not history:
        parts.append("--- Maintenance History ---\n(No maintenance history record exists for this asset.)\n")
    elif history:
        parts.append("--- Maintenance History ---")
        for h in history:
            parts.append(format_history_record(h))
        parts.append("")
    else:
        parts.append("--- Maintenance History ---\n(No relevant maintenance history found for this query.)\n")

    # 4. Engineering Manual Excerpt if available
    if store.manual_text:
        parts.append("--- Official Engineering Manual (ISO 10816-3 & Mounting Guidelines) ---")
        parts.append("[Kaynak: STD-ENG-BRG-2026-V4 Rulman Mühendislik Kılavuzu]\n"
                     "- Montaj Kuralı: Bilyalı ve makaralı rulmanlar indüksiyonla tam 110°C ısıtılarak takılmalıdır (asla 125°C üzeri ısıtılmamalıdır).\n"
                     "- Yağlama Kuralı: Rulman iç boşluğunun %30-%50'si belirtilen NLGI-2 sentetik gresle doldurulmalıdır.\n"
                     "- LOTO Kuralı: Müdahale öncesi Lockout/Tagout (LOTO) izolasyonu zorunludur.\n")

    parts.append(
        "=== END SOURCES ===\n\n"
        "Answer the user's question using ONLY the sources above, following the system instructions strictly."
    )

    return "\n".join(parts)
