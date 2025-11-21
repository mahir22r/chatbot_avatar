import os
from dotenv import load_dotenv

# Load values from .env file
load_dotenv()

# API Keys and Endpoints
API_KEY = os.getenv("API_KEY")

LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME")
LLM_ENDPOINT = os.getenv("LLM_ENDPOINT")

STT_MODEL_NAME = os.getenv("STT_MODEL_NAME")
STT_ENDPOINT = os.getenv("STT_ENDPOINT")

SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_ENDPOINT = os.getenv("SPEECH_ENDPOINT")

BLENDER_EXECUTABLE_PATH = os.getenv("BLENDER_EXECUTABLE_PATH")

# Audio Configuration
AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", 16000))
AUDIO_CHANNELS = int(os.getenv("AUDIO_CHANNELS", 1))
AUDIO_BLOCK_SECONDS = int(os.getenv("AUDIO_BLOCK_SECONDS", 4))
