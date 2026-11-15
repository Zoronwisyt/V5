import json
import subprocess
from pathlib import Path

import gradio as gr

BASE_DIR = Path(__file__).resolve().parent
DETECT_SCRIPT = BASE_DIR / "detect_cuts.py"
MODEL_PATH = BASE_DIR / "model.pt"


def detect_beats(video_file):
    if video_file is None:
        return {"ok": False, "error": "No video file provided."}

    video_path = video_file if isinstance(video_file, str) else getattr(video_file, "name", str(video_file))
    proc = subprocess.run(
        [
            "python",
            str(DETECT_SCRIPT),
            video_path,
            "--model",
            str(MODEL_PATH),
            "--json-only",
        ],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if proc.returncode != 0:
        return {
            "ok": False,
            "error": proc.stderr.strip() or f"Detector exited with code {proc.returncode}",
        }

    data = json.loads(proc.stdout.strip())
    return {"ok": True, **data}


demo = gr.Interface(
    fn=detect_beats,
    inputs=gr.File(label="Upload Edit Video (.mp4, .mov, .mkv)"),
    outputs=gr.JSON(label="Detected Beat Cuts"),
    title="Flippy v5 · ClipCutNet Beat Detector",
    description="Detects clip changes and outputs beat timestamps for Alight Motion XML.",
    api_name="detect_beats",
)

if __name__ == "__main__":
    demo.launch()
