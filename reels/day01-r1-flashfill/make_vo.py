# Generates each voice line with Kokoro (US male) and writes vo.js with real durations.
import json, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro(""+__import__("os").path.expanduser("~")+"/kokoro-models/kokoro-v1.0.onnx", ""+__import__("os").path.expanduser("~")+"/kokoro-models/voices-v1.0.bin")
LINES = [
  (0.2,  "Stop typing names one by one. This takes forever."),
  (4.2,  "Do this instead. Type just one name."),
  (6.75, "Then press Control E."),
  (8.3,  "Boom. Flash Fill does the rest."),
  (11.0, "Last names? Same trick."),
  (14.15, "Bonus. Type one email address,"),
  (18.3, "and it builds every single one."),
  (20.3, "If there's a pattern, Excel can see it."),
  (24.3, "Save this, and follow for more Excel tricks."),
]
out = []
for i, (t, text) in enumerate(LINES):
    a, sr = k.create(text, voice="am_michael", speed=1.12, lang="en-us")
    f = f"out/vo/line{i}.wav"; sf.write(f, a, sr)
    out.append({"t": t, "text": text, "dur": round(len(a) / sr, 3), "file": f})
open("vo.js", "w").write("(function(){const VO=" + json.dumps(out, indent=1) + ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n")
for o in out: print(o["t"], o["dur"], o["text"])
