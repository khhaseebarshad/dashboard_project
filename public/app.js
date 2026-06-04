/**
 * Athletes Analytics Dashboard Application Script
 * Controls interactive filters, fetches data, dynamically updates charts,
 * handles pagination, custom double range sliders, and modal lightboxes.
 */

// Application initial state
const state = {
    search: '',
    gender: 'all',
    ageMin: 14,
    ageMax: 72,
    heightMin: 120,
    heightMax: 222,
    weightMin: 30,
    weightMax: 150,
    countries: [],
    disciplines: [],
    activeTab: 'overview',
    theme: localStorage.getItem('dashboard-theme') || 'dark',
    sortColumn: null,
    sortOrder: 'asc',
    
    // Loaded data
    records: [],
    kpis: {},
    currentPage: 1,
    rowsPerPage: 10,
    dropdownsPopulated: false
};

// DOM Elements mapping
const elements = {
    // Theme Selector
    themeSelect: document.getElementById('theme-select'),

    // Filters
    searchFilter: document.getElementById('search-filter'),
    genderRadios: document.getElementsByName('gender-filter'),
    ageMin: document.getElementById('age-min'),
    ageMax: document.getElementById('age-max'),
    ageMinVal: document.getElementById('age-min-val'),
    ageMaxVal: document.getElementById('age-max-val'),
    heightMin: document.getElementById('height-min'),
    heightMax: document.getElementById('height-max'),
    heightMinVal: document.getElementById('height-min-val'),
    heightMaxVal: document.getElementById('height-max-val'),
    weightMin: document.getElementById('weight-min'),
    weightMax: document.getElementById('weight-max'),
    weightMinVal: document.getElementById('weight-min-val'),
    weightMaxVal: document.getElementById('weight-max-val'),
    pageSizeSelect: document.getElementById('page-size-select'),
    resetBtn: document.getElementById('reset-filters-btn'),
    
    // Header & Navigation
    sidebar: document.getElementById('sidebar'),
    mobileToggleBtn: document.getElementById('mobile-toggle-btn'),
    activeDatasetName: document.getElementById('active-dataset-name'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.panel-tab-content'),
    
    // KPIs
    kpiRecordsVal: document.getElementById('kpi-records-val'),
    kpiRecordsSub: document.getElementById('kpi-records-sub'),
    kpiAgeVal: document.getElementById('kpi-age-val'),
    kpiHeightVal: document.getElementById('kpi-height-val'),
    kpiWeightVal: document.getElementById('kpi-weight-val'),
    
    // Table
    tableBody: document.getElementById('table-body'),
    tableMatchesCount: document.getElementById('table-matches-count'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    paginationInfo: document.getElementById('pagination-info'),
    
    // Modal Lightbox
    chartModal: document.getElementById('chart-modal'),
    modalChartTitle: document.getElementById('modal-chart-title'),
    modalChartImg: document.getElementById('modal-chart-img'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCloseBackdrop: document.getElementById('modal-close-backdrop')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    setupSliders();
    initCustomMultiselect('countries');
    initCustomMultiselect('disciplines');
    setupEventListeners();
    fetchDataAndUpdateUI();
});

// Setup Double Range Sliders (Handles overlapping prevention and updates label values)
function setupSliders() {
    // Age Slider
    const handleAgeChange = () => {
        let min = parseInt(elements.ageMin.value);
        let max = parseInt(elements.ageMax.value);
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
            elements.ageMin.value = min;
            elements.ageMax.value = max;
        }
        state.ageMin = min;
        state.ageMax = max;
        elements.ageMinVal.textContent = min;
        elements.ageMaxVal.textContent = max;
    };
    elements.ageMin.addEventListener('input', handleAgeChange);
    elements.ageMax.addEventListener('input', handleAgeChange);
    elements.ageMin.addEventListener('change', fetchDataAndUpdateUI);
    elements.ageMax.addEventListener('change', fetchDataAndUpdateUI);

    // Height Slider
    const handleHeightChange = () => {
        let min = parseInt(elements.heightMin.value);
        let max = parseInt(elements.heightMax.value);
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
            elements.heightMin.value = min;
            elements.heightMax.value = max;
        }
        state.heightMin = min;
        state.heightMax = max;
        elements.heightMinVal.textContent = min;
        elements.heightMaxVal.textContent = max;
    };
    elements.heightMin.addEventListener('input', handleHeightChange);
    elements.heightMax.addEventListener('input', handleHeightChange);
    elements.heightMin.addEventListener('change', fetchDataAndUpdateUI);
    elements.heightMax.addEventListener('change', fetchDataAndUpdateUI);

    // Weight Slider
    const handleWeightChange = () => {
        let min = parseInt(elements.weightMin.value);
        let max = parseInt(elements.weightMax.value);
        if (min > max) {
            const temp = min;
            min = max;
            max = temp;
            elements.weightMin.value = min;
            elements.weightMax.value = max;
        }
        state.weightMin = min;
        state.weightMax = max;
        elements.weightMinVal.textContent = min;
        elements.weightMaxVal.textContent = max;
    };
    elements.weightMin.addEventListener('input', handleWeightChange);
    elements.weightMax.addEventListener('input', handleWeightChange);
    elements.weightMin.addEventListener('change', fetchDataAndUpdateUI);
    elements.weightMax.addEventListener('change', fetchDataAndUpdateUI);
}

// Setup standard event listeners
function setupEventListeners() {
    // Search Filter with Debounce
    let searchTimeout;
    elements.searchFilter.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.search = e.target.value;
            fetchDataAndUpdateUI();
        }, 300);
    });

    // Gender Radios
    elements.genderRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.gender = e.target.value;
            fetchDataAndUpdateUI();
        });
    });

    // Page Size Selector Listener
    if (elements.pageSizeSelect) {
        elements.pageSizeSelect.value = state.rowsPerPage.toString();
        elements.pageSizeSelect.addEventListener('change', (e) => {
            state.rowsPerPage = parseInt(e.target.value);
            state.currentPage = 1;
            renderTable();
        });
    }

    // Table sorting headers listener
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const col = header.getAttribute('data-sort');
            if (state.sortColumn === col) {
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortColumn = col;
                state.sortOrder = 'asc';
            }
            updateSortingHeaderIcons();
            sortRecords();
            renderTable();
        });
    });

    // Reset Filters Button
    elements.resetBtn.addEventListener('click', resetFilters);

    // Theme Change Listener
    if (elements.themeSelect) {
        elements.themeSelect.value = state.theme;
        elements.themeSelect.addEventListener('change', (e) => {
            state.theme = e.target.value;
            localStorage.setItem('dashboard-theme', state.theme);
            applyTheme(state.theme);
            fetchDataAndUpdateUI();
        });
    }

    // Tab Navigation
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            state.activeTab = tabId;
        });
    });

    // Pagination
    elements.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderTable();
        }
    });

    elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.records.length / state.rowsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderTable();
        }
    });

    // Export CSV
    elements.exportCsvBtn.addEventListener('click', exportCSV);

    // Lightbox Zoom Triggers
    document.querySelectorAll('.btn-chart-action.zoom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chartName = btn.getAttribute('data-chart');
            openLightbox(chartName);
        });
    });

    // Close Lightbox
    elements.modalCloseBtn.addEventListener('click', closeLightbox);
    elements.modalCloseBackdrop.addEventListener('click', closeLightbox);
    
    // Mobile Menu Toggle
    elements.mobileToggleBtn.addEventListener('click', () => {
        elements.sidebar.classList.toggle('active');
        const icon = elements.mobileToggleBtn.querySelector('i');
        icon.className = elements.sidebar.classList.contains('active') 
            ? 'fa-solid fa-xmark' 
            : 'fa-solid fa-bars';
    });
}

// Build query parameters based on active filters
function buildQueryString() {
    const params = new URLSearchParams();
    if (state.search) params.append('search', state.search);
    if (state.gender !== 'all') params.append('gender', state.gender);
    
    params.append('min_age', state.ageMin);
    params.append('max_age', state.ageMax);
    params.append('min_height', state.heightMin);
    params.append('max_height', state.heightMax);
    params.append('min_weight', state.weightMin);
    params.append('max_weight', state.weightMax);
    
    if (state.countries.length > 0) params.append('countries', state.countries.join(','));
    if (state.disciplines.length > 0) params.append('disciplines', state.disciplines.join(','));
    
    return params.toString();
}

// Reset filters to defaults
function resetFilters() {
    state.search = '';
    state.gender = 'all';
    state.ageMin = 14;
    state.ageMax = 72;
    state.heightMin = 120;
    state.heightMax = 222;
    state.weightMin = 30;
    state.weightMax = 150;
    state.countries = [];
    state.disciplines = [];
    state.currentPage = 1;
    state.sortColumn = null;
    state.sortOrder = 'asc';

    // Reset DOM Elements
    elements.searchFilter.value = '';
    elements.genderRadios.forEach(radio => {
        radio.checked = radio.value === 'all';
    });

    elements.ageMin.value = 14;
    elements.ageMax.value = 72;
    elements.ageMinVal.textContent = 14;
    elements.ageMaxVal.textContent = 72;

    elements.heightMin.value = 120;
    elements.heightMax.value = 222;
    elements.heightMinVal.textContent = 120;
    elements.heightMaxVal.textContent = 222;

    elements.weightMin.value = 30;
    elements.weightMax.value = 150;
    elements.weightMinVal.textContent = 30;
    elements.weightMaxVal.textContent = 150;

    if (elements.pageSizeSelect) {
        elements.pageSizeSelect.value = "10";
        state.rowsPerPage = 10;
    }

    // Reset custom multiselect chips and search lists
    updateMultiselectUI('countries');
    updateMultiselectUI('disciplines');
    document.getElementById('countries-search').value = '';
    document.getElementById('disciplines-search').value = '';
    updateSortingHeaderIcons();

    fetchDataAndUpdateUI();
}

// Fetches statistics and raw data rows from Flask API
async function fetchDataAndUpdateUI() {
    const queryString = buildQueryString();
    
    // Set loading indicator on KPI values and table
    elements.kpiRecordsVal.textContent = '...';
    elements.tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px; color: var(--primary);"></i> Fetching records from server...</td></tr>`;
    
    // Trigger chart image updates
    updateCharts(queryString);
    
    try {
        const response = await fetch(`/api/data?${queryString}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update state
        state.records = data.records;
        state.kpis = data.kpis;
        state.currentPage = 1; // reset page on filter change
        
        // Populate dropdowns once
        if (!state.dropdownsPopulated) {
            populateCustomMultiselectOptions('countries', data.countries);
            populateCustomMultiselectOptions('disciplines', data.disciplines);
            state.dropdownsPopulated = true;
        }
        
        if (state.sortColumn) {
            sortRecords();
        }
        
        // Render statistics & data table
        updateKPIs();
        renderTable();
        updateMatchedAthletesList();
        generateDynamicInsights();
        
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        elements.tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--color-red);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i> Failed to load data from backend server.</td></tr>`;
    }
}



// Triggers background reload of Matplotlib generated images
function updateCharts(queryString) {
    const chartTypes = ['pie', 'histogram', 'line', 'bar', 'scatter', 'box', 'heatmap', 'area', 'count', 'violin'];
    
    chartTypes.forEach(type => {
        const imgElement = document.getElementById(`chart-${type}`);
        if (imgElement) {
            const chartBody = imgElement.parentElement;
            chartBody.classList.add('loading');
            
            // Bypass browser cache with dynamic timestamp
            const url = `/api/charts/${type}?${queryString}&theme=${state.theme}&_cb=${new Date().getTime()}`;
            
            imgElement.src = url;
            
            // Update download button link
            const downloadBtn = document.querySelector(`.download-btn[data-chart="${type}"]`);
            if (downloadBtn) {
                downloadBtn.href = url;
                downloadBtn.download = `athlete_${type}_chart.png`;
            }
            
            // Remove spinner when image has loaded fully
            imgElement.onload = () => {
                chartBody.classList.remove('loading');
            };
            imgElement.onerror = () => {
                chartBody.classList.remove('loading');
                console.warn(`Chart rendering error: ${type}`);
            };
        }
    });
}

// Populates KPI metrics
function updateKPIs() {
    const k = state.kpis;
    elements.kpiRecordsVal.textContent = k.total_records.toLocaleString();
    elements.kpiRecordsSub.textContent = `Matched from ${k.original_records.toLocaleString()} profiles`;
    elements.kpiAgeVal.textContent = k.avg_age;
    elements.kpiHeightVal.textContent = `${k.avg_height} cm`;
    elements.kpiWeightVal.textContent = `${k.avg_weight} kg`;
}

// Renders the data table with pagination controls
function renderTable() {
    const records = state.records;
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const end = Math.min(start + state.rowsPerPage, records.length);
    const paginatedRecords = records.slice(start, end);
    
    // Update record count labels
    elements.tableMatchesCount.textContent = `Showing ${records.length > 0 ? start + 1 : 0}-${end} of ${records.length} athletes matched`;
    
    if (records.length === 0) {
        elements.tableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="margin-right: 8px;"></i> No athletes match the current active filter settings.</td></tr>`;
        elements.prevPageBtn.disabled = true;
        elements.nextPageBtn.disabled = true;
        elements.paginationInfo.textContent = "Page 1 of 1";
        return;
    }
    
    let html = '';
    paginatedRecords.forEach((record, index) => {
        const id = start + index + 1;
        const genderBadgeClass = record.gender === 'Male' ? 'badge-gender-male' : 'badge-gender-female';
        const genderBadge = `<span class="badge-gender ${genderBadgeClass}">${record.gender}</span>`;
            
        // Handling display values
        const heightStr = record.height ? Math.round(record.height) : '-';
        const weightStr = record.weight ? Math.round(record.weight) : '-';
        
        html += `
            <tr>
                <td><strong>#${id}</strong></td>
                <td><strong>${record.name}</strong></td>
                <td>${genderBadge}</td>
                <td>${record.age}</td>
                <td>${heightStr}</td>
                <td>${weightStr}</td>
                <td>${record.country}</td>
                <td>${record.disciplines || '-'}</td>
                <td>${record.events || '-'}</td>
                <td>${record.birth_date || '-'}</td>
            </tr>
        `;
    });
    
    elements.tableBody.innerHTML = html;
    
    // Pagination button states
    const totalPages = Math.ceil(records.length / state.rowsPerPage);
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;
    elements.paginationInfo.textContent = `Page ${state.currentPage} of ${totalPages || 1}`;
}

// Lightbox zooming modal trigger
function openLightbox(chartName) {
    const srcElement = document.getElementById(`chart-${chartName}`);
    if (srcElement) {
        // Set lightbox image src to match current filtered image
        elements.modalChartImg.src = srcElement.src;
        
        // Translate chart type to title
        const titles = {
            pie: 'Gender breakdown (Pie Chart)',
            histogram: 'Athlete Age Demographics (Histogram)',
            line: 'Average Athlete Height Trend (Line Chart)',
            bar: 'Top 10 Represented Countries (Bar Chart)',
            scatter: 'Height vs. Weight Distribution (Scatter Plot)',
            box: 'Weight Spread by Gender (Box Plot)',
            heatmap: 'Correlation Matrix of Attributes (Heatmap)',
            area: 'Cumulative Athlete Count (Area Chart)',
            count: 'Top 5 Disciplines by Gender (Count Plot)',
            violin: 'Height Distribution Profile (Violin Plot)'
        };
        elements.modalChartTitle.textContent = titles[chartName] || 'Athlete Insights Visualization';
        elements.chartModal.classList.add('active');
    }
}

function closeLightbox() {
    elements.chartModal.classList.remove('active');
    elements.modalChartImg.src = '';
}

// Exports filtered records as CSV file
function exportCSV() {
    const records = state.records;
    if (records.length === 0) {
        alert("No athlete records match the filters to export!");
        return;
    }
    
    // Headers list
    const headers = ['code', 'name', 'gender', 'age', 'height', 'weight', 'country', 'disciplines', 'events', 'birth_date'];
    let csvContent = headers.join(',') + '\n';
    
    // Build CSV body rows
    records.forEach(record => {
        const row = headers.map(header => {
            const val = record[header];
            if (val === null || val === undefined) return '';
            const strVal = String(val);
            // Handle quotes if fields contain commas
            return strVal.includes(',') ? `"${strVal}"` : strVal;
        });
        csvContent += row.join(',') + '\n';
    });
    
    // Trigger temporary anchor element download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `athletes_insights_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Populates matched athletes names on the overview card
function updateMatchedAthletesList() {
    const listElement = document.getElementById('matched-athletes-list');
    if (!listElement) return;

    const records = state.records;
    if (records.length === 0) {
        listElement.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-user-slash" style="font-size: 24px; margin-bottom: 8px; display: block; color: var(--color-red);"></i> No matching athletes found.</div>`;
        return;
    }

    let html = '';
    const limit = 15;
    const items = records.slice(0, limit);
    
    items.forEach(record => {
        html += `
            <div class="matched-athletes-list-item">
                <div>
                    <div class="matched-athlete-name">${record.name}</div>
                    <span class="matched-athlete-meta">${record.gender} | Age ${record.age}</span>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--primary);">${record.disciplines || '-'}</div>
                    <span class="matched-athlete-meta">${record.country}</span>
                </div>
            </div>
        `;
    });

    if (records.length > limit) {
        html += `
            <div style="text-align: center; padding: 12px; font-size: 12px; color: var(--text-muted); border-top: 1px solid rgba(255, 255, 255, 0.05);">
                ...and ${records.length - limit} more. Switch to the <strong>Raw Data Explorer</strong> tab to view all.
            </div>
        `;
    }

    listElement.innerHTML = html;
}

// Apply selected theme class to body
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

// Init custom multiselect dropdown logic
function initCustomMultiselect(field) {
    const trigger = document.getElementById(`${field}-trigger`);
    const searchInput = document.getElementById(`${field}-search`);
    const clearBtn = document.getElementById(`${field}-clear`);
    const optionsContainer = document.getElementById(`${field}-options`);
    const container = document.getElementById(`${field}-multiselect`);

    // Toggle dropdown visibility
    trigger.addEventListener('click', (e) => {
        const otherField = field === 'countries' ? 'disciplines' : 'countries';
        const otherContainer = document.getElementById(`${otherField}-multiselect`);
        if (otherContainer) {
            otherContainer.classList.remove('active');
        }
        
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            searchInput.focus();
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('active');
        }
    });

    // Search filter
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const options = optionsContainer.getElementsByClassName('dropdown-option');
        Array.from(options).forEach(opt => {
            const val = opt.getAttribute('data-value').toLowerCase();
            if (val.includes(query)) {
                opt.style.display = 'flex';
            } else {
                opt.style.display = 'none';
            }
        });
    });

    // Clear selections
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state[field] = [];
        state.currentPage = 1;
        updateMultiselectUI(field);
        fetchDataAndUpdateUI();
    });
}

function populateCustomMultiselectOptions(field, optionsList) {
    const optionsContainer = document.getElementById(`${field}-options`);
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    optionsList.forEach(optVal => {
        const opt = document.createElement('div');
        opt.className = 'dropdown-option';
        opt.setAttribute('data-value', optVal);
        opt.innerHTML = `<span>${optVal}</span> <i class="fa-solid fa-check"></i>`;
        
        if (state[field].includes(optVal)) {
            opt.classList.add('selected');
        }
        
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state[field].includes(optVal)) {
                state[field] = state[field].filter(v => v !== optVal);
                opt.classList.remove('selected');
            } else {
                state[field].push(optVal);
                opt.classList.add('selected');
            }
            state.currentPage = 1;
            updateMultiselectUI(field);
            fetchDataAndUpdateUI();
        });
        optionsContainer.appendChild(opt);
    });
    
    updateMultiselectUI(field);
}

function updateMultiselectUI(field) {
    const placeholder = document.querySelector(`#${field}-trigger .placeholder`);
    const chipsContainer = document.getElementById(`${field}-chips`);
    const optionsContainer = document.getElementById(`${field}-options`);
    
    if (optionsContainer) {
        const options = optionsContainer.getElementsByClassName('dropdown-option');
        Array.from(options).forEach(opt => {
            const val = opt.getAttribute('data-value');
            if (state[field].includes(val)) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    if (state[field].length === 0) {
        if (placeholder) placeholder.style.display = 'block';
        if (chipsContainer) chipsContainer.innerHTML = '';
    } else {
        if (placeholder) placeholder.style.display = 'none';
        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            state[field].forEach(val => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.innerHTML = `<span>${val}</span> <i class="fa-solid fa-xmark remove-chip"></i>`;
                chip.querySelector('.remove-chip').addEventListener('click', (e) => {
                    e.stopPropagation();
                    state[field] = state[field].filter(v => v !== val);
                    updateMultiselectUI(field);
                    fetchDataAndUpdateUI();
                });
                chipsContainer.appendChild(chip);
            });
        }
    }
}

// Client-side column sorting
function sortRecords() {
    const col = state.sortColumn;
    if (!col) return;
    
    state.records.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        if (col === 'disciplines') {
            valA = valA || '';
            valB = valB || '';
        }
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
            return state.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        if (valA === null || valA === undefined) valA = state.sortOrder === 'asc' ? Infinity : -Infinity;
        if (valB === null || valB === undefined) valB = state.sortOrder === 'asc' ? Infinity : -Infinity;
        
        return state.sortOrder === 'asc' ? valA - valB : valB - valA;
    });
}

function updateSortingHeaderIcons() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        const col = header.getAttribute('data-sort');
        const icon = header.querySelector('i');
        if (icon) {
            if (state.sortColumn === col) {
                icon.className = state.sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
                icon.style.opacity = '1';
            } else {
                icon.className = 'fa-solid fa-sort';
                icon.style.opacity = '0.5';
            }
        }
    });
}

// Dynamic rule-based insights observations panel generator
function generateDynamicInsights() {
    const listElement = document.getElementById('insights-list');
    if (!listElement) return;

    const records = state.records;
    const total = records.length;
    const k = state.kpis;

    if (total === 0) {
        listElement.innerHTML = `<li><i class="fa-solid fa-triangle-exclamation insight-icon" style="color: var(--color-red);"></i> No matching data is active. Reset filters to see dynamic observations.</li>`;
        return;
    }

    const insights = [];

    // 1. Gender distribution insight
    const femaleCount = records.filter(r => r.gender === 'Female').length;
    const femalePct = Math.round((femaleCount / total) * 100);
    const malePct = 100 - femalePct;
    if (femalePct > 65) {
        insights.push(`<li><i class="fa-solid fa-venus insight-icon" style="color: var(--color-pink);"></i> Highly female-represented dataset (<strong>${femalePct}% female</strong> vs ${malePct}% male).</li>`);
    } else if (femalePct < 35) {
        insights.push(`<li><i class="fa-solid fa-mars insight-icon" style="color: var(--primary);"></i> Highly male-represented dataset (<strong>${malePct}% male</strong> vs ${femalePct}% female).</li>`);
    } else {
        insights.push(`<li><i class="fa-solid fa-venus-mars insight-icon" style="color: var(--color-green);"></i> Balanced gender distribution (<strong>${malePct}% male</strong> and <strong>${femalePct}% female</strong>).</li>`);
    }

    // 2. Average Age insight
    if (k.avg_age) {
        const avgAgeNum = parseFloat(k.avg_age);
        if (avgAgeNum < 24) {
            insights.push(`<li><i class="fa-solid fa-baby insight-icon" style="color: var(--color-amber);"></i> A very youthful cohort with an average age of <strong>${k.avg_age} years</strong>.</li>`);
        } else if (avgAgeNum > 35) {
            insights.push(`<li><i class="fa-solid fa-user-tie insight-icon" style="color: var(--color-blue);"></i> A highly experienced cohort with an average age of <strong>${k.avg_age} years</strong>.</li>`);
        } else {
            insights.push(`<li><i class="fa-solid fa-user-check insight-icon" style="color: var(--color-green);"></i> Standard athletic age profile averaging <strong>${k.avg_age} years</strong>.</li>`);
        }
    }

    // 3. BMI estimation
    if (k.avg_height && k.avg_weight) {
        const heightM = parseFloat(k.avg_height) / 100;
        const weightKg = parseFloat(k.avg_weight);
        if (heightM > 0 && weightKg > 0) {
            const bmi = (weightKg / (heightM * heightM)).toFixed(1);
            let bmiCategory = 'Normal Weight';
            let bmiColor = 'var(--color-green)';
            if (bmi < 18.5) {
                bmiCategory = 'Underweight';
                bmiColor = 'var(--color-blue)';
            } else if (bmi >= 25 && bmi < 30) {
                bmiCategory = 'Overweight';
                bmiColor = 'var(--color-amber)';
            } else if (bmi >= 30) {
                bmiCategory = 'Obese';
                bmiColor = 'var(--color-red)';
            }
            insights.push(`<li><i class="fa-solid fa-heart-pulse insight-icon" style="color: ${bmiColor};"></i> Estimated cohort average BMI is <strong>${bmi}</strong>, placing them in the <strong>${bmiCategory}</strong> category.</li>`);
        }
    }

    // 4. Country dominance
    const countriesMap = {};
    records.forEach(r => {
        if (r.country) {
            countriesMap[r.country] = (countriesMap[r.country] || 0) + 1;
        }
    });
    const sortedCountries = Object.entries(countriesMap).sort((a, b) => b[1] - a[1]);
    if (sortedCountries.length > 0) {
        const [topCountry, topCount] = sortedCountries[0];
        const topPct = Math.round((topCount / total) * 100);
        if (topPct > 20) {
            insights.push(`<li><i class="fa-solid fa-globe insight-icon" style="color: var(--primary);"></i> <strong>${topCountry}</strong> dominates the selected group representing <strong>${topPct}%</strong> of all matched profiles (${topCount} athletes).</li>`);
        }
    }

    // 5. Discipline variety
    const disciplinesSet = new Set(records.map(r => r.disciplines).filter(Boolean));
    if (disciplinesSet.size > 1) {
        insights.push(`<li><i class="fa-solid fa-person-running insight-icon" style="color: var(--color-purple);"></i> Active set spans across <strong>${disciplinesSet.size} different sports disciplines</strong>.</li>`);
    }

    listElement.innerHTML = insights.join('');
}
