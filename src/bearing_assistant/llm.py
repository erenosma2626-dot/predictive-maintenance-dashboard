# -*- coding: utf-8 -*-
"""
Groq & LLM Interface for Bearing Assistant
Single gateway to Groq using the hardcoded standard configuration.
"""
from groq import Groq
from src.bearing_assistant import config

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is None and config.GROQ_API_KEY:
        _groq_client = Groq(api_key=config.GROQ_API_KEY)
    return _groq_client


def call_groq(system_prompt: str, user_prompt: str) -> str:
    """
    Calls Groq with the fixed standard parameters.
    Falls back to Azure if Groq fails or key is missing.
    """
    client = _get_groq_client()
    if client:
        try:
            response = client.chat.completions.create(
                model=config.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_completion_tokens=config.GROQ_MAX_COMPLETION_TOKENS,
                reasoning_effort=config.GROQ_REASONING_EFFORT,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[bearing_assistant.llm] Groq call error: {e}")
            # Try without reasoning_effort if unsupported by model variant
            try:
                response = client.chat.completions.create(
                    model=config.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_completion_tokens=config.GROQ_MAX_COMPLETION_TOKENS,
                )
                return response.choices[0].message.content
            except Exception as e2:
                print(f"[bearing_assistant.llm] Groq fallback attempt error: {e2}")

    # Fallback to Azure OpenAI if available
    if config.AZURE_AI_ENDPOINT and config.AZURE_AI_KEY:
        try:
            from azure.ai.inference import ChatCompletionsClient
            from azure.core.credentials import AzureKeyCredential
            base_url = config.AZURE_AI_ENDPOINT.split("/api/")[0]
            az_client = ChatCompletionsClient(
                endpoint=f"{base_url}/models",
                credential=AzureKeyCredential(config.AZURE_AI_KEY),
            )
            response = az_client.complete(
                model=config.AZURE_AI_DEPLOYMENT,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=config.GROQ_MAX_COMPLETION_TOKENS,
            )
            return response.choices[0].message.content
        except Exception as az_e:
            print(f"[bearing_assistant.llm] Azure fallback error: {az_e}")

    return "AI Asistan servisine şu anda erişilemiyor. Lütfen sistem yöneticiniz ile iletişime geçiniz."
