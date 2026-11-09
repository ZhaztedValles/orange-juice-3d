#!/usr/bin/env bash
# Setup script for the "Orange Juice 3D writer" cloud environment.
# Paste this whole file into: claude.ai/code -> environment settings -> Setup script.
# It runs as root before each session. Once it finishes, the disk is snapshotted and reused by later runs (the cache is
# rebuilt when this script changes, or after about 7 days), so the nightly writer does not re-download Python, PyTorch
# and the voice model every night. It does not need the repository: it only installs tools system-wide.
# Keep the pins in sync with requirements.txt and requirements-voice.txt.
set -euo pipefail
export PIP_BREAK_SYSTEM_PACKAGES=1 PIP_DISABLE_PIP_VERSION_CHECK=1
PIP="python -m pip install --retries 10 --timeout 120 -q"

python --version
command -v espeak-ng || (apt-get update -q && apt-get install -y -q espeak-ng)   # Kokoro's fallback for unknown words

# CPU-only PyTorch first (the default CUDA build is several GB and times out)
$PIP torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
# requirements.txt
$PIP numpy==2.3.4 scipy==1.16.3 soundfile==0.13.1 pyyaml==6.0.3 pytest==8.4.2 pillow==12.3.0 \
     google-api-python-client==2.185.0 google-auth==2.41.1 tzdata==2026.6
# requirements-voice.txt
$PIP kokoro==0.9.4 "misaki[en]==0.9.4"

# Download the voice model, the am_michael voice and the spaCy English model now, into a shared cache that the
# environment variable HF_HOME=/opt/hf-cache points at (set it in the environment's variables too).
export HF_HOME=/opt/hf-cache
mkdir -p "$HF_HOME"
python - <<'EOF'
from kokoro import KPipeline
p = KPipeline(lang_code="a")
n = sum(1 for _ in p("Warm up the voice once.", voice="am_michael", speed=1.2))
print("kokoro warm-up ok", n)
EOF
chmod -R a+rwX "$HF_HOME"
echo "orange-juice writer environment ready"
