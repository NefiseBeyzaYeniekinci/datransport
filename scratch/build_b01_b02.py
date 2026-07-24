import os
import sys
import json
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.data_cleaner import fix_mojibake

df_stops = pd.read_csv("data/cleaned_transport_data.csv")

b01_names = [
    "Gazikent Son Durak", "Rayalp Apt.", "Burak Mah. 29 Nolu Cad. 1", "Burak Mah. 29 Nolu Cad. 2",
    "Çamlıca Öğrenci Yurdu", "Burak Mah. 29 Nolu Cad. 3", "Birlik Inşaat", "Melisa Akar Parkı",
    "Fidan Inşaat", "26 Nolu Cad.üzeri. 1", "26 Nolu Cad. Üzeri 2", "26 Nolu Cad. Üzeri 3",
    "Akteks Spor Salonu", "Pasaj Esnaf Sitesi", "Hisar Yapı Sitesi", "Serinevler Sitesi",
    "Burcu Sitesi", "19 Nolu Cad.", "Arı Sitesi", "Seçkin Evler", "Tanış Yapı Koop.",
    "Kudüs Sitesi", "Asosmer Inşaat", "Sarı Konutlar 2.", "Sevimli City 2.", "Anpa Gross",
    "Otogar 1", "Otogar 2", "Fen Işleri Gaski", "Merveşehir 49021 Cad. 3", "Merveşehir 49021 Cad. 4",
    "Şehitkamil Nikah Salonu", "Merveşehir Bim Avm.", "Merveşehir 22 Nolu Cad.", "Merveşehir Santrali",
    "Merinos Merveşehir 50070 Cad.", "70 Nolu Cad.", "Onatkutlar Sosyal Tesisleri",
    "Onat Kutlar Sosyal Tesisleri 1", "Onat Kutlar Sosyal Tesisleri 25 Nolu Cad. 2",
    "Onat Kutlar Sosyal Tesisleri 3", "Turgut Özal Bulvarı Mobese", "Turğut Özal Blv Mobese",
    "Selimiye Mahallesi", "Şehit Enes Kaya Orta Okul", "Çetin Emeç Caddesi", "Şehitkamil Devlet Hst.",
    "Kayaönü Itfaiye", "Öz Fatih Sürücü Kursu", "Sani Konukoğlu Blv. 1", "Adliye Sarayı",
    "Ulu Mobilya Tugay", "Polis Okulu Lojmanı", "Güvenevler 26 Nolu Cad. 1", "Güvenevler 26 Nolu Cad. 2",
    "Güvenevler 26 Nolu Cad. 3", "Enkaya Inşaat", "Osmanlı Parkı", "Mustafa Taşar Caddesi",
    "Atatürk Mah.polat Sitesi", "Vali Kemal Kalender Cad. 1", "Sun Sitesi", "Vali Kemal Kalender Cad. 2",
    "Memik Şekerci Camii", "Nihavend Konutları", "Muhsin Yazıcıoğlu Cad.", "Sena Sitesi",
    "Sağlamcılar Camii Önü", "Kürşad Tüzmen Blv.", "Abdulkadir Aksu Blv. Kaleli Konutları",
    "Abdulkadir Aksu Blv. Metro Avm.", "Mustafa Erkent Çeşmesi", "Mimoza Sitesi", "Nijmegen Blv.",
    "Osman Gazi Mah. 56062 Nolu Cad. 1", "Osman Gazi Mah. 56062 Nolu Cad. 2", "Güçsüzler Yurdu",
    "Özaslan Okulları", "Türgev Kız Öğrenci Yurdu 2", "Primemall Avm.", "Primemall Avm. 1",
    "Raylı Sistemler Depo", "Güllüoğlu Camii", "Üniversite Blv. Tıp Fakültesi Önü", "Üniversite Önü",
    "Müzeyyen Erkul Bilim Merkezi", "Halep Bulvarı", "Ensar Sitesi", "Güneykent Sondurak"
]

b02_names = [
    "Mavikent Son Durak", "Mavikent 4.Etap", "Mavikent Mah.a 101", "Şahinbey Asfalt Şantiyesi",
    "Mavikent Sanayi Sitesi Yolu", "Mavikent Sanayi Yolu 2", "Mavikent Sanayi Yolu 3",
    "Mavikent 3.Etap Sitesi", "Gaziler Sitesi", "Gaziler Sitesi Park", "Mavikent Mh. Semt Pazarı",
    "Gentaş Park Evleri", "Günsev Sitesi 9.", "Zeliha Ziylan Kız Anadolu Lisesi", "Ibnisina Mah.1",
    "Ibnisina Mah.2", "Ibnisina Mah.3", "Ibnisina Mah.4", "Ibni Sina Günsev Sitesi", "Ibnisina Mah.",
    "Hakkı Orhan Inşaat", "Ibni Sina Mah.rampa", "Özdemirbey Cad 2", "Yeşil Vadi Köprüsü",
    "Özdemir Bey Caddesi Kavşak", "Güzeldere Anadolu Lisesi", "Bedri Ince Tahtacı Ilk Okulu",
    "Yeşilvadi Kapalı Pazar Yeri", "Toki Evleri", "Toki Evleri", "Yeşilvadi Kapalı Pazar Yeri",
    "Dumlupınar", "Dumlupınar Yalçın Pide", "Dumlupınar Mh.", "Dumlupınar Camii",
    "Esentepe Mahallesi 36 Nolu Sk", "Esentepe Sosyal Tesisleri", "Yeşilırmak Cad.",
    "25.Aralık I.ö Okulu", "Yaşam Hastanesi", "Düztepe I.ö.o", "Haci Halil Camii",
    "Aliye Ömer Battal I.ö.o", "Balıklı", "Eski Emirgan", "Abdullah Kepkep", "Forum Avm.",
    "Forum Avm.", "Eski Otobüs Işletmesi", "D.d.y Lojistik", "Istasyon Meydan"
]

def build_route_stops(name_list, start_coords, end_coords, line_code, sample_lines):
    stops = []
    n = len(name_list)
    lat_step = (end_coords[0] - start_coords[0]) / float(n - 1)
    lng_step = (end_coords[1] - start_coords[1]) / float(n - 1)

    for idx, name in enumerate(name_list):
        clean_name = fix_mojibake(name).upper()
        # Try matching in database
        sub = df_stops[df_stops['stop_name'].str.contains(clean_name[:8], case=False, na=False)]
        if not sub.empty:
            lat = float(sub.iloc[0]['lat'])
            lng = float(sub.iloc[0]['lng'])
            s_id = str(sub.iloc[0]['stop_id'])
        else:
            lat = round(start_coords[0] + idx * lat_step, 5)
            lng = round(start_coords[1] + idx * lng_step, 5)
            s_id = f"{line_code[1:]}{idx+1:02d}"

        stops.append({
            "stop_id": s_id,
            "stop_name": clean_name,
            "lat": lat,
            "lng": lng,
            "lines": sample_lines
        })
    return stops

b01_stops = build_route_stops(b01_names, (37.0950, 37.4250), (37.0340, 37.3100), "B01", ["B01", "B30", "B57", "B79", "B80", "M03", "M04", "M05"])
b02_stops = build_route_stops(b02_names, (37.0120, 37.3320), (37.0738, 37.3827), "B02", ["B02", "B01", "M01", "M03", "S03"])

print(f"B01 built: {len(b01_stops)} stops")
print(f"B02 built: {len(b02_stops)} stops")

with open("scratch/b01_b02_built.json", "w", encoding="utf-8") as f:
    json.dump({"B01": b01_stops, "B02": b02_stops}, f, ensure_ascii=False, indent=2)
