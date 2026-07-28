// Global State
let map = null;
let requestMap = null;
let pinnedRequestMarker = null;
let requestMapPolyline = null;
let requestMapStopMarkers = [];
let currentRequestRouteStops = [];

let currentMarkers = [];
let currentPolyline = null;
let busVehicleMarkers = [];
let cardCenterMarkers = [];
let gaziBisMarkers = [];
let parkingMarkers = [];
let accessibilityMarkers = [];

let isCardCentersVisible = false;
let isGaziBisVisible = false;
let isParkingVisible = false;
let isAccessibilityVisible = false;
let accessibilityServicesList = [];

// Real Street Distance Ruler Tool State
let isRulerActive = false;
let rulerPoints = [];
let rulerMarkers = [];
let rulerPolyline = null;

let co2Chart = null;
let hourlyChart = null;
let featureChart = null;
let fuelEmissionsChart = null;

let allStops = [];
let allRoutes = [];
let gazibisStationsList = [];
let parkingLotsList = [];
let isReversed = false;
let currentStopsData = [];
let currentRoadPolyline = [];
let currentMeta = {};

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    initRequestMap();
    loadRoutes();
    loadStops();
    loadGaziBisStations();
    loadParkingLots();
    loadAccessibilityServices();
    initCharts();
    initMLCharts();
    updateAISimulator();
});

// Modal System Handlers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// Phone Number Input Formatting (Strict Max 11 Digits, Format 05XX XXX XX XX)
function formatPhoneNumber(input) {
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 11) digits = digits.substring(0, 11);

    if (digits.length === 0) {
        input.value = '';
    } else if (digits.length <= 4) {
        input.value = digits;
    } else if (digits.length <= 7) {
        input.value = `${digits.substring(0, 4)} ${digits.substring(4)}`;
    } else if (digits.length <= 9) {
        input.value = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
    } else {
        input.value = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
    }
}

// Reset Dropdown Selections
function resetStartStopSelect() {
    const sel = document.getElementById('calc-start-stop');
    if (sel && sel.options.length > 0) sel.selectedIndex = 0;
    calculateCO2();
}

function resetEndStopSelect() {
    const sel = document.getElementById('calc-end-stop');
    if (sel && sel.options.length > 1) sel.selectedIndex = 1;
    calculateCO2();
}

// CSV Export Helpers
function triggerCSVDownload(filename, csvContent) {
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadStopsCSV() {
    if (!allStops || allStops.length === 0) return;
    let csv = "Durak ID,Durak Adı,Enlem (Lat),Boylam (Lng),Ulaşım Türü\n";
    allStops.forEach(s => {
        csv += `"${s.stop_id}","${s.stop_name}",${s.lat},${s.lng},"${s.type || 'Otobüs Durağı'}"\n`;
    });
    triggerCSVDownload("Gaziantep_Tüm_Duraklar_GPS_Verisi.csv", csv);
}

function downloadFleetCSV() {
    let csv = "Otobüs Modeli,Filo Adedi,Motor Tipi,Yakıt Türü,Ortalama CO2 (g/km),Emisyon Sınıfı,Günlük Gerekli Ağaç Adedi\n";
    csv += '"MAN Lion\'s City (Solo)",50,"Euro 6 Diesel","Dizel",265.0,"Euro 6",4.4\n';
    csv += '"MAN Lion\'s City G (Körüklü)",10,"Euro 6 Heavy Diesel","Dizel",390.0,"Euro 6",6.5\n';
    csv += '"Otokar 9M Doruk LE",36,"Euro 6 Diesel","Dizel",195.0,"Euro 6",3.25\n';
    csv += '"Otokar 10M Doruk LE",14,"Euro 6 Diesel","Dizel",210.0,"Euro 6",3.5\n';
    csv += '"Temsa Prestij City",27,"Euro 6 Diesel","Dizel",145.0,"Euro 6",2.4\n';
    csv += '"18M Körüklü Elektrikli Otobüs",2,"Li-Ion Batarya EV","Elektrik",0.0,"Sıfır Emisyon",0.0\n';
    triggerCSVDownload("GAZİULAŞ_Otobüs_Filosu_CO2_Kataloğu.csv", csv);
}

function downloadGaziBisCSV() {
    if (!gazibisStationsList || gazibisStationsList.length === 0) return;
    let csv = "İstasyon ID,İstasyon Adı,Enlem,Boylam,Boş Bisiklet Sayısı,Boş Park Yeri,Durum\n";
    gazibisStationsList.forEach(st => {
        csv += `"${st.id}","${st.name}",${st.lat},${st.lng},${st.available_bikes},${st.available_docks},"${st.status}"\n`;
    });
    triggerCSVDownload("GaziBis_Canlı_İstasyon_Müsaitlik_Verisi.csv", csv);
}

function downloadParkingCSV() {
    if (!parkingLotsList || parkingLotsList.length === 0) return;
    let csv = "Otopark ID,Otopark Adı,Tipi,Enlem,Boylam,Toplam Kapasite,Boş Park Yeri,Dolu Park Yeri,Doluluk Oranı (%),Ücret,Durum\n";
    parkingLotsList.forEach(pk => {
        csv += `"${pk.id}","${pk.name}","${pk.type}",${pk.lat},${pk.lng},${pk.total_capacity},${pk.empty_spots},${pk.filled_spots},${pk.occupancy_pct},"${pk.fee_per_hour}","${pk.status}"\n`;
    });
    triggerCSVDownload("Gaziantep_Canlı_Otopark_Doluluk_Verisi.csv", csv);
}

function downloadStopRequestsCSV() {
    let csv = "Talep ID,Hat Kodu,Önerilen Durak Adı,Talep Açıklaması,Durum,Tarih\n";
    csv += '"TLP-20260724-8492","B01","TOKİ 2. Etap Ara Durağı","Gazikent yakınında ara durak talebi","Talep Alındı","2026-07-24"\n';
    csv += '"TLP-20260724-1025","T1","Akkent Parkı - Karataş Ara Durağı","Ara yürüme mesafesi 1.4 km olduğu için yeni durak talebi","Talep Alındı","2026-07-24"\n';
    triggerCSVDownload("Gaziantep_Vatandaş_Durak_Talepleri_Raporu.csv", csv);
}

async function downloadKaggleDatasetCSV() {
    try {
        const res = await fetch('/api/ml-info');
        const json = await res.json();
        if (json.success && json.sample_data) {
            let csv = "Engine Size(L),Cylinders,Fuel Type,Vehicle Class,Fuel Consumption Comb (L/100 km),CO2 Emissions(g/km)\n";
            json.sample_data.forEach(row => {
                csv += `${row['Engine Size(L)'] || 2.0},${row['Cylinders'] || 4},"${row['Fuel Type'] || 'D'}","${row['Vehicle Class'] || 'VAN'}",${row['Fuel Consumption Comb (L/100 km)'] || 8.5},${row['CO2 Emissions(g/km)'] || 200}\n`;
            });
            triggerCSVDownload("Kaggle_Vehicle_CO2_ML_Dataset.csv", csv);
        }
    } catch (e) {
        console.error("Error downloading Kaggle CSV:", e);
    }
}

// Tab Navigation
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    const btn = Array.from(document.querySelectorAll('.nav-tab')).find(b => b.getAttribute('onclick').includes(tabId));
    if (btn) btn.classList.add('active');

    if (tabId === 'tab-map' && map) {
        setTimeout(() => map.invalidateSize(), 200);
    } else if (tabId === 'tab-request-stop' && requestMap) {
        setTimeout(() => requestMap.invalidateSize(), 200);
    } else if (tabId === 'tab-calculator') {
        setTimeout(() => {
            if (co2Chart) { co2Chart.resize(); co2Chart.update(); }
            if (hourlyChart) { hourlyChart.resize(); hourlyChart.update(); }
        }, 200);
    } else if (tabId === 'tab-data') {
        setTimeout(() => {
            if (featureChart) { featureChart.resize(); featureChart.update(); }
            if (fuelEmissionsChart) { fuelEmissionsChart.resize(); fuelEmissionsChart.update(); }
        }, 200);
    }
}

function initMap() {
    const gaziantepCoords = [37.0662, 37.3781];
    map = L.map('map-container').setView(gaziantepCoords, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    map.on('click', async (e) => {
        if (!isRulerActive) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        rulerPoints.push([lat, lng]);

        const ptIcon = L.divIcon({
            className: 'ruler-pt-pin',
            html: `<div style="background:#ea580c; color:white; width:26px; height:26px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.35);">${rulerPoints.length}</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        const m = L.marker([lat, lng], { icon: ptIcon }).addTo(map);
        rulerMarkers.push(m);

        if (rulerPoints.length === 2) {
            const p1 = rulerPoints[0];
            const p2 = rulerPoints[1];

            document.getElementById('ruler-text').innerHTML = `Canlı Karayolu Harita Motorundan Gerçek Yol Mesafesi Hesaplanıyor...`;

            try {
                const res = await fetch('/api/street-route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat1: p1[0], lng1: p1[1],
                        lat2: p2[0], lng2: p2[1],
                        mode: 'driving'
                    })
                });

                const json = await res.json();

                if (json.success) {
                    const distKm = json.distance_km;
                    const distMeters = json.distance_meters;
                    const driveMins = json.duration_mins;
                    const walkMins = Math.round((distKm / 5.0) * 60);

                    if (rulerPolyline) map.removeLayer(rulerPolyline);

                    rulerPolyline = L.polyline(json.geometry, {
                        color: '#ea580c',
                        weight: 5,
                        opacity: 0.95,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    const banner = document.getElementById('ruler-info-banner');
                    document.getElementById('ruler-text').innerHTML = `Gerçek Karayolu Mesafesi: ${distKm} km (${distMeters}m) • Sürüş: ~${driveMins} dk • Yürüme: ~${walkMins} dk <span style="background: #059669; color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.72rem; margin-left: 6px;">Gerçek Yol Verisi</span>`;
                    banner.style.display = 'flex';
                }
            } catch (err) {
                console.error("Error calculating street route:", err);
            }
        } else if (rulerPoints.length > 2) {
            clearRulerMeasurement();
            rulerPoints.push([lat, lng]);
            const m1 = L.marker([lat, lng], { icon: ptIcon }).addTo(map);
            rulerMarkers.push(m1);
        }
    });
}

function toggleRulerTool() {
    isRulerActive = !isRulerActive;
    const btn = document.getElementById('btn-toggle-ruler');
    const banner = document.getElementById('ruler-info-banner');

    if (btn) {
        btn.classList.toggle('active', isRulerActive);
    }

    if (isRulerActive) {
        banner.style.display = 'flex';
        document.getElementById('ruler-text').textContent = "Haritada yollar üzerinden gerçek mesafesini ölçmek istediğiniz 2 noktaya tıklayın";
    } else {
        banner.style.display = 'none';
        clearRulerMeasurement();
    }
}

function clearRulerMeasurement() {
    rulerMarkers.forEach(m => map.removeLayer(m));
    rulerMarkers = [];
    rulerPoints = [];
    if (rulerPolyline) {
        map.removeLayer(rulerPolyline);
        rulerPolyline = null;
    }
    if (isRulerActive) {
        document.getElementById('ruler-text').textContent = "Haritada yollar üzerinden gerçek mesafesini ölçmek istediğiniz 2 noktaya tıklayın";
    }
}

function initRequestMap() {
    const gaziantepCoords = [37.0662, 37.3781];
    requestMap = L.map('request-map-container').setView(gaziantepCoords, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(requestMap);

    requestMap.on('click', (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (pinnedRequestMarker) {
            requestMap.removeLayer(pinnedRequestMarker);
        }

        const pinIcon = L.divIcon({
            className: 'pinned-stop-marker',
            html: `<div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.45);"><i class="fa-solid fa-location-dot"></i></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        let nearestPrev = "Tespit ediliyor...";
        let nearestNext = "Tespit ediliyor...";
        let interStopDistText = "";

        if (currentRequestRouteStops && currentRequestRouteStops.length >= 2) {
            let minDist = 999999;
            let closestIdx = 0;

            currentRequestRouteStops.forEach((s, idx) => {
                const d = haversine(lat, lng, floatVal(s.lat), floatVal(s.lng));
                if (d < minDist) {
                    minDist = d;
                    closestIdx = idx;
                }
            });

            const prevIdx = Math.max(0, closestIdx - 1);
            const nextIdx = Math.min(currentRequestRouteStops.length - 1, closestIdx + 1);

            const prevStop = currentRequestRouteStops[prevIdx];
            const nextStop = currentRequestRouteStops[nextIdx];

            const dPrev = Math.round(haversine(lat, lng, floatVal(prevStop.lat), floatVal(prevStop.lng)) * 1000);
            const dNext = Math.round(haversine(lat, lng, floatVal(nextStop.lat), floatVal(nextStop.lng)) * 1000);
            const totalBetween = Math.round(haversine(floatVal(prevStop.lat), floatVal(prevStop.lng), floatVal(nextStop.lat), floatVal(nextStop.lng)) * 1000);

            nearestPrev = `${prevStop.stop_name} (~${dPrev}m)`;
            nearestNext = `${nextStop.stop_name} (~${dNext}m)`;
            interStopDistText = ` (Ara Karayolu Mesafesi: ${totalBetween}m)`;

            document.getElementById('req-proposed-name').value = `${prevStop.stop_name} - ${nextStop.stop_name} Ara Durağı`;
            document.getElementById('req-description').value = `Bu iki durak arasındaki karayolu mesafesi ${totalBetween} metre (~${Math.round((totalBetween/1000/5.0)*60)} dk yürüme süresi) olduğu için yeni ara durak eklenmesi talep edilmektedir.`;
        } else {
            document.getElementById('req-proposed-name').value = `Haritadan İşaretlenen Konum (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        }

        document.getElementById('txt-nearest-prev').textContent = `Önceki Durak: ${nearestPrev}`;
        document.getElementById('txt-nearest-next').textContent = `Sonraki Durak: ${nearestNext}${interStopDistText}`;

        pinnedRequestMarker = L.marker([lat, lng], { icon: pinIcon })
            .bindPopup(`
                <div style="font-family: 'Inter', sans-serif;">
                    <div style="font-weight: 800; color: #ea580c; font-size: 0.95rem; margin-bottom: 4px;"><i class="fa-solid fa-location-dot"></i> Önerilen Yeni Durak Konumu</div>
                    <div style="font-size: 0.8rem; color: #059669; font-weight: 600;">Önceki: ${nearestPrev}</div>
                    <div style="font-size: 0.8rem; color: #d97706; font-weight: 600;">Sonraki: ${nearestNext}</div>
                </div>
            `)
            .addTo(requestMap);

        pinnedRequestMarker.openPopup();
    });
}

function floatVal(v) {
    return parseFloat(v) || 0.0;
}

async function loadRoutes() {
    try {
        const res = await fetch('/api/routes');
        const json = await res.json();
        
        if (json.success && json.data) {
            allRoutes = json.data;
            renderVerticalAccordionMenu();
            populateRequestRouteSelect(allRoutes);
            if (allRoutes.length > 0) {
                onRequestRouteSelectChanged();
            }
        }
    } catch (err) {
        console.error("Error loading routes:", err);
    }
}

let allRoutesList = [];

function populateRequestRouteSelect(routes) {
    if (routes && Array.isArray(routes)) {
        allRoutesList = routes;
    }
    const reqSelect = document.getElementById('req-route-select');
    const countBadge = document.getElementById('lbl-request-route-count');
    if (!reqSelect) return;
    reqSelect.innerHTML = '';
    
    allRoutesList.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.route_code;
        opt.textContent = `${r.route_code} - ${r.route_name}`;
        reqSelect.appendChild(opt);
    });

    if (countBadge) {
        countBadge.textContent = `${allRoutesList.length} hat bulundu`;
    }
}

function filterRequestRouteOptions() {
    const searchInput = document.getElementById('search-request-route');
    const selectEl = document.getElementById('req-route-select');
    const countBadge = document.getElementById('lbl-request-route-count');

    if (!searchInput || !selectEl || !allRoutesList) return;

    const qRaw = searchInput.value.trim();
    const qNorm = trNormalize(qRaw);
    selectEl.innerHTML = '';

    const filtered = allRoutesList.filter(r => {
        if (!qNorm) return true;
        const codeNorm = trNormalize(r.route_code || '');
        const nameNorm = trNormalize(r.route_name || '');
        return codeNorm.includes(qNorm) || nameNorm.includes(qNorm);
    });

    if (filtered.length === 0) {
        const opt = new Option(`❌ "${qRaw}" adında hat bulunamadı`, '');
        opt.disabled = true;
        selectEl.add(opt);
    } else {
        filtered.forEach(r => {
            const opt = new Option(`${r.route_code} - ${r.route_name}`, r.route_code);
            selectEl.add(opt);
        });
    }

    if (countBadge) {
        countBadge.textContent = `${filtered.length} hat bulundu`;
    }

    if (typeof onRequestRouteSelectChanged === 'function') {
        onRequestRouteSelectChanged();
    }
}

let expandedCategories = {
    'bus': false,
    'tram': false,
    'tram_transfer': false,
    'gaziray': false,
    'gazibis': false,
    'parking': false,
    'accessibility': false
};

function renderVerticalAccordionMenu(filterQuery = '') {
    const container = document.getElementById('route-items-box');
    if (!container) return;
    container.innerHTML = '';

    const query = filterQuery.toLowerCase().trim();

    const mainTramCodes = ['T1', 'T2', 'T3'];
    const busRoutes = allRoutes.filter(r => !mainTramCodes.includes(r.route_code.toUpperCase()) && !r.route_code.toUpperCase().startsWith('TA') && !r.route_code.toUpperCase().startsWith('GR'));
    const mainTramRoutes = allRoutes.filter(r => mainTramCodes.includes(r.route_code.toUpperCase()));
    const tramTransferRoutes = allRoutes.filter(r => r.route_code.toUpperCase().startsWith('TA'));
    const grRoutes = allRoutes.filter(r => r.route_code.toUpperCase().startsWith('GR'));

    const categories = [
        {
            id: 'bus',
            title: 'Otobüs Hatları',
            icon: 'fa-bus',
            color: '#2563eb',
            bgColor: '#eff6ff',
            count: busRoutes.length,
            renderContent: (bodyEl) => {
                let filtered = busRoutes;
                if (query) {
                    filtered = filtered.filter(r => r.route_code.toLowerCase().includes(query) || r.route_name.toLowerCase().includes(query));
                }
                filtered.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'route-list-item';
                    item.onclick = (e) => { e.stopPropagation(); selectRoute(r.route_code); };
                    item.innerHTML = `
                        <div class="route-code-badge">${r.route_code}</div>
                        <div class="route-name-text">
                            <span>${r.route_name}</span>
                        </div>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'tram',
            title: 'Tramvay Hatları',
            icon: 'fa-train-subway',
            color: '#dc2626',
            bgColor: '#fef2f2',
            count: mainTramRoutes.length || 3,
            renderContent: (bodyEl) => {
                const mainList = mainTramRoutes.length > 0 ? mainTramRoutes : [
                    { route_code: 'T1', route_name: 'T1 - İbni Sina-Gar (Ana Tramvay Hattı)' },
                    { route_code: 'T2', route_name: 'T2 - Adliye-Gar (Ana Tramvay Hattı)' },
                    { route_code: 'T3', route_name: 'T3 - Adliye-Burç (Ana Tramvay Hattı)' }
                ];
                mainList.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'route-list-item';
                    item.onclick = (e) => { e.stopPropagation(); selectRoute(r.route_code); };
                    item.innerHTML = `
                        <div class="route-code-badge red-badge">${r.route_code}</div>
                        <div class="route-name-text">
                            <span>${r.route_name}</span>
                        </div>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'tram_transfer',
            title: 'Tramvay Aktarma Hatları',
            icon: 'fa-arrow-right-arrow-left',
            color: '#ea580c',
            bgColor: '#fff7ed',
            count: tramTransferRoutes.length || 5,
            renderContent: (bodyEl) => {
                const transferList = tramTransferRoutes.length > 0 ? tramTransferRoutes : [
                    { route_code: 'TA1', route_name: 'TA1 - Gaün-Güneyşehir' },
                    { route_code: 'TA3', route_name: 'TA3 - Gibte-Gaün' },
                    { route_code: 'TA502', route_name: 'TA502 - Adliye-Gar' },
                    { route_code: 'TA503', route_name: 'TA503 - Burçç-Adliye' },
                    { route_code: 'TA6', route_name: 'TA6 - Karataş2-Tramvay Aktarma' }
                ];
                transferList.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'route-list-item';
                    item.onclick = (e) => { e.stopPropagation(); selectRoute(r.route_code); };
                    item.innerHTML = `
                        <div class="route-code-badge" style="background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;">${r.route_code}</div>
                        <div class="route-name-text">
                            <span>${r.route_name}</span>
                        </div>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'gaziray',
            title: 'Gaziray Banliyö',
            icon: 'fa-train',
            color: '#ca8a04',
            bgColor: '#fefce8',
            count: grRoutes.length || 1,
            renderContent: (bodyEl) => {
                const list = grRoutes.length > 0 ? grRoutes : [
                    { route_code: 'GR01', route_name: 'GR01: BAŞPINAR - TAŞLICA (Gaziray Banliyö)' }
                ];
                list.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'route-list-item';
                    item.onclick = (e) => { e.stopPropagation(); selectRoute(r.route_code); };
                    item.innerHTML = `
                        <div class="route-code-badge yellow-badge">${r.route_code}</div>
                        <div class="route-name-text">${r.route_name}</div>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'gazibis',
            title: 'GaziBis İstasyonları',
            icon: 'fa-bicycle',
            color: '#7c3aed',
            bgColor: '#f5f3ff',
            count: gazibisStationsList.length || 8,
            renderContent: (bodyEl) => {
                gazibisStationsList.forEach(st => {
                    const item = document.createElement('div');
                    item.className = 'category-item-tile';
                    item.onclick = (e) => {
                        e.stopPropagation();
                        if (!isGaziBisVisible) toggleGaziBisMapLayer();
                        if (map) {
                            map.flyTo([st.lat, st.lng], 16);
                            const m = gaziBisMarkers.find(marker => marker.getLatLng().lat === st.lat);
                            if (m) m.openPopup();
                        }
                    };
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 800; color: #6d28d9; font-size: 0.88rem;"><i class="fa-solid fa-bicycle"></i> ${st.name}</div>
                            <div style="font-size: 0.76rem; color: #059669; font-weight: 700;">${st.available_bikes} Boş Bisiklet • ${st.available_docks} Boş Park</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'parking',
            title: 'Akıllı Otoparklar',
            icon: 'fa-square-parking',
            color: '#0284c7',
            bgColor: '#f0f9ff',
            count: parkingLotsList.length || 6,
            renderContent: (bodyEl) => {
                parkingLotsList.forEach(pk => {
                    const item = document.createElement('div');
                    item.className = 'category-item-tile';
                    item.onclick = (e) => {
                        e.stopPropagation();
                        if (!isParkingVisible) toggleParkingMapLayer();
                        if (map) {
                            map.flyTo([pk.lat, pk.lng], 16);
                            const m = parkingMarkers.find(marker => marker.getLatLng().lat === pk.lat);
                            if (m) m.openPopup();
                        }
                    };
                    const pct = pk.occupancy_pct || 50;
                    const badgeColor = pct > 85 ? '#ef4444' : (pct > 60 ? '#f59e0b' : '#10b981');
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 800; color: #0f172a; font-size: 0.88rem;"><i class="fa-solid fa-square-parking" style="color:#0284c7;"></i> ${pk.name}</div>
                            <div style="font-size: 0.76rem; color: #64748b;">${pk.empty_spots} Boş Park Yeri / ${pk.total_capacity} Kapasite</div>
                        </div>
                        <span style="background: ${badgeColor}20; color: ${badgeColor}; font-weight: 800; font-size: 0.72rem; padding: 2px 7px; border-radius: 8px;">%${pct} Dolu</span>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        },
        {
            id: 'accessibility',
            title: 'Engelsiz Ulaşım Noktaları',
            icon: 'fa-wheelchair',
            color: '#0d9488',
            bgColor: '#f0fdf4',
            count: accessibilityServicesList.length || 8,
            renderContent: (bodyEl) => {
                accessibilityServicesList.forEach(srv => {
                    const item = document.createElement('div');
                    item.className = 'category-item-tile';
                    item.onclick = (e) => {
                        e.stopPropagation();
                        if (!isAccessibilityVisible) toggleAccessibilityMapLayer();
                        if (map) {
                            map.flyTo([srv.lat, srv.lng], 16);
                            const m = accessibilityMarkers.find(marker => marker.getLatLng().lat === srv.lat);
                            if (m) m.openPopup();
                        }
                    };
                    const iconSymbol = srv.charging_station ? 'fa-bolt' : 'fa-wheelchair';
                    const iconColor = srv.charging_station ? '#f59e0b' : '#0d9488';
                    item.innerHTML = `
                        <div>
                            <div style="font-weight: 800; color: #0f172a; font-size: 0.88rem;"><i class="fa-solid ${iconSymbol}" style="color:${iconColor}; margin-right: 4px;"></i> ${srv.name}</div>
                            <div style="font-size: 0.76rem; color: #64748b;">${srv.district || 'Gaziantep'} • ${srv.type}</div>
                        </div>
                        <i class="fa-solid fa-chevron-right" style="color: #cbd5e1; font-size: 0.8rem;"></i>
                    `;
                    bodyEl.appendChild(item);
                });
            }
        }
    ];

    categories.forEach(cat => {
        const isOpen = query ? true : expandedCategories[cat.id];

        const card = document.createElement('div');
        card.className = 'accordion-category-card';

        const header = document.createElement('div');
        header.className = `accordion-category-header ${isOpen ? 'active' : ''}`;
        header.onclick = () => {
            expandedCategories[cat.id] = !expandedCategories[cat.id];
            renderVerticalAccordionMenu(document.getElementById('route-search-input')?.value || '');
        };

        header.innerHTML = `
            <div class="accordion-header-title">
                <div class="accordion-header-icon" style="background: ${cat.bgColor}; color: ${cat.color};">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <span>${cat.title}</span>
            </div>
            <div class="accordion-header-right">
                <span class="accordion-count-badge">${cat.count}</span>
                <i class="fa-solid fa-chevron-down accordion-chevron"></i>
            </div>
        `;

        const body = document.createElement('div');
        body.className = `accordion-category-body ${isOpen ? 'open' : ''}`;

        if (isOpen) {
            cat.renderContent(body);
        }

        card.appendChild(header);
        card.appendChild(body);
        container.appendChild(card);
    });
}

function filterRouteList() {
    const query = document.getElementById('route-search-input').value.toLowerCase().trim();
    renderVerticalAccordionMenu(query);
}

async function selectRoute(routeCode) {
    if (!routeCode) return;

    document.getElementById('view-route-list').style.display = 'none';
    document.getElementById('view-route-detail').style.display = 'flex';

    try {
        const res = await fetch(`/api/route-details/${routeCode}`);
        const json = await res.json();

        if (json.success && json.stops) {
            currentMeta = json.meta || {};
            currentStopsData = json.stops;
            currentRoadPolyline = json.road_polyline || [];
            isReversed = false;

            updateRouteDetailUI();
        }
    } catch (err) {
        console.error("Error loading route details:", err);
    }
}

function showRouteListView() {
    document.getElementById('view-route-detail').style.display = 'none';
    document.getElementById('view-route-list').style.display = 'flex';
    clearMap();
}

function reverseRouteDirection() {
    if (!currentStopsData || currentStopsData.length === 0) return;
    isReversed = !isReversed;
    currentStopsData.reverse();
    if (currentRoadPolyline) currentRoadPolyline.reverse();
    updateRouteDetailUI();
}

function updateRouteDetailUI() {
    const meta = currentMeta;
    document.getElementById('detail-route-badge').textContent = meta.route_code || 'B01';
    document.getElementById('detail-route-name').textContent = meta.route_name || `${meta.route_code} Hattı`;
    document.getElementById('detail-stop-count').textContent = `${currentStopsData.length} Durak`;

    renderStopsDetailList(currentStopsData, meta.route_code);
    renderMapStopsAndLine(currentStopsData, currentRoadPolyline, meta.color || '#2563eb');
}

function renderStopsDetailList(stops, mainRouteCode) {
    const container = document.getElementById('detail-stops-list');
    container.innerHTML = '';

    stops.forEach((s, idx) => {
        const item = document.createElement('div');
        item.className = 'stop-row-item';
        item.onclick = () => focusStopOnMap(idx, s.lat, s.lng, s.stop_name);

        const lineList = s.lines || [mainRouteCode || 'B01', 'B30', 'B57'];
        const lineBadgesHtml = lineList.map(c => {
            const bgClass = c.startsWith('M') ? 'badge-blue' : (c.startsWith('T') ? 'badge-purple' : 'badge-orange');
            return `<span class="badge-tag ${bgClass}">${c}</span>`;
        }).join(' ');

        const hasActiveBus = (idx === 0 || idx === Math.floor(stops.length / 2) || idx === stops.length - 2);
        const iconType = mainRouteCode.startsWith('T') || mainRouteCode.startsWith('GR') ? 'fa-train-tram' : 'fa-bus';
        const busBtnHtml = hasActiveBus ? `<div class="bus-present-icon" title="Canlı Sefer"><i class="fa-solid ${iconType}"></i></div>` : ``;

        item.innerHTML = `
            <div class="stop-left-content">
                <div class="stop-blue-icon">
                    <i class="fa-solid ${iconType}"></i>
                </div>
                <div>
                    <div class="stop-title">${s.stop_name}</div>
                    <div class="line-badges-row">${lineBadgesHtml}</div>
                </div>
            </div>
            ${busBtnHtml}
        `;
        container.appendChild(item);

        if (idx < stops.length - 1) {
            const nextStop = stops[idx + 1];
            const distKm = haversine(floatVal(s.lat), floatVal(s.lng), floatVal(nextStop.lat), floatVal(nextStop.lng));
            const distMeters = Math.round(distKm * 1000);
            const walkMins = Math.round((distKm / 5.0) * 60);

            const isLongDistance = distKm >= 1.2;

            const distDivider = document.createElement('div');
            distDivider.style.cssText = "padding: 6px 16px 6px 42px; font-size: 0.76rem; font-weight: 700; color: #64748b; background: #f8fafc; border-bottom: 1px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center;";

            if (isLongDistance) {
                distDivider.innerHTML = `
                    <span style="color: #dc2626; font-weight: 800;"><i class="fa-solid fa-triangle-exclamation"></i> Uzun Ara Mesafe: ${distKm.toFixed(2)} km (${distMeters}m)</span>
                    <button style="background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; padding: 2px 8px; border-radius: 10px; font-size: 0.72rem; font-weight: 800; cursor: pointer;" onclick="requestStopForSegment('${mainRouteCode}', '${s.stop_name}', '${nextStop.stop_name}')">+ Durak Ekle</button>
                `;
            } else {
                distDivider.innerHTML = `
                    <span>Yol Mesafesi: ${distMeters} metre</span>
                    <span>~${walkMins} dk yürüme</span>
                `;
            }
            container.appendChild(distDivider);
        }
    });
}

function requestStopForSegment(routeCode, prevName, nextName) {
    switchTab('tab-request-stop');
    const reqSelect = document.getElementById('req-route-select');
    if (reqSelect) reqSelect.value = routeCode;
    document.getElementById('req-proposed-name').value = `${prevName} - ${nextName} Ara Durağı`;
    document.getElementById('req-description').value = `Bu iki durak arasındaki karayolu yürüme mesafesi uzun olduğu için yeni ara durak eklenmesi talep edilmektedir.`;
    document.getElementById('txt-nearest-prev').textContent = `Önceki Durak: ${prevName}`;
    document.getElementById('txt-nearest-next').textContent = `Sonraki Durak: ${nextName}`;
}

function focusStopOnMap(markerIndex, lat, lng, stopName) {
    if (!map) return;
    map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

    if (currentMarkers && currentMarkers[markerIndex]) {
        currentMarkers[markerIndex].openPopup();
    }
}

function renderMapStopsAndLine(stops, roadPolyline, lineColor) {
    clearMap();

    if (!stops || stops.length === 0) return;

    stops.forEach((s, idx) => {
        const latLng = [s.lat, s.lng];

        const isTerminal = (idx === 0 || idx === stops.length - 1);
        const badgeBg = isTerminal ? 'linear-gradient(135deg, #10b981, #059669)' : (lineColor || 'linear-gradient(135deg, #ef4444, #dc2626)');

        const iconType = (currentMeta.route_code && (currentMeta.route_code.startsWith('T') || currentMeta.route_code.startsWith('GR'))) ? 'fa-train-tram' : 'fa-bus';

        const sName = (s.stop_name || '').toUpperCase();
        const hasElevator = s.has_elevator || sName.includes('GAR') || sName.includes('ADLİYE') || sName.includes('MEYDAN') || sName.includes('ÜNİVERSİTE') || sName.includes('HASTANE') || sName.includes('SANKO');
        const hasCharge = s.charging_station || sName.includes('GAR') || sName.includes('ÜNİVERSİTE') || sName.includes('SANKO') || sName.includes('MEYDAN') || sName.includes('BURÇ');

        const accessSubBadge = (hasElevator || hasCharge) ? 
            `<div style="position: absolute; bottom: -4px; right: -4px; background: #0f766e; color: white; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; border: 1px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="fa-solid fa-wheelchair"></i></div>` : '';

        const customIcon = L.divIcon({
            className: 'custom-stop-badge-icon',
            html: `<div style="position: relative; background: ${badgeBg}; border: 2.5px solid white; width: 28px; height: 28px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; box-shadow: 0 3px 8px rgba(0,0,0,0.35); transition: transform 0.2s ease;"><i class="fa-solid ${iconType}" style="font-size: 10px;"></i>${accessSubBadge}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const popupHTML = `
            <div style="font-family: 'Inter', sans-serif; min-width: 220px;">
                <div style="font-weight: 800; color: #0f172a; font-size: 0.95rem; margin-bottom: 2px;">${idx + 1}. ${s.stop_name}</div>
                <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 6px;">Durak ID: ${s.stop_id}</div>
                <div style="padding: 6px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 0.75rem; line-height: 1.45;">
                    <div style="font-weight: 800; color: #16a34a; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
                        <i class="fa-solid fa-wheelchair"></i> Engelsiz Ulaşım Standartları
                    </div>
                    <div style="color: #15803d;">🚌 Otobüs: <strong>Alçak Tabanlı (%100 Uyumlu)</strong></div>
                    <div style="color: #166534;">🦽 Rampa: <strong>🟢 Kullanılabilir (Eğim <%5)</strong></div>
                    ${hasElevator ? '<div style="color: #0d9488;">🛗 Asansör: <strong>🟢 Aktif / Çalışıyor</strong></div>' : ''}
                    ${hasCharge ? '<div style="color: #b45309;">⚡ Hızlı Şarj: <strong>⚡ Akülü Sandalye Şarj Noktası Var</strong></div>' : ''}
                    <div style="color: #475569;">🟡 Yüzey: <strong>Görme Engelli Hissedilebilir İz Var</strong></div>
                </div>
            </div>
        `;

        const marker = L.marker(latLng, { icon: customIcon })
            .bindPopup(popupHTML)
            .addTo(map);

        currentMarkers.push(marker);
    });

    const polylineCoords = (roadPolyline && roadPolyline.length > 2) ? roadPolyline : stops.map(s => [s.lat, s.lng]);

    currentPolyline = L.polyline(polylineCoords, {
        color: lineColor || '#2563eb',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);

    map.fitBounds(currentPolyline.getBounds(), { padding: [40, 40] });
}

function clearMap() {
    currentMarkers.forEach(m => map.removeLayer(m));
    currentMarkers = [];
    busVehicleMarkers.forEach(m => map.removeLayer(m));
    busVehicleMarkers = [];
    if (currentPolyline) {
        map.removeLayer(currentPolyline);
        currentPolyline = null;
    }
    map.setView([37.0662, 37.3781], 13);
}

async function toggleGaziBisMapLayer() {
    isGaziBisVisible = !isGaziBisVisible;
    if (isGaziBisVisible) {
        await loadAndRenderGaziBisMapMarkers();
    } else {
        clearGaziBisMapMarkers();
    }
}

async function loadAndRenderGaziBisMapMarkers() {
    try {
        const res = await fetch('/api/gazibis-stations');
        const json = await res.json();

        if (json.success && json.data) {
            clearGaziBisMapMarkers();

            json.data.forEach((st) => {
                const customIcon = L.divIcon({
                    className: 'gazibis-marker-icon',
                    html: `<div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.45);"><i class="fa-solid fa-bicycle"></i></div>`,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                });

                const marker = L.marker([st.lat, st.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
                            <div style="font-weight: 800; color: #6d28d9; font-size: 0.95rem; margin-bottom: 4px;"><i class="fa-solid fa-bicycle"></i> ${st.name}</div>
                            <div style="font-size: 0.82rem; color: #059669; font-weight: 700;">${st.available_bikes} Boş Bisiklet Mevcut</div>
                            <div style="font-size: 0.8rem; color: #64748b;">${st.available_docks} Boş Park Noktası</div>
                        </div>
                    `)
                    .addTo(map);

                gaziBisMarkers.push(marker);
            });
        }
    } catch (err) {
        console.error("Error loading GaziBis map markers:", err);
    }
}

function clearGaziBisMapMarkers() {
    gaziBisMarkers.forEach(m => map.removeLayer(m));
    gaziBisMarkers = [];
}

// OTOPARK HARİTA KATMANI & YÜKLEME
async function toggleParkingMapLayer() {
    isParkingVisible = !isParkingVisible;
    if (isParkingVisible) {
        await loadAndRenderParkingMapMarkers();
    } else {
        clearParkingMapMarkers();
    }
}

async function loadAndRenderParkingMapMarkers() {
    try {
        const res = await fetch('/api/parking-lots');
        const json = await res.json();

        if (json.success && json.data) {
            clearParkingMapMarkers();

            json.data.forEach((pk) => {
                const statusColor = pk.occupancy_pct > 85 ? '#ef4444' : (pk.occupancy_pct > 65 ? '#eab308' : '#0284c7');
                const customIcon = L.divIcon({
                    className: 'parking-marker-icon',
                    html: `<div style="background: linear-gradient(135deg, ${statusColor}, #0369a1); color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);">P</div>`,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                });

                const marker = L.marker([pk.lat, pk.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
                            <div style="font-weight: 800; color: #0284c7; font-size: 0.95rem; margin-bottom: 4px;"><i class="fa-solid fa-square-parking"></i> ${pk.name}</div>
                            <div style="font-size: 0.82rem; color: #059669; font-weight: 700;">${pk.empty_spots} Boş Park Yeri / Kapa: ${pk.total_capacity}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Doluluk Oranı: %${pk.occupancy_pct} • ${pk.fee_per_hour}</div>
                            <button onclick="selectParkingLotForReservation(${pk.id})" style="margin-top: 8px; width: 100%; background: #0284c7; color: white; border: none; padding: 6px; border-radius: 8px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">Park Yeri Rezerve Et</button>
                        </div>
                    `)
                    .addTo(map);

                parkingMarkers.push(marker);
            });
        }
    } catch (err) {
        console.error("Error loading Parking map markers:", err);
    }
}

function clearParkingMapMarkers() {
    parkingMarkers.forEach(m => map.removeLayer(m));
    parkingMarkers = [];
}

async function loadParkingLots() {
    try {
        const res = await fetch('/api/parking-lots');
        const json = await res.json();

        if (json.success && json.data) {
            parkingLotsList = json.data;

            const select = document.getElementById('prk-select-lot');
            const tbody = document.getElementById('table-parking-lots');
            if (select) select.innerHTML = '';
            if (tbody) tbody.innerHTML = '';

            parkingLotsList.forEach((pk) => {
                if (select) {
                    const opt = new Option(`${pk.name} (${pk.empty_spots} Boş Yer - Doluluk %${pk.occupancy_pct})`, pk.id);
                    select.add(opt);
                }

                if (tbody) {
                    const tr = document.createElement('tr');
                    const badgeBg = pk.occupancy_pct > 85 ? '#fef2f2' : (pk.occupancy_pct > 65 ? '#fefce8' : '#ecfdf5');
                    const badgeTextColor = pk.occupancy_pct > 85 ? '#991b1b' : (pk.occupancy_pct > 65 ? '#854d0e' : '#065f46');
                    
                    tr.innerHTML = `
                        <td><strong>${pk.name}</strong><br><span style="font-size:0.75rem; color:#64748b;">${pk.type}</span></td>
                        <td>
                            <div style="font-size: 0.8rem; font-weight: 800; color: ${badgeTextColor}; margin-bottom: 2px;">%${pk.occupancy_pct}</div>
                            <div style="width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pk.occupancy_pct}%; height: 100%; background: ${badgeTextColor};"></div>
                            </div>
                        </td>
                        <td><span style="background: #d1fae5; color: #065f46; font-weight: 800; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${pk.empty_spots} Boş</span></td>
                        <td><span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${pk.total_capacity} Araç</span></td>
                        <td><span style="font-size: 0.78rem; font-weight: 700; color: #475569;">${pk.fee_per_hour}</span></td>
                        <td><span style="background: ${badgeBg}; color: ${badgeTextColor}; font-weight: 700; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">${pk.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        }
    } catch (e) {
        console.error("Error loading Parking lots:", e);
    }
}

function selectParkingLotForReservation(parkingId) {
    switchTab('tab-parking');
    const select = document.getElementById('prk-select-lot');
    if (select) select.value = parkingId;
}

async function submitParkingReservation() {
    const parkingId = document.getElementById('prk-select-lot')?.value;
    const startTime = document.getElementById('prk-start-time')?.value || '10:00';
    const endTime = document.getElementById('prk-end-time')?.value || '12:00';
    const plate = document.getElementById('prk-plate')?.value.trim().toUpperCase() || '27 ABC 123';
    const driverName = document.getElementById('prk-driver-name')?.value.trim() || 'Ahmet Yılmaz';
    const phone = document.getElementById('prk-phone')?.value.replace(/\D/g, '') || '';
    const duration = document.getElementById('prk-duration')?.value || '2 Saat';

    if (!plate || plate.length < 5) {
        alert('Lütfen geçerli bir araç plaka numarası giriniz (Örn: 27 ABC 123).');
        return;
    }

    const parkingObj = parkingLotsList.find(p => p.id === parkingId) || { name: 'Valilik Katlı Otoparkı' };

    try {
        const res = await fetch('/api/reserve-parking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parking_id: parkingId,
                driver_name: driverName,
                plate_number: plate,
                phone: phone,
                duration: duration
            })
        });

        const json = await res.json();
        const code = (json.success && json.data) ? json.data.reservation_code : `PRK-${Math.floor(1000 + Math.random() * 9000)}`;

        const myTable = document.getElementById('table-parking-my-reservations');
        if (myTable) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${code}</code></td>
                <td><strong>${parkingObj.name}</strong></td>
                <td><span class="route-code-badge" style="background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; font-weight: 900;">${plate}</span></td>
                <td><span style="font-weight: 800; color: #0284c7;">${startTime} - ${endTime}</span></td>
                <td>${driverName}</td>
                <td><span style="background: #d1fae5; color: #047857; font-weight: 800; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem;">Rezerve Edildi 🟢</span></td>
            `;
            myTable.insertBefore(tr, myTable.firstChild);
        }

        showCustomMessageBox({
            title: 'Otopark Araç Park Yeri Randevunuz Oluşturuldu!',
            subtitle: 'Aracınız için park yeri ayrılmıştır. Giriş saatinde sıra beklemeden giriş yapabilirsiniz.',
            icon: 'fa-square-parking',
            iconBg: '#e0f2fe',
            iconColor: '#0284c7',
            details: [
                { label: 'Rezervasyon Kodu', value: code, color: '#0284c7' },
                { label: 'Otopark Konumu', value: parkingObj.name, color: '#0f172a' },
                { label: 'Araç Plakası', value: plate, color: '#0369a1' },
                { label: 'Park Saatleri', value: `${startTime} - ${endTime}`, color: '#0284c7' },
                { label: 'Sürücü Adı', value: driverName, color: '#059669' }
            ]
        });

        if (document.getElementById('prk-plate')) document.getElementById('prk-plate').value = '';
        if (document.getElementById('prk-driver-name')) document.getElementById('prk-driver-name').value = '';
        if (document.getElementById('prk-phone')) document.getElementById('prk-phone').value = '';
    } catch (e) {
        console.error("Error submitting Parking reservation:", e);
    }
}

async function loadGaziBisStations() {
    try {
        const res = await fetch('/api/gazibis-stations');
        const json = await res.json();

        if (json.success && json.data) {
            gazibisStationsList = json.data;

            const selectPickup = document.getElementById('gbis-station-select');
            const selectDropoff = document.getElementById('gbis-dropoff-select');
            const tbody = document.getElementById('table-gazibis-stations');
            if (selectPickup) selectPickup.innerHTML = '';
            if (selectDropoff) selectDropoff.innerHTML = '';
            if (tbody) tbody.innerHTML = '';

            gazibisStationsList.forEach((st) => {
                if (selectPickup) {
                    const opt = new Option(`${st.name} (${st.available_bikes} Bisiklet Mevcut)`, st.id);
                    selectPickup.add(opt);
                }

                if (selectDropoff) {
                    const opt = new Option(`${st.name} (${st.available_docks} Boş Park Yeri)`, st.id);
                    selectDropoff.add(opt);
                }

                if (tbody) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${st.name}</strong></td>
                        <td><span style="background: #d1fae5; color: #065f46; font-weight: 800; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${st.available_bikes} Bisiklet</span></td>
                        <td><span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${st.available_docks} Park</span></td>
                        <td><span style="background: #d1fae5; color: #047857; font-weight: 700; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">${st.status}</span></td>
                    `;
                    tbody.appendChild(tr);
                }
            });

            if (selectDropoff && selectDropoff.options.length > 1) {
                selectDropoff.selectedIndex = 1;
            }
        }
    } catch (e) {
        console.error("Error loading GaziBis stations:", e);
    }
}

async function updateAISimulator() {
    const engineSize = document.getElementById('sim-engine').value;
    document.getElementById('lbl-sim-engine').textContent = `${engineSize} L`;

    const cylinders = document.getElementById('sim-cylinders').value;
    const consumption = document.getElementById('sim-consumption').value;
    const fuelType = document.getElementById('sim-fuel-type').value;

    try {
        const res = await fetch('/api/predict-co2-ml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                engine_size: engineSize,
                cylinders: cylinders,
                fuel_consumption: consumption,
                fuel_type: fuelType
            })
        });

        const json = await res.json();

        if (json.success) {
            document.getElementById('sim-res-co2').textContent = `${json.predicted_co2_g_km} g/km`;

            const badge = document.getElementById('sim-res-badge');
            badge.textContent = json.eco_score;
            badge.style.backgroundColor = json.score_color;

            document.getElementById('sim-res-trees').textContent = `Günlük Telafi İçin: ${json.trees_daily} Ağaç Gerekli`;
        }
    } catch (err) {
        console.error("Error running AI simulator:", err);
    }
}

const animatedValueLabelsPlugin = {
    id: 'animatedValueLabelsPlugin',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                const val = dataset.data[index];
                if (val !== undefined && val !== null) {
                    ctx.save();
                    ctx.font = '800 11px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    
                    if (chart.config.options.indexAxis === 'y') {
                        ctx.fillStyle = '#4c1d95';
                        ctx.textAlign = 'left';
                        const text = typeof val === 'number' && val > 100 ? `${val} g` : `%${val}`;
                        ctx.fillText(text, bar.x + 8, bar.y + 4);
                    } else {
                        const colors = ['#dc2626', '#ea580c', '#ca8a04', '#2563eb', '#16a34a', '#059669'];
                        ctx.fillStyle = colors[index % colors.length] || '#0f172a';
                        const text = val > 0 ? `${val} g/km` : '0 (Sıfır)';
                        ctx.fillText(text, bar.x, bar.y - 6);
                    }
                    ctx.restore();
                }
            });
        });
    }
};

function initMLCharts() {
    const ctx1 = document.getElementById('featureChart');
    if (ctx1) {
        featureChart = new Chart(ctx1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Yakıt Tüketimi (L/100km)', 'Motor Hacmi (L)', 'Silindir Sayısı', 'Yakıt Türü'],
                datasets: [{
                    label: 'Karar Ağırlığı (%)',
                    data: [58.4, 25.8, 11.6, 4.2],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.9)',
                        'rgba(168, 85, 247, 0.85)',
                        'rgba(192, 132, 252, 0.8)',
                        'rgba(233, 213, 255, 0.75)'
                    ],
                    borderColor: ['#7c3aed', '#9333ea', '#a855f7', '#c084fc'],
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: '#6d28d9'
                }]
            },
            plugins: [animatedValueLabelsPlugin],
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { left: 10, right: 45, top: 10, bottom: 10 }
                },
                animation: {
                    duration: 1800,
                    easing: 'easeOutQuart',
                    delay: (context) => context.dataIndex * 200
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Inter', weight: 'bold' },
                        bodyFont: { family: 'Inter' },
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: function(ctx) {
                                return ` Yapay Zekanın Verdiği Önem Ağırlığı: %${ctx.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 70,
                        ticks: { font: { family: 'Inter', weight: '700' } },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter', weight: '700' } }
                    }
                }
            }
        });
    }

    const ctx2 = document.getElementById('fuelEmissionsChart');
    if (ctx2) {
        fuelEmissionsChart = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Benzin (Gasoline)', 'Dizel (Diesel)', 'E85 Ethanol', 'CNG Doğalgaz', 'Hibrit (Hybrid)', 'Elektrik (EV)'],
                datasets: [{
                    label: 'Ortalama CO2 Emisyonu (g/km)',
                    data: [262, 238, 312, 195, 125, 0],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.85)',
                        'rgba(249, 115, 22, 0.85)',
                        'rgba(234, 179, 8, 0.85)',
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(34, 197, 94, 0.85)',
                        'rgba(16, 185, 129, 0.85)'
                    ],
                    borderColor: ['#dc2626', '#ea580c', '#ca8a04', '#2563eb', '#16a34a', '#059669'],
                    borderWidth: 2,
                    borderRadius: 10,
                    barThickness: 32,
                    hoverBorderWidth: 4
                }]
            },
            plugins: [animatedValueLabelsPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { left: 20, right: 25, top: 30, bottom: 10 }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutElastic',
                    delay: (context) => context.dataIndex * 180
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Inter', weight: 'bold' },
                        bodyFont: { family: 'Inter' },
                        padding: 12,
                        cornerRadius: 10,
                        callbacks: {
                            label: function(ctx) {
                                return ` Ortalama Karbon Salınımı: ${ctx.raw} Gram CO2 / km`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 350,
                        title: { display: true, text: 'CO2 Salınımı (g/km)', font: { weight: '800', family: 'Inter', size: 12 } },
                        ticks: { font: { family: 'Inter', weight: '700' } },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter', weight: '700' } }
                    }
                }
            }
        });
    }
}

async function submitGaziBisReservation() {
    const pickupId = document.getElementById('gbis-station-select')?.value;
    const dropoffId = document.getElementById('gbis-dropoff-select')?.value;
    const startTime = document.getElementById('gbis-start-time')?.value || '14:00';
    const endTime = document.getElementById('gbis-end-time')?.value || '16:00';
    const name = document.getElementById('gbis-name')?.value.trim() || 'Nefise Beyza';
    const phone = document.getElementById('gbis-phone')?.value.replace(/\D/g, '') || '';
    const duration = document.getElementById('gbis-duration')?.value || '2 Saat';

    if (phone.length > 0 && phone.length < 10) {
        alert('Lütfen geçerli bir telefon numarası giriniz (Örn: 0555 123 45 67).');
        return;
    }

    const pickupStationObj = gazibisStationsList.find(s => s.id === pickupId) || { name: 'Masal Parkı İstasyonu' };
    const dropoffStationObj = gazibisStationsList.find(s => s.id === dropoffId) || { name: 'GAÜN Kampüs İstasyonu' };

    try {
        const res = await fetch('/api/reserve-gazibis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                station_id: pickupId,
                name: name,
                phone: phone,
                duration: duration
            })
        });

        const json = await res.json();
        const code = (json.success && json.data) ? json.data.reservation_code : `GBIS-${Math.floor(1000 + Math.random() * 9000)}`;

        const myTable = document.getElementById('table-gazibis-my-reservations');
        if (myTable) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${code}</code></td>
                <td><strong>${pickupStationObj.name}</strong></td>
                <td><strong>${dropoffStationObj.name}</strong></td>
                <td><span style="font-weight: 800; color: #6d28d9;">${startTime} - ${endTime}</span></td>
                <td>${name}</td>
                <td><span style="background: #d1fae5; color: #047857; font-weight: 800; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem;">Onaylandı / Aktif 🟢</span></td>
            `;
            myTable.insertBefore(tr, myTable.firstChild);
        }

        showCustomMessageBox({
            title: 'GaziBis Bisiklet Randevunuz Oluşturuldu!',
            subtitle: 'Bisikletiniz belirttiğiniz istasyonda seçtiğiniz saat aralığı için rezerve edilmiştir.',
            icon: 'fa-bicycle',
            iconBg: '#f3e8ff',
            iconColor: '#8b5cf6',
            details: [
                { label: 'Randevu Kodu', value: code, color: '#7c3aed' },
                { label: 'Teslim Alınacak', value: pickupStationObj.name, color: '#0f172a' },
                { label: 'Bırakılacak İstasyon', value: dropoffStationObj.name, color: '#0f172a' },
                { label: 'Kiralama Saatleri', value: `${startTime} - ${endTime}`, color: '#6d28d9' },
                { label: 'Kullanıcı Adı', value: name, color: '#059669' }
            ]
        });

        if (document.getElementById('gbis-name')) document.getElementById('gbis-name').value = '';
        if (document.getElementById('gbis-phone')) document.getElementById('gbis-phone').value = '';
    } catch (e) {
        console.error("Error submitting GaziBis reservation:", e);
    }
}

async function onRequestRouteSelectChanged() {
    const routeCode = document.getElementById('req-route-select').value;
    if (!routeCode || !requestMap) return;

    try {
        const res = await fetch(`/api/route-details/${routeCode}`);
        const json = await res.json();

        if (json.success && json.stops) {
            clearRequestMapRoute();

            currentRequestRouteStops = json.stops;
            
            if (currentRequestRouteStops.length >= 2) {
                const s1 = currentRequestRouteStops[0];
                const s2 = currentRequestRouteStops[1];
                const dM = Math.round(haversine(floatVal(s1.lat), floatVal(s1.lng), floatVal(s2.lat), floatVal(s2.lng)) * 1000);

                document.getElementById('txt-nearest-prev').textContent = `Önceki Durak: ${s1.stop_name}`;
                document.getElementById('txt-nearest-next').textContent = `Sonraki Durak: ${s2.stop_name} (Ara Mesafe: ${dM}m)`;
            }

            currentRequestRouteStops.forEach(s => {
                const sMarker = L.marker([s.lat, s.lng], {
                    icon: L.divIcon({
                        className: 'req-stop-dot',
                        html: `<div style="background:#ef4444; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [14, 14]
                    })
                }).bindPopup(`<b>${s.stop_name}</b>`).addTo(requestMap);
                requestMapStopMarkers.push(sMarker);
            });

            const poly = (json.road_polyline && json.road_polyline.length > 2) ? json.road_polyline : currentRequestRouteStops.map(s => [s.lat, s.lng]);
            requestMapPolyline = L.polyline(poly, { color: '#f97316', weight: 5, opacity: 0.85 }).addTo(requestMap);
            requestMap.fitBounds(requestMapPolyline.getBounds(), { padding: [30, 30] });
        }
    } catch (e) {
        console.error("Error drawing request map route:", e);
    }
}

function clearRequestMapRoute() {
    requestMapStopMarkers.forEach(m => requestMap.removeLayer(m));
    requestMapStopMarkers = [];
    if (requestMapPolyline) {
        requestMap.removeLayer(requestMapPolyline);
        requestMapPolyline = null;
    }
}

async function toggleCardCenters() {
    isCardCentersVisible = !isCardCentersVisible;
    
    if (isCardCentersVisible) {
        await loadAndRenderCardCenters();
    } else {
        clearCardCenters();
    }
}

async function loadAndRenderCardCenters() {
    try {
        const res = await fetch('/api/card-centers');
        const json = await res.json();

        if (json.success && json.data) {
            clearCardCenters();

            json.data.forEach((c) => {
                const customIcon = L.divIcon({
                    className: 'card-center-icon',
                    html: `<div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4);"><i class="fa-regular fa-id-card"></i></div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker([c.lat, c.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="font-family: 'Inter', sans-serif;">
                            <div style="font-weight: 800; color: #6d28d9; font-size: 0.95rem; margin-bottom: 2px;">${c.name}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Gaziantep Toplu Taşıma Kart İşlem Noktası</div>
                        </div>
                    `)
                    .addTo(map);

                cardCenterMarkers.push(marker);
            });
        }
    } catch (err) {
        console.error("Error loading card centers:", err);
    }
}

function clearCardCenters() {
    cardCenterMarkers.forEach(m => map.removeLayer(m));
    cardCenterMarkers = [];
}

function openScheduleModal() {
    const modal = document.getElementById('schedule-modal');
    const code = currentMeta.route_code || 'B01';
    const name = currentMeta.route_name || 'GAZİKENT-ENSAR SİTESİ';

    document.getElementById('modal-route-code').textContent = `${code} Sefer Saatleri`;
    document.getElementById('modal-route-name').textContent = name;

    modal.classList.add('active');
}

function closeScheduleModal() {
    document.getElementById('schedule-modal').classList.remove('active');
}

function formatLicensePlate(input) {
    if (!input) return;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 10) val = val.substring(0, 10);

    if (/^\d{2}/.test(val)) {
        const city = val.substring(0, 2);
        const rest = val.substring(2);
        
        const lettersMatch = rest.match(/^[A-Z]+/);
        if (lettersMatch) {
            const letters = lettersMatch[0].substring(0, 3);
            const digits = rest.substring(letters.length).replace(/[^0-9]/g, '').substring(0, 4);
            val = `${city} ${letters}${digits ? ' ' + digits : ''}`;
        } else if (rest.length > 0) {
            val = `${city} ${rest}`;
        } else {
            val = city;
        }
    }
    input.value = val;
}

function showCustomMessageBox(config) {
    const modal = document.getElementById('custom-message-modal');
    if (!modal) return;

    const iconEl = document.getElementById('msg-box-icon');
    const titleEl = document.getElementById('msg-box-title');
    const subtitleEl = document.getElementById('msg-box-subtitle');
    const detailsEl = document.getElementById('msg-box-details');

    if (iconEl) {
        iconEl.innerHTML = `<i class="fa-solid ${config.icon || 'fa-check'}"></i>`;
        iconEl.style.background = config.iconBg || '#d1fae5';
        iconEl.style.color = config.iconColor || '#059669';
        iconEl.style.boxShadow = `0 4px 14px ${config.iconColor || '#059669'}40`;
    }

    if (titleEl) titleEl.textContent = config.title || 'İşlem Başarıyla Tamamlandı!';
    if (subtitleEl) subtitleEl.textContent = config.subtitle || 'Talebiniz sistem tarafından kaydedilmiştir.';

    if (detailsEl) {
        detailsEl.innerHTML = '';
        if (config.details && Array.isArray(config.details)) {
            config.details.forEach(item => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.fontSize = '0.86rem';
                row.innerHTML = `
                    <span style="color: #64748b; font-weight: 600;">${item.label}:</span>
                    <strong style="color: ${item.color || '#0f172a'};">${item.value}</strong>
                `;
                detailsEl.appendChild(row);
            });
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCustomMessageBox() {
    const modal = document.getElementById('custom-message-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function trNormalize(str) {
    if (!str) return '';
    return str.toString()
        .toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/i̇/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/â|â/g, 'a')
        .replace(/î|î/g, 'i')
        .replace(/û|û/g, 'u')
        .replace(/[^a-z0-9]/g, '');
}

function filterStopOptions(type) {
    const searchInput = document.getElementById(type === 'start' ? 'search-start-stop' : 'search-end-stop');
    const selectEl = document.getElementById(type === 'start' ? 'calc-start-stop' : 'calc-end-stop');
    const countBadge = document.getElementById(type === 'start' ? 'lbl-start-count' : 'lbl-end-count');

    if (!searchInput || !selectEl || !allStops) return;

    const qRaw = searchInput.value.trim();
    const qNorm = trNormalize(qRaw);
    selectEl.innerHTML = '';

    const filtered = allStops.filter(s => {
        if (!qNorm) return true;
        const nameNorm = trNormalize(s.stop_name || '');
        const idNorm = trNormalize(String(s.stop_id || ''));
        return nameNorm.includes(qNorm) || idNorm.includes(qNorm);
    });

    if (filtered.length === 0) {
        const opt = new Option(`❌ "${qRaw}" için durak bulunamadı`, '');
        opt.disabled = true;
        selectEl.add(opt);
    } else {
        filtered.forEach(s => {
            const opt = new Option(`${s.stop_id} - ${s.stop_name}`, s.stop_id);
            selectEl.add(opt);
        });
    }

    if (countBadge) {
        countBadge.textContent = `${filtered.length} durak bulundu`;
    }

    calculateCO2();
}

function resetStartStopSelect() {
    const input = document.getElementById('search-start-stop');
    if (input) input.value = '';
    filterStopOptions('start');
}

function resetEndStopSelect() {
    const input = document.getElementById('search-end-stop');
    if (input) input.value = '';
    filterStopOptions('end');
}

async function loadStops() {
    try {
        const res = await fetch('/api/stops');
        const json = await res.json();

        if (json.success && json.data) {
            allStops = json.data;

            populateStopDropdowns(allStops);
            calculateCO2();
        }
    } catch (err) {
        console.error("Error loading all stops:", err);
    }
}

function populateStopDropdowns(stops) {
    const selectStart = document.getElementById('calc-start-stop');
    const selectEnd = document.getElementById('calc-end-stop');
    const lblStart = document.getElementById('lbl-start-count');
    const lblEnd = document.getElementById('lbl-end-count');

    if (!selectStart || !selectEnd) return;

    selectStart.innerHTML = '';
    selectEnd.innerHTML = '';

    const defOpt1 = new Option('-- Lütfen Kalkış Durağı Seçin veya Arayın --', '');
    defOpt1.disabled = true;
    selectStart.add(defOpt1);

    const defOpt2 = new Option('-- Lütfen Varış Durağı Seçin veya Arayın --', '');
    defOpt2.disabled = true;
    selectEnd.add(defOpt2);

    stops.forEach((s) => {
        const opt1 = new Option(`${s.stop_id} - ${s.stop_name}`, s.stop_id);
        const opt2 = new Option(`${s.stop_id} - ${s.stop_name}`, s.stop_id);
        selectStart.add(opt1);
        selectEnd.add(opt2);
    });

    if (selectStart.options.length > 1) selectStart.selectedIndex = 1;
    if (selectEnd.options.length > 6) selectEnd.selectedIndex = 6;

    if (lblStart) lblStart.textContent = `${stops.length} durak bulundu`;
    if (lblEnd) lblEnd.textContent = `${stops.length} durak bulundu`;
}

function downloadCO2ReportCSV() {
    const startSelect = document.getElementById('calc-start-stop');
    const endSelect = document.getElementById('calc-end-stop');
    
    const startText = startSelect?.options[startSelect.selectedIndex]?.text || '10002 - Demokrasi Meydanı / Valilik';
    const endText = endSelect?.options[endSelect.selectedIndex]?.text || '10005 - Karataş 1. Bölge Çarşı';
    const busCo2Text = document.getElementById('cmp-bus-co2')?.textContent || '15.12 kg';
    const tramCo2Text = document.getElementById('cmp-tram-co2')?.textContent || '2.16 kg';
    const distText = document.getElementById('cmp-distance-header')?.textContent || 'Mesafe: 5.4 km';
    const savingText = document.getElementById('cmp-saving-text')?.textContent || '';
    const trafficText = document.getElementById('txt-traffic-percent')?.textContent || '%38 Akıcı';
    const trafficFactor = document.getElementById('txt-traffic-factor')?.textContent || '';

    let csv = "Gaziantep Akıllı Ulaşım Güzergah & CO2 Karşılaştırma Analiz Raporu\n";
    csv += `Rapor Tarihi,"${new Date().toLocaleString('tr-TR')}"\n`;
    csv += `Kalkış Durağı,"${startText}"\n`;
    csv += `Varış Durağı,"${endText}"\n`;
    csv += `Hesaplanan Güzergah Mesafesi,"${distText}"\n`;
    csv += `Trafik Yoğunluğu,"${trafficText} (${trafficFactor})"\n\n`;

    csv += "Ulaşım Modu,Model / Hat Tipi,Yolcu Kapasitesi,Toplam Sefer CO2 Salınımı (kg),Gram CO2 / km,Tahmini Süre,Çevre Eco Puanı\n";
    csv += `"Belediye Otobüsü (Körüklü)","MAN Lion's City G (Körüklü)",150 Yolcu,"${busCo2Text}",390 g/km,"~18 dk",C (Orta Emisyon)\n`;
    csv += `"Belediye Otobüsü (Solo)","MAN Lion's City (Solo)",100 Yolcu,"${(parseFloat(busCo2Text)*0.68).toFixed(2)} kg",265 g/km,"~18 dk",B (Dengeli Emisyon)\n`;
    csv += `"Tramvay Hatları (T1/T2/T3)","Elektrikli Tramvay",300 Yolcu,"${tramCo2Text}",90 g/km,"~14 dk",A+ (Çevreci / Önerilen)\n`;
    csv += `"Elektrikli Otobüs (18M)","Körüklü EV",150 Yolcu,"0.00 kg",0 g/km,"~16 dk",A++ (Sıfır Emisyon)\n`;
    csv += `"Özel Bireysel Otomobil","Binek Araç (1.6 Dizel)",1 Yolcu,"${(parseFloat(busCo2Text)*0.85).toFixed(2)} kg",220 g/km,"~15 dk",D (Yüksek Kişi Başı Emisyon)\n\n`;

    csv += `Analiz Sonucu,"${savingText}"\n`;
    csv += `Çevresel Kazanım,"Tramvay / EV kullanımı ile karbon ayak izinde %85 tasarruf sağlanmıştır."\n`;

    triggerCSVDownload("Gaziantep_Guzergah_CO2_Karsilastirma_Analiz_Raporu.csv", csv);

    showCustomMessageBox({
        title: 'Güzergah Karşılaştırma Raporu İndirildi!',
        subtitle: 'Seçtiğiniz duraklar arası detaylı CO2 emisyon tablosu ve analiz raporu bilgisayarınıza kaydedilmiştir.',
        icon: 'fa-file-arrow-down',
        iconBg: '#dcfce7',
        iconColor: '#16a34a',
        details: [
            { label: 'Rapor Türü', value: 'Güzergah & CO2 Karşılaştırma Analizi', color: '#16a34a' },
            { label: 'Güzergah', value: `${startText.split('-')[1] || startText} ➔ ${endText.split('-')[1] || endText}`, color: '#0f172a' },
            { label: 'Mesafe', value: distText.replace('Mesafe: ', ''), color: '#2563eb' },
            { label: 'Otobüs Salınım', value: busCo2Text, color: '#ef4444' },
            { label: 'Tramvay Salınım', value: tramCo2Text, color: '#059669' }
        ]
    });
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function submitStopRequest() {
    const routeCode = document.getElementById('req-route-select').value;
    const proposedName = document.getElementById('req-proposed-name').value.trim() || 'Yeni Ara Durak';
    const description = document.getElementById('req-description').value.trim() || 'Bu otobüs hattında yürüme mesafesi uzun olduğu için yeni durak talebi.';

    try {
        const res = await fetch('/api/request-new-stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route_code: routeCode,
                proposed_stop_name: proposedName,
                description: description
            })
        });

        const json = await res.json();

        if (json.success && json.data) {
            const d = json.data;
            const pText = document.getElementById('txt-nearest-prev')?.textContent.replace('Önceki Durak:', '').trim();
            const nText = document.getElementById('txt-nearest-next')?.textContent.replace('Sonraki Durak:', '').trim();

            showCustomMessageBox({
                title: 'Durak Talebi Başarıyla Alındı!',
                subtitle: 'Talebiniz Ulaşım Daire Başkanlığı sistemine başarıyla iletilmiştir.',
                icon: 'fa-plus-circle',
                iconBg: '#dbeafe',
                iconColor: '#2563eb',
                details: [
                    { label: 'Talep Takip Kodu', value: d.request_id || 'TLP-20260724', color: '#2563eb' },
                    { label: 'İlgili Hat', value: d.route_code || 'B01', color: '#0f172a' },
                    { label: 'Önerilen Durak', value: d.proposed_stop_name || 'Yeni Ara Durak', color: '#059669' },
                    { label: 'Önceki Durak', value: pText || 'Tespit Edildi', color: '#64748b' },
                    { label: 'Sonraki Durak', value: nText || 'Tespit Edildi', color: '#d97706' }
                ]
            });

            const tbody = document.getElementById('table-submitted-requests');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>${d.request_id}</code></td>
                <td><span class="route-code-badge" style="padding: 2px 6px; font-size: 0.75rem;">${d.route_code}</span></td>
                <td><strong>${d.proposed_stop_name}</strong></td>
                <td>${d.description}</td>
                <td><span style="background: #d1fae5; color: #065f46; font-weight: 700; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">Talep Alındı</span></td>
            `;
            tbody.insertBefore(tr, tbody.firstChild);

            document.getElementById('req-proposed-name').value = '';
            document.getElementById('req-description').value = '';
        }
    } catch (err) {
        console.error("Error submitting stop request:", err);
    }
}

function onModeChanged() {
    const mode = document.getElementById('calc-mode').value;
    const fuelGroup = document.getElementById('fuel-group');

    if (mode === 'Otobüs') {
        fuelGroup.style.display = 'block';
    } else {
        fuelGroup.style.display = 'none';
    }
    calculateCO2();
}

async function calculateCO2() {
    const busModelEl = document.getElementById('calc-bus-model');
    const busModel = busModelEl ? busModelEl.value : "MAN Lion's City (Solo)";
    const startSelect = document.getElementById('calc-start-stop');
    const endSelect = document.getElementById('calc-end-stop');

    if (!startSelect || !endSelect) return;

    const startStopId = startSelect.value;
    const endStopId = endSelect.value;

    const startOption = startSelect.options[startSelect.selectedIndex];
    const endOption = endSelect.options[endSelect.selectedIndex];

    if (!startOption || !endOption || !startStopId || !endStopId) return;

    const startText = startOption.text;
    const endText = endOption.text;

    try {
        const res = await fetch('/api/calculate-co2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'Otobüs',
                bus_model: busModel,
                start_stop_id: startStopId,
                end_stop_id: endStopId
            })
        });

        const json = await res.json();

        if (json.success && json.result) {
            const r = json.result;

            const dist = r.distance_km || 5.4;
            const busCo2 = (r.total_vehicle_co2_kg || 15.12);
            const tramCo2 = (busCo2 * 0.14).toFixed(2);
            const savedCo2 = (busCo2 - tramCo2).toFixed(2);
            const treesEarned = (savedCo2 * 1.36).toFixed(1);

            const distEl = document.getElementById('cmp-distance-header');
            if (distEl) distEl.textContent = `Mesafe: ${dist} km`;

            const subtitleEl = document.getElementById('cmp-route-subtitle');
            if (subtitleEl) subtitleEl.textContent = `${startText} ➔ ${endText}`;

            const busCo2El = document.getElementById('cmp-bus-co2');
            if (busCo2El) busCo2El.textContent = `${busCo2} kg CO2`;

            const busTimeEl = document.getElementById('cmp-bus-time');
            if (busTimeEl) busTimeEl.textContent = `~${Math.round(dist * 3.3)} dk seyahat`;

            const tramCo2El = document.getElementById('cmp-tram-co2');
            if (tramCo2El) tramCo2El.textContent = `${tramCo2} kg CO2`;

            const tramTimeEl = document.getElementById('cmp-tram-time');
            if (tramTimeEl) tramTimeEl.textContent = `~${Math.round(dist * 2.6)} dk seyahat`;

            const savingEl = document.getElementById('cmp-saving-text');
            if (savingEl) savingEl.textContent = `Düşük emisyonlu mod seçimi ile ${savedCo2} kg CO2 tasarruf sağlandı.`;

            const treeEl = document.getElementById('cmp-tree-badge');
            if (treeEl) treeEl.innerHTML = `<i class="fa-solid fa-tree"></i> ${treesEarned} Ağaç Kazancı`;

            const trafficPctEl = document.getElementById('txt-traffic-percent');
            if (trafficPctEl) trafficPctEl.textContent = `%${r.traffic_pct} • Akıcı Şehir Trafiği`;

            const trafficFactEl = document.getElementById('txt-traffic-factor');
            if (trafficFactEl) trafficFactEl.textContent = `Dur-Kalk Etkisi: CO2 Emisyonu +%${r.traffic_increase_pct}`;

            updateCO2Charts(dist, r.traffic_pct);
        }
    } catch (err) {
        console.error("Error calculating CO2:", err);
    }
}

function initCharts() {
    const ctx1 = document.getElementById('co2Chart').getContext('2d');
    co2Chart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: [
                "Özel Otomobil",
                "MAN Körüklü",
                "MAN Solo",
                "Otokar 10M Doruk",
                "Otokar 9M Doruk",
                "Temsa Prestij",
                "Tramvay",
                "Elektrikli Otobüs"
            ],
            datasets: [{
                label: 'Toplam Sefer CO2 Salınımı (Gram CO2)',
                data: [1430, 2535, 1722, 1365, 1267, 942, 585, 0],
                backgroundColor: [
                    '#ef4444',
                    '#f97316',
                    '#fb923c',
                    '#eab308',
                    '#84cc16',
                    '#22c55e',
                    '#3b82f6',
                    '#10b981'
                ],
                borderRadius: 8,
                barThickness: 16
            }]
        },
        plugins: [animatedValueLabelsPlugin],
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { left: 10, right: 50, top: 10, bottom: 10 }
            },
            animation: {
                duration: 1600,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.raw} Gram Toplam Araç Karbon Salınımı`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { font: { family: 'Inter', weight: '700' } },
                    grid: { color: '#f1f5f9' }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { family: 'Inter', weight: '700' } }
                }
            }
        }
    });

    const ctx2 = document.getElementById('hourlyChart').getContext('2d');
    hourlyChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ["06:00", "07:00", "08:00 (Yoğun)", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00 (Yoğun)", "19:00", "20:00", "21:00", "22:00", "23:00", "24:00"],
            datasets: [{
                label: 'Saatlik Filo CO2 Salınımı (kg CO2 / saat)',
                data: [120, 380, 490, 340, 220, 190, 260, 240, 210, 230, 310, 440, 520, 410, 280, 180, 110, 60, 30],
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#ea580c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { left: 10, right: 20, top: 15, bottom: 10 }
            },
            animation: {
                duration: 1800,
                easing: 'easeInOutQuad'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` Saat ${ctx.label}: ${ctx.raw} kg Toplam Şehir Otobüs Karbonu`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Filo CO2 (kg/Saat)', font: { weight: '800', family: 'Inter', size: 12 } },
                    ticks: { font: { family: 'Inter', weight: '700' } },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { weight: '700', family: 'Inter' } }
                }
            }
        }
    });
}

function updateCO2Charts(distanceKm, trafficPct) {
    if (!co2Chart || !hourlyChart) return;
    const dist = distanceKm || 5.0;
    const pct = trafficPct || 38;

    const trafficFactor = 1.0 + (pct / 250.0);
    const values = [
        Math.round(220.0 * dist * trafficFactor),  // Özel otomobil
        Math.round(390.0 * dist * trafficFactor),  // MAN Körüklü
        Math.round(265.0 * dist * trafficFactor),  // MAN Solo
        Math.round(210.0 * dist * trafficFactor),  // Otokar 10M
        Math.round(195.0 * dist * trafficFactor),  // Otokar 9M
        Math.round(145.0 * dist * trafficFactor),  // Temsa Prestij
        Math.round(90.0 * dist * trafficFactor),   // Tramvay
        0.0                                         // 18M Elektrikli
    ];

    co2Chart.data.datasets[0].data = values;
    co2Chart.update();

    const scale = (dist / 5.0);
    const baseCurve = [120, 380, 490, 340, 220, 190, 260, 240, 210, 230, 310, 440, 520, 410, 280, 180, 110, 60, 30];
    const scaledCurve = baseCurve.map(v => Math.round(v * scale));

    hourlyChart.data.datasets[0].data = scaledCurve;
    hourlyChart.update();
}

async function loadAccessibilityServices() {
    try {
        const res = await fetch('/api/accessibility-services');
        const json = await res.json();
        if (json.success && json.data) {
            accessibilityServicesList = json.data;
        }
    } catch (e) {
        console.error("Error fetching accessibility services:", e);
    }
}

async function toggleAccessibilityMapLayer() {
    isAccessibilityVisible = !isAccessibilityVisible;
    const btn = document.getElementById('btn-accessibility-layer');
    
    if (isAccessibilityVisible) {
        if (btn) btn.style.background = 'linear-gradient(135deg, #059669, #047857)';
        await loadAndRenderAccessibilityMarkers();
    } else {
        if (btn) btn.style.background = 'linear-gradient(135deg, #0d9488, #0f766e)';
        clearAccessibilityMarkers();
    }
}

async function loadAndRenderAccessibilityMarkers() {
    try {
        const res = await fetch('/api/accessibility-services');
        const json = await res.json();

        if (json.success && json.data) {
            accessibilityServicesList = json.data;
            clearAccessibilityMarkers();

            json.data.forEach((srv) => {
                const isCharge = srv.charging_station;
                const iconSymbol = isCharge ? 'fa-bolt-lightning' : 'fa-wheelchair';
                const badgeBg = isCharge ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #0d9488, #0f766e)';

                const customIcon = L.divIcon({
                    className: 'accessibility-marker-icon',
                    html: `<div style="background: ${badgeBg}; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.45);"><i class="fa-solid ${iconSymbol}"></i></div>`,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                });

                const marker = L.marker([srv.lat, srv.lng], { icon: customIcon })
                    .bindPopup(`
                        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 220px;">
                            <div style="font-weight: 800; color: #0f766e; font-size: 0.95rem; margin-bottom: 4px;">
                                <i class="fa-solid ${iconSymbol}"></i> ${srv.name}
                            </div>
                            <div style="font-size: 0.8rem; color: #475569; font-weight: 700; margin-bottom: 6px;">
                                📍 ${srv.district || 'Gaziantep'} • ${srv.type}
                            </div>
                            <div style="font-size: 0.78rem; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 8px; border-radius: 8px; color: #16a34a; line-height: 1.45;">
                                <strong>Hizmet & Erişilebilirlik:</strong><br>${srv.services}
                            </div>
                            <div style="font-size: 0.75rem; margin-top: 6px; color: #059669; font-weight: 800;">
                                ${srv.status || 'Aktif / Hizmette 🟢'}
                            </div>
                        </div>
                    `)
                    .addTo(map);

                accessibilityMarkers.push(marker);
            });
        }
    } catch (err) {
        console.error("Error loading accessibility markers:", err);
    }
}

function clearAccessibilityMarkers() {
    accessibilityMarkers.forEach(m => map.removeLayer(m));
    accessibilityMarkers = [];
}

function downloadAccessibilityCSV() {
    if (!accessibilityServicesList || accessibilityServicesList.length === 0) {
        accessibilityServicesList = [
            {"id": "HZT01", "name": "Gaziantep BŞB Engelsiz Yaşam Merkezi", "district": "Şahinbey", "lat": 37.0450, "lng": 37.3380, "type": "Engelli Hizmet & Koordinasyon Merkezi", "charging_station": true, "has_ramp": true, "has_elevator": true, "services": "Akülü Sandalye Şarj Ünitesi, Medikal Bakım", "status": "Aktif / Hizmette 🟢"},
            {"id": "HZT02", "name": "Sanko Park Engelli Hizmet & Şarj Noktası", "district": "Şehitkamil", "lat": 37.0655, "lng": 37.3685, "type": "Akülü Sandalye Şarj & Erişilebilir Durak", "charging_station": true, "has_ramp": true, "has_elevator": true, "services": "Hızlı Şarj Ünitesi (24V DC), Asansörlü Biniş", "status": "Aktif / Hizmette 🟢"},
            {"id": "HZT04", "name": "Gaziantep Gar Banliyö & Tramvay Engelsiz Aktarma Merkezi", "district": "Şehitkamil", "lat": 37.0738, "lng": 37.3827, "type": "Asansörlü & Rampalı Ana Aktarma Istasyonu", "charging_station": true, "has_ramp": true, "has_elevator": true, "services": "Panoramik Asansörler, Dokunsal Harita", "status": "Aktif / Hizmette 🟢"}
        ];
    }
    let csv = "Nokta ID,Nokta Adı,İlçe,Enlem,Boylam,Tür,Şarj Ünitesi Var mı,Rampa Var mı,Asansör Var mı,Hizmet Detayları,Durum\n";
    accessibilityServicesList.forEach(s => {
        csv += `"${s.id}","${s.name}","${s.district || 'Gaziantep'}",${s.lat},${s.lng},"${s.type}",${s.charging_station ? 'EVET' : 'HAYIR'},${s.has_ramp ? 'EVET' : 'HAYIR'},${s.has_elevator ? 'EVET' : 'HAYIR'},"${s.services}","${s.status || 'Aktif'}"\n`;
    });
    triggerCSVDownload("Gaziantep_Engelsiz_Ulasim_Erisilebilirlik_Veri_Seti.csv", csv);
}
