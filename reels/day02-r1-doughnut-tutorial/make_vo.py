# Voice for the full tutorial. Lines play back to back with a short gap; vo.js stores the real start times
# so the score can anchor every visual to the sentence that explains it.
import os, json, soundfile as sf
from kokoro_onnx import Kokoro
home = os.path.expanduser("~")
k = Kokoro(home + "/kokoro-models/kokoro-v1.0.onnx", home + "/kokoro-models/voices-v1.0.bin")
LINES = [
  ("hook",   "Tick a task, and this ring fills up by itself. Here's how to build it."),
  ("s1",     "Step one. Type your tasks in column A, and the heading Done in B1."),
  ("s2",     "Step two. Select B2 to B9. Go to the Insert tab, and click Checkbox."),
  ("s2b",    "No Checkbox button? Use Developer, Insert, Check Box."),
  ("s2c",    "Ticked means TRUE. Empty means FALSE."),
  ("s3",     "Step three. In E2, type COUNTIF, B2 to B9, TRUE, divided by 8 tasks."),
  ("s3b",    "Press Enter, then click percent on the Home tab."),
  ("s3c",    "In E3, type one minus E2."),
  ("s4",     "Step four. Select E2 and E3. Then Insert, pie chart menu, Doughnut."),
  ("s5",     "Step five. Right click the ring, Format Data Series, and set the hole size to seventy five percent."),
  ("s5b",    "Done part green, the rest light grey."),
  ("s6",     "Step six. Add a text box in the middle, and type equals E2 in the formula bar."),
  ("test",   "Now tick your tasks."),
  ("full",   "One hundred percent!"),
  ("end",    "Save this, and follow for a new Excel build every day."),
]
GAP = {"s2b": 0.6, "s2c": 0.5, "s3b": 0.7, "s3c": 0.6, "s5b": 0.6, "full": 3.0, "test": 0.6, "end": 1.0}
t, out = 0.8, []
for i, (key, text) in enumerate(LINES):
    a, sr = k.create(text, voice="am_michael", speed=1.05, lang="en-us")
    f = f"out/vo/line{i}.wav"; sf.write(f, a, sr)
    d = round(len(a) / sr, 3)
    out.append({"key": key, "t": round(t, 3), "text": text, "dur": d, "file": f})
    t += d + GAP.get(LINES[i + 1][0], 0.65) if i + 1 < len(LINES) else d
open("vo.js", "w").write("(function(){const VO=" + json.dumps(out, indent=1) + ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n")
for o in out: print(o["key"], o["t"], o["dur"])
print("END", round(t, 2))
