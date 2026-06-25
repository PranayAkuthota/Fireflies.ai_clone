import os
import wave
import struct

def generate_soft_tone_wav(filepath: str, duration_sec: int):
    """
    Generates a local, soft synthesized WAV file of the specified duration.
    This guarantees that the audio playhead and seekbar match the meeting length perfectly.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Audio parameters
    sample_rate = 8000  # Low sample rate to keep file size small
    num_channels = 1
    sample_width = 2    # 16-bit
    
    num_samples = sample_rate * duration_sec
    
    print(f"Generating {duration_sec}s WAV file at {filepath}...")
    
    with wave.open(filepath, "wb") as wav_file:
        wav_file.setnchannels(num_channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        
        # Soft hum frequency
        frequency = 150.0
        
        # Generate raw 16-bit PCM bytes
        # Using a simple square/triangle wave that sounds like a soft machine hum
        for i in range(num_samples):
            # Calculate sample amplitude (between -32767 and 32767 for 16-bit audio)
            # Soft volume (scaled down to 5% of max capacity)
            val = int(32767 * 0.05 * (1 if (i // (sample_rate / (2 * frequency))) % 2 == 0 else -1))
            data = struct.pack("<h", val)
            wav_file.writeframesraw(data)

def main():
    frontend_public_audio = "/Users/pranaykumarakuthota/Scaler_Fireflies/frontend/public/audio"
    
    # Meeting 1: 320 seconds
    generate_soft_tone_wav(os.path.join(frontend_public_audio, "sample_meeting_1.wav"), 320)
    # Meeting 2: 165 seconds
    generate_soft_tone_wav(os.path.join(frontend_public_audio, "sample_meeting_2.wav"), 165)
    # Meeting 3: 180 seconds
    generate_soft_tone_wav(os.path.join(frontend_public_audio, "sample_meeting_3.wav"), 180)
    
    print("Audio synthesis complete!")

if __name__ == "__main__":
    main()
