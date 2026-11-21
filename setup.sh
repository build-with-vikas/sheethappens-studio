#!/usr/bin/env bash
# One-time setup for a fresh session: free Kokoro voice (no API key) + Playwright already present.
set -e
python3 -m venv "$HOME/.venv-kokoro"
"$HOME/.venv-kokoro/bin/pip" install -q kokoro-onnx soundfile openpyxl
mkdir -p "$HOME/kokoro-models" && cd "$HOME/kokoro-models"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$f" ] || for i in 1 2 3 4; do curl -sSL -C - -o "$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f" && break; sleep 3; done
done
echo "setup done"
