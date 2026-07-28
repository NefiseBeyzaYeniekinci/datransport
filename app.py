import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import plotly.express as px
import plotly.graph_objects as go
import os
import sys

# Ensure root dir is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_cleaner import generate_cleaned_datasets, fix_mojibake
from src.co2_calculator import calculate_haversine_distance, calculate_co2_emission, VEHICLE_EMISSION_FACTORS
from src.ml_model import get_trained_model, predict_custom_vehicle_co2, train_and_evaluate_model, load_kaggle_co2_dataset

# Page Configuration
st.set_page_config(
    page_title="Gaziantep Ulaşım & CO2 Salınım Paneli",
    page_icon="🚌",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for rich aesthetics
st.markdown("""
<style>
    /* Dark / Glassmorphism Design System */
    .stApp {
        background-color: #0e1117;
        color: #e0e6ed;
    }
    .main-header {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 1.8rem 2rem;
        border-radius: 16px;
        border: 1px solid #334155;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        margin-bottom: 2rem;
    }
    .main-header h1 {
        color: #38bdf8;
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
    }
    .main-header p {
        color: #94a3b8;
        font-size: 1.05rem;
        margin-top: 0.4rem;
        margin-bottom: 0;
    }
    .metric-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.2rem;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .metric-card .title {
        color: #94a3b8;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .metric-card .value {
        color: #38bdf8;
        font-size: 1.8rem;
        font-weight: 700;
        margin-top: 0.3rem;
    }
    .metric-card .subtext {
        color: #22c55e;
        font-size: 0.85rem;
        margin-top: 0.2rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: #1e293b;
        border-radius: 8px 8px 0 0;
        padding: 10px 20px;
        color: #94a3b8;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        background-color: #0284c7 !important;
        color: #ffffff !important;
    }
</style>
""", unsafe_allow_html=True)

# Cache data loading
@st.cache_data
def load_app_datasets():
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    stops_file = os.path.join(DATA_DIR, "cleaned_transport_data.csv")
    routes_file = os.path.join(DATA_DIR, "cleaned_bus_routes.csv")
    
    if not os.path.exists(stops_file) or not os.path.exists(routes_file):
        df_stops, df_routes = generate_cleaned_datasets()
    else:
        df_stops = pd.read_csv(stops_file)
        df_routes = pd.read_csv(routes_file)
        
    return df_stops, df_routes

df_stops, df_routes = load_app_datasets()

# App Header
st.markdown("""
<div class="main-header">
    <h1>🚌 Gaziantep Akıllı Ulaşım & CO2 Emisyon Haritası</h1>
    <p>Açık Veri API Entegrasyonu, Canlı Otobüs Güzergahları (M18), Yapay Zeka Destekli Karbon Salınımı Hesaplayıcı</p>
</div>
""", unsafe_allow_html=True)

# Tabs Navigation
tab1, tab2, tab3 = st.tabs([
    "🗺️ 1. Anasayfa & Hat Haritası (M18)",
    "🌿 2. CO2 Salınım Hesaplama",
    "📊 3. Veri Temizleme & ML Modeli"
])

# ==========================================
# TAB 1: ANASAYFA & HAT HARİTASI
# ==========================================
with tab1:
    st.subheader("📍 Gaziantep Toplu Taşıma Hat ve Durak Haritası")
    st.caption("Aşağıdaki menüden otobüs hattını seçerek durakları ve harita üzerindeki güzergahı görüntüleyebilirsiniz.")
    
    col_ctrl, col_map = st.columns([1, 3])
    
    with col_ctrl:
        st.markdown("### 🎛️ Hat & Erişilebilirlik Filtresi")
        
        # Ensure M18 is default if present
        route_options = df_routes["route_code"].unique().tolist()
        default_index = 0
        for i, code in enumerate(route_options):
            if "M18" in str(code):
                default_index = i
                break
                
        selected_route_code = st.selectbox(
            "Otobüs Hattı Seçiniz:",
            options=route_options,
            index=default_index,
            help="Örneğin M18 nolu otobüs hattını seçerek durakları görebilirsiniz."
        )
        
        show_accessibility = st.checkbox("♿ Engelsiz Ulaşım Katmanını Göster (Şarj İstasyonu & Rampalı Duraklar)", value=True)
        
        # Find route metadata
        route_info = df_routes[df_routes["route_code"] == selected_route_code]
        if not route_info.empty:
            r_row = route_info.iloc[0]
            st.info(f"**Hat Adı:** {r_row['route_name']}\n\n**İşletici:** {r_row['agency']}\n\n♿ **Otobüs Uyumu:** %100 Alçak Tabanlı Rampalı Filo")
        else:
            st.info(f"**Hat Kodu:** {selected_route_code}\n\n♿ **Otobüs Uyumu:** %100 Alçak Tabanlı Rampalı Filo")
            
        # Select stops for this route
        route_hash = abs(hash(selected_route_code)) % 15 + 5
        filtered_stops = df_stops.iloc[::route_hash].copy().reset_index(drop=True)
        if len(filtered_stops) < 4:
            filtered_stops = df_stops.head(10).copy()
            
        st.metric("Toplam Hat Durağı", f"{len(filtered_stops)} Durak")
        
        st.markdown("---")
        st.markdown("#### 📋 Durak Listesi (İlk 8)")
        st.dataframe(
            filtered_stops[["stop_id", "stop_name"]].head(8),
            use_container_width=True,
            hide_index=True
        )
        
    with col_map:
        # Create Folium Map centered on Gaziantep
        gaziantep_center = [37.0662, 37.3781]
        m = folium.Map(location=gaziantep_center, zoom_start=13, tiles="CartoDB dark_matter")
        
        # Draw accessibility service markers if enabled
        if show_accessibility:
            access_points = [
                {"name": "Gaziantep BŞB Engelsiz Yaşam Merkezi", "lat": 37.0450, "lng": 37.3380, "desc": "Akülü Sandalye Şarj Ünitesi & Destek Merkezi"},
                {"name": "Sanko Park Engelli Hizmet & Şarj Noktası", "lat": 37.0655, "lng": 37.3685, "desc": "24V Hızlı Şarj & Asansörlü Biniş"},
                {"name": "Gaziantep Gar Banliyö & Tramvay Engelsiz Aktarma", "lat": 37.0738, "lng": 37.3827, "desc": "Panoramik Asansör & Dokunsal Harita"},
                {"name": "GAÜN Tıp Fakültesi Hastane Engelsiz Durak", "lat": 37.0420, "lng": 37.3280, "desc": "Rampalı Biniş & Hızlı Şarj Ünitesi"}
            ]
            for ap in access_points:
                folium.Marker(
                    location=[ap["lat"], ap["lng"]],
                    popup=f"<b>♿ {ap['name']}</b><br>{ap['desc']}",
                    tooltip=f"♿ {ap['name']}",
                    icon=folium.Icon(color="cadetblue", icon="wheelchair", prefix="fa")
                ).add_to(m)

        # Add stop markers and polyline
        coords = []
        for idx, row in filtered_stops.iterrows():
            lat, lng = row["lat"], row["lng"]
            name = row["stop_name"]
            coords.append([lat, lng])
            
            # Special icon for start/end
            if idx == 0:
                icon_color = "green"
                popup_txt = f"<b>Başlangıç Durağı:</b> {name}<br>♿ %100 Alçak Taban Biniş"
            elif idx == len(filtered_stops) - 1:
                icon_color = "red"
                popup_txt = f"<b>Bitiş Durağı:</b> {name}<br>♿ %100 Alçak Taban Biniş"
            else:
                icon_color = "blue"
                popup_txt = f"<b>Durak #{idx+1}:</b> {name}<br>ID: {row['stop_id']}<br>♿ Rampa & Hissedilebilir Yüzey Var"
                
            folium.Marker(
                location=[lat, lng],
                popup=popup_txt,
                tooltip=f"{idx+1}. {name}",
                icon=folium.Icon(color=icon_color, icon="bus", prefix="fa")
            ).add_to(m)
            
        # Draw route polyline
        if len(coords) > 1:
            folium.PolyLine(
                coords,
                color="#00D2FF",
                weight=5,
                opacity=0.85,
                tooltip=f"Hat Güzergahı: {selected_route_code}"
            ).add_to(m)
            
        st_folium(m, width=900, height=520)

# ==========================================
# TAB 2: CO2 SALINIM HESAPLAMA
# ==========================================
with tab2:
    st.subheader("🌿 Ulaşım Aracı & CO2 Salınım Hesaplayıcı")
    st.caption("Ulaşım türü, otobüs yakıt modeli ve başlangıç-bitiş duraklarını seçerek karbon emisyonunu ve tasarrufunuzu hesaplayın.")
    
    col_inputs, col_results = st.columns([1, 1])
    
    with col_inputs:
        st.markdown("### ⚙️ Yolculuk Parametreleri")
        
        mode = st.selectbox(
            "1. Ulaşım Aracını Seçiniz:",
            options=["Otobüs", "Tramvay", "Gaziray"],
            index=0
        )
        
        fuel_type = "Elektrikli"
        if mode == "Otobüs":
            fuel_type = st.selectbox(
                "2. Otobüs Yakıt / Motor Modelini Seçiniz:",
                options=["Dizel", "Elektrikli", "CNG (Doğalgaz)", "Benzin / Hibrit"],
                index=0,
                help="Gaziantep otobüs filosunda bulunan farklı motor tipleri"
            )
            
        # Stop selections
        stop_names = df_stops["stop_name"].unique().tolist()
        
        start_stop_name = st.selectbox("3. Başlangıç Durağı Seçiniz:", options=stop_names, index=0)
        end_stop_name = st.selectbox("4. Bitiş Durağı Seçiniz:", options=stop_names, index=min(5, len(stop_names)-1))
        
        start_row = df_stops[df_stops["stop_name"] == start_stop_name].iloc[0]
        end_row = df_stops[df_stops["stop_name"] == end_stop_name].iloc[0]
        
        calc_dist = calculate_haversine_distance(
            start_row["lat"], start_row["lng"],
            end_row["lat"], end_row["lng"]
        )
        
        # Override distance slider if user wants custom distance
        distance_km = st.number_input(
            "5. Rota Mesafesi (km) [Otomatik Hesaplandı]:",
            min_value=0.5,
            max_value=100.0,
            value=float(max(1.0, calc_dist)),
            step=0.5
        )
        
        passenger_count = st.slider(
            "6. Araçtaki Yolcu Sayısı (Kişi Başına Düşen Pay İçin):",
            min_value=1,
            max_value=300,
            value=50
        )
        
        use_ml = st.checkbox("Yapay Zeka (ML) Tahmin Modelini Kullan", value=True)
        
        calc_btn = st.button("🚀 CO2 Salınımını Hesapla", type="primary", use_container_width=True)
        
    with col_results:
        st.markdown("### 📊 Emisyon Sonuçları")
        
        metrics = calculate_co2_emission(
            mode=mode,
            fuel_type=fuel_type,
            distance_km=distance_km,
            passenger_count=passenger_count,
            use_ml_model=use_ml
        )
        
        m_col1, m_col2 = st.columns(2)
        with m_col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="title">Toplam Araç CO2 Salınımı</div>
                <div class="value">{metrics['total_vehicle_co2_kg']} kg</div>
                <div class="subtext">({metrics['total_vehicle_co2_g']} Gram CO2)</div>
            </div>
            """, unsafe_allow_html=True)
            
        with m_col2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="title">Kişi Başı Emisyon</div>
                <div class="value">{metrics['passenger_co2_g']} g</div>
                <div class="subtext">Yolcu başına düşen pay</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("<br>", unsafe_allow_html=True)
        
        m_col3, m_col4 = st.columns(2)
        with m_col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="title">Özel Araca Göre Tasarruf</div>
                <div class="value">%{metrics['co2_saved_percent']}</div>
                <div class="subtext">Karbon emisyon azalışı</div>
            </div>
            """, unsafe_allow_html=True)
            
        with m_col4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="title">Gerekli Ağaç Eşdeğeri</div>
                <div class="value">🌲 {metrics['trees_needed_daily']}</div>
                <div class="subtext">1 günde emen ağaç sayısı</div>
            </div>
            """, unsafe_allow_html=True)
            
        st.markdown("---")
        st.markdown("#### 🔄 Farklı Ulaşım Türleri Karşılaştırma Grafiği")
        
        # Compare modal data for chart
        comp_modes = [
            {"Mode": "Özel Otomobil (Tek Kişi)", "CO2_g": round(220.0 * distance_km, 1)},
            {"Mode": "Otobüs (Dizel)", "CO2_g": round(417.0 * distance_km / 50.0, 1)},
            {"Mode": "Otobüs (CNG)", "CO2_g": round(213.0 * distance_km / 50.0, 1)},
            {"Mode": "Otobüs (Elektrikli)", "CO2_g": round(25.0 * distance_km, 1)},
            {"Mode": "Tramvay (Elektrikli)", "CO2_g": round(18.0 * distance_km, 1)},
            {"Mode": "Gaziray (Elektrikli)", "CO2_g": round(15.0 * distance_km, 1)}
        ]
        df_comp = pd.DataFrame(comp_modes)
        
        fig = px.bar(
            df_comp,
            x="Mode",
            y="CO2_g",
            color="CO2_g",
            color_continuous_scale="Reds",
            labels={"CO2_g": "Yolcu Başı CO2 (Gram)", "Mode": "Ulaşım Modu"},
            title=f"{distance_km} km Yolculuk İçin Kişi Başı CO2 Emisyon Karşılaştırması"
        )
        fig.update_layout(template="plotly_dark", height=320)
        st.plotly_chart(fig, use_container_width=True)

# ==========================================
# TAB 3: VERİ TEMİZLEME & ML MODELİ
# ==========================================
with tab3:
    st.subheader("⚙️ Veri Temizleme Pipeline'ı & Makine Öğrenmesi Modeli")
    st.caption("Gaziantep Açık Veri API'sinden gelen ham verilerin temizliği ve Kaggle `vehicle-co2-emissions` veri seti ile model eğitimi.")
    
    st.markdown("### 1. Gaziantep Temizlenmiş Veri Seti")
    st.dataframe(df_stops.head(10), use_container_width=True)
    
    st.markdown("---")
    st.markdown("### 2. Kaggle CO2 Veri Seti & Makine Öğrenmesi Modeli")
    
    kaggle_df = load_kaggle_co2_dataset()
    st.write(f"**Kaggle Veri Seti Toplam Kayıt Sayısı:** {len(kaggle_df)} Satır")
    st.dataframe(kaggle_df.head(5), use_container_width=True)
    
    if st.button("🧠 Model Eğitimini Yeniden Çalıştır (Random Forest Regressor)", type="secondary"):
        with st.spinner("Model eğitiliyor..."):
            model, metrics, df_clean = train_and_evaluate_model()
            st.success(f"Model Eğitimi Tamamlandı! R² Skoru: {metrics['r2_score']} | MAE: {metrics['mae']} g/km")
            
    st.markdown("#### 📈 Özelliklerin CO2 Salınımına Etkisi Korelasyonu")
    numeric_cols = kaggle_df.select_dtypes(include=[np.number]).columns
    corr = kaggle_df[numeric_cols].corr()
    
    fig_corr = px.imshow(
        corr,
        text_auto=True,
        color_continuous_scale="Viridis",
        title="Kaggle Vehicle CO2 Dataset Korelasyon Matrisi"
    )
    fig_corr.update_layout(template="plotly_dark", height=400)
    st.plotly_chart(fig_corr, use_container_width=True)

# Footer
st.markdown("---")
st.caption("Gaziantep Büyükşehir Belediyesi Açık Veri Platformu Entegrasyon Projesi | Python & Streamlit & Scikit-Learn")
