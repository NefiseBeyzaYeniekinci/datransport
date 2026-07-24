import requests
import json

base_url = "https://service.kentkart.com/api"
region = "027" # Gaziantep region code in Kentkart system

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
    "Origin": "https://online.gaziantepkart.com.tr",
    "Referer": "https://online.gaziantepkart.com.tr/"
}

# Test endpoints
endpoints = [
    f"{base_url}/rls/route/list?regionCode={region}",
    f"{base_url}/rls/v1/routes?regionCode={region}",
    f"{base_url}/v1/routes?regionCode={region}",
    f"{base_url}/rls/route/details?regionCode={region}&displayRouteCode=B01",
    f"{base_url}/rls/route/details?regionCode={region}&displayRouteCode=B53",
    f"{base_url}/rls/bus/list?regionCode={region}",
]

for ep in endpoints:
    try:
        r = requests.get(ep, headers=headers, timeout=4)
        print(ep, "Status:", r.status_code)
        if r.status_code == 200:
            print("  Response sample:", r.text[:250])
    except Exception as e:
        print(ep, "Error:", e)
