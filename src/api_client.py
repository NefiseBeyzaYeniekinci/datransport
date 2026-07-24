import requests
import json
import os
import re

BASE_URL = "https://acikveriapi.gaziantep.bel.tr"

def decode_raw_bytes(b):
    """Decode raw bytes using iso-8859-9 (Turkish encoding) to prevent Mojibake."""
    if isinstance(b, bytes):
        try:
            return b.decode('iso-8859-9')
        except Exception:
            return b.decode('utf-8', errors='ignore')
    return str(b)

def clean_text_str(s):
    if not isinstance(s, str):
        return s
    s = s.replace('\ufffd', '').replace('\x00', '')
    s = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def fetch_bus_stops():
    """Fetch raw bus stops from Gaziantep Open Data API."""
    url = f"{BASE_URL}/api/Ulasim/Duraklar"
    try:
        response = requests.get(url, timeout=6)
        if response.status_code == 200:
            decoded_text = decode_raw_bytes(response.content)
            res_json = json.loads(decoded_text)
            if res_json.get("success") and "data" in res_json:
                data = res_json["data"]
                if isinstance(data, str):
                    data = json.loads(data)
                return data
    except Exception as e:
        print(f"API Error fetching Duraklar: {e}")
    return get_fallback_bus_stops()

def fetch_bus_routes():
    """Fetch route and stop information from Gaziantep Open Data API."""
    url = f"{BASE_URL}/api/Ulasim/OtobusHatBilgisi"
    try:
        response = requests.get(url, timeout=6)
        if response.status_code == 200:
            decoded_text = decode_raw_bytes(response.content)
            res_json = json.loads(decoded_text)
            if res_json.get("success") and "data" in res_json:
                raw_data = res_json["data"]
                if isinstance(raw_data, str):
                    return json.loads(raw_data)
                return raw_data
    except Exception as e:
        print(f"API Error fetching OtobusHatBilgisi: {e}")
    return get_fallback_bus_routes()

def fetch_tram_stops():
    """Fetch tram stops."""
    url = f"{BASE_URL}/api/Ulasim/TramvayDuraklari"
    try:
        response = requests.get(url, timeout=6)
        if response.status_code == 200:
            decoded_text = decode_raw_bytes(response.content)
            res_json = json.loads(decoded_text)
            if res_json.get("success") and "data" in res_json:
                return res_json["data"]
    except Exception as e:
        print(f"API Error fetching TramvayDuraklari: {e}")
    return get_fallback_tram_stops()

def fetch_gaziray_info():
    """Fetch Gaziray line info."""
    url = f"{BASE_URL}/api/Ulasim/GaziRayHatBilgisi"
    try:
        response = requests.get(url, timeout=6)
        if response.status_code == 200:
            decoded_text = decode_raw_bytes(response.content)
            res_json = json.loads(decoded_text)
            if res_json.get("success") and "data" in res_json:
                return res_json["data"]
    except Exception as e:
        print(f"API Error fetching GaziRayHatBilgisi: {e}")
    return []

# Fallbacks
def get_fallback_bus_stops():
    return [
        {"name": "GATEM KUNDURACILAR SİTESİ", "miPrinx": 1, "lat": 37.075715, "lng": 37.441600},
        {"name": "26 NOLU CADDE", "miPrinx": 2, "lat": 37.095900, "lng": 37.424720},
        {"name": "AKTEKS SPOR SALONU", "miPrinx": 3, "lat": 37.081200, "lng": 37.412000},
        {"name": "PASAJ ESNAF SİTESİ", "miPrinx": 4, "lat": 37.079000, "lng": 37.398000},
        {"name": "HİSAR YAPI SİTESİ", "miPrinx": 5, "lat": 37.068000, "lng": 37.385000},
        {"name": "GAZİKENT MERKEZ", "miPrinx": 6, "lat": 37.085000, "lng": 37.390000},
        {"name": "SERİNEVLER SİTESİ", "miPrinx": 7, "lat": 37.062000, "lng": 37.375000},
        {"name": "DEMOKRASİ MEYDANI", "miPrinx": 8, "lat": 37.066220, "lng": 37.378120},
        {"name": "GAZİANTEP ÜNİVERSİTESİ", "miPrinx": 9, "lat": 37.035400, "lng": 37.323500},
        {"name": "SANKOPARK DURAĞI", "miPrinx": 10, "lat": 37.061000, "lng": 37.362000},
        {"name": "OTOGAR İSTASYONU", "miPrinx": 11, "lat": 37.091000, "lng": 37.399000},
        {"name": "KARATAŞ MERKEZ", "miPrinx": 12, "lat": 37.021000, "lng": 37.345000}
    ]

def get_fallback_bus_routes():
    return {
        "routeList": [
            {"routeCode": "00018", "displayRouteCode": "M18", "name": "OTOGAR - GAZİANTEP ÜNİVERSİTESİ - KARATAŞ", "agencyName": "Gaziulaş", "routeColor": "2563EB"},
            {"routeCode": "00010", "displayRouteCode": "B01", "name": "GAZİKENT - ENSAR SİTESİ", "agencyName": "Gaziulaş", "routeColor": "059669"},
            {"routeCode": "00020", "displayRouteCode": "B02", "name": "MAVİKENT - İSTASYON", "agencyName": "Gaziulaş", "routeColor": "D97706"},
            {"routeCode": "00030", "displayRouteCode": "B03", "name": "ÖNCÜLİKAYA - ÇOCUK HASTANESİ", "agencyName": "Gaziulaş", "routeColor": "7C3AED"}
        ],
        "stopList": [
            {"stopId": "10001", "name": "GATEM KUNDURACILAR SİTESİ", "lat": "37.0757157", "lng": "37.4416009"},
            {"stopId": "10002", "name": "26 NOLU CADDE", "lat": "37.0959", "lng": "37.42472"},
            {"stopId": "10003", "name": "OTOGAR İSTASYONU", "lat": "37.0910", "lng": "37.3990"},
            {"stopId": "10004", "name": "DEMOKRASİ MEYDANI", "lat": "37.0662", "lng": "37.3781"},
            {"stopId": "10005", "name": "SANKOPARK DURAĞI", "lat": "37.0610", "lng": "37.3620"},
            {"stopId": "10006", "name": "GAZİANTEP ÜNİVERSİTESİ", "lat": "37.0354", "lng": "37.3235"},
            {"stopId": "10007", "name": "KARATAŞ MERKEZ", "lat": "37.0210", "lng": "37.3450"}
        ]
    }

def get_fallback_tram_stops():
    return [
        {"name": "GAR İSTASYONU", "lat": 37.0691, "lng": 37.3831},
        {"name": "ADLİYE İSTASYONU", "lat": 37.0850, "lng": 37.3610},
        {"name": "BURÇ KAVŞAĞI", "lat": 37.0390, "lng": 37.3280},
        {"name": "İBNİ SİNA HASTANESİ", "lat": 37.0150, "lng": 37.3400}
    ]
