import requests
import re

url = "https://online.gaziantepkart.com.tr/assets/index-Bv7yRupR.js"
r = requests.get(url)
text = r.text

print("Bundle size:", len(text))

# Find base URLs
base_urls = set(re.findall(r'https?://[a-zA-Z0-9\.\-\:\_]+', text))
print("Base URLs found:")
for b in base_urls:
    print(" -", b)

# Find API paths
paths = set(re.findall(r'/[a-zA-Z0-9\_\-\/]+/rls/[a-zA-Z0-9\_\-\/]+', text))
print("RLS paths found:", paths)

# Find route queries
routes_q = set(re.findall(r'regionCode=[a-zA-Z0-9\_]+', text))
print("Region queries:", routes_q)
