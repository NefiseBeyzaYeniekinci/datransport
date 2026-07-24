import os
import sys
import json
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api_client import fetch_bus_stops, fetch_bus_routes, fetch_tram_stops
from src.data_cleaner import fix_mojibake

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DATA_DIR, exist_ok=True)
out_file = os.path.join(DATA_DIR, "api_cekilen_veriler.txt")

print("Gaziantep Açık Veri API'sinden veriler çekiliyor...")

stops = fetch_bus_stops()
routes = fetch_bus_routes()
trams = fetch_tram_stops()

url_cards = "https://acikveriapi.gaziantep.bel.tr/api/Ulasim/KartIslemMerkezi"
cards = []
try:
    r = requests.get(url_cards, timeout=5)
    r.encoding = "iso-8859-9"
    j = r.json()
    data = j.get("data", [])
    if isinstance(data, str):
        data = json.loads(data)
    cards = data
except Exception as e:
    cards = []

with open(out_file, "w", encoding="utf-8") as f:
    f.write("========================================================================\n")
    f.write(" GAZİANTEP BÜYÜKŞEHİR BELEDİYESİ AÇIK VERİ API-DEN ÇEKİLEN TÜM VERİLER\n")
    f.write("========================================================================\n\n")
    
    # 1. Otobüs Durakları
    f.write(f"1. OTOBÜS VE TRAMVAY DURAKLARI (TOPLAM {len(stops)} KAYIT)\n")
    f.write("------------------------------------------------------------------------\n")
    for idx, s in enumerate(stops, 1):
        if isinstance(s, dict):
            s_id = s.get("stop_id") or s.get("DurakId") or s.get("id") or idx
            s_name = fix_mojibake(str(s.get("stop_name") or s.get("DurakAdi") or s.get("name") or "Durak"))
            lat = s.get("lat") or s.get("Enlem") or s.get("enlem")
            lng = s.get("lng") or s.get("Boylam") or s.get("boylam")
            f.write(f"{idx}. Durak ID: {s_id} | Durak Adı: {s_name} | Enlem: {lat} | Boylam: {lng}\n")
        else:
            f.write(f"{idx}. Durak: {fix_mojibake(str(s))}\n")
    f.write("\n\n")
    
    # 2. Otobüs Hat Bilgileri
    f.write(f"2. OTOBÜS HAT BİLGİLERİ (TOPLAM {len(routes)} KAYIT)\n")
    f.write("------------------------------------------------------------------------\n")
    for idx, r_item in enumerate(routes, 1):
        if isinstance(r_item, dict):
            r_code = r_item.get("route_code") or r_item.get("displayRouteCode") or r_item.get("routeCode") or idx
            r_name = fix_mojibake(str(r_item.get("route_name") or r_item.get("name") or "Hat"))
            f.write(f"{idx}. Hat Kodu: {r_code} | Hat İsmi: {r_name} | Hizmet Sağlayıcı: Gaziulaş\n")
        else:
            f.write(f"{idx}. Hat Bilgisi: {fix_mojibake(str(r_item))}\n")
    f.write("\n\n")

    # 3. Kart İşlem Merkezleri
    f.write(f"3. KART İŞLEM MERKEZLERİ (TOPLAM {len(cards)} KAYIT)\n")
    f.write("------------------------------------------------------------------------\n")
    for idx, c in enumerate(cards, 1):
        if isinstance(c, dict):
            c_id = c.get("id") or idx
            c_name = fix_mojibake(str(c.get("adi") or "Kart İşlem Merkezi"))
            lat = c.get("enlem")
            lng = c.get("boylam")
            f.write(f"{idx}. Merkez ID: {c_id} | İsim: {c_name} | Enlem: {lat} | Boylam: {lng}\n")
        else:
            f.write(f"{idx}. Kart Merkezi: {fix_mojibake(str(c))}\n")
    f.write("\n\n")

    # 4. Tramvay Durakları
    f.write(f"4. TRAMVAY DURAKLARI (TOPLAM {len(trams)} KAYIT)\n")
    f.write("------------------------------------------------------------------------\n")
    for idx, t in enumerate(trams, 1):
        t_name = fix_mojibake(str(t.get("DurakAdi") if isinstance(t, dict) else t))
        f.write(f"{idx}. Tramvay Durağı: {t_name}\n")

print(f"BAŞARILI: Tüm API verileri '{out_file}' dosyasına yazıldı!")
