import os
os.environ["PATH"] += os.pathsep + r"C:\Users\A509784\Downloads\ffmpeg-2025-11-02-git-f5eb11a71d-full_build\ffmpeg-2025-11-02-git-f5eb11a71d-full_build\bin"

import sounddevice as sd
import numpy as np
import io
import time
import wave

# Try import webrtcvad for robust VAD. If missing, fallback to amplitude-based detection.
try:
    import webrtcvad
    VAD_AVAILABLE = True
except Exception:
    VAD_AVAILABLE = False


def _frames_from_stream(stream, frame_duration_ms=30, sample_rate=16000, channels=1):
    """
    Generator yielding frames of raw int16 audio from the input stream.
    frame_duration_ms typically 20 or 30ms.
    """
    frame_bytes = int(sample_rate * (frame_duration_ms / 1000.0)) * channels * 2  # int16 -> 2 bytes
    while True:
        data, _ = stream.read(int(sample_rate * (frame_duration_ms / 1000.0)))
        if data is None:
            break
        yield data


def record_block(max_duration=12,
                 sample_rate=16000,
                 channels=1,
                 vad_mode=1,
                 frame_duration_ms=30,
                 silence_timeout_s=1.0):
    """
    VAD-driven recorder.

    If webrtcvad is available it uses it. Otherwise falls back to amplitude-based detection.
    Records until `silence_timeout_s` seconds of continuous silence after speech started,
    or until max_duration is reached.
    Returns WAV bytes (PCM16, sample_rate, mono).
    """
    print("[Listening...] Speak now.")
    max_frames = int(max_duration * sample_rate)
    recorded = []
    started = False
    silence_frames_required = int((silence_timeout_s * 1000) / frame_duration_ms)

    if VAD_AVAILABLE:
        vad = webrtcvad.Vad(vad_mode)
    silence_counter = 0
    total_frames = 0

    with sd.InputStream(samplerate=sample_rate, channels=channels, dtype="int16") as stream:
        frame_gen = _frames_from_stream(stream, frame_duration_ms=frame_duration_ms,
                                        sample_rate=sample_rate, channels=channels)
        for frame in frame_gen:
            total_frames += frame.shape[0]
            recorded.append(frame)

            if VAD_AVAILABLE:
                # webrtcvad expects mono 16-bit little-endian bytes
                raw_bytes = frame.tobytes()
                is_speech = vad.is_speech(raw_bytes, sample_rate)
            else:
                # amplitude fallback
                is_speech = (np.abs(frame).mean() > 300)

            if is_speech:
                started = True
                silence_counter = 0
            else:
                if started:
                    silence_counter += 1

            # stop after required silence following speech
            if started and silence_counter >= silence_frames_required:
                break

            # hard stop at max_duration
            if total_frames >= max_frames:
                break

    if not recorded:
        print("[Silence detected — skipping]")
        return None

    frames = np.concatenate(recorded, axis=0)

    # quick silence mean check to drop tiny clips
    if np.abs(frames).mean() < 80:
        print("[Silence detected — skipping]")
        return None

    # write PCM16 WAV to bytes
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(frames.tobytes())
    return buf.getvalue()


def continuous_record_blocks(block_seconds, callback, sample_rate=16000, channels=1, stop_event=None):
    """
    Continuously record speech segments and call callback(wav_bytes) for each.
    Adds a small throttle between calls to reduce STT rate-limit exposure.
    """
    while stop_event is None or not stop_event.is_set():
        wav = record_block(max_duration=block_seconds, sample_rate=sample_rate, channels=channels)
        if wav:
            callback(wav)
            time.sleep(1.5)  # throttle to avoid aggressive STT calling
        else:
            time.sleep(0.3)
