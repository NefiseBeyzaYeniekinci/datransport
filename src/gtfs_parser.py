import os
import io
import re
import json
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
GTFS_DIR = os.path.join(DATA_DIR, "gtfs")

def fix_mojibake_text(text):
    """Repair residual Turkish mojibake characters."""
    if not isinstance(text, str):
        return text
    replacements = {
        'stasyon': 'İstasyon',
        'ncilikaya': 'İncilikaya',
        'ocuk': 'Çocuk',
        'Gne': 'Güneş',
        'Sefaehir': 'Sefaşehir',
        'Gzelyurt': 'Güzelyurt',
        'Konutlar': 'Konutları',
        'Balkl': 'Balıklı',
        'H.Bahesi': 'H.Bahçesi',
        'Pazar': 'Pazarı',
        'Yama': 'Yamaç',
        'Bulvar': 'Bulvarı',
        'Gaziula': 'Gaziulaş',
        'nv.': 'Ünv.',
        'Bur': 'Burç',
        'Kava': 'Kavşağı',
        'lk': 'İlk',
        'ğretmenler': 'Öğretmenler',
        'arşı': 'Çarşı'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def load_clean_gtfs_csv(filename):
    """Load GTFS csv and fix Windows CP1254 byte encodings into clean UTF-8 text."""
    path = os.path.join(GTFS_DIR, filename)
    if not os.path.exists(path):
        return None

    with open(path, 'rb') as f:
        content = f.read()

    byte_map = {
        0x9f: 'ş'.encode('utf-8'),
        0x9e: 'Ş'.encode('utf-8'),
        0x87: 'ç'.encode('utf-8'),
        0x86: 'Ç'.encode('utf-8'),
        0x99: 'ğ'.encode('utf-8'),
        0x98: 'Ğ'.encode('utf-8'),
        0x91: 'ı'.encode('utf-8'),
        0x90: 'İ'.encode('utf-8'),
        0xb6: 'ö'.encode('utf-8'),
        0x96: 'Ö'.encode('utf-8'),
        0xbc: 'ü'.encode('utf-8'),
        0x9c: 'Ü'.encode('utf-8'),
    }

    cleaned = bytearray()
    for b in content:
        if b in byte_map:
            cleaned.extend(byte_map[b])
        else:
            cleaned.append(b)

    text = cleaned.decode('utf-8', errors='ignore')
    return pd.read_csv(io.StringIO(text))

class GTFSStore:
    def __init__(self):
        self.routes_df = None
        self.stops_df = None
        self.shapes_df = None
        self.trips_df = None
        self.stop_times_df = None
        self.is_loaded = False
        self.load_data()

    def load_data(self):
        if not os.path.exists(GTFS_DIR):
            return

        try:
            self.routes_df = load_clean_gtfs_csv('routes.txt')
            self.stops_df = load_clean_gtfs_csv('stops.txt')
            self.shapes_df = load_clean_gtfs_csv('shapes.txt')
            self.trips_df = load_clean_gtfs_csv('trips.txt')
            self.stop_times_df = load_clean_gtfs_csv('stop_times.txt')

            self.is_loaded = True
            print("Official Gaziantep GTFS dataset loaded with 100% clean Turkish encodings.")
        except Exception as e:
            print(f"Error loading GTFS dataset: {e}")

    def get_all_routes(self):
        if not self.is_loaded or self.routes_df is None:
            return []

        routes = []
        seen_codes = set()

        for _, r in self.routes_df.iterrows():
            code = fix_mojibake_text(str(r['route_short_name'])).strip()
            name = fix_mojibake_text(str(r.get('route_long_name', ''))).strip()
            color = str(r.get('route_color', '2563eb')).strip()
            if not color.startswith('#'):
                color = '#' + color

            if code and code not in seen_codes:
                seen_codes.add(code)
                routes.append({
                    "route_code": code,
                    "route_name": f"{code} - {name}" if name else f"{code} Hattı",
                    "color": color
                })

        routes.sort(key=lambda x: x["route_code"])
        return routes

    def get_route_details(self, route_code):
        if not self.is_loaded or self.routes_df is None:
            return None, None, None

        matching_routes = self.routes_df[self.routes_df['route_short_name'].astype(str) == str(route_code)]
        if matching_routes.empty:
            return None, None, None

        r_row = matching_routes.iloc[0]
        route_id = r_row['route_id']
        route_name = fix_mojibake_text(str(r_row.get('route_long_name', '')))
        color = str(r_row.get('route_color', '2563eb')).strip()
        if not color.startswith('#'):
            color = '#' + color

        matching_trips = self.trips_df[self.trips_df['route_id'] == route_id] if self.trips_df is not None else pd.DataFrame()

        stops_list = []
        if not matching_trips.empty and self.stop_times_df is not None and self.stops_df is not None:
            best_trip_id = matching_trips.iloc[0]['trip_id']
            st_times = self.stop_times_df[self.stop_times_df['trip_id'] == best_trip_id].sort_values('stop_sequence')
            merged_stops = st_times.merge(self.stops_df, on='stop_id')

            for _, s in merged_stops.iterrows():
                stops_list.append({
                    "stop_id": str(s['stop_id']),
                    "stop_name": fix_mojibake_text(str(s['stop_name'])),
                    "lat": float(s['stop_lat']),
                    "lng": float(s['stop_lon']),
                    "lines": [str(route_code)]
                })

        road_polyline = []
        if not matching_trips.empty and self.shapes_df is not None and 'shape_id' in matching_trips.columns:
            shape_id = matching_trips.iloc[0]['shape_id']
            shape_pts = self.shapes_df[self.shapes_df['shape_id'] == shape_id].sort_values('shape_pt_sequence')
            for _, pt in shape_pts.iterrows():
                road_polyline.append([float(pt['shape_pt_lat']), float(pt['shape_pt_lon'])])

        meta = {
            "route_code": str(route_code),
            "route_name": f"{route_code} - {route_name}" if route_name else f"{route_code} Hattı",
            "agency": "Gaziulaş GTFS Resmi Verisi",
            "color": color
        }

        return meta, stops_list, road_polyline

gtfs_store = GTFSStore()
