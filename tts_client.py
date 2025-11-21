import azure.cognitiveservices.speech as speechsdk
from utils import SPEECH_KEY, SPEECH_ENDPOINT
import threading

speaking_event = threading.Event()


class AzureTTS:
    def __init__(self, key=SPEECH_KEY, endpoint=SPEECH_ENDPOINT, voice="en-US-GuyNeural"):
        """
        Azure TTS wrapper using SSML for prosody control.
        Voice default set to 'en-US-GuyNeural' (warmer conversational male voice).
        """
        self.speech_config = speechsdk.SpeechConfig(endpoint=endpoint, subscription=key)
        self.speech_config.speech_synthesis_voice_name = voice
        self.audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
        self.synthesizer = speechsdk.SpeechSynthesizer(speech_config=self.speech_config,
                                                       audio_config=self.audio_config)
        self._thread = None

    def _build_ssml(self, text: str, rate: str = "0%", pitch: str = "0%"):
        """Wrap user text in SSML with light prosody adjustments."""
        escaped = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
        ssml = f"""
<speak version='1.0' xml:lang='en-US'>
  <voice name="{self.speech_config.speech_synthesis_voice_name}">
    <prosody rate="{rate}" pitch="{pitch}">{escaped}</prosody>
  </voice>
</speak>
"""
        return ssml

    def _speak_ssml(self, ssml: str):
        speaking_event.set()
        try:
            result = self.synthesizer.speak_ssml_async(ssml).get()
            if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
                # non-fatal - print reason
                print("TTS issue:", result.reason)
        except Exception as e:
            print("TTS error:", e)
        finally:
            speaking_event.clear()

    def speak_text(self, text: str, rate: str = "-2%", pitch: str = "0%"):
        """Speak text asynchronously using SSML. Smaller chunks allowed by Azure async call."""
        # stop current speech first
        self.stop()
        ssml = self._build_ssml(text, rate=rate, pitch=pitch)
        self._thread = threading.Thread(target=self._speak_ssml, args=(ssml,), daemon=True)
        self._thread.start()

    def stop(self):
        """Stop ongoing speech quickly."""
        if speaking_event.is_set():
            speaking_event.clear()
            try:
                self.synthesizer.stop_speaking_async().get()
            except Exception:
                pass
