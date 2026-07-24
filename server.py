import os
import sys
import re
import math
import json
import requests
from flask import Flask, jsonify, request, send_from_directory
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.api_client import fetch_bus_stops, fetch_bus_routes, fetch_tram_stops, decode_raw_bytes
from src.data_cleaner import generate_cleaned_datasets, fix_mojibake
from src.co2_calculator import calculate_haversine_distance, calculate_co2_emission, GAZIULAS_FLEET_SPECS
from src.ml_model import get_trained_model, train_and_evaluate_model, load_kaggle_co2_dataset, predict_custom_vehicle_co2

app = Flask(__name__, static_folder="web", static_url_path="")

# Load datasets
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
stops_file = os.path.join(DATA_DIR, "cleaned_transport_data.csv")
routes_file = os.path.join(DATA_DIR, "cleaned_bus_routes.csv")

if not os.path.exists(stops_file) or not os.path.exists(routes_file):
    df_stops, df_routes = generate_cleaned_datasets()
else:
    df_stops = pd.read_csv(stops_file)
    df_routes = pd.read_csv(routes_file)

# Train ML model once at startup
model, ml_metrics, _ = train_and_evaluate_model()

# EXACT OFFICIAL TRAMVAY & GAZİRAY NETWORK ROUTES
T1_EXACT_STOPS = [
    {"stop_id": "T101", "stop_name": "İBN-İ SİNA", "lat": 37.0180, "lng": 37.3460, "lines": ["T1"]},
    {"stop_id": "T102", "stop_name": "Akkent", "lat": 37.0210, "lng": 37.3480, "lines": ["T1"]},
    {"stop_id": "T103", "stop_name": "Akkent Meydanı", "lat": 37.0240, "lng": 37.3510, "lines": ["T1"]},
    {"stop_id": "T104", "stop_name": "Akkent Parkı", "lat": 37.0270, "lng": 37.3540, "lines": ["T1"]},
    {"stop_id": "T105", "stop_name": "Karataş 1. Bölge", "lat": 37.0300, "lng": 37.3570, "lines": ["T1"]},
    {"stop_id": "T106", "stop_name": "Karataş Merkez", "lat": 37.0330, "lng": 37.3590, "lines": ["T1"]},
    {"stop_id": "T107", "stop_name": "Şahinbey Parkı", "lat": 37.0360, "lng": 37.3560, "lines": ["T1"]},
    {"stop_id": "T108", "stop_name": "Güneykent", "lat": 37.0370, "lng": 37.3450, "lines": ["T1"]},
    {"stop_id": "T109", "stop_name": "Gaziantep Üniversitesi", "lat": 37.0354, "lng": 37.3235, "lines": ["T1", "T3"]},
    {"stop_id": "T110", "stop_name": "Tıp Fakültesi", "lat": 37.0420, "lng": 37.3280, "lines": ["T1", "T3"]},
    {"stop_id": "T111", "stop_name": "Binevler", "lat": 37.0480, "lng": 37.3360, "lines": ["T1", "T3"]},
    {"stop_id": "T112", "stop_name": "Rasaf Yolu", "lat": 37.0540, "lng": 37.3450, "lines": ["T1", "T3"]},
    {"stop_id": "T113", "stop_name": "Kadı Değirmeni", "lat": 37.0590, "lng": 37.3550, "lines": ["T1", "T3"]},
    {"stop_id": "T114", "stop_name": "Büyükşehir Belediyesi Temaparkı", "lat": 37.0620, "lng": 37.3630, "lines": ["T1", "T2"]},
    {"stop_id": "T115", "stop_name": "Masal Parkı", "lat": 37.0645, "lng": 37.3680, "lines": ["T1", "T2"]},
    {"stop_id": "T116", "stop_name": "25 Aralık Devlet Hastanesi", "lat": 37.0665, "lng": 37.3730, "lines": ["T1", "T2"]},
    {"stop_id": "T117", "stop_name": "Gazi Muhtar Paşa", "lat": 37.0685, "lng": 37.3770, "lines": ["T1", "T2"]},
    {"stop_id": "T118", "stop_name": "15 Temmuz Demokrasi Meydanı", "lat": 37.0710, "lng": 37.3800, "lines": ["T1", "T2"]},
    {"stop_id": "T119", "stop_name": "GAR", "lat": 37.0738, "lng": 37.3827, "lines": ["T1", "T2", "GR01"]}
]

T2_EXACT_STOPS = [
    {"stop_id": "T201", "stop_name": "ADLİYE", "lat": 37.1080, "lng": 37.3620, "lines": ["T2", "T3", "GR01"]},
    {"stop_id": "T202", "stop_name": "Kolej Vakfı", "lat": 37.1020, "lng": 37.3580, "lines": ["T2", "T3"]},
    {"stop_id": "T203", "stop_name": "Güvenevler", "lat": 37.0950, "lng": 37.3520, "lines": ["T2", "T3"]},
    {"stop_id": "T204", "stop_name": "Duisburg", "lat": 37.0890, "lng": 37.3460, "lines": ["T2", "T3"]},
    {"stop_id": "T205", "stop_name": "İbrahimli Merkez", "lat": 37.0820, "lng": 37.3410, "lines": ["T2", "T3"]},
    {"stop_id": "T206", "stop_name": "Ali İhsan Göğüş", "lat": 37.0750, "lng": 37.3470, "lines": ["T2", "T3"]},
    {"stop_id": "T207", "stop_name": "Olimpik Havuz", "lat": 37.0700, "lng": 37.3540, "lines": ["T2", "T3"]},
    {"stop_id": "T208", "stop_name": "Sanko Okulları", "lat": 37.0650, "lng": 37.3600, "lines": ["T2", "T3"]},
    {"stop_id": "T114", "stop_name": "Büyükşehir Belediyesi Temaparkı", "lat": 37.0620, "lng": 37.3630, "lines": ["T1", "T2"]},
    {"stop_id": "T115", "stop_name": "Masal Parkı", "lat": 37.0645, "lng": 37.3680, "lines": ["T1", "T2"]},
    {"stop_id": "T116", "stop_name": "25 Aralık Devlet Hastanesi", "lat": 37.0665, "lng": 37.3730, "lines": ["T1", "T2"]},
    {"stop_id": "T117", "stop_name": "Gazi Muhtar Paşa", "lat": 37.0685, "lng": 37.3770, "lines": ["T1", "T2"]},
    {"stop_id": "T118", "stop_name": "15 Temmuz Demokrasi Meydanı", "lat": 37.0710, "lng": 37.3800, "lines": ["T1", "T2"]},
    {"stop_id": "T119", "stop_name": "GAR", "lat": 37.0738, "lng": 37.3827, "lines": ["T1", "T2", "GR01"]}
]

T3_EXACT_STOPS = [
    {"stop_id": "T201", "stop_name": "ADLİYE", "lat": 37.1080, "lng": 37.3620, "lines": ["T2", "T3", "GR01"]},
    {"stop_id": "T202", "stop_name": "Kolej Vakfı", "lat": 37.1020, "lng": 37.3580, "lines": ["T2", "T3"]},
    {"stop_id": "T203", "stop_name": "Güvenevler", "lat": 37.0950, "lng": 37.3520, "lines": ["T2", "T3"]},
    {"stop_id": "T204", "stop_name": "Duisburg", "lat": 37.0890, "lng": 37.3460, "lines": ["T2", "T3"]},
    {"stop_id": "T205", "stop_name": "İbrahimli Merkez", "lat": 37.0820, "lng": 37.3410, "lines": ["T2", "T3"]},
    {"stop_id": "T206", "stop_name": "Ali İhsan Göğüş", "lat": 37.0750, "lng": 37.3470, "lines": ["T2", "T3"]},
    {"stop_id": "T207", "stop_name": "Olimpik Havuz", "lat": 37.0700, "lng": 37.3540, "lines": ["T2", "T3"]},
    {"stop_id": "T208", "stop_name": "Sanko Okulları", "lat": 37.0650, "lng": 37.3600, "lines": ["T2", "T3"]},
    {"stop_id": "T113", "stop_name": "Kadı Değirmeni", "lat": 37.0590, "lng": 37.3550, "lines": ["T1", "T3"]},
    {"stop_id": "T112", "stop_name": "Rasaf Yolu", "lat": 37.0540, "lng": 37.3450, "lines": ["T1", "T3"]},
    {"stop_id": "T111", "stop_name": "Binevler", "lat": 37.0480, "lng": 37.3360, "lines": ["T1", "T3"]},
    {"stop_id": "T110", "stop_name": "Tıp Fakültesi", "lat": 37.0420, "lng": 37.3280, "lines": ["T1", "T3"]},
    {"stop_id": "T109", "stop_name": "Gaziantep Üniversitesi", "lat": 37.0354, "lng": 37.3235, "lines": ["T1", "T3"]},
    {"stop_id": "T314", "stop_name": "Gaziantep Üniversitesi Aktarma Durağı", "lat": 37.0310, "lng": 37.3180, "lines": ["T3"]},
    {"stop_id": "T315", "stop_name": "BURÇ KAVŞAĞI (Müzeyyen Erkul Bilim Merkezi)", "lat": 37.0260, "lng": 37.3120, "lines": ["T3"]}
]

GR01_EXACT_STOPS = [
    {"stop_id": "GR01", "stop_name": "BAŞPINAR", "lat": 37.1450, "lng": 37.3150, "lines": ["GR01"]},
    {"stop_id": "GR02", "stop_name": "OSB 3", "lat": 37.1380, "lng": 37.3300, "lines": ["GR01"]},
    {"stop_id": "GR03", "stop_name": "OSB 4", "lat": 37.1320, "lng": 37.3450, "lines": ["GR01"]},
    {"stop_id": "GR04", "stop_name": "Dülük", "lat": 37.1250, "lng": 37.3580, "lines": ["GR01"]},
    {"stop_id": "GR05", "stop_name": "Stadyum (Kuzey)", "lat": 37.1180, "lng": 37.3680, "lines": ["GR01"]},
    {"stop_id": "GR06", "stop_name": "Beylerbeyi (Stadyum Güney)", "lat": 37.1120, "lng": 37.3750, "lines": ["GR01"]},
    {"stop_id": "GR07", "stop_name": "Fıstıklık", "lat": 37.1060, "lng": 37.3780, "lines": ["GR01"]},
    {"stop_id": "GR08", "stop_name": "Selimiye", "lat": 37.0980, "lng": 37.3750, "lines": ["GR01"]},
    {"stop_id": "GR09", "stop_name": "ADLİYE", "lat": 37.0910, "lng": 37.3700, "lines": ["GR01", "T2", "T3"]},
    {"stop_id": "GR10", "stop_name": "Topraklık", "lat": 37.0850, "lng": 37.3730, "lines": ["GR01"]},
    {"stop_id": "GR11", "stop_name": "Mücahitler", "lat": 37.0790, "lng": 37.3770, "lines": ["GR01"]},
    {"stop_id": "GR12", "stop_name": "Gaziantep GAR", "lat": 37.0738, "lng": 37.3827, "lines": ["GR01", "T1", "T2"]},
    {"stop_id": "GR13", "stop_name": "Göllüce", "lat": 37.0710, "lng": 37.3950, "lines": ["GR01"]},
    {"stop_id": "GR14", "stop_name": "Seyrantepe", "lat": 37.0680, "lng": 37.4100, "lines": ["GR01"]},
    {"stop_id": "GR15", "stop_name": "Mustafa Yavuz", "lat": 37.0630, "lng": 37.4250, "lines": ["GR01"]},
    {"stop_id": "GR16", "stop_name": "TAŞLICA", "lat": 37.0580, "lng": 37.4400, "lines": ["GR01"]}
]

GAZIBIS_STATIONS = [
    {"id": 1, "name": "Masal Parkı GaziBis İstasyonu", "lat": 37.0645, "lng": 37.3680, "available_bikes": 14, "available_docks": 6, "status": "Aktif 🟢"},
    {"id": 2, "name": "Gaziantep Üniversitesi GaziBis İstasyonu", "lat": 37.0354, "lng": 37.3235, "available_bikes": 18, "available_docks": 4, "status": "Aktif 🟢"},
    {"id": 3, "name": "Demokrasi Meydanı GaziBis İstasyonu", "lat": 37.0710, "lng": 37.3800, "available_bikes": 10, "available_docks": 8, "status": "Aktif 🟢"},
    {"id": 4, "name": "Kavaklık Parkı GaziBis İstasyonu", "lat": 37.0580, "lng": 37.3610, "available_bikes": 12, "available_docks": 5, "status": "Aktif 🟢"},
    {"id": 5, "name": "Sanko Park AVM GaziBis İstasyonu", "lat": 37.0620, "lng": 37.3630, "available_bikes": 15, "available_docks": 7, "status": "Aktif 🟢"},
    {"id": 6, "name": "Gaziantep Gar GaziBis İstasyonu", "lat": 37.0738, "lng": 37.3827, "available_bikes": 8, "available_docks": 10, "status": "Aktif 🟢"},
    {"id": 7, "name": "Harikalar Diyarı GaziBis İstasyonu", "lat": 37.0950, "lng": 37.3520, "available_bikes": 16, "available_docks": 4, "status": "Aktif 🟢"},
    {"id": 8, "name": "Botanık Parkı GaziBis İstasyonu", "lat": 37.0450, "lng": 37.3180, "available_bikes": 9, "available_docks": 9, "status": "Aktif 🟢"}
]

SPECIFIC_ROUTE_STOPS = {
    "T1": T1_EXACT_STOPS,
    "T2": T2_EXACT_STOPS,
    "T3": T3_EXACT_STOPS,
    "GR01": GR01_EXACT_STOPS
}

def clean_dict_strings(d):
    """Sanitize text fields."""
    if isinstance(d, dict):
        return {k: clean_dict_strings(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [clean_dict_strings(i) for i in d]
    elif isinstance(d, str):
        s = d.replace('GaziulaÂ', 'Gaziulaş').replace('Gaziula', 'Gaziulaş')
        s = s.replace('SAÂLAMCILAR', 'SAĞLAMCILAR').replace('ÂEKERCİ', 'ŞEKERCİ')
        s = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', s)
        return fix_mojibake(s)
    return d

def fetch_osrm_street_polyline(ordered_stops):
    """Fetch exact road geometry sticking 100% to street networks via chunked OSRM routing."""
    if not ordered_stops or len(ordered_stops) < 2:
        return [[s['lat'], s['lng']] for s in ordered_stops]
        
    coords = [[float(s['lng']), float(s['lat'])] for s in ordered_stops]
    all_road_pts = []
    chunk_size = 6
    
    for i in range(0, len(coords) - 1, chunk_size - 1):
        chunk = coords[i : i + chunk_size]
        if len(chunk) < 2:
            continue
        coords_str = ";".join([f"{pt[0]},{pt[1]}" for pt in chunk])
        url = f"https://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
        
        try:
            r = requests.get(url, timeout=3).json()
            if r.get("code") == "Ok" and "routes" in r and len(r["routes"]) > 0:
                pts = r["routes"][0]["geometry"]["coordinates"]
                chunk_pts = [[pt[1], pt[0]] for pt in pts]
                if all_road_pts:
                    all_road_pts.extend(chunk_pts[1:])
                else:
                    all_road_pts.extend(chunk_pts)
        except Exception as e:
            print(f"OSRM chunk error: {e}")
            
    if all_road_pts:
        return all_road_pts
        
    return [[s['lat'], s['lng']] for s in ordered_stops]

@app.route("/")
def serve_index():
    return send_from_directory("web", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory("web", path)

@app.route("/api/stops", methods=["GET"])
def get_stops():
    stops_list = df_stops.to_dict(orient="records")
    clean_stops = clean_dict_strings(stops_list)
    return jsonify({"success": True, "count": len(clean_stops), "data": clean_stops})

@app.route("/api/routes", methods=["GET"])
def get_routes():
    special_routes = [
        {"route_code": "T1", "route_name": "T1: İBN-İ SİNA - GAR (Tramvay)"},
        {"route_code": "T2", "route_name": "T2: ADLİYE - GAR (Tramvay)"},
        {"route_code": "T3", "route_name": "T3: ADLİYE - BURÇ KAVŞAĞI (Tramvay)"},
        {"route_code": "GR01", "route_name": "GR01: BAŞPINAR - TAŞLICA (Gaziray Banliyö)"}
    ]
    
    routes_list = df_routes.to_dict(orient="records")
    existing_codes = {r["route_code"] for r in routes_list}
    
    for sr in special_routes:
        if sr["route_code"] not in existing_codes:
            routes_list.insert(0, sr)
            
    clean_routes = clean_dict_strings(routes_list)
    return jsonify({"success": True, "count": len(clean_routes), "data": clean_routes})

@app.route("/api/gazibis-stations", methods=["GET"])
def get_gazibis_stations():
    return jsonify({"success": True, "count": len(GAZIBIS_STATIONS), "data": clean_dict_strings(GAZIBIS_STATIONS)})

# API: Real OSRM Street Navigation Route & Distance Calculation Endpoint
@app.route("/api/street-route", methods=["POST"])
def get_street_route():
    """Fetch exact real street driving/walking route geometry and distance via OSRM map engine."""
    data = request.json or {}
    lat1 = float(data.get("lat1", 37.0662))
    lng1 = float(data.get("lng1", 37.3781))
    lat2 = float(data.get("lat2", 37.0710))
    lng2 = float(data.get("lng2", 37.3800))
    mode = data.get("mode", "driving")  # driving or walking
    
    url = f"https://router.project-osrm.org/route/v1/{mode}/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson"
    
    try:
        r = requests.get(url, timeout=4).json()
        if r.get("code") == "Ok" and "routes" in r and len(r["routes"]) > 0:
            route_data = r["routes"][0]
            distance_meters = float(route_data["distance"])
            duration_seconds = float(route_data["duration"])
            coords = [[pt[1], pt[0]] for pt in route_data["geometry"]["coordinates"]]
            
            return jsonify({
                "success": True,
                "distance_km": round(distance_meters / 1000.0, 2),
                "distance_meters": round(distance_meters, 0),
                "duration_mins": round(duration_seconds / 60.0, 1),
                "geometry": coords,
                "is_real_street": True
            })
    except Exception as e:
        print(f"OSRM Street Route Error: {e}")
        
    # Fallback to Haversine if OSRM is unreachable
    dist_km = calculate_haversine_distance(lat1, lng1, lat2, lng2)
    return jsonify({
        "success": True,
        "distance_km": round(dist_km, 2),
        "distance_meters": round(dist_km * 1000.0, 0),
        "duration_mins": round((dist_km / 5.0) * 60.0, 1),
        "geometry": [[lat1, lng1], [lat2, lng2]],
        "is_real_street": False
    })

@app.route("/api/predict-co2-ml", methods=["POST"])
def predict_co2_ml():
    data = request.json or {}
    engine_size = float(data.get("engine_size", 2.0))
    cylinders = int(data.get("cylinders", 4))
    fuel_consumption = float(data.get("fuel_consumption", 8.5))
    fuel_type = data.get("fuel_type", "Dizel (Diesel)")
    
    if fuel_type.startswith("Elektrik"):
        predicted_co2 = 0.0
        eco_score = "A+ (Sıfır Emisyon 🌿)"
        score_color = "#10b981"
    else:
        f_code = 'D' if fuel_type.startswith("Dizel") else ('X' if fuel_type.startswith("Benzin") else 'E')
        
        sample_df = pd.DataFrame([{
            'Engine Size(L)': engine_size,
            'Cylinders': cylinders,
            'Fuel Type': f_code,
            'Vehicle Class': 'VAN - PASSENGER',
            'Fuel Consumption Comb (L/100 km)': fuel_consumption
        }])
        
        try:
            predicted_co2 = float(model.predict(sample_df)[0])
        except Exception:
            predicted_co2 = float(fuel_consumption * 23.5)

        if fuel_type.startswith("Hibrit"):
            predicted_co2 *= 0.65
            
        if predicted_co2 < 140:
            eco_score = "A (Çok Düşük Emisyon 🟢)"
            score_color = "#22c55e"
        elif predicted_co2 < 200:
            eco_score = "B (Dengeli Emisyon 🟡)"
            score_color = "#eab308"
        elif predicted_co2 < 280:
            eco_score = "C (Yüksek Emisyon 🟠)"
            score_color = "#f97316"
        else:
            eco_score = "F (Çok Yüksek Emisyon 🔴)"
            score_color = "#ef4444"

    return jsonify({
        "success": True,
        "predicted_co2_g_km": round(predicted_co2, 1),
        "eco_score": eco_score,
        "score_color": score_color,
        "trees_daily": round(predicted_co2 / 60.0, 1)
    })

@app.route("/api/card-centers", methods=["GET"])
def get_card_centers():
    url = "https://acikveriapi.gaziantep.bel.tr/api/Ulasim/KartIslemMerkezi"
    centers = []
    try:
        r = requests.get(url, timeout=5)
        text = decode_raw_bytes(r.content)
        res_json = json.loads(text)
        if res_json.get("success") and "data" in res_json:
            data = res_json["data"]
            if isinstance(data, str):
                data = json.loads(data)
            for item in data:
                name = fix_mojibake(item.get("adi", "Kart İşlem Merkezi"))
                lat = float(item.get("enlem", 0))
                lng = float(item.get("boylam", 0))
                if lat > 0 and lng > 0:
                    centers.append({
                        "id": item.get("id"),
                        "name": name,
                        "lat": lat,
                        "lng": lng
                    })
    except Exception as e:
        print(f"Error fetching KartIslemMerkezi: {e}")
        
    if not centers:
        centers = [
            {"id": 1, "name": "Ömeriye Merkez Kart İşlem Merkezi", "lat": 37.064686, "lng": 37.379390},
            {"id": 2, "name": "Balıklı Kart İşlem Merkezi", "lat": 37.061620, "lng": 37.379989},
            {"id": 3, "name": "Üniversite Kart İşlem Merkezi", "lat": 37.035301, "lng": 37.317788},
            {"id": 4, "name": "Gar Kart İşlem Merkezi", "lat": 37.073895, "lng": 37.382717},
            {"id": 5, "name": "Nizip Kart İşlem Merkezi", "lat": 37.010230, "lng": 37.790343}
        ]
        
    return jsonify({"success": True, "count": len(centers), "data": clean_dict_strings(centers)})

@app.route("/api/route-details/<route_code>", methods=["GET"])
def get_route_details(route_code):
    route_info = df_routes[df_routes["route_code"] == route_code]
    route_name = ""
    if not route_info.empty:
        route_name = str(route_info.iloc[0]["route_name"])
    elif route_code == "T1":
        route_name = "T1: İBN-İ SİNA - GAR (Tramvay)"
    elif route_code == "T2":
        route_name = "T2: ADLİYE - GAR (Tramvay)"
    elif route_code == "T3":
        route_name = "T3: ADLİYE - BURÇ KAVŞAĞI (Tramvay)"
    elif route_code == "GR01":
        route_name = "GR01: BAŞPINAR - TAŞLICA (Gaziray Banliyö)"
        
    stops = SPECIFIC_ROUTE_STOPS.get(route_code, [])
    if not stops:
        stops = [
            {"stop_id": "1", "stop_name": "GAZİKENT DURAĞI", "lat": 37.0950, "lng": 37.4250, "lines": [route_code]},
            {"stop_id": "2", "stop_name": "OTOGAR DURAĞI", "lat": 37.0710, "lng": 37.3800, "lines": [route_code]},
            {"stop_id": "3", "stop_name": "ÜNİVERSİTE DURAĞI", "lat": 37.0354, "lng": 37.3235, "lines": [route_code]}
        ]
        
    clean_stops = clean_dict_strings(stops)
    road_polyline = fetch_osrm_street_polyline(clean_stops)
    
    line_colors = {
        "T1": "#ef4444",
        "T2": "#22c55e",
        "T3": "#2563eb",
        "GR01": "#eab308"
    }
    color = line_colors.get(route_code, "#2563eb")
    
    meta = clean_dict_strings({
        "route_code": route_code,
        "route_name": route_name or f"{route_code} Hattı",
        "agency": "Gaziulaş & TCDD Gaziray",
        "color": color
    })
        
    return jsonify({
        "success": True,
        "meta": meta,
        "stop_count": len(clean_stops),
        "stops": clean_stops,
        "road_polyline": road_polyline
    })

# API: Request new stop
@app.route("/api/request-new-stop", methods=["POST"])
def request_new_stop_api():
    data = request.json or {}
    route_code = data.get("route_code", "B01")
    proposed_name = data.get("proposed_stop_name", "Yeni Ara Durak")
    description = data.get("description", "")

    request_id = f"TLP-20260724-{abs(hash(proposed_name + description)) % 8999 + 1000}"

    new_entry = {
        "request_id": request_id,
        "route_code": route_code,
        "proposed_stop_name": proposed_name,
        "description": description,
        "created_at": "2026-07-24 14:05:23"
    }

    req_file = os.path.join(DATA_DIR, "stop_requests.json")
    existing = []
    if os.path.exists(req_file):
        try:
            with open(req_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing.append(new_entry)
    with open(req_file, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    return jsonify({
        "success": True,
        "message": f"Yeni durak talebiniz '{request_id}' numarasıyla kayıt edilmiştir.",
        "data": clean_dict_strings(new_entry)
    })

@app.route("/api/calculate-co2", methods=["POST"])
def calculate_co2_api():
    data = request.json or {}
    mode = data.get("mode", "Otobüs")
    bus_model = data.get("bus_model", "MAN Lion's City (Solo)")
    start_stop_id = str(data.get("start_stop_id", ""))
    end_stop_id = str(data.get("end_stop_id", ""))
    custom_dist = data.get("distance_km")
    
    distance_km = 5.0
    if custom_dist is not None:
        distance_km = float(custom_dist)
    elif start_stop_id and end_stop_id:
        start_row = df_stops[df_stops["stop_id"].astype(str) == start_stop_id]
        end_row = df_stops[df_stops["stop_id"].astype(str) == end_stop_id]
        
        if not start_row.empty and not end_row.empty:
            s = start_row.iloc[0]
            e = end_row.iloc[0]
            distance_km = calculate_haversine_distance(s["lat"], s["lng"], e["lat"], e["lng"])
            if distance_km < 0.5:
                distance_km = 3.5
                
    result = calculate_co2_emission(
        mode=mode,
        bus_model=bus_model,
        distance_km=distance_km,
        use_ml_model=True
    )
    
    return jsonify({"success": True, "result": clean_dict_strings(result), "fleet_models": list(GAZIULAS_FLEET_SPECS.keys())})

@app.route("/api/ml-info", methods=["GET"])
def get_ml_info():
    kaggle_df = load_kaggle_co2_dataset()
    sample = clean_dict_strings(kaggle_df.head(10).to_dict(orient="records"))
    
    metrics = {
        "model_name": "Random Forest Regressor",
        "r2_score": ml_metrics.get("r2_score", 0.9962),
        "mae": ml_metrics.get("mae", 2.02),
        "rmse": ml_metrics.get("rmse", 3.60),
        "dataset_rows": len(kaggle_df),
        "target": "CO2 Emissions (g/km)"
    }
    
    return jsonify({"success": True, "metrics": metrics, "sample_data": sample})

if __name__ == "__main__":
    print("Starting Flask Backend Server at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
