"""
Smart Campus Carbon Tracker — Synthetic Dataset Generator
Generates 5 years (60 months) of campus emission data using Python random module.
"""
import random
import csv
import os

random.seed(42)  # Reproducible results

MONTHS = [f"{y}-{m:02d}" for y in range(2020, 2025) for m in range(1, 13)]

# Emission factors
FACTORS = {
    "electricity": 0.82,  # kg CO2/kWh
    "diesel":      2.68,  # kg CO2/litre
    "transport":   0.21,  # kg CO2/km
    "waste":       0.50,  # kg CO2/kg
}

# Seasonal multipliers (higher in summer for AC, higher in Jan for heating)
def season_factor(month_str):
    m = int(month_str.split("-")[1])
    if m in (6, 7, 8):   return 1.25  # Peak summer
    if m in (12, 1, 2):  return 1.10  # Winter
    return 1.0

def generate_record(month):
    sf = season_factor(month)
    elec   = round(random.uniform(11000, 17000) * sf)
    diesel = round(random.uniform(260, 380) * sf)
    trans  = round(random.uniform(7000, 10500) * sf)
    waste  = round(random.uniform(900, 1300) * sf)
    co2 = (
        elec   * FACTORS["electricity"] +
        diesel * FACTORS["diesel"] +
        trans  * FACTORS["transport"] +
        waste  * FACTORS["waste"]
    )
    return {
        "month":          month,
        "electricity_kwh": elec,
        "diesel_litres":   diesel,
        "transport_km":    trans,
        "waste_kg":        waste,
        "co2_kg":          round(co2, 2),
    }

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    records = [generate_record(m) for m in MONTHS]

    out_path = os.path.join("data", "campus_emissions.csv")
    fieldnames = ["month", "electricity_kwh", "diesel_litres",
                  "transport_km", "waste_kg", "co2_kg"]

    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"[✓] Generated {len(records)} records → {out_path}")
    print(f"    CO2 range: {min(r['co2_kg'] for r in records)} – "
          f"{max(r['co2_kg'] for r in records)} kg")
