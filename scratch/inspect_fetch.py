import requests
import re

url = "https://online.gaziantepkart.com.tr/assets/index-Bv7yRupR.js"
text = requests.get(url).text

# Search for fetch / axios calls or API route patterns
fetches = re.findall(r'(?:fetch|axios|get|post)\s*\(\s*[\"\`\']([^\"\'\`]+)[\"\`\']', text)
print("Fetch/Axios direct string URLs:", set(fetches[:20]))

# Search for string literals with /rls/ or /api/
literals = set(re.findall(r'\"([^\"]*api[^\"]*)\"', text))
print("API literals:", list(literals)[:20])

# Search for /routes or /stops paths
route_paths = set(re.findall(r'\"([^\"]*route[^\"]*)\"', text))
print("Route paths:", list(route_paths)[:20])
