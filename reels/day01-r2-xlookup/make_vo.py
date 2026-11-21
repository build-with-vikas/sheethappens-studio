# Generates each voice line with Kokoro (US male) and writes vo.js with real durations.
import json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(""+__import__("os").path.expanduser("~")+"/kokoro-models/kokoro-v1.0.onnx", ""+__import__("os").path.expanduser("~")+"/kokoro-models/voices-v1.0.bin")
LINES = [
  (0.2,  "Still using VLOOKUP? It can't look left, so you get errors."),
  (4.15, "Do this instead. Use XLOOKUP."),
  (6.3,  "Find, look, return."),
  (8.3,  "Done. It looks left, no problem."),
  (12.1, "Change the name, and it updates instantly."),
  (16.1, "Bonus. Name not in the list?"),
  (19.3, "Add Not found, and the ugly errors are gone."),
  (22.0, "XLOOKUP beats VLOOKUP."),
  (24.3, "Save this, and follow for more Excel tricks."),
]
out = []
for i, (t, text) in enumerate(LINES):
    a, sr = k.create(text, voice="am_michael", speed=1.22, lang="en-us")
    f = f"out/vo/line{i}.wav"; sf.write(f, a, sr)
    out.append({"t": t, "text": text, "dur": round(len(a) / sr, 3), "file": f})
open("vo.js", "w").write("(function(){const VO=" + json.dumps(out, indent=1) + ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n")
for o in out: print(o["t"], o["dur"], o["text"])
