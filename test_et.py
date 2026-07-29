import requests

siparis = {
    "distance_km": 6.2,
    "hour": 8,
    "traffic_density": 0.75,
}

url = "http://127.0.0.1:5000/api/ai-route-recommend"

try:
    cevap = requests.post(url, json=siparis)
    print(f"Status Kod: {cevap.status_code}\n")

    if cevap.status_code == 200:
        print("✅ YAPAY ZEKA MODELİNDEN GELEN YANIT:\n")
        print(cevap.json())
    else:
        print("⚠️ SUNUCU HATA DÖNDÜRDÜ (HTML/TEXT):\n")
        print(cevap.text)
except Exception as e:
    print("\n❌ Bağlantı Hatası:", e)