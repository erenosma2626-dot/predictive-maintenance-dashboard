# -*- coding: utf-8 -*-
"""
RAG (Retrieval-Augmented Generation) & Knowledge Retrieval Engine
Loads bearing assets, 30+ fault catalog, maintenance history, and engineering manual.
Provides structured deterministic and semantic retrieval for Scene 2 (Chatbot).
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
            for f in self.fault_catalog:
                keywords = [
                    f["fault_name"].lower(),
                    f["fault_category"].lower(),
                    f.get("description", "").lower(),
                ]
                q_lower = question.lower()
                if (
                    any(kw in q_lower for kw in ["iç bilezik", "bpfi", "inner"]) and f["fault_category"] == "inner_race"
                    or any(kw in q_lower for kw in ["dış bilezik", "bpfo", "outer"]) and f["fault_category"] == "outer_race"
                    or any(kw in q_lower for kw in ["bilye", "makara", "roller", "bsf", "cage", "kafes"]) and f["fault_category"] == "roller_element"
                    or any(kw in q_lower for kw in ["yağ", "grease", "lubrication", "starvation", "yağsız"]) and f["fault_category"] == "lubrication"
                    or any(kw in q_lower for kw in ["balans", "unbalance", "misalignment", "hizasızlık", "gevşeklik"]) and f["fault_category"] == "mechanical_stress"
                ):
                    matching_faults.append(f)

        # 3. Retrieve Maintenance History
        history_records = self.get_history_for_asset(resolved_asset_id) if resolved_asset_id else self.history[:4]

        return {
            "asset": asset_data,
            "faults": matching_faults[:3],
            "history": history_records[:3],
        }


# Singleton instance
store = BearingKnowledgeStore()

SYSTEM_PROMPT_CHATBOT = """Sen endüstriyel rulman ve dönen ekipman arıza teşhisinde uzman, sahada pratik ve net çözümler sunan bir Endüstriyel AI Bakım Mühendisisin.

KURALLAR:
1. Asla upuzun, karmaşık akademik tablolar ve kafa karıştırıcı paragraflar üretme! Yanıtların kısa, öz, net ve doğrudan sahada uygulanabilir olsun (maksimum 100-120 kelime).
2. Yanıtını 3 kısa bölümde sun:
   • 1. Teşhis & Kök Neden: (1-2 cümle)
   • 2. Temel Müdahale Adımları: (Madde imleriyle 2-3 kısa adım: Değişecek parça, montaj sıcaklığı örn. 110°C, gres tipi ve gramı).
   • 3. Ekip Bilgilendirme Notu (ZORUNLU):
     "Ekibi kısaca şu şekilde bilgilendirebilirsiniz: '[Makine ID'de şu arıza oluşmuş, LOTO sonrası şu parça sökülüp indüksiyonla 110°C ısıtılarak takılmalı ve şu kadar gram şu gres basılmalı.]'"
3. Operatörün Sahne 4 çözüm ekranına yazacağı 1-2 cümlelik pratik özet, 3. maddedeki tırnak içindeki net cümle olacaktır.
4. Sıfır halüsinasyon: Yalnızca verilen bağlamdaki doğru rulman modelleri, gres miktarları ve sıcaklıkları kullan.
"""


def build_chat_user_prompt(question: str, context: Dict[str, Any]) -> str:
    parts = []

    # Asset context
    if context.get("asset"):
        a = context["asset"]
        parts.append(f"### 📍 HEDEF MAKİNE / RULMAN VARLIĞI:\n"
                     f"- ID: {a['asset_id']} ({a['display_name']})\n"
                     f"- Makine & Konum: {a['machine_type']} - {a['location_in_plant']} ({a['bearing_position']})\n"
                     f"- Rulman Modeli: {a['bearing_model']} ({a['bearing_type']})\n"
                     f"- Yağlama: {a['lubricant_type']} | Miktar: {a['grease_charge_grams']}g | Aralık: {a['lubrication_interval_hours']} saat\n"
                     f"- Çalışma Hızı: {a['nominal_rpm']} RPM | Nominal Sıcaklık: {a['operating_temp_nominal_c']}°C\n")

    # Fault context
    if context.get("faults"):
        parts.append("### ⚠️ ARIZA KATALOĞU VE RESMİ STANDART OPERASYON PROSEDÜRÜ (SOP):\n")
        for f in context["faults"]:
            parts.append(f"Arıza Kodu: {f['fault_code']} - {f['fault_name']}\n"
                         f"- Kategori: {f['fault_category']} | Şiddet: {f['severity']} ({f['iso_10816_zone']})\n"
                         f"- Spektral İz: {f['spectral_signature']}\n"
                         f"- Kurtosis Aralığı: {f['kurtosis_range']} | Sıcaklık Artışı: +{f['thermal_rise_c']}°C\n"
                         f"- Kök Nedenler: {', '.join(f['root_causes'])}\n"
                         f"- Acil Önlem: {f['immediate_action']}\n"
                         f"- STANDART ONARIM PROSEDÜRÜ (SOP):\n{f['standard_operating_procedure']}\n")

    # History context
    if context.get("history"):
        parts.append("### 📜 GEÇMİŞ BAKIM VE ARIZA KAYITLARI:\n")
        for h in context["history"]:
            parts.append(f"- İş Emri: {h['record_id']} ({h['event_date']}) - {h['shift']}\n"
                         f"  Belirti: {h['reported_symptom']}\n"
                         f"  Teşhis: {h['fault_code_diagnosed']} | Duruş: {h['downtime_minutes']} dk\n"
                         f"  Yapılan İşlem: {h['actions_taken']}\n"
                         f"  Kök Neden: {h['root_cause_summary']}\n")

    parts.append(f"### ❓ KULLANICI SORUSU:\n{question}\n\nLütfen yukarıdaki bağlam doğrultusunda net, teknik ve maddeler halinde rehberlik sağla.")
    return "\n".join(parts)
