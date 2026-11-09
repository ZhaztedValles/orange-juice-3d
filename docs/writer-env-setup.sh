#!/usr/bin/env bash
# Setup script for the "Orange Juice 3D writer" cloud environment.
# Paste this whole file into: claude.ai/code -> environment settings -> Setup script.
# It runs as root before each session. Once it finishes, the disk is snapshotted and reused by later runs (the cache is
# rebuilt when this script changes, or after about 7 days), so the nightly writer does not re-install Python packages
# and the voice model every night. It does not need the repository: it only installs tools system-wide.
#
# PyPI is very slow from the cloud session (58 kB/s - 1 MB/s measured), so every Python package comes from one
# pre-built bundle on this repo's `writer-deps` release (Linux, CPython 3.11, CPU-only torch; built from
# requirements.txt + requirements-voice.txt + en_core_web_sm). GitHub downloads are fast there.
set -euo pipefail
export PIP_BREAK_SYSTEM_PACKAGES=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_ROOT_USER_ACTION=ignore
URL=https://github.com/ZhaztedValles/orange-juice-3d/releases/download/writer-deps
SHA=98dd5d510fc57243cf26d49414f9219f9e1816a3f1d3b640c8242aae5ccedd7a

python --version
command -v espeak-ng || (apt-get update -q && apt-get install -y -q espeak-ng)   # Kokoro's fallback for unknown words

cd /tmp
curl -fsSL --retry 5 -o oj-wheels.tar "$URL/oj-writer-wheels-py311.tar"
echo "$SHA  oj-wheels.tar" | sha256sum -c -
tar -xf oj-wheels.tar                      # -> /tmp/wheels/*.whl
# --ignore-installed: Debian's own PyYAML 6.0.1 has no RECORD file and cannot be uninstalled
python -m pip install -q --no-index --ignore-installed --find-links /tmp/wheels \
  torch==2.15.0 numpy==2.3.4 scipy==1.16.3 soundfile==0.13.1 pyyaml==6.0.3 pytest==8.4.2 pillow==12.3.0 \
  google-api-python-client==2.185.0 google-auth==2.41.1 tzdata==2026.6 \
  kokoro==0.9.4 "misaki[en]==0.9.4" en_core_web_sm==3.8.0
rm -rf /tmp/wheels oj-wheels.tar

# Download the voice model and the am_michael voice now, into a shared cache that the environment variable
# HF_HOME=/opt/hf-cache points at (set it in the environment's variables too).
export HF_HOME=/opt/hf-cache
mkdir -p "$HF_HOME"
timeout 600 python - <<'EOF'
from kokoro import KPipeline
p = KPipeline(lang_code="a")
n = sum(1 for _ in p("Warm up the voice once.", voice="am_michael", speed=1.2))
print("kokoro warm-up ok", n)
EOF
chmod -R a+rwX "$HF_HOME"
echo "orange-juice writer environment ready"
