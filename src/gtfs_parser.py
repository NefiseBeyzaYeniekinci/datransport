import os
import re
import json
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
GTFS_DIR = os.path.join(DATA_DIR, "gtfs")

def clean_gtfs_text(text):
    """Clean and repair Turkish characters in GTFS text fields."""
    if not isinstance(text, str):
        return text
    replacements = {
        '\x9f': 'ş', '\x9e': 'Ş',
        '\x87': 'ç', '\x86': 'Ç',
        '\x99': 'ğ', '\x98': 'Ğ',
        '\x91': 'ı', '\x90': 'İ',
        '\xb6': 'ö', '\x96': 'Ö',
        '\xbc': 'ü', '\x9c': 'Ü',
        '': 'i',
        'Â': 'ş'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    return text

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
            r_path = os.path.join(GTFS_DIR, 'routes.txt')
            s_path = os.path.join(GTFS_DIR, 'stops.txt')
            sh_path = os.path.join(GTFS_DIR, 'shapes.txt')
            t_path = os.path.join(GTFS_DIR, 'trips.txt')
            st_path = os.path.join(GTFS_DIR, 'stop_times.txt')

            if os.path.exists(r_path):
                self.routes_df = pd.read_csv(r_path, encoding='latin1')
                self.routes_df['route_short_name'] = self.routes_df['route_short_name'].astype(str).apply(clean_gtfs_text)
                self.routes_df['route_long_name'] = self.routes_df['route_long_name'].astype(str).apply(clean_gtfs_text)

            if os.path.exists(s_path):
                self.stops_df = pd.read_csv(s_path, encoding='latin1')
                self.stops_df['stop_name'] = self.stops_df['stop_name'].astype(str).apply(clean_gtfs_text)

            if os.path.exists(sh_path):
                self.shapes_df = pd.read_csv(sh_path, encoding='latin1')

            if os.path.exists(t_path):
                self.trips_df = pd.read_csv(t_path, encoding='latin1')

            if os.path.exists(st_path):
                self.stop_times_df = pd.read_csv(st_path, encoding='latin1')

            self.is_loaded = True
            print("Official Gaziantep GTFS dataset loaded successfully into memory.")
        except Exception as e:
            print(f"Error loading GTFS dataset: {e}")

    def get_all_routes(self):
        if not self.is_loaded or self.routes_df is None:
            return []

        routes = []
        seen_codes = set()

        for _, r in self.routes_df.iterrows():
            code = str(r['route_short_name']).strip()
            name = str(r.get('route_long_name', '')).strip()
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

        matching_routes = self.routes_df[self.routes_df['route_short_name'] == str(route_code)]
        if matching_routes.empty:
            return None, None, None

        r_row = matching_routes.iloc[0]
        route_id = r_row['route_id']
        route_name = str(r_row.get('route_long_name', ''))
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
                    "stop_name": str(s['stop_name']),
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
