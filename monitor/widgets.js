const WIDGETS = {
    "w_billing_stat": { title: "Billing Status", w: 4, h: 4, type: 'chart', api: 'billing_status', hasFilters: true, filterType: 'bgy_only', param: 'status' },
    "w_expenses":     { title: "Expenses", w: 4, h: 4, type: 'chart', api: 'expenses_mon', hasFilters: true, filterType: 'toggle_today', param: 'cat' },
    "w_pay_methods":  { title: "Payment Methods", w: 4, h: 4, type: 'chart', api: 'pay_method_mon', hasFilters: true, filterType: 'toggle_today', param: 'method' },
    "w_jo_queue":     { title: "JO Queue", w: 4, h: 5, type: 'chart', api: 'queue_mon', hasFilters: true, filterType: 'toggle_today', param: 'jo' },
    "w_so_queue":     { title: "SO Queue", w: 4, h: 5, type: 'chart', api: 'queue_mon', hasFilters: true, filterType: 'toggle_today', param: 'so' },
    "w_app_map":      { title: "Application Map", w: 6, h: 6, type: 'map', api: 'app_map', hasFilters: true, filterType: 'date_bgy', param: 'map' },
    "w_online_stat":  { title: "Online Status", w: 4, h: 4, type: 'chart', api: 'online_status', hasFilters: false, param: 'status' },
    "w_app_mon":      { title: "Application Monitoring", w: 4, h: 4, type: 'chart', api: 'app_status', hasFilters: true, filterType: 'date_bgy', param: 'status' },
    "w_so_support":   { title: "SO Support Status", w: 4, h: 4, type: 'chart', api: 'so_status', hasFilters: true, filterType: 'date_bgy', param: 'support' },
    "w_so_visit":     { title: "SO Visit Status", w: 4, h: 4, type: 'chart', api: 'so_status', hasFilters: true, filterType: 'date_bgy', param: 'visit' },
    "w_jo_onsite":    { title: "JO Onsite Status", w: 4, h: 4, type: 'chart', api: 'jo_status', hasFilters: true, filterType: 'date_bgy', param: 'onsite' },
    "w_jo_tech":      { title: "JO Tech Performance", w: 8, h: 5, type: 'chart', api: 'tech_mon_jo', hasFilters: true, filterType: 'toggle_today', param: 'jo' },
    "w_so_tech":      { title: "SO Tech Performance", w: 8, h: 5, type: 'chart', api: 'tech_mon_so', hasFilters: true, filterType: 'toggle_today', param: 'so' },
    "w_jo_refer":     { title: "JO Refer Rank", w: 4, h: 5, type: 'chart', api: 'jo_refer_rank', hasFilters: true, filterType: 'toggle_today', param: 'refer' },
    "w_inv_stat":     { title: "Invoice Status", w: 6, h: 5, type: 'chart', api: 'invoice_mon', hasFilters: true, filterType: 'year', param: 'count' },
    "w_inv_amt":      { title: "Invoice Revenue", w: 6, h: 5, type: 'chart', api: 'invoice_mon', hasFilters: true, filterType: 'year', param: 'amount' },
    "w_inv_overall":  { title: "Invoice (Overall)", w: 4, h: 4, type: 'chart', api: 'invoice_overall', hasFilters: false, param: 'status' },
    "w_trans_stat":   { title: "Transactions (#)", w: 6, h: 5, type: 'chart', api: 'transactions_mon', hasFilters: true, filterType: 'year', param: 'count' },
    "w_trans_amt":    { title: "Transactions (Amt)", w: 6, h: 5, type: 'chart', api: 'transactions_mon', hasFilters: true, filterType: 'year', param: 'amount' },
    "w_portal_stat":  { title: "Portal Logs (#)", w: 6, h: 5, type: 'chart', api: 'portal_mon', hasFilters: true, filterType: 'year', param: 'count' },
    "w_portal_amt":   { title: "Portal Logs (Amt)", w: 6, h: 5, type: 'chart', api: 'portal_mon', hasFilters: true, filterType: 'year', param: 'amount' }
};

window.chartInstances = {};
window.mapInstances = {};
window.queryLogs = [];

function logQuery(id, status, details) {
    const entry = { time: new Date().toLocaleTimeString(), id, status, details };
    window.queryLogs.unshift(entry);
    if(window.queryLogs.length > 50) window.queryLogs.pop();
    updateLogModal();
}

function updateLogModal() {
    const container = document.getElementById('logContent');
    if(!container) return;
    let html = '<table class="table table-sm table-dark text-start" style="font-size:0.75rem;"><thead><tr><th>Time</th><th>Widget</th><th>Status</th><th>Details</th></tr></thead><tbody>';
    window.queryLogs.forEach((l, index) => {
        let color = l.status === 'error' ? 'text-danger' : (l.status === 'empty' ? 'text-warning' : 'text-success');
        html += `<tr><td>${l.time}</td><td>${l.id}</td><td class="${color}">${l.status}</td><td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${l.details}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

window.getWidgetSettings = function(id) {
    let filters = {};
    if(document.getElementById(`${id}_scope`)) filters.scope = document.getElementById(`${id}_scope`).checked ? 'today' : 'overall';
    if(document.getElementById(`${id}_start`)) filters.start = document.getElementById(`${id}_start`).value;
    if(document.getElementById(`${id}_end`)) filters.end = document.getElementById(`${id}_end`).value;
    if(document.getElementById(`${id}_year`)) filters.year = document.getElementById(`${id}_year`).value;
    if(document.getElementById(`${id}_bgy`)) filters.bgy = document.getElementById(`${id}_bgy`).value;
    
    let wrapper = document.getElementById(`scale_wrapper_${id}`);
    let fontSize = wrapper ? wrapper.style.fontSize : '';
    let header = document.getElementById(`header_${id}`);
    let align = header ? header.style.textAlign : 'left';
    let root = document.getElementById(`widget_root_${id}`);
    let isPct = root ? root.getAttribute('data-pct') : 'false';
    
    let activeViewBtn = document.querySelector(`.grid-stack-item[gs-id="${id}"] .view-btn.active`);
    let viewType = 'bar';
    if(activeViewBtn) {
        let match = activeViewBtn.getAttribute('onclick').match(/'([^']+)'\)/);
        if(match) viewType = match[1];
    }
    return { fontSize, align, viewType, isPct, filters };
};

window.applyWidgetSettings = function(id, settings) {
    if(!settings) return;
    if(settings.fontSize) document.getElementById(`scale_wrapper_${id}`).style.fontSize = settings.fontSize;
    if(settings.align) window.alignTitle(id, settings.align);
    if(settings.isPct === 'true' || settings.isPct === true) {
        let root = document.getElementById(`widget_root_${id}`);
        root.setAttribute('data-pct', 'true');
        let btn = document.getElementById(`btn_pct_${id}`);
        if(btn) btn.classList.add('active', 'text-warning');
    }
    if(settings.filters) {
        let scopeToggle = document.getElementById(`${id}_scope`);
        if(scopeToggle && settings.filters.scope) scopeToggle.checked = (settings.filters.scope === 'today');
        
        if(settings.filters.start && document.getElementById(`${id}_start`)) document.getElementById(`${id}_start`).value = settings.filters.start;
        if(settings.filters.end && document.getElementById(`${id}_end`)) document.getElementById(`${id}_end`).value = settings.filters.end;
        if(settings.filters.year && document.getElementById(`${id}_year`)) document.getElementById(`${id}_year`).value = settings.filters.year;
        if(settings.filters.bgy && document.getElementById(`${id}_bgy`)) {
            let bgySelect = document.getElementById(`${id}_bgy`);
            bgySelect.setAttribute('data-saved-val', settings.filters.bgy);
            bgySelect.value = settings.filters.bgy;
        }
    }
    if(settings.viewType) {
        let container = document.querySelector(`.grid-stack-item[gs-id="${id}"]`);
        if(container) {
            container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            let targetBtn = container.querySelector(`.view-btn[onclick*="${settings.viewType}"]`);
            if(targetBtn) targetBtn.classList.add('active');
        }
    }
};

function buildWidgetHTML(id) {
    let def = WIDGETS[id];
    let controls = '', filters = '', inner = '';

    controls = `<div class="widget-controls-footer">`;
    if(def.type === 'chart') {
        controls += `
        <button class="ctrl-btn view-btn active" onclick="switchView('${id}', 'bar')"><i class="fas fa-chart-bar"></i></button>
        <button class="ctrl-btn view-btn" onclick="switchView('${id}', 'line')"><i class="fas fa-chart-line"></i></button>
        <button class="ctrl-btn view-btn" onclick="switchView('${id}', 'pie')"><i class="fas fa-chart-pie"></i></button>
        <button class="ctrl-btn view-btn" onclick="switchView('${id}', 'list')"><i class="fas fa-th-large"></i></button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn view-btn" id="btn_pct_${id}" onclick="togglePercent('${id}')" title="Toggle %"><i class="fas fa-percentage"></i></button>
        <div class="ctrl-sep"></div>`;
    }
    controls += `
        <button class="ctrl-btn" onclick="alignTitle('${id}', 'start')"><i class="fas fa-align-left"></i></button>
        <button class="ctrl-btn" onclick="alignTitle('${id}', 'center')"><i class="fas fa-align-center"></i></button>
        <button class="ctrl-btn" onclick="alignTitle('${id}', 'end')"><i class="fas fa-align-right"></i></button>
        <div class="ctrl-sep"></div>
        <button class="ctrl-btn" onclick="resizeFont('${id}', 1)"><i class="fas fa-plus"></i></button>
        <button class="ctrl-btn" onclick="resizeFont('${id}', -1)"><i class="fas fa-minus"></i></button>
        <div class="ctrl-sep"></div>
        <div class="ctrl-btn drag-handle"><i class="fas fa-arrows-alt"></i></div>
    </div>`;

    if(def.hasFilters) {
        let filterHtml = '<div class="widget-filters d-flex gap-2 align-items-center" style="margin-left:auto;">';
        
        if(def.filterType === 'toggle_today' || def.filterType === 'date' || def.filterType === 'date_bgy') {
            filterHtml += `
            <div class="form-check form-switch m-0" title="Toggle Today vs Overall">
                <input class="form-check-input" type="checkbox" role="switch" id="${id}_scope" onchange="refreshWidget('${id}')">
                <label class="form-check-label small" for="${id}_scope">Today</label>
            </div>`;
        }
        
        if(def.filterType === 'date' || def.filterType === 'date_bgy') {
            filterHtml += `
            <div id="${id}_date_inputs" class="d-none">
                <input type="datetime-local" id="${id}_start">
                <input type="datetime-local" id="${id}_end">
            </div>`;
        }

        if(def.filterType === 'year') {
            let y = new Date().getFullYear();
            filterHtml += `<select id="${id}_year" onchange="refreshWidget('${id}')"><option value="${y}">${y}</option><option value="${y-1}">${y-1}</option></select>`;
        }
        if(def.filterType === 'bgy_only' || def.filterType === 'date_bgy') {
            filterHtml += `<select id="${id}_bgy" class="bgy-select" onchange="refreshWidget('${id}')"><option value="All">All Brgy</option></select>`;
        }
        filters = filterHtml + '</div>';
    }

    if(def.type === 'map') {
        inner = `
        <div style="flex: 1 1 auto; position: relative; width: 100%; min-height: 200px; overflow: hidden;">
             <div id="map_${id}" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; z-index: 1;"></div>
             <div id="msg_${id}" class="no-data-msg" style="display:none; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 2;">No Data</div>
        </div>`;
    } else {
        inner = `
        <div class="chart-container flex-grow-1" style="position:relative; min-height:0; padding-bottom: 35px;" id="container_${id}_chart"><canvas id="canvas_${id}"></canvas></div>
        <div class="table-container flex-grow-1" id="container_${id}_list" style="display:none; overflow-y:auto; padding:10px; padding-bottom: 40px;"></div>
        <div id="msg_${id}" class="no-data-msg" style="display:none;">No Data</div>`;
    }

    return `
    <div class="h-100 d-flex flex-column position-relative" id="widget_root_${id}" data-pct="false">
        <div class="widget-scale-wrapper h-100 d-flex flex-column" id="scale_wrapper_${id}" style="font-size: 14px;">
            <div class="widget-header" id="header_${id}" style="flex: 0 0 auto;">
                <h6 class="widget-title" id="title_${id}" style="margin-right:5px; white-space:nowrap;">${def.title}</h6>
                ${filters}
            </div>
            ${inner}
            ${controls} 
        </div>
    </div>`;
}

window.refreshWidget = function(id) {
    let def = WIDGETS[id];
    let params = `action=${def.api}&param=${def.param}`;
    
    if(def.hasFilters) {
        let scopeEl = document.getElementById(id+'_scope');
        if(scopeEl) {
            params += `&scope=` + (scopeEl.checked ? 'today' : 'overall');
        }
        
        let y = document.getElementById(id+'_year'); if(y) params += `&year=${y.value}`;
        let b = document.getElementById(id+'_bgy'); if(b) params += `&bgy=${b.value}`;
    }

    fetch(`api.php?${params}`).then(r => r.json()).then(response => {
        const res = response.data;
        logQuery(id, response.status, response.message || 'Success');
        const msgDiv = document.getElementById(`msg_${id}`);

        if(response.barangays && document.querySelector('.bgy-select')) {
            document.querySelectorAll('.bgy-select').forEach(sel => {
                if(sel.options.length === 1) {
                    response.barangays.forEach(b => sel.add(new Option(b.Name, b.Name)));
                    let saved = sel.getAttribute('data-saved-val'); 
                    if(saved) { sel.value = saved; sel.removeAttribute('data-saved-val'); }
                }
            });
        }

        if(response.status === 'empty' || !res || res.length === 0) {
            if(def.type === 'chart') {
                document.getElementById(`container_${id}_chart`).style.display = 'none'; 
                document.getElementById(`container_${id}_list`).style.display = 'none'; 
                if(window.chartInstances[id]) window.chartInstances[id].destroy();
            }
            msgDiv.style.display = 'block'; 
            return;
        }
        msgDiv.style.display = 'none';

        if(def.type === 'map') { initMap(id, res); return; }

        const chartDiv = document.getElementById(`container_${id}_chart`);
        const listDiv = document.getElementById(`container_${id}_list`);
        const isCurrency = (id === 'w_inv_amt' || id === 'w_trans_amt' || id === 'w_portal_amt' || id === 'w_expenses' || id === 'w_pay_methods');
        const isPct = document.getElementById(`widget_root_${id}`).getAttribute('data-pct') === 'true';
        const fmt = (num, total) => {
            if(isPct && total > 0) return ((num/total)*100).toFixed(1) + '%';
            if(isCurrency) return '₱ ' + parseFloat(num).toLocaleString('en-PH', {minimumFractionDigits: 2});
            return num;
        };

        let labels = [], datasets = [];

        if(!res[0].series) {
            labels = res.map(i => i.label);
            let total = res.reduce((a,b) => a + parseFloat(b.value), 0);
            datasets = [{ label: isCurrency ? 'Amount' : 'Count', data: res.map(i => i.value), backgroundColor: generateColors(res.length), borderWidth:0 }];
            
            let html = '<div class="d-flex flex-wrap gap-2" style="width:100%;">';
            res.forEach(row => {
                html += `<div class="data-card" style="flex-grow:1; flex-basis:100px; background:var(--inner-card-bg, rgba(255,255,255,0.05)); color:inherit; border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:8px; text-align:center;"><div style="font-size:0.7em; opacity:0.7;" title="${row.label}">${row.label}</div><div style="font-size:1.4em; font-weight:700; color:var(--app-accent);">${fmt(row.value, total)}</div></div>`;
            });
            listDiv.innerHTML = html + '</div>';
        } else {
            labels = res.map(i => i.label);
            let keys = Array.from(new Set(res.flatMap(r => Object.keys(r.series))));
            res.forEach(r => { r.total = Object.values(r.series).reduce((a,b)=>a+parseFloat(b),0); });
            keys.forEach((k, idx) => {
                datasets.push({ label: k, data: res.map(r => r.series[k] || 0), backgroundColor: getSeriesColor(k, idx), borderWidth:0 });
            });
            let html = '<div class="d-flex flex-column gap-2">';
            res.forEach(row => {
                html += `<div class="group-card" style="background:var(--inner-card-bg, rgba(255,255,255,0.05)); color:inherit; border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:10px;"><div style="font-size:0.9em; font-weight:bold; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:5px;">${row.label}</div><div class="d-flex flex-wrap gap-2">`;
                keys.forEach(k => { if(row.series[k] > 0) { html += `<div style="flex-grow:1; background:rgba(0,0,0,0.2); padding:5px; text-align:center; border-radius:4px;"><div style="font-size:0.6em; opacity:0.7;">${k}</div><div style="font-size:1em; font-weight:bold;">${fmt(row.series[k], row.total)}</div></div>`; }});
                html += `</div></div>`;
            });
            listDiv.innerHTML = html + '</div>';
        }

        let viewType = document.querySelector(`.grid-stack-item[gs-id="${id}"] .view-btn.active`)?.getAttribute('onclick').match(/'([^']+)'\)/)[1] || 'bar';
        if(viewType === 'list') { chartDiv.style.display = 'none'; listDiv.style.display = 'block'; } 
        else {
            listDiv.style.display = 'none'; chartDiv.style.display = 'block';
            if(window.chartInstances[id]) window.chartInstances[id].destroy();
            let ctx = document.getElementById(`canvas_${id}`).getContext('2d');
            
            let chartOpts = { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#999', boxWidth: 12 } }, 
                    tooltip: { callbacks: { label: (c) => { let val = c.raw; if(isCurrency) val = '₱ ' + parseFloat(val).toLocaleString('en-PH', {minimumFractionDigits: 2}); return c.dataset.label + ': ' + val; }}}
                } 
            };
            
            if(viewType !== 'pie' && viewType !== 'doughnut') {
                chartOpts.scales = { x: { stacked: true, ticks: { color: '#999' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { stacked: true, ticks: { color: '#999' }, grid: { color: 'rgba(255,255,255,0.05)' } } };
            }

            window.chartInstances[id] = new Chart(ctx, {
                type: viewType,
                data: { labels: labels, datasets: datasets },
                options: chartOpts
            });
        }
    }).catch(err => { console.error(err); logQuery(id, 'error', err.message); });
};

function initMap(id, data) {
    let container = document.getElementById(`map_${id}`);
    if(!container) return; 

    if(window.mapInstances[id]) { 
        window.mapInstances[id].off();
        window.mapInstances[id].remove(); 
    }
    
    if (container.offsetHeight === 0) {
        setTimeout(() => initMap(id, data), 100);
        return;
    }

    let map = L.map(container).setView([14.5995, 120.9842], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

    let bounds = [];
    data.forEach(p => {
        if(p.coords) {
            let [lat, lng] = p.coords.split(',').map(s => parseFloat(s.trim()));
            if(!isNaN(lat) && !isNaN(lng)) {
                let marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`<b>${p.name}</b><br>${p.plan}<br>${p.bgy}`);
                bounds.push([lat, lng]);
            }
        }
    });

    if(bounds.length > 0) map.fitBounds(bounds);
    window.mapInstances[id] = map;

    const resizeObserver = new ResizeObserver(() => { map.invalidateSize(); });
    const widgetRoot = document.getElementById(`widget_root_${id}`);
    if(widgetRoot) resizeObserver.observe(widgetRoot);
    setTimeout(() => { map.invalidateSize(); }, 300);
}

window.togglePercent = function(id) { let r = document.getElementById(`widget_root_${id}`); let s = r.getAttribute('data-pct') === 'true'; r.setAttribute('data-pct', !s); let b = document.getElementById(`btn_pct_${id}`); if(!s) b.classList.add('active','text-warning'); else b.classList.remove('active','text-warning'); refreshWidget(id); };
window.alignTitle = function(id, a) { document.getElementById(`header_${id}`).style.justifyContent = a === 'center' ? 'center' : (a === 'end' ? 'flex-end' : 'flex-start'); document.getElementById(`header_${id}`).style.textAlign = a; };
window.resizeFont = function(id, d) { let w = document.getElementById(`scale_wrapper_${id}`); let c = parseInt(window.getComputedStyle(w).fontSize); w.style.fontSize = (c + d) + 'px'; };
window.switchView = function(id, type) { let c = document.querySelector(`.grid-stack-item[gs-id="${id}"]`); if(!c) return; c.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); c.querySelector(`.view-btn[onclick*="${type}"]`)?.classList.add('active'); refreshWidget(id); };
function generateColors(c) { const p = ['#0d6efd','#6610f2','#6f42c1','#d63384','#dc3545','#fd7e14','#ffc107','#198754','#20c997','#0dcaf0']; let r=[]; for(let i=0; i<c; i++) r.push(p[i%p.length]); return r; }
function getSeriesColor(k, i) { return generateColors(i+5)[i]; }
