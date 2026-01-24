<?php require 'auth.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Monitor</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/gridstack@7.2.3/dist/gridstack.min.css" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    
    <style>
        :root { --app-accent: #0d6efd; }
        body { font-family: 'Inter', sans-serif; background-color: #0f1012; color: #e0e0e0; overflow-x: hidden; transition: background 0.3s; }
        
        .navbar { padding: 0.5rem 1rem; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 1000; background-color: #212529; transition: all 0.3s; }
        body.fullscreen-mode nav { display: none !important; }
        body.fullscreen-mode .container-fluid { padding-top: 15px !important; }
        .nav-controls { display: flex; align-items: center; gap: 8px; }
        .navbar-brand img { max-height: 40px; margin-right: 10px; }
        .powered-by { font-size: 0.6rem; letter-spacing: 1px; color: #6c757d; margin-top: -5px; display: block; margin-left: 55px; text-transform: uppercase;}
        
        .grid-stack-item-content { background-color: #1e1e1e; color: #ffffff; border: 1px solid #333; border-left: 4px solid var(--app-accent); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); padding: 15px; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s; position: relative; }
        
        .widget-controls-footer { position: absolute; bottom: 5px; left: 5px; display: flex; align-items: center; gap: 2px; z-index: 1000; opacity: 0; transition: opacity 0.2s ease-in-out; background: rgba(0, 0, 0, 0.7); border-radius: 4px; padding: 3px 5px; }
        .grid-stack-item-content:hover .widget-controls-footer { opacity: 1; }
        .ctrl-btn { background: transparent; border: none; color: #fff; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; border-radius: 3px; }
        .ctrl-btn:hover { background-color: rgba(255,255,255,0.3); }
        .ctrl-btn.active { color: var(--app-accent); background-color: rgba(255,255,255,0.1); }
        .ctrl-sep { width: 1px; background-color: #555; height: 16px; margin: 0 4px; }

        .widget-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 10px; min-height: 28px; width: 100%; position: sticky; top: 0; z-index: 10; background-color: transparent; padding-bottom: 5px; border-radius: 4px; padding-left: 2px; padding-right: 2px; }
        .widget-title { font-size: 1.1em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; color: var(--app-accent); }
        .widget-filters select { background-color: rgba(255,255,255,0.08); color: inherit; border: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem; padding: 2px; border-radius: 4px; max-width: 90px; }
        .no-data-msg { width: 100%; text-align: center; margin-top: 20px; color: #666; font-style: italic; font-size: 0.9rem; }

        body.light-mode { background-color: #f4f6f9; color: #212529; }
        body.light-mode .grid-stack-item-content { background-color: #fff; color: #333; border: 1px solid #ddd; border-left: 4px solid var(--app-accent); }
        body.light-mode .widget-filters select { background-color: #eee; border-color: #ccc; color: #333; }
        body.light-mode .widget-controls-footer { background: rgba(0,0,0,0.1); }
        body.light-mode .ctrl-btn { color: #333; }
        body.light-mode .widget-header { background-color: transparent; }

        #contextMenu { display: none; position: absolute; z-index: 9999; background-color: #2c2c2c; border: 1px solid #444; color: white; border-radius: 6px; padding: 10px; width: 260px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        .color-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; }
        #toast { position: fixed; bottom: 20px; left: 20px; background: rgba(13, 110, 253, 0.2); color: #0d6efd; padding: 8px 15px; border-radius: 20px; font-size: 0.8rem; opacity: 0; transition: opacity 0.5s; pointer-events: none; border: 1px solid rgba(13, 110, 253, 0.3); z-index: 2000; }
    </style>
</head>
<body>

<div id="toast"><i class="fas fa-sync-alt fa-spin me-2"></i>Data Updated</div>

<div id="contextMenu">
    <div class="mb-2">
        <label class="small text-muted mb-1">Rename Widget</label>
        <div class="input-group input-group-sm">
            <input type="text" id="renameInput" class="form-control bg-secondary text-white border-0">
            <button class="btn btn-primary" onclick="applyRename()"><i class="fas fa-check"></i></button>
        </div>
    </div>
    <hr class="my-2 border-secondary">
    <div class="color-row"><span>Accent Color</span><input type="color" id="accentColorPicker" class="form-control form-control-color form-control-sm"></div>
    <div class="color-row"><span>Box Background</span><input type="color" id="bgColorPicker" class="form-control form-control-color form-control-sm"></div>
    <div class="color-row"><span>Header Background</span><input type="color" id="headerColorPicker" class="form-control form-control-color form-control-sm"></div>
    <div class="color-row"><span>Inner Card Color</span><input type="color" id="innerCardColorPicker" class="form-control form-control-color form-control-sm"></div>
    
    <div class="color-row"><button class="btn btn-sm btn-outline-secondary w-100" onclick="resetWidgetColor()">Reset Styles</button></div>
    <hr class="my-2 border-secondary">
    <div class="color-row" onclick="hideTargetWidget()" style="cursor: pointer;"><span class="text-danger"><i class="fas fa-eye-slash me-2"></i> Hide Widget</span></div>
</div>

<nav class="navbar navbar-expand-lg navbar-dark" id="mainNav">
    <div class="container-fluid">
        <div class="d-flex flex-column">
            <a class="navbar-brand fw-bold text-accent d-flex align-items-center" href="#">
                <img src="logo.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                <i class="fas fa-satellite-dish fa-lg me-2" style="display:none;"></i> 
                <span>Live Monitor</span>
                <span id="currentTemplateLabel" class="badge bg-secondary ms-2" style="font-size:0.6em; display:none; vertical-align: middle;"></span>
            </a>
            <span class="powered-by">POWERED BY: SYNC</span>
        </div>
        
        <div class="nav-controls">
            <div class="d-none d-md-block text-secondary small me-2">Updated: <span id="lastUpdatedTime">--:--:--</span></div>
            
            <div class="dropdown">
                <button class="btn btn-outline-warning btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Templates"><i class="fas fa-save"></i></button>
                <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark">
                    <li><a class="dropdown-item" href="#" onclick="handleSaveAction()"><i class="fas fa-save me-2"></i>Save View</a></li>
                    <li><a class="dropdown-item" href="#" onclick="openLoadTemplateModal()"><i class="fas fa-folder-open me-2"></i>Manage Templates</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="resetLayout()"><i class="fas fa-trash-alt me-2"></i>Reset Everything</a></li>
                </ul>
            </div>

            <button class="btn btn-outline-info btn-sm" data-bs-toggle="modal" data-bs-target="#logModal" title="Query Logs"><i class="fas fa-terminal"></i></button>

            <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="modal" data-bs-target="#settingsModal" title="Settings"><i class="fas fa-cog"></i></button>
            
            <button class="btn btn-outline-secondary btn-sm" onclick="toggleTheme()" title="Toggle Theme"><i class="fas fa-sun"></i></button>
            
            <button class="btn btn-outline-primary btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#widgetSidebar">
                <i class="fas fa-th-large me-1"></i> Widgets
            </button>
            
            <button class="btn btn-primary btn-sm" onclick="toggleFullScreen()"><i class="fas fa-expand"></i></button>
        </div>
    </div>
</nav>

<div class="offcanvas offcanvas-end bg-dark text-white" tabindex="-1" id="widgetSidebar">
  <div class="offcanvas-header border-bottom border-secondary">
    <h5 class="offcanvas-title">Dashboard Widgets</h5>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
  </div>
  <div class="offcanvas-body">
    <p class="small text-muted">Toggle switches to add or remove widgets from your current view.</p>
    <div id="toggleList" class="d-flex flex-column gap-2"></div>
  </div>
</div>

<div class="modal fade" id="settingsModal" tabindex="-1">
    <div class="modal-dialog modal-sm">
        <div class="modal-content bg-dark text-white">
            <div class="modal-header border-secondary"><h6 class="modal-title">Settings</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
                <div class="mb-3"><label class="form-label small text-muted">Global Theme Color</label><input type="color" class="form-control form-control-color w-100" id="globalColorPicker" value="#0d6efd"></div>
                <button class="btn btn-primary btn-sm w-100" onclick="saveAndApplyView()">Save View Locally</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="saveTemplateModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary"><h6 class="modal-title">Save Template</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
                <div id="saveOptions" class="d-none mb-3">
                    <p class="text-info small mb-2"><i class="fas fa-info-circle"></i> A template is currently loaded.</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-success" onclick="updateCurrentTemplate()">Update Existing (<span id="existingNameDisplay"></span>)</button>
                        <button class="btn btn-outline-light" onclick="showNewInput()">Save as New</button>
                    </div>
                    <hr class="border-secondary">
                </div>
                <div id="newSaveInput">
                    <label class="form-label">Template Name</label>
                    <input type="text" id="templateNameInput" class="form-control bg-secondary text-white border-0" placeholder="e.g. Sales Dashboard">
                    <div class="form-text text-muted">Saves: Layout, Widget Settings (Filters, Graph Types, Fonts), and Colors.</div>
                </div>
            </div>
            <div class="modal-footer border-secondary" id="newSaveFooter">
                <button type="button" class="btn btn-primary" onclick="saveNewTemplate()">Save to Database</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="loadTemplateModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary"><h6 class="modal-title">Load Template</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body p-0">
                <div id="templateList" class="list-group list-group-flush"></div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="logModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content bg-dark text-white border-secondary">
            <div class="modal-header border-secondary">
                <h6 class="modal-title">System Logs</h6>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
                <div id="logContent" style="height: 400px; overflow-y: auto; padding: 10px;"></div>
            </div>
        </div>
    </div>
</div>

<div class="container-fluid pt-3">
    <div class="grid-stack"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gridstack@7.2.3/dist/gridstack-all.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="widgets.js?v=<?php echo time(); ?>"></script>

<script>
    window.grid = null; 
    window.targetId = null; 
    
    let currentTemplateId = localStorage.getItem('monitor_template_id') || null;
    let currentTemplateName = localStorage.getItem('monitor_template_name') || null;
    let savedStyles = JSON.parse(localStorage.getItem('monitor_styles')) || {};
    let savedLayout = JSON.parse(localStorage.getItem('monitor_layout_v14'));
    let savedGlobal = localStorage.getItem('monitor_global_color') || '#0d6efd';
    let savedTheme = localStorage.getItem('monitor_theme') || 'dark';

    document.addEventListener('DOMContentLoaded', function() {
        window.grid = GridStack.init({ cellHeight: 70, margin: 8, handle: '.drag-handle', animate: true, float: true });
        applyGlobalSettings(savedGlobal, savedTheme);
        renderWidgets();
        updateTemplateLabel(); 
        setTimeout(initAll, 500); 
        setInterval(initAll, 15000);
        setupContextMenu();
        setupColorPickers();
    });

    function applyGlobalSettings(color, theme) {
        document.documentElement.style.setProperty('--app-accent', color);
        document.getElementById('globalColorPicker').value = color;
        setLightTheme(theme === 'light');
    }

    function renderWidgets() {
        let layout = savedLayout || [
            {id: 'w_billing_stat', x: 0, y: 0, w: 4, h: 4}, 
            {id: 'w_online_stat', x: 4, y: 0, w: 4, h: 4}, 
            {id: 'w_expenses', x: 8, y: 0, w: 4, h: 4}
        ];

        layout.forEach(node => {
            if (WIDGETS[node.id]) {
                window.grid.addWidget({ id: node.id, x: node.x, y: node.y, w: node.w, h: node.h, content: buildWidgetHTML(node.id) });
                applyStyles(node.id);
                if(node.widgetSettings) window.applyWidgetSettings(node.id, node.widgetSettings);
            }
        });
        buildMenu();
    }

    function buildMenu() { 
        const list = document.getElementById('toggleList'); 
        list.innerHTML = ''; 
        Object.keys(WIDGETS).sort().forEach(key => { 
            let isOnGrid = document.querySelector(`.grid-stack-item[gs-id="${key}"]`); 
            list.innerHTML += `<div class="form-check form-switch py-2 px-4 border rounded border-secondary bg-secondary bg-opacity-10"><input class="form-check-input" type="checkbox" ${isOnGrid ? 'checked' : ''} onchange="toggleWidget('${key}', this.checked)"><label class="form-check-label fw-bold">${WIDGETS[key].title}</label></div>`; 
        }); 
    }

    function initAll() {
        document.getElementById('toast').style.opacity = 1; 
        setTimeout(() => document.getElementById('toast').style.opacity = 0, 2000);
        window.grid.getGridItems().forEach(item => {
            let id = item.getAttribute('gs-id');
            refreshWidget(id);
        });
        document.getElementById('lastUpdatedTime').innerText = new Date().toLocaleTimeString();
    }

    function updateTemplateLabel() {
        const lbl = document.getElementById('currentTemplateLabel');
        if(currentTemplateName && currentTemplateId) {
            lbl.innerText = currentTemplateName;
            lbl.style.display = 'inline-block';
        } else {
            lbl.style.display = 'none';
        }
    }

    function handleSaveAction() {
        const modal = new bootstrap.Modal(document.getElementById('saveTemplateModal'));
        const optionsDiv = document.getElementById('saveOptions');
        const inputDiv = document.getElementById('newSaveInput');
        const footer = document.getElementById('newSaveFooter');

        if(currentTemplateId) {
            optionsDiv.classList.remove('d-none');
            inputDiv.classList.add('d-none');
            footer.classList.add('d-none');
            document.getElementById('existingNameDisplay').innerText = currentTemplateName;
        } else {
            optionsDiv.classList.add('d-none');
            inputDiv.classList.remove('d-none');
            footer.classList.remove('d-none');
        }
        modal.show();
    }

    function showNewInput() {
        document.getElementById('saveOptions').classList.add('d-none');
        document.getElementById('newSaveInput').classList.remove('d-none');
        document.getElementById('newSaveFooter').classList.remove('d-none');
    }

    function getCurrentLayoutWithSettings() {
        let layout = window.grid.save(false);
        layout.forEach(node => { node.widgetSettings = window.getWidgetSettings(node.id); });
        return layout;
    }

    function getStylePayload() {
        return JSON.stringify({
            styles: savedStyles,
            globalColor: localStorage.getItem('monitor_global_color') || '#0d6efd',
            theme: localStorage.getItem('monitor_theme') || 'dark'
        });
    }

    function saveNewTemplate() {
        const name = document.getElementById('templateNameInput').value;
        if(!name) return alert('Enter a name');

        const fd = new FormData();
        fd.append('action', 'save_template');
        fd.append('name', name);
        fd.append('layout', JSON.stringify(getCurrentLayoutWithSettings()));
        fd.append('styles', getStylePayload());

        fetch('api.php', { method: 'POST', body: fd }).then(r => r.json()).then(res => {
            if(res.status === 'success') {
                currentTemplateId = res.id;
                currentTemplateName = name;
                localStorage.setItem('monitor_template_id', currentTemplateId);
                localStorage.setItem('monitor_template_name', currentTemplateName);
                updateTemplateLabel();
                alert('Saved successfully!');
                bootstrap.Modal.getInstance(document.getElementById('saveTemplateModal')).hide();
                document.getElementById('templateNameInput').value = '';
            } else alert('Error: ' + res.message);
        });
    }

    function updateCurrentTemplate() {
        if(!currentTemplateId) return;
        const fd = new FormData();
        fd.append('action', 'update_template');
        fd.append('id', currentTemplateId);
        fd.append('layout', JSON.stringify(getCurrentLayoutWithSettings()));
        fd.append('styles', getStylePayload());

        fetch('api.php', { method: 'POST', body: fd }).then(r => r.json()).then(res => {
            if(res.status === 'success') {
                alert('Updated successfully!');
                bootstrap.Modal.getInstance(document.getElementById('saveTemplateModal')).hide();
            } else alert('Error: ' + res.message);
        });
    }

    function openLoadTemplateModal() {
        fetch('api.php?action=list_templates').then(r => r.json()).then(res => {
            renderTemplateList(res.data);
            new bootstrap.Modal(document.getElementById('loadTemplateModal')).show();
        });
    }

    function renderTemplateList(data) {
        let html = '';
        if(data && data.length > 0) {
            data.forEach(t => {
                let isActive = (t.id == currentTemplateId) ? 'border-primary' : 'border-secondary';
                html += `<div class="list-group-item list-group-item-action bg-dark text-white ${isActive} d-flex justify-content-between align-items-center mb-1"><div onclick="loadTemplate(${t.id})" style="cursor:pointer; flex-grow:1;"><strong>${t.template_name}</strong><br><small class="text-muted">${t.created_at}</small></div><button class="btn btn-sm btn-outline-danger" onclick="deleteTemplate(${t.id})"><i class="fas fa-trash"></i></button></div>`;
            });
        } else html = '<div class="p-3 text-center text-muted">No templates found.</div>';
        document.getElementById('templateList').innerHTML = html;
    }

    function loadTemplate(id) {
        if(!confirm('Load template? Unsaved changes will be lost.')) return;
        fetch(`api.php?action=load_template&id=${id}`).then(r => r.json()).then(res => {
            if(res.status === 'success') {
                const layout = JSON.parse(res.data.layout_data);
                const styles = JSON.parse(res.data.style_data);

                savedStyles = styles.styles || {};
                localStorage.setItem('monitor_styles', JSON.stringify(savedStyles));
                localStorage.setItem('monitor_global_color', styles.globalColor);
                localStorage.setItem('monitor_theme', styles.theme);
                localStorage.setItem('monitor_layout_v14', res.data.layout_data);

                currentTemplateId = res.data.id;
                currentTemplateName = res.data.template_name;
                localStorage.setItem('monitor_template_id', currentTemplateId);
                localStorage.setItem('monitor_template_name', currentTemplateName);
                updateTemplateLabel();

                applyGlobalSettings(styles.globalColor, styles.theme);
                window.grid.removeAll();
                layout.forEach(node => {
                    if (WIDGETS[node.id]) {
                        window.grid.addWidget({ id: node.id, x: node.x, y: node.y, w: node.w, h: node.h, content: buildWidgetHTML(node.id) });
                        applyStyles(node.id);
                        if(node.widgetSettings) window.applyWidgetSettings(node.id, node.widgetSettings);
                    }
                });
                buildMenu();
                setTimeout(initAll, 500);
                bootstrap.Modal.getInstance(document.getElementById('loadTemplateModal')).hide();
            }
        });
    }

    function deleteTemplate(id) {
        if(!confirm('Delete this template?')) return;
        const fd = new FormData(); 
        fd.append('action', 'delete_template'); 
        fd.append('id', id);
        fetch('api.php', { method:'POST', body: fd }).then(r=>r.json()).then(res => {
            if(currentTemplateId == id) {
                currentTemplateId = null; 
                currentTemplateName = null;
                localStorage.removeItem('monitor_template_id');
                localStorage.removeItem('monitor_template_name');
                updateTemplateLabel();
            }
            fetch('api.php?action=list_templates').then(r => r.json()).then(listRes => {
                renderTemplateList(listRes.data);
            });
        });
    }

    window.resetLayout = function() { 
        if(confirm("Reset entire dashboard?")) { 
            localStorage.clear();
            currentTemplateId = null; 
            currentTemplateName = null;
            location.reload(); 
        } 
    }

    window.toggleWidget = function(id, isChecked) { 
        if(isChecked) { 
            window.grid.addWidget({ id: id, w: WIDGETS[id].w, h: WIDGETS[id].h, content: buildWidgetHTML(id) }); 
            applyStyles(id); 
            if(WIDGETS[id].type === 'chart') setTimeout(() => switchView(id, 'bar'), 100); else refreshWidget(id); 
        } else { 
            let el = document.querySelector(`.grid-stack-item[gs-id="${id}"]`); 
            if(el) window.grid.removeWidget(el); 
        } 
    }

    window.toggleTheme = function() {
        document.body.classList.toggle('light-mode');
        let isLight = document.body.classList.contains('light-mode');
        setLightTheme(isLight);
        localStorage.setItem('monitor_theme', isLight ? 'light' : 'dark');
    }

    function setLightTheme(isLight) {
        let nav = document.getElementById('mainNav');
        if(isLight) { 
            document.body.classList.add('light-mode'); 
            nav.classList.remove('navbar-dark'); 
            nav.style.backgroundColor='#ffffff'; 
            nav.style.color='#333'; 
            nav.classList.add('navbar-light','bg-white','shadow-sm'); 
        } else { 
            document.body.classList.remove('light-mode'); 
            nav.classList.remove('navbar-light','bg-white','shadow-sm'); 
            nav.classList.add('navbar-dark'); 
            nav.style.backgroundColor='#212529'; 
        }
    }

    window.toggleFullScreen = function() { 
        !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen(); 
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) document.body.classList.add('fullscreen-mode');
        else document.body.classList.remove('fullscreen-mode');
    });

    window.saveAndApplyView = function() { 
        localStorage.setItem('monitor_layout_v14', JSON.stringify(getCurrentLayoutWithSettings())); 
        location.reload(); 
    }
    
    function applyStyles(id) {
        if(!savedStyles[id]) return;
        let item = document.querySelector(`.grid-stack-item[gs-id="${id}"]`);
        if(!item) return;

        let el = item.querySelector('.grid-stack-item-content');
        let header = item.querySelector('.widget-header');
        let title = item.querySelector('.widget-title');

        if(savedStyles[id].bg) el.style.backgroundColor = savedStyles[id].bg;
        if(savedStyles[id].headerBg) header.style.backgroundColor = savedStyles[id].headerBg;
        if(savedStyles[id].innerBg) el.style.setProperty('--inner-card-bg', savedStyles[id].innerBg);
        if(savedStyles[id].accent) { 
            el.style.borderLeftColor = savedStyles[id].accent; 
            title.style.color = savedStyles[id].accent; 
        }
        if(savedStyles[id].rename) {
            title.innerText = savedStyles[id].rename;
        }
    }

    function setupContextMenu() {
        const cm = document.getElementById('contextMenu');
        document.querySelector('.grid-stack').addEventListener('contextmenu', e => {
            let w = e.target.closest('.grid-stack-item');
            if(w) { 
                e.preventDefault(); 
                window.targetId = w.getAttribute('gs-id'); 
                let s = savedStyles[window.targetId] || {}; 
                
                document.getElementById('renameInput').value = s.rename || WIDGETS[window.targetId].title;
                document.getElementById('accentColorPicker').value = s.accent || '#0d6efd'; 
                document.getElementById('bgColorPicker').value = s.bg || '#1e1e1e'; 
                document.getElementById('headerColorPicker').value = s.headerBg || '#1e1e1e';
                document.getElementById('innerCardColorPicker').value = s.innerBg || '#2a2a2a';

                let y = e.pageY;
                let x = e.pageX;
                if (x + 260 > window.innerWidth) x = window.innerWidth - 270;

                cm.style.top = y+'px'; 
                cm.style.left = x+'px'; 
                cm.style.display = 'block'; 
            }
        });
        document.addEventListener('click', e => { 
            if(!e.target.closest('#contextMenu') && !e.target.closest('input[type="color"]')) cm.style.display = 'none'; 
        });
    }

    function setupColorPickers() {
        ['accentColorPicker', 'bgColorPicker', 'headerColorPicker', 'innerCardColorPicker'].forEach(pid => {
            document.getElementById(pid).addEventListener('input', (e) => {
                if(!window.targetId) return; 
                if(!savedStyles[window.targetId]) savedStyles[window.targetId] = {};
                
                if(pid === 'accentColorPicker') savedStyles[window.targetId].accent = e.target.value;
                if(pid === 'bgColorPicker') savedStyles[window.targetId].bg = e.target.value;
                if(pid === 'headerColorPicker') savedStyles[window.targetId].headerBg = e.target.value;
                if(pid === 'innerCardColorPicker') savedStyles[window.targetId].innerBg = e.target.value;

                applyStyles(window.targetId); 
                localStorage.setItem('monitor_styles', JSON.stringify(savedStyles));
            });
        });

        document.getElementById('globalColorPicker').addEventListener('input', function() { 
            document.documentElement.style.setProperty('--app-accent', this.value); 
            localStorage.setItem('monitor_global_color', this.value); 
        });
    }

    window.applyRename = function() {
        if(!window.targetId) return;
        if(!savedStyles[window.targetId]) savedStyles[window.targetId] = {};
        
        savedStyles[window.targetId].rename = document.getElementById('renameInput').value;
        applyStyles(window.targetId);
        localStorage.setItem('monitor_styles', JSON.stringify(savedStyles));
        document.getElementById('contextMenu').style.display = 'none';
    }

    window.resetWidgetColor = function() { 
        if(window.targetId) { 
            delete savedStyles[window.targetId]; 
            localStorage.setItem('monitor_styles', JSON.stringify(savedStyles)); 
            
            let item = document.querySelector(`.grid-stack-item[gs-id="${window.targetId}"]`);
            if(item) {
                let content = item.querySelector('.grid-stack-item-content');
                let header = item.querySelector('.widget-header');
                let title = item.querySelector('.widget-title');
                
                content.style.backgroundColor = ''; 
                content.style.borderLeftColor = ''; 
                content.style.removeProperty('--inner-card-bg');
                header.style.backgroundColor = '';
                title.style.color = '';
                title.innerText = WIDGETS[window.targetId].title;
            }
            document.getElementById('contextMenu').style.display='none'; 
        } 
    }

    window.hideTargetWidget = function() { 
        if(window.targetId) { 
            let cb = document.querySelector(`input[onchange*="'${window.targetId}'"]`);
            if(cb) cb.checked = false;
            toggleWidget(window.targetId, false); 
            document.getElementById('contextMenu').style.display = 'none'; 
        } 
    }
</script>
</body>
</html>
