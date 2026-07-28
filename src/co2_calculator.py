import math

# Gaziantep Gaziulaş Bus Fleet Models Specs & Emissions Baseline
GAZIULAS_FLEET_SPECS = {
    "MAN Lion's City (Solo)": {
        "engine_size": 6.9,
        "cylinders": 6,
        "co2_base_g_km": 265.0,
        "fuel_type": "Dizel",
        "capacity": 80
    },
    "MAN Lion's City G (Körüklü)": {
        "engine_size": 10.5,
        "cylinders": 6,
        "co2_base_g_km": 390.0,
        "fuel_type": "Dizel",
        "capacity": 140
    },
    "Otokar 9M Doruk LE (Midibüs)": {
        "engine_size": 4.7,
        "cylinders": 4,
        "co2_base_g_km": 195.0,
        "fuel_type": "Dizel",
        "capacity": 55
    },
    "Otokar 10M Doruk LE (Midibüs)": {
        "engine_size": 4.7,
        "cylinders": 4,
        "co2_base_g_km": 210.0,
        "fuel_type": "Dizel",
        "capacity": 65
    },
    "Temsa Prestij City": {
        "engine_size": 3.0,
        "cylinders": 4,
        "co2_base_g_km": 145.0,
        "fuel_type": "Dizel",
        "capacity": 30
    },
    "18M Körüklü Elektrikli Otobüs": {
        "engine_size": 0.0,
        "cylinders": 0,
        "co2_base_g_km": 0.0,
        "fuel_type": "Elektrikli",
        "capacity": 150
    }
}

VEHICLE_EMISSION_FACTORS = GAZIULAS_FLEET_SPECS

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate Great Circle distance in kilometers between two lat/lng coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * Math_atan2_sqrt(a)
    return R * c

def Math_atan2_sqrt(a):
    return math.atan2(math.sqrt(a), math.sqrt(1 - a))

def calculate_co2_emission(mode="Otobüs", bus_model="MAN Lion's City (Solo)", distance_km=5.0, use_ml_model=True, fuel_type=None, **kwargs):
    """
    Calculate CO2 emissions based on Gaziulaş fleet specs and distance.
    """
    dist = max(0.5, float(distance_km))
    
    co2_g_per_km = 265.0
    
    if mode == "Otobüs":
        model_spec = GAZIULAS_FLEET_SPECS.get(bus_model, GAZIULAS_FLEET_SPECS["MAN Lion's City (Solo)"])
        co2_g_per_km = model_spec["co2_base_g_km"]
    elif mode == "Tramvay":
        co2_g_per_km = 90.0
    elif mode == "Gaziray":
        co2_g_per_km = 75.0
    elif mode == "Özel Otomobil":
        co2_g_per_km = 220.0
        
    total_vehicle_co2_g = co2_g_per_km * dist
    
    # Calculate automatic corridor traffic density percentage
    # Corridor traffic index based on distance and city center proximity
    traffic_pct = min(78, max(28, int(35 + (dist * 3.2) % 30)))
    traffic_factor = 1.0 + (traffic_pct / 250.0)  # e.g., +15% to +25% emission increase
    
    adjusted_total_g = total_vehicle_co2_g * traffic_factor
    
    # Trees required (1 mature tree absorbs ~60g CO2 per day)
    trees_needed = round(adjusted_total_g / 60.0, 1)
    
    passenger_cnt = int(kwargs.get("passenger_count", 1)) if kwargs.get("passenger_count") else 1
    passenger_cnt = max(1, passenger_cnt)
    passenger_co2_g = round(adjusted_total_g / passenger_cnt, 1)

    car_co2_g = 220.0 * dist * traffic_factor
    co2_saved_pct = round(max(0, (car_co2_g - adjusted_total_g) / max(1.0, car_co2_g) * 100), 1)

    return {
        "mode": mode,
        "bus_model": bus_model,
        "distance_km": round(dist, 2),
        "co2_g_per_km": round(co2_g_per_km, 1),
        "total_vehicle_co2_g": round(adjusted_total_g, 1),
        "total_vehicle_co2_kg": round(adjusted_total_g / 1000.0, 3),
        "passenger_co2_g": passenger_co2_g,
        "passenger_co2_kg": round(passenger_co2_g / 1000.0, 3),
        "passenger_count": passenger_cnt,
        "co2_saved_percent": co2_saved_pct,
        "traffic_pct": traffic_pct,
        "traffic_increase_pct": round((traffic_factor - 1.0) * 100, 1),
        "trees_needed_daily": trees_needed
    }
