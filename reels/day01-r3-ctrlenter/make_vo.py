# Generates each voice line with Kokoro (US male) and writes vo.js with real durations.
import json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(""+__import__("os").path.expanduser("~")+"/kokoro-models/kokoro-v1.0.onnx", ""+__import__("os").path.expanduser("~")+"/kokoro-models/voices-v1.0.bin")
LINES = [
  (0.2,  "Still typing the same thing in every cell? Stop."),
  (4.15, "Do this instead. Select, type once."),
  (6.5,  "Press Control Enter."),
  (8.45, "Every cell, filled in one go."),
  (11.1, "Scattered cells? Hold Control and click them."),
  (14.3, "Same trick."),
  (15.2, "Bonus. It works with formulas too,"),
  (18.3, "and every row gets its own answer."),
  (20.3, "Type once. Control Enter. Done."),
  (24.3, "Save this, and follow for more Excel tricks."),
]
out = []
for i, (t, text) in enumerate(LINES):
    a, sr = k.create(text, voice="am_michael", speed=1.22, lang="en-us")
    f = f"out/vo/line{i}.wav"; sf.write(f, a, sr)
    out.append({"t": t, "text": text, "dur": round(len(a) / sr, 3), "file": f})
open("vo.js", "w").write("(function(){const VO=" + json.dumps(out, indent=1) + ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n")
for o in out: print(o["t"], o["dur"], o["text"])
