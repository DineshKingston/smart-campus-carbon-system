"""
Smart Campus Carbon Tracker — Flask ML API
Secure: NOT exposed publicly. Only Spring Boot can call this service.
"""
import os
import json
import glob
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://carbon-backend:8080"])  # Internal only

# ── Model Loading ─────────────────────────────────────────────────
def load_latest_model():
    """Auto-load the highest-versioned model_vN.pkl"""
    model_files = sorted(glob.glob("models/model_v*.pkl"))
    if not model_files:
        return None, None, None
    latest_pkl  = model_files[-1]
    version_num = latest_pkl.replace("models/model_v", "").replace(".pkl", "")
    meta_path   = f"models/model_v{version_num}_meta.json"
    meta        = {}
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
    model = joblib.load(latest_pkl)
    return model, meta, version_num

model, model_meta, version_num = load_latest_model()

MODEL_NAME = (
    f"{model_meta.get('algorithm', 'model')}_v{version_num}"
    if model_meta else "untrained"
)
print(f"[✓] Loaded model: {MODEL_NAME}")


# ── Routes ────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Called internally by Spring Boot for GET /api/predictions/health"""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": MODEL_NAME,
        "version": version_num,
        "r2_score": model_meta.get("r2_score") if model_meta else None,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Input (JSON):
      {
        "electricity_kwh": 14200,
        "diesel_litres":   320,
        "transport_km":    8500,
        "waste_kg":        1100
      }
    Output:
      { "predicted_co2": 15234.5, "model_used": "random_forest_v1", ... }
    """
    if model is None:
        return jsonify({"error": "No trained model found. Run train_model.py first."}), 503

    data = request.get_json(force=True)
    try:
        features = np.array([[
            float(data["electricity_kwh"]),
            float(data["diesel_litres"]),
            float(data["transport_km"]),
            float(data["waste_kg"]),
        ]])
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400

    prediction = float(model.predict(features)[0])
    return jsonify({
        "predicted_co2": round(prediction, 2),
        "model_used":    MODEL_NAME,
        "r2_score":      model_meta.get("r2_score") if model_meta else None,
        "mae_kg":        model_meta.get("mae_kg") if model_meta else None,
        "timestamp":     datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    })


@app.route("/train", methods=["POST"])
def train():
    """Retrain models and reload the latest version"""
    global model, model_meta, version_num, MODEL_NAME
    try:
        import subprocess
        result = subprocess.run(
            ["python", "train_model.py"],
            capture_output=True, text=True, timeout=120
        )
        model, model_meta, version_num = load_latest_model()
        MODEL_NAME = f"{model_meta.get('algorithm', 'model')}_v{version_num}"
        return jsonify({
            "message": "Model retrained successfully",
            "new_model": MODEL_NAME,
            "r2_score": model_meta.get("r2_score"),
            "output": result.stdout[-500:] if result.stdout else "",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
