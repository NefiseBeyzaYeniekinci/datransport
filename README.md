# 🏛️ Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım Portalı

> **Kentkart Canlı API, Açık Veri Entegrasyonu, OSRM Karayolu Navigasyonu, Random Forest Makine Öğrenmesi CO2 Simülatörü ve GaziBis Mobilite Platformu**

![Gaziantep Akıllı Ulaşım Portalı](https://img.shields.io/badge/Gaziantep%20B%C3%BCy%C3%BCk%C5%9Fehir%20Belediyesi-Ak%C4%B1ll%C4%B1%20Ula%C5%9F%C4%B1m-2563eb?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3-000000?style=for-the-badge&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Interactive%20Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)

---

## 📌 Proje Hakkında

**Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım Portalı**, Gaziantep kent içi toplu taşıma ağının (Otobüs, Tramvay, Gaziray), bisiklet paylaşım sisteminin (GaziBis) ve kentsel karbon ayak izinin canlı verilerle izlendiği, analiz edildiği ve simüle edildiği **dünya standartlarında web tabanlı akıllı şehir platformudur**.

Proje; vatandaşların ulaşım hatlarını incelemesini, yollar üzerinden gerçek karayolu mesafesini ölçmesini, yeni ara durak talepleri iletmesini, seyahatlerinin CO2 emisyonunu hesaplayıp en çevreci modu seçmesini ve GaziBis bisiklet randevusu oluşturmasını sağlar.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🚏 Hatlar & İnteraktif Harita
* **Otobüs & Raylı Sistem Hatları:** GAZİULAŞ otobüs hatları (B01, B02...), T1 (Gar-Adliye), T2 (Gar-Akkent), T3 (Adliye-Burç) Tramvay hatları ve **GR01 Gaziray** banliyö hattının resmi durak dizilimleri.
* **Canlı Araç & Durak Takibi:** Durak detaylarında hatta hizmet veren otobüs göstergeleri ve hat yönü değiştirme fonksiyonu.
* **💳 Kart İşlem Merkezleri & GaziBis Katmanı:** Gaziantep genelindeki Kentkart başvuru merkezleri ve GaziBis istasyonlarının harita üzerinde gösterimi.

### 2. 📐 OSRM Gerçek Karayolu Mesafe Ölçer
* Kuş uçuşu düz çizgi yerine **Open Source Routing Machine (OSRM)** karayolu navigasyon motoru entegrasyonu.
* Harita üzerinde işaretlenen 2 nokta arasındaki **gerçek sokak/karayolu sürüş mesafesini (km/metre)**, arabayla seyahat süresini ve yürüme süresini hesaplar.
* İki durak arası 1.2 km'yi aştığında otomatik **`⚠️ Uzun Ara Mesafe`** uyarısı vererek vatandaş durak talebine yönlendirir.

### 3. 🚦 Gaziantep Canlı Trafik Yoğunluk Haritası
* `gaziantep.yogunlukharitasi.com` entegrasyonu ile Gaziantep şehir merkezi ve ana arterlerdeki anlık yol durumu, dur-kalk indeksleri ve trafik akış çizgileri canlı olarak görüntülenir.

### 4. 📝 Yeni Ara Durak Talebi Modülü
* Harita üzerinde tıklanan konuma göre en yakın önceki ve sonraki durağı otomatik tespit eder.
* Ara karayolu mesafesini ve tahmini yürüme süresini hesaplayarak Ulaşım Daire Başkanlığı sistemine **otomatik talep takip numarası (`TLP-2026...`)** ile başvuru oluşturur.

### 5. 🌱 Ultra-Modern CO2 Salınım & Güzergah Karşılaştırma Dashboard'u
* **Otobüs vs. Tramvay Karşılaştırması:** Seçilen başlangıç ve varış durakları arasında Otobüs (MAN Solo, MAN Körüklü, Otokar Doruk, Temsa Prestij, 18M Elektrikli) ile Tramvay modlarının CO2 emisyonlarını ve seyahat sürelerini karşılaştırır.
* **Yapay Zeka Tavsiyesi & Ağaç Kazancı:** En düşük emisyonlu modu **`🌱 ÖNERİLEN`** olarak vurgular ve sağlanan karbon tasarrufundan elde edilen günlük ağaç kazancını (`🌲 Ağaç Kazancı`) hesaplar.
* **Saatlik Emisyon Eğrisi:** Gün içindeki saatlere (06:00 - 24:00) göre otobüs filosunun CO2 emisyon zirvelerini gösterir.

### 6. 🚲 GaziBis Bisiklet Kiralama & Randevu
* 8 adet GaziBis istasyonunun canlı boş bisiklet ve boş park yeri durumları.
* 11 haneli telefon format doğrulamalı (`05XX XXX XX XX`) anlık bisiklet rezervasyon sistemi.

### 7. 🤖 Veri & AI Simülatörü ve 5 Farklı CSV Export Merkezi
* **Random Forest ML Modeli:** Motor Hacmi, Silindir Sayısı, Şehir İçi Yakıt Tüketimi ve Yakıt Türüne göre anlık kilometredeki CO2 g/km emisyonunu ve Eco Puanını (A, B, C, D, E) tahmin eder.
* **📥 5 Farklı CSV İndirme Formatı:**
  1. *Duraklar & GPS Konum Veri Seti (CSV)*
  2. *GAZİULAŞ Otobüs Filosu & CO2 Kataloğu (CSV)*
  3. *GaziBis Canlı İstasyon Verisi (CSV)*
  4. *Vatandaş Durak Talepleri Raporu (CSV)*
  5. *Kaggle ML Araç Emisyon Veri Seti (CSV)*

---

## 📚 Yararlanılan Kaynaklar ve Veri Setleri

Projenin geliştirilmesinde ve doğrulanmasında aşağıdaki resmi veri kaynakları ve kütüphaneler kullanılmıştır:

* 🚌 **Hatlar, Güzergahlar ve Sefer Saatleri:** [GAZİULAŞ Resmi Web Sitesi](https://gaziulas.com.tr/) & [Gaziantep Kart Online](https://online.gaziantepkart.com.tr/)
* 🚦 **Gaziantep Canlı Trafik Yoğunluğu ve Yol Durumu:** [Gaziantep Yoğunluk Haritası](https://gaziantep.yogunlukharitasi.com/)
* 📊 **Otobüs & Araç CO2 Emisyon Hesaplama ML Veri Seti:** [Kaggle Vehicle CO2 Emissions Dataset](https://www.kaggle.com/datasets/brsahan/vehicle-co2-emissions-dataset)
* 📍 **Açık Veri Servisi:** [Gaziantep Büyükşehir Belediyesi Açık Veri Portal API](https://acikveriapi.gaziantep.bel.tr/)
* 🗺️ **Karayolu Navigasyon Motoru:** [Open Source Routing Machine (OSRM API)](https://router.project-osrm.org/)

---

## 🛠️ Teknoloji Yığını

* **Backend:** Python 3.10+, Flask, Requests, Joblib, NumPy, Pandas
* **Machine Learning:** Scikit-Learn (Random Forest Regressor Model)
* **Frontend:** HTML5, Modern Vanilla CSS (Glassmorphism & Flex/Grid Design System), JavaScript (ES6+)
* **Harita & Grafikler:** Leaflet.js (CartoDB Voyager Tiles), Chart.js (Custom Animated Plugins)
* **İkonlar & Tipografi:** FontAwesome 6, Google Fonts (Inter & Outfit)

---

## 🚀 Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/NefiseBeyzaYeniekinci/datransport.git
cd datransport
```

### 2. Gerekli Bağımlılıkları Yükleyin
```bash
pip install flask pandas numpy scikit-learn joblib requests
```

### 3. Sunucuyu Başlatın
```bash
python server.py
```

### 4. Tarayıcıda Açın
Uygulama varsayılan olarak **`http://localhost:5000`** adresinde çalışmaya başlayacaktır:
```text
 * Running on http://127.0.0.1:5000
```

---

## 📁 Proje Dizin Yapısı

```text
datransport/
├── data/
│   ├── api_cekilen_veriler.txt       # Çekilen ham API verileri
│   ├── cleaned_bus_routes.csv        # Temizlenmiş hat ve durak verileri
│   ├── cleaned_transport_data.csv    # Temizlenmiş ulaşım emisyon veri seti
│   ├── co2_rf_model.joblib           # Eğitilmiş Random Forest ML Modeli
│   ├── gazibis_reservations.json     # Kaydedilen GaziBis randevuları
│   └── stop_requests.json            # Vatandaş durak talepleri
├── src/
│   ├── api_client.py                 # Kentkart & Açık Veri API entegrasyonu
│   ├── co2_calculator.py             # CO2 emisyon hesaplama mantığı
│   ├── data_cleaner.py               # Veri temizleme ve işleme boru hattı
│   └── ml_model.py                   # Random Forest model eğitim modülü
├── web/
│   ├── css/
│   │   └── style.css                 # Glassmorphic özel CSS tasarım sistemi
│   ├── js/
│   │   └── app.js                    # İnteraktif harita, OSRM ve grafik mantığı
│   └── index.html                    # Ana portal HTML şablonu
├── README.md                         # Proje dokümantasyonu
└── server.py                         # Flask Web ve REST API sunucusu
```

---

## 📜 Lisans ve Kullanım

Bu proje **Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım** vizyonu çerçevesinde açık veri standartlarına uygun olarak geliştirilmiştir.

*Geliştirici:* **Nefise Beyza Yeniekinci**