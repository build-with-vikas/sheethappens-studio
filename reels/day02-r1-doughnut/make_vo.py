# Generates each voice line with Kokoro (US male) and writes vo.js with real durations.
import json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(""+__import__("os").path.expanduser("~")+"/kokoro-models/kokoro-v1.0.onnx", ""+__import__("os").path.expanduser("~")+"/kokoro-models/voices-v1.0.bin")
LINES = [
  (0.7,  "Tick a box, and this ring fills by itself."),
  (3.15, "Step one. Add your tasks, then insert checkboxes."),
  (7.1,  "Step two. Count the ticks with COUNTIF."),
  (9.3,  "And one minus that for what's left."),
  (11.3, "Step three. Insert a doughnut chart."),
  (16.1, "Step four. Bigger hole, green fill, percent in the middle."),
  (20.15, "Now just tick your tasks."),
  (24.1, "Finish them all,"),
  (25.8, "and it hits one hundred percent."),
  (27.3, "Save this, and follow for a new Excel build every day."),
]
out = []
for i, (t, text) in enumerate(LINES):
    a, sr = k.create(text, voice="am_michael", speed=1.22, lang="en-us")
    f = f"out/vo/line{i}.wav"; sf.write(f, a, sr)
    out.append({"t": t, "text": text, "dur": round(len(a) / sr, 3), "file": f})
open("vo.js", "w").write("(function(){const VO=" + json.dumps(out, indent=1) + ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n")
for o in out: print(o["t"], o["dur"], o["text"])
