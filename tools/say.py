import sys, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("$HOME/kokoro-models/kokoro-v1.0.onnx", "$HOME/kokoro-models/voices-v1.0.bin")
text, voice, out = sys.argv[1], sys.argv[2], sys.argv[3]
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
a, sr = k.create(text, voice=voice, speed=speed, lang="en-us" if voice[0] == "a" else "en-gb")
sf.write(out, a, sr)
