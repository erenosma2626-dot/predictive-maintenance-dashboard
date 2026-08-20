# -*- coding: utf-8 -*-
"""
Operator Solution Evaluator (Scene 4 Gate)
Compares the technician's proposed solution against the official SOP and asset specs.
Returns structured score, pass/fail status, and targeted feedback.
"""
import json
import re
from typing import Dict, Any, Optional
from src.bearing_assistant.llm import call_groq
from src.bearing_assistant.rag import store

SYSTEM_PROMPT_EVALUATOR = """Sen bir Endüstriyel Bakım & Güvenlik Baş Denetçisisin.
GÖREVİN: Sahadaki operatörün arızalı rulman için yazdığı 1-2 cümlelik ekip çözüm ve bilgilendirme notunu, makinenin resmi Standart Operasyon Prosedürü (SOP) ile karşılaştırarak doğrulamaktır.

DEĞERLENDİRME KRİTERLERİ:
1. Temel İşlem Doğruluğu: Yazılan 1-2 cümlelik özet; parça değişimi, doğru yağlama miktarı/tipi, şaft/balans temizliği veya indüksiyonla montaj sıcaklığı (110°C) gibi temel teknik noktalardan en az 1-2 tanesini doğru ifade ediyor mu?
2. Birebir kelimelerin aynı olması gerekmez; aynı teknik anlamı ve doğru müdahaleyi ifade etmesi tam puan için yeterlidir.
3. Puanlama (0 - 100):
   - 65 ve üzeri: Başarılı (is_correct: true)
   - 65 altı: Yetersiz veya alakasız (is_correct: false)

DÖNÜŞ FORMATI (Yalnızca saf JSON nesnesi döndür):
{
  "is_correct": true,
  "score": 90,
  "feedback": "Kısa ve tebrik edici Türkçe değerlendirme.",
  "missing_steps": []
}
"""


def evaluate_solution(
    user_solution: str,
    machine_id: str,
    fault_code: Optional[str] = None,
    fault_type: Optional[str] = None,
) -> Dict[str, Any]:
    asset = store.get_asset(machine_id)
    fault = store.get_fault_by_code(fault_code) if fault_code else None

    if not fault and fault_type:
        cat_faults = store.get_faults_by_category(fault_type)
        if cat_faults:
            fault = cat_faults[0]

    # Fallback to general fault if still not found
    if not fault:
        fault = store.fault_catalog[0]

    user_prompt = f"""
### 📍 MAKİNE BİLGİSİ:
- Makine ID: {machine_id} ({asset['display_name'] if asset else 'Rulman Ünitesi'})
- Rulman: {asset['bearing_model'] if asset else 'Standart Rulman'} | Gres: {asset['lubricant_type'] if asset else 'Endüstriyel Gres'} ({asset['grease_charge_grams'] if asset else 20}g)

### ⚠️ TEŞHİS EDİLEN ARIZA & RESMİ SOP:
- Arıza: {fault['fault_code']} - {fault['fault_name']}
- Kategori: {fault['fault_category']}
- Kök Nedenler: {', '.join(fault['root_causes'])}
- RESMİ STANDART ONARIM PROSEDÜRÜ (SOP):
{fault['standard_operating_procedure']}

### ✍️ OPERATÖRÜN YAZDIĞI ÇÖZÜM ÖNERİSİ:
"{user_solution}"

Yukarıdaki çözümü resmi SOP ile karşılaştır ve JSON formatında puanla.
"""

    raw_response = call_groq(SYSTEM_PROMPT_EVALUATOR, user_prompt)

    # Clean json from response if wrapped in code blocks
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        data = json.loads(cleaned)
        return {
            "is_correct": bool(data.get("is_correct", False)),
            "score": int(data.get("score", 0)),
            "feedback": str(data.get("feedback", "")),
            "missing_steps": list(data.get("missing_steps", [])),
            "official_sop": fault["standard_operating_procedure"],
        }
    except Exception as e:
        print(f"[evaluate_solution] JSON parsing failed: {e}. Raw: {raw_response}")
        # Rule-based fallback grading
        user_lower = user_solution.lower()
        score = 0
        missing = []
        if any(w in user_lower for w in ["değiş", "sök", "yeni", "rulman", "tak"]):
            score += 40
        if any(w in user_lower for w in ["gres", "yağ", "polyrex", "shc", "shell", "klüber"]):
            score += 30
        if any(w in user_lower for w in ["ısıt", "110", "indüksiyon", "tork", "hizala", "balans"]):
            score += 25

        is_corr = score >= 65
        return {
            "is_correct": is_corr,
            "score": max(score, 50 if is_corr else 30),
            "feedback": "Çözümünüz temel teknik adımları içeriyor." if is_corr else "Çözümünüz eksik adımlar barındırıyor, lütfen kılavuza göre detaylandırın.",
            "missing_steps": missing or ["Doğru montaj sıcaklığı (110°C) ve belirtilen miktarda gres dolumu."],
            "official_sop": fault["standard_operating_procedure"],
        }
