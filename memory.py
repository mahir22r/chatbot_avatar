import json
import os
import time
from typing import List, Dict

MEMORY_FILE = "mike_memory.json"

# Simple file-based memory for web compatibility
def load_memory_entries() -> List[Dict]:
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_memory_entries(entries: List[Dict]):
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

def add_memory(text: str, role: str = "user"):
    entries = load_memory_entries()
    entry = {"role": role, "content": text, "ts": int(time.time())}
    entries.append(entry)
    save_memory_entries(entries)

def update_context(role, content):
    add_memory(content, role)

def build_prompt_with_memory(user_text):
    """
    Build the messages payload for the LLM.
    """
    entries = load_memory_entries()
    
    # Enhanced system prompt for better responses
    system_prompt = (
        "You are Mike, a helpful, friendly, and intelligent AI assistant. "
        "Your goal is to provide accurate, relevant, and conversational answers to user questions. "
        "Always answer directly and completely. "
        "Be warm, engaging, and use natural language. "
        "If you don't know something, say so honestly. "
        "Keep responses concise but informative. "
        "Remember previous context from this conversation when relevant."
    )
    messages = [{"role": "system", "content": system_prompt}]
    
    # include recent conversation history (last 6 messages for context)
    for item in entries[-6:]:
        messages.append({"role": item["role"], "content": item["content"]})
    
    # finally the new user message
    messages.append({"role": "user", "content": user_text})
    return messages

def retrieve(query: str, k: int = 5):
    """Simple retrieval for web compatibility"""
    entries = load_memory_entries()
    return entries[-k:]  # Return last k entries