"""
Smart Campus Carbon Tracker — Model Trainer with Versioning
Trains Linear Regression + Random Forest on campus emission data.
Saves versioned model (model_v1.pkl, model_v2.pkl, …) and metadata.
"""
import os
import json
import glob
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from generate_dataset import generate_record  # reuse generator if no CSV yet

# ── 1. Load or Generate Dataset ──────────────────────────────────
CSV_PATH = os.path.join("data", "campus_emissions.csv")
if not os.path.exists(CSV_PATH):
    print("[!] CSV not found — generating dataset first …")
    os.system("python generate_dataset.py")

df = pd.read_csv(CSV_PATH)
print(f"[✓] Loaded {len(df)} records from {CSV_PATH}")

FEATURES = ["electricity_kwh", "diesel_litres", "transport_km", "waste_kg"]
TARGET   = "co2_kg"

X = df[FEATURES].values
y = df[TARGET].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ── 2. Train Models ───────────────────────────────────────────────
models = {
    "linear_regression": LinearRegression(),
    "random_forest":     RandomForestRegressor(n_estimators=100, random_state=42),
}

results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    preds  = model.predict(X_test)
    r2     = round(r2_score(y_test, preds), 4)
    mae    = round(mean_absolute_error(y_test, preds), 2)
    results[name] = {"model": model, "r2": r2, "mae": mae}
    print(f"  [{name}]  R²={r2}  MAE={mae} kg CO2")

# ── 3. Select Best Model ──────────────────────────────────────────
best_name = max(results, key=lambda n: results[n]["r2"])
best      = results[best_name]
print(f"\n[✓] Best model: {best_name}  (R²={best['r2']}, MAE={best['mae']})")

# ── 4. Version Numbering ──────────────────────────────────────────
existing = glob.glob("models/model_v*.pkl")
version  = len(existing) + 1
os.makedirs("models", exist_ok=True)

model_filename = f"models/model_v{version}.pkl"
meta_filename  = f"models/model_v{version}_meta.json"

# ── 5. Save Versioned Model ───────────────────────────────────────
joblib.dump(best["model"], model_filename)
print(f"[✓] Model saved  → {model_filename}")

meta = {
    "version":    version,
    "algorithm":  best_name,
    "r2_score":   best["r2"],
    "mae_kg":     best["mae"],
    "features":   FEATURES,
    "trained_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "train_size": len(X_train),
    "test_size":  len(X_test),
    "all_results": {
        k: {"r2": v["r2"], "mae": v["mae"]} for k, v in results.items()
    },
}
with open(meta_filename, "w") as f:
    json.dump(meta, f, indent=2)
print(f"[✓] Metadata saved → {meta_filename}")
print(f"\n[✓] Model versioning: will be loaded as '{best_name}_v{version}'")
