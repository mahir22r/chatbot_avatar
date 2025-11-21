import threading
import time
import json
import os
from audio import continuous_record_blocks
from stt_client import transcription_from_wav
from llm_client import chat_with_llm
from tts_client import AzureTTS, speaking_event
from utils import AUDIO_BLOCK_SECONDS, AUDIO_SAMPLE_RATE, AUDIO_CHANNELS
import memory  # new module

# Persistent resources
tts = AzureTTS()
stop_event = threading.Event()
paused = threading.Event()

# Load basic chat history (kept in memory module file)
conversation_history = memory.load_memory_entries()  # list of dicts with role/content/ts


def contains_command(text, commands):
    text = text.lower().strip()
    return any(cmd in text for cmd in commands)


def update_context(role, content):
    """Add to persistent memory and embeddings."""
    memory.add_memory(content, role)
    # keep a small in-memory view for sending to LLM
    conversation_history.append({"role": role, "content": content})
    if len(conversation_history) > 10:
        del conversation_history[0]


def build_prompt_with_memory(user_text):
    """
    Build the messages payload for the LLM.
    We will:
     - Retrieve top-5 related persistent memories
     - Prepend them as assistant/user notes for context
     - Include the latest transient conversation_history (last 6)
    """
    retrieved = memory.retrieve(user_text, k=5)
    # convert retrieved into system-ish lines to prime model
    memory_snippets = []
    for r in retrieved:
        memory_snippets.append(f"[Memory-{r.get('role')}] {r.get('content')}")
    # Basic system prompt with persona + memory summary
    system_prompt = (
        "You are Mike, a friendly, witty, and emotionally-intelligent AI friend. "
        "You remember previous sessions. Use the memory notes to stay consistent. "
        "Keep replies short, warm, and human-like."
    )
    messages = [{"role": "system", "content": system_prompt}]
    if memory_snippets:
        messages.append({"role": "system", "content": "Relevant memory:\n" + "\n".join(memory_snippets)})
    # include recent conversation history
    for item in conversation_history[-6:]:
        messages.append({"role": item["role"], "content": item["content"]})
    # finally the new user message
    messages.append({"role": "user", "content": user_text})
    return messages


def on_audio_block(wav_bytes):
    if not wav_bytes:
        print("[Silence detected — skipping]")
        return

    print("\n[audio block recorded] Sending to STT...")
    text = transcription_from_wav(wav_bytes)
    if not text:
        print("No transcription or STT error")
        return

    text = text.strip()
    print("User said:", text)
    lower_text = text.lower()

    # Priority exit phrases
    exit_phrases = [
        "stop the chatbot", "completely stop", "end the chat",
        "terminate", "stop completely", "shut down",
        "exit chat", "quit chatbot", "bye", "goodbye", "enough"
    ]
    if any(p in lower_text for p in exit_phrases):
        print("[Mike] Got it — ending the chat now. Take care!")
        tts.stop()
        stop_event.set()
        memory.save_memory_entries(memory.load_memory_entries())  # ensure save
        time.sleep(0.5)
        exit(0)

    # pause (short)
    if lower_text.strip() in ["stop", "pause", "hold on", "wait"]:
        print("[Mike] Okay, I’ll pause. Say 'continue' when you’re ready.")
        tts.stop()
        paused.set()
        return

    # resume
    if any(k in lower_text for k in ["continue", "resume", "start again", "go on"]):
        if paused.is_set():
            print("[Mike] Alright, I’m back. Let’s continue.")
            paused.clear()
        else:
            print("[Mike] I’m already active and listening.")
        return

    if paused.is_set():
        print("[System] Chat is paused. Say 'continue' to resume.")
        return

    # interrupt TTS if speaking
    if speaking_event.is_set():
        print("[Mike] Okay, I’ll stop talking.")
        tts.stop()

    # Save user -> memory
    update_context("user", text)

    # Build prompt using retrieval
    messages = build_prompt_with_memory(text)

    # Call LLM
    response = chat_with_llm(messages)
    if not response:
        print("[Mike] Hmm, I didn’t catch that. Try again?")
        return

    print("Mike:", response)
    update_context("assistant", response)
    tts.speak_text(response)


# Text chat mode (similar flow)
def text_chat():
    print("\n[Text Chat Mode Active — You’re chatting with Mike (Persistent Memory Enabled)]")
    while True:
        user_input = input("You: ").strip()
        if not user_input:
            continue
        if contains_command(user_input, ["stop the chatbot", "completely stop", "end the chat",
                                         "stop", "bye", "quit", "exit", "enough"]):
            print("Mike: Alright, goodbye! Catch you later.")
            memory.save_memory_entries(memory.load_memory_entries())
            break
        update_context("user", user_input)
        messages = build_prompt_with_memory(user_input)
        response = chat_with_llm(messages)
        print("Mike:", response)
        update_context("assistant", response)


def voice_chat():
    print("\n[Voice Chat Mode Active — say 'stop' to pause, 'continue' to resume, 'stop the chatbot' to exit]\n")
    try:
        continuous_record_blocks(
            AUDIO_BLOCK_SECONDS,
            on_audio_block,
            sample_rate=AUDIO_SAMPLE_RATE,
            channels=AUDIO_CHANNELS,
            stop_event=stop_event,
        )
    except KeyboardInterrupt:
        print("\n[Mike] Voice chat manually stopped.")
        stop_event.set()
        tts.stop()
        memory.save_memory_entries(memory.load_memory_entries())
        exit(0)


def main():
    print("=== Interactive Chatbot: Mike v5.0 (VAD + Vector Memory + SSML) ===")
    print("Select Chat Mode:")
    print("1. Text Chat")
    print("2. Voice Chat")
    choice = input("Enter 1 or 2: ").strip()
    if choice == "1":
        text_chat()
    elif choice == "2":
        voice_chat()
    else:
        print("Invalid choice. Restart and select 1 or 2.")


if __name__ == "__main__":
    main()
