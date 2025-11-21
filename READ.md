# 🎙️ Voice + Text Chatbot — "Mike"

**Mike** is a smart conversational AI assistant that supports both **voice and text chat**.  
He listens, speaks, remembers previous chats, and interacts naturally — like a real human friend.

---

## 🚀 Features

✅ **Two Chat Modes**
- 🗣️ Voice Chat — talk to Mike using your microphone  
- 💬 Text Chat — type messages directly in the terminal

✅ **Speech Abilities**
- **Speech-to-Text (STT):** Converts your voice into text  
- **Text-to-Speech (TTS):** Speaks replies naturally using Azure Neural Voices  
- You can interrupt or stop Mike mid-speech using simple commands

✅ **Persistent Memory**
- Mike remembers past conversations across sessions (`mike_memory.json`)
- Delete memory anytime to make him “forget”

✅ **Voice Commands**
| Command | Action |
|----------|---------|
| “stop”, “pause”, “wait” | Temporarily pause the chat |
| “continue”, “resume” | Resume paused conversation |
| “stop the chatbot”, “bye”, “exit” | End chat completely |

✅ **Friendly, Contextual Conversations**
- Mike remembers the last few messages
- Keeps tone natural and emotional like a human

---

## 🧩 Project Structure

voice-chatbot/
│
├── main.py # Main entry point
├── audio.py # Handles voice recording & silence detection
├── stt_client.py # Speech-to-Text (Azure Whisper)
├── tts_client.py # Text-to-Speech (Azure Cognitive Services)
├── llm_client.py # LLM handler (OpenAI-compatible endpoint)
├── utils.py # Common configuration values
├── .env # Environment file (API keys & endpoints)
├── mike_memory.json # Auto-generated chat memory
└── requirements.txt # Required dependencies


---

## ⚙️ Requirements

- **Python 3.10+**
- **FFmpeg** (installed and added to system PATH)
- Internet connection  
- Azure Cognitive Services (Speech) and LLM API access

---

## 🛠️ Installation

### 1️⃣ Clone the Project
```bash
git clone <your-repo-url>
cd voice-chatbot


python -m venv venv
venv\Scripts\activate


pip install -r requirements.txt


4️⃣ Install FFmpeg

Download from https://www.gyan.dev/ffmpeg/builds/

Extract the ZIP file

Copy the path to the /bin folder, for example:

C:\Users\<YourName>\Downloads\ffmpeg-2025-11-02-git-full_build\bin


Add that to your system PATH variable (Environment Variables → User Path → New → paste folder path)

Verify with:

ffmpeg -version


API_KEY=d0c9b5828e5647abae87139869ccbe4b
LLM_MODEL_NAME=gpt-4o-mini_dz-eu_2024-07-08
LLM_ENDPOINT=https://api.volvogenaihubqa.volvogroup.net/azure-openai-data-inference/openai/deployments/gpt-4o-mini_dz-eu_2024-07-08/chat/completions?api-version=2025-01-01-preview

STT_MODEL_NAME=whisper_rg-swc_001
STT_ENDPOINT=https://api.volvogenaihubqa.volvogroup.net/azure-openai-data-inference

SPEECH_KEY=3byNp0X3eX1lh7n4erh6cGZHSIdzQOx5kgxU9Zos5WZnAUVZFt9qJQQJ99BHAC5RqLJXJ3w3AAAYACOGhJK6
SPEECH_ENDPOINT=https://demo-app-avatar-joi.cognitiveservices.azure.com/

AUDIO_SAMPLE_RATE=16000
AUDIO_CHANNELS=1
AUDIO_BLOCK_SECONDS=10
