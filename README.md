# 🏛️ Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım Portalı

> **Kentkart Canlı API, Otopark Doluluk & Rezervasyon Servisi, OSRM Karayolu Navigasyonu, Random Forest Makine Öğrenmesi CO2 Simülatörü ve GaziBis Mobilite Platformu**

[![Live Demo](https://img.shields.io/badge/Live_Demo-datransport.vercel.app-10b981?style=for-the-badge&logo=vercel)](https://datransport.vercel.app/)
![Gaziantep Büyükşehir Belediyesi](https://img.shields.io/badge/Gaziantep%20B%C3%BCy%C3%BCk%C5%9Fehir%20Belediyesi-Ak%C4%B1ll%C4%B1%20Ula%C5%9F%C4%B1m-2563eb?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3-000000?style=for-the-badge&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

---

## 🌐 Canlı Yayın & Online Uygulama Adresi

👉 **[https://datransport.vercel.app/](https://datransport.vercel.app/)**

Proje Vercel Serverless bulut altyapısı üzerinde kesintisiz canlı yayın yapmaktadır. Yarı yolda kalmadan mobil ve masaüstü cihazlardan anında erişebilirsiniz.

---

## 📌 Proje Hakkında

**Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım Portalı**, Gaziantep kent içi toplu taşıma ağının (Otobüs, Tramvay, Gaziray), bisiklet paylaşım sisteminin (GaziBis), akıllı katlı/açık otopark doluluklarının ve kentsel karbon ayak izinin canlı verilerle izlendiği, analiz edildiği ve simüle edildiği **dünya standartlarında web tabanlı akıllı şehir platformudur**.

Proje; vatandaşların ulaşım hatlarını incelemesini, yollar üzerinden gerçek karayolu mesafesini ölçmesini, yeni ara durak talepleri iletmesini, seyahatlerinin CO2 emisyonunu hesaplayıp en çevreci modu seçmesini, GaziBis bisiklet kiralama ve **akıllı otopark rezervasyonu yapmasını** sağlar.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🚏 Hatlar & İnteraktif Harita
* **Otobüs & Raylı Sistem Hatları:** GAZİULAŞ otobüs hatları (B01, B02...), T1 (Gar-Adliye), T2 (Gar-Akkent), T3 (Adliye-Burç) Tramvay hatları ve **GR01 Gaziray** banliyö hattının resmi durak dizilimleri ve GTFS `shapes.txt` yol çizgileri.
* **Canlı Araç & Durak Takibi:** Durak detaylarında hatta hizmet veren otobüs göstergeleri ve hat yönü değiştirme fonksiyonu.
* **💳 Kart İşlem Merkezleri, GaziBis & Otopark Katmanları:** Gaziantep genelindeki Kentkart başvuru merkezleri, GaziBis istasyonları ve Katlı Otoparkların harita üzerinde dinamik gösterimi.

### 2. 🅿️ Akıllı Otopark Doluluk Durumları & Rezervasyon Modülü
* **Canlı Otopark Doluluk Takibi:** `https://acikveriapi.gaziantep.bel.tr/api/Ulasim/OtoparkDolulukDurumu` resmi servisi ile Gaziantep genelindeki katlı ve açık otoparkların (Sanko Park, 15 Temmuz Demokrasi Meydanı Yeraltı, Gazi Muhtar Paşa, Balıklı, Gar Otoparkı vb.) anlık boş/dolu park yeri sayıları, doluluk yüzdeleri ve ücret bilgileri.
* **Araç Park Yeri Rezervasyonu:** Boş park yeri bulunan konumlar için plaka no (`27 ABC 123`) ve telefon doğrulamalı anlık park yeri rezervasyon ve kod üretme servisi (`OTP-20260727-XXXXX`).

### 3. 📐 OSRM Gerçek Karayolu Mesafe Ölçer
* Kuş uçuşu düz çizgi yerine **Open Source Routing Machine (OSRM)** karayolu navigasyon motoru entegrasyonu.
* Harita üzerinde işaretlenen 2 nokta arasındaki **gerçek sokak/karayolu sürüş mesafesini (km/metre)**, arabayla seyahat süresini ve yürüme süresini hesaplar.

### 4. 🚦 Gaziantep Canlı Trafik Yoğunluk Haritası
* `gaziantep.yogunlukharitasi.com` entegrasyonu ile Gaziantep şehir merkezi ve ana arterlerdeki anlık yol durumu, dur-kalk indeksleri ve trafik akış çizgileri canlı olarak görüntülenir.

### 5. 📝 Yeni Ara Durak Talebi Modülü
* Harita üzerinde tıklanan konuma göre en yakın önceki ve sonraki durağı otomatik tespit eder, takip numarası (`TLP-2026...`) ile talep oluşturur.

### 6. 🌱 Ultra-Modern CO2 Salınım & Güzergah Karşılaştırma Dashboard'u
* Otobüs modelleri vs Tramvay emisyon karşılaştırması, karbon tasarrufu ve günlük ağaç kazancı hesabı (`🌲 Ağaç Kazancı`).

### 7. 🚲 GaziBis Bisiklet Kiralama & Randevu
* 8 adet GaziBis istasyonunun canlı boş bisiklet ve boş park yeri durumları ile randevu oluşturma servisi.

### 8. 🤖 Veri & AI Simülatörü ve 6 Farklı CSV Export Merkezi
* Random Forest ML Modeli ile anlık CO2 g/km tahmini.
* **📥 6 Farklı CSV İndirme Formatı:**
  1. *Duraklar & GPS Konum Veri Seti (CSV)*
  2. *GAZİULAŞ Otobüs Filosu & CO2 Kataloğu (CSV)*
  3. *GaziBis Canlı İstasyon Verisi (CSV)*
  4. *Vatandaş Durak Talepleri Raporu (CSV)*
  5. *Kaggle ML Araç Emisyon Veri Seti (CSV)*
  6. *Gaziantep Otopark Doluluk & Konum Veri Seti (CSV)*

---

## 📚 Yararlanılan Kaynaklar ve Veri Setleri

* 🅿️ **Otopark Doluluk Durumları API:** [Gaziantep BŞB Otopark Servisi](https://acikveriapi.gaziantep.bel.tr/api/Ulasim/OtoparkDolulukDurumu)
* 🌐 **Canlı Uygulama:** [https://datransport.vercel.app/](https://datransport.vercel.app/)
* 🚌 **Hatlar, Güzergahlar ve Sefer Saatleri:** [GAZİULAŞ Resmi Web Sitesi](https://gaziulas.com.tr/) & [Gaziantep Kart Online](https://online.gaziantepkart.com.tr/)
* 🚦 **Gaziantep Canlı Trafik Yoğunluğu:** [Gaziantep Yoğunluk Haritası](https://gaziantep.yogunlukharitasi.com/)
* 📊 **Otobüs & Araç CO2 Emisyon Veri Seti:** [Kaggle Vehicle CO2 Emissions Dataset](https://www.kaggle.com/datasets/brsahan/vehicle-co2-emissions-dataset)
* 🗺️ **Karayolu Navigasyon Motoru:** [OSRM API](https://router.project-osrm.org/)

---

## 📜 Lisans ve Kullanım

Bu proje **Gaziantep Büyükşehir Belediyesi Akıllı Ulaşım** vizyonu çerçevesinde açık veri standartlarına uygun olarak geliştirilmiştir.

*Geliştirici:* **Nefise Beyza Yeniekinci**
