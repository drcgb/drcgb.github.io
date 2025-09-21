// Store the original console functions
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

// Function to toggle all types of console logging on/off
function toggleLogging(isLoggingEnabled) {
  if (isLoggingEnabled) {
    console.log = originalConsoleLog;   // Enable log messages
    console.warn = originalConsoleWarn; // Enable warning messages
    console.error = originalConsoleError; // Enable error messages
    console.info = originalConsoleInfo; // Enable info messages
  } else {
    console.log = function () {};   // Disable log messages
    console.warn = function () {};  // Disable warning messages
    console.error = function () {}; // Disable error messages
    console.info = function () {};  // Disable info messages
  }
}

// Disable all logging initially
toggleLogging(false); // Turn off all logging by default

let allRows = [];
let dataTable;
let methodData = [];
let researchAreasData = [];
let isResettingFilters = false; // Add this flag at the top with other global variables

// Add text size adjustment tracking variables
let fontSizeAdjustLevel = 0; // Current adjustment level: 0 is baseline
const MAX_INCREASE = 3;      // Maximum 3 clicks to increase
const MAX_DECREASE = -2;     // Maximum 2 clicks to decrease

function scheduleTableScrollReset(options = { smooth: true }) {
    setTimeout(() => {
        resetTableScrollPosition(options);
    }, 80);
}

function resetTableScrollPosition(options = { smooth: true }) {
    try {
        const table = document.getElementById('abstractTable');
        const blueBar = document.querySelector('.blue-bar');
        const fixedHeader = document.querySelector('.fixed-header');
        const offset = (blueBar ? blueBar.getBoundingClientRect().height : 0) +
                       (fixedHeader ? fixedHeader.getBoundingClientRect().height : 0) + 10;
        const targetTop = table ? Math.max(0, table.getBoundingClientRect().top + window.pageYOffset - offset) : 0;
        const behavior = options && options.smooth ? 'smooth' : 'auto';
        window.scrollTo({ top: targetTop, behavior });
    } catch (err) {
        window.scrollTo(0, 0);
    }
}

// Unified margin adjustment function that handles both instructions and filters
function adjustContentMargin() {
  requestAnimationFrame(() => {
    const filterNoticeHeight = $('#filterNotice').is(':visible') ? $('#filterNotice').outerHeight(true) : 0;
    const instructionsHeight = $('#instructionsDetails').prop('open') ? $('#instructionsDetails').outerHeight(true) : 0;
    
    // Increase base margin
    const baseMargin = 200; // Increased from 180px for better initial spacing
    const totalMargin = baseMargin + filterNoticeHeight + instructionsHeight;
    
    $('.content').css('margin-top', totalMargin + 'px');
  });
}

function matchNoticeWidth() {
    // Add safety check to ensure elements exist
    const searchInput = document.getElementById('customSearch');
    const filterNotice = document.getElementById('filterNotice');
    
    if (searchInput && filterNotice && searchInput.offsetWidth > 0) {
        const searchWidth = searchInput.offsetWidth;
        filterNotice.style.width = searchWidth + 'px';
    }
}

// Update font size control functions with limits
function adjustFontSize(factor) {
    // Check if we're at the limits before adjusting
    if ((factor > 1 && fontSizeAdjustLevel >= MAX_INCREASE) || 
        (factor < 1 && fontSizeAdjustLevel <= MAX_DECREASE)) {
        return; // Don't allow adjustment beyond limits
    }
    
    // Update the adjustment level
    fontSizeAdjustLevel += (factor > 1) ? 1 : -1;
    
    const baseSelectors = 'body, table, #abstractTable, #abstractTable *, th, td, tr, tbody, thead, .dataTables_wrapper, .filter-status-btn, .filter-notice, select, option, .filter-group select';
    const importantSelector = '#abstractTable td, #abstractTable th';

    const targets = new Set();
    document.querySelectorAll(baseSelectors).forEach(el => targets.add(el));

    targets.forEach(el => {
        const computedSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (Number.isNaN(computedSize)) {
            return;
        }
        const newSize = computedSize * factor;
        if (el.matches(importantSelector)) {
            el.style.setProperty('font-size', `${newSize}px`, 'important');
        } else {
            el.style.fontSize = `${newSize}px`;
        }
    });

    // Store the current level and factor in localStorage
    localStorage.setItem('fontSizeAdjustLevel', fontSizeAdjustLevel.toString());
    const currentFactor = parseFloat(localStorage.getItem('fontSizeFactor') || '1');
    localStorage.setItem('fontSizeFactor', (currentFactor * factor).toString());

    // Update button states
    updateFontSizeButtonStates();
}

function resetFontSize() {
    const baseSelectors = 'body, table, #abstractTable, #abstractTable *, th, td, tr, tbody, thead, .dataTables_wrapper, .filter-status-btn, .filter-notice, select, option, .filter-group select';
    document.querySelectorAll(baseSelectors).forEach(el => {
        el.style.removeProperty('font-size');
    });

    // Reset level and remove localStorage items
    fontSizeAdjustLevel = 0;
    localStorage.removeItem('fontSizeFactor');
    localStorage.removeItem('fontSizeAdjustLevel');
    
    // Update button states
    updateFontSizeButtonStates();
}

// New function to update button states based on current adjustment level
function updateFontSizeButtonStates() {
    const increaseBtn = $('#increaseTextSize');
    const decreaseBtn = $('#decreaseTextSize');
    
    // Enable/disable increase button
    if (fontSizeAdjustLevel >= MAX_INCREASE) {
        increaseBtn.addClass('disabled').css('opacity', 0.5);
    } else {
        increaseBtn.removeClass('disabled').css('opacity', 1);
    }
    
    // Enable/disable decrease button
    if (fontSizeAdjustLevel <= MAX_DECREASE) {
        decreaseBtn.addClass('disabled').css('opacity', 0.5);
    } else {
        decreaseBtn.removeClass('disabled').css('opacity', 1);
    }
}

// Event listener for DOMContentLoaded to handle data loading and initialization
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load saved font size adjustment level from localStorage
    const savedLevel = localStorage.getItem('fontSizeAdjustLevel');
    if (savedLevel !== null) {
      fontSizeAdjustLevel = parseInt(savedLevel);
      
      // Apply saved font size if needed
      const savedFactor = parseFloat(localStorage.getItem('fontSizeFactor') || '1');
      if (savedFactor !== 1) {
        $('body, table, #abstractTable, #abstractTable *, th, td, tr, tbody, thead, .dataTables_wrapper, .filter-status-btn, .filter-notice')
          .css('font-size', function() {
            return (parseFloat(getComputedStyle(this).fontSize) * savedFactor) + 'px';
          });
      }
      
      // Update button states based on loaded level
      setTimeout(() => {
        updateFontSizeButtonStates();
      }, 200);
    }

    const response = await fetch("AssetsHonsPrelimTA2025/data/Prelim_Hons_Thesis_Titles_and_Abstracts_2025_FinalX.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);

    // Populate and initialize components
    populateTable(allRows);
    populateMethodFilter(allRows);
    populateAreaFilter(allRows);
    initializeDataTable();

    // Define a global function instead of a local alias
    function adjustScrollbarVisibility() {
        // call the safer helper
        forceScrollbarVisibility();
    }

    // Add a small delay to ensure everything is rendered
    setTimeout(() => {
      updateFilterStatus();
    }, 500);

    setTimeout(() => {
      matchNoticeWidth();
    }, 600);

    // Add this back around line 95:
    setTimeout(() => {
      adjustContentMargin(); // Initial margin adjustment
    }, 800);

    // Adjustments on window resize
    window.addEventListener('resize', () => {
      adjustContentMargin(); // Only adjust on resize
      setTimeout(() => {
        matchNoticeWidth();
      }, 100);
      forceScrollbarVisibility();
    });

    // Add this line near other layout adjustments
    adjustScrollbarVisibility();

    // Add to the end of your DOMContentLoaded handler:
    setTimeout(() => {
        forceScrollbarVisibility();
        
        // Force a complete refresh of filters
        if (dataTable) {
            dataTable.draw();
            updateFilterStatus();
        }
    }, 1000);

  } catch (err) {
    console.error('Error loading XLSX data:', err);
  }
});

$(document).ready(function() {
    // Instructions Toggle - Use the unified function
    $('#instructionsToggle').on('click', function() {
        const detailsElement = $('#instructionsDetails');
        if (detailsElement.prop('open')) {
            detailsElement.removeAttr('open');
            $(this).text('► Instructions');
        } else {
            detailsElement.attr('open', true);
            $(this).text('▼ Instructions');
        }
        adjustContentMargin(); // Use unified margin function
    });

    // Close Instructions Link - Use the unified function
    $('#closeInstructions').on('click', function(e) {
        e.preventDefault();
        $('#instructionsDetails').removeAttr('open');
        $('#instructionsToggle').text('► Instructions');
        adjustContentMargin(); // Use unified margin function
    });

    // Filter status button click handler
    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            clearAllFilters();
        }
    });
    
    // Custom search handler
    $('#customSearch').on('input', function() {
        const searchValue = $(this).val();
        if (dataTable) {
            dataTable.search(searchValue).draw();
        }
        updateFilterStatus();
        updateFilterNotice();
        scheduleTableScrollReset({ smooth: true });
    });
    // Method filter change handler
    $('#methodFilter').on('change', function() {
        const selectedMethod = $(this).val();

        if (dataTable) {
            dataTable.draw();
        }

        updateAreaFilterCounts(selectedMethod);
        updateFilterStatus();
        updateFilterNotice();
        adjustContentMargin();
        scheduleTableScrollReset({ smooth: true });
    });

    // Area filter change handler
    $('#areaFilter').on('change', function() {
        const selectedArea = $(this).val();

        if (dataTable) {
            dataTable.draw();
        }

        if (selectedArea === '') {
            populateMethodFilter(allRows);
        } else {
            updateMethodFilterCounts(selectedArea);
        }

        updateFilterStatus();
        updateFilterNotice();
        adjustContentMargin();
        scheduleTableScrollReset({ smooth: true });
    });

    // Text size controls with updated handlers
    $('#increaseTextSize').on('click', function() {
        if (fontSizeAdjustLevel < MAX_INCREASE) {
            adjustFontSize(1.1);
        }
    });

    $('#decreaseTextSize').on('click', function() {
        if (fontSizeAdjustLevel > MAX_DECREASE) {
            adjustFontSize(0.9);
        }
    });

    $('#resetTextSize').on('click', function() {
        resetFontSize();
    });

    updateFontSizeButtonStates();
});

// Initialize DataTable configuration
function initializeDataTable() {
    dataTable = $('#abstractTable').DataTable({
        paging: false,
        searching: true,
        info: true,
        autoWidth: false,
        ordering: false,
        lengthMenu: [[5, 10, 25, -1], [5, 10, 25, `${allRows.length} (All)`]],
        language: {
            lengthMenu: 'Show up to _MENU_ records per page',
        },
        dom: '<"top"l>rt<"bottom"p><"clear">',
        drawCallback: function(settings) {
            const api = this.api();
            const rows = api.rows({ search: 'applied' }).data().length;

            $('#abstractTable tbody .end-of-records').remove();
            if (rows === 0 || rows > 0) {
                $('#abstractTable tbody').append('<tr class="end-of-records"><td style="text-align: center; font-weight: bold; padding: 10px;">End of records</td></tr>');
            }
            updateFilterNotice();
        }
    });

    // Custom filtering logic
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const methodValue = $('#methodFilter').val();
        const areaValue = $('#areaFilter').val();

        const mainMethod = methodData[dataIndex] || '';
        const researchAreasContent = researchAreasData[dataIndex] || '';

        return methodMatchesFilter(mainMethod, methodValue) && areaMatchesFilter(researchAreasContent, areaValue);
    });

    dataTable.draw(); // Apply filters initially
}

// Populate the table with rows
function populateTable(rows) {
    methodData = [];
    researchAreasData = [];

    const tbody = document.querySelector("#abstractTable tbody");
    tbody.innerHTML = rows.map(row => {
        const [abstractID, mainMethod = '', methodDetail = '', preliminaryTitle = '', preliminaryAbstract = '', ...researchAreas] = row;
        const titleWithID = `<strong>ID: </strong>${abstractID}&nbsp&nbsp <strong>|</strong> &nbsp&nbsp<strong class="method-section">Method:</strong> ${mainMethod}${methodDetail ? ` (${methodDetail})` : ''} &nbsp <br><br> <strong class="abstract-title">${preliminaryTitle}</strong>`;
        const methodAndAreas = `<strong class="areas-section">Areas:</strong> ${researchAreas.filter(Boolean).join('; ')}`;

        methodData.push(mainMethod.toLowerCase().trim());
        researchAreasData.push(researchAreas.filter(Boolean).join('; ').toLowerCase().trim());

        return `<tr><td><br>${titleWithID}<br>${preliminaryAbstract}<br><br>${methodAndAreas}<br><br></td></tr>`;
    }).join('');

    tbody.innerHTML += `<tr class="end-of-records"><td><strong>End of records</strong></td></tr>`;
    console.log("Table populated.");
}

/**
 * Helper: return array of visible original rows (from allRows) based on DataTable filtering.
 * Falls back to allRows if dataTable is not available.
 */
function getVisibleRowsFromDataTable() {
    if (typeof dataTable !== 'undefined' && dataTable && typeof dataTable.rows === 'function' && Array.isArray(allRows) && allRows.length) {
         try {
             // Get indexes of rows that are currently visible (search/filters applied)
             const idxs = dataTable.rows({ search: 'applied' }).indexes().toArray();
             if (idxs && idxs.length) {
                 return idxs.map(i => allRows[i]).filter(Boolean);
             }
             // If no rows matched search, return empty array (counts should show zero)
             return [];
         } catch (e) {
             // fallback
         }
     }
     return Array.isArray(allRows) ? allRows : [];
}

/**
 * Find a column index from the table header by matching header text (case-insensitive).
 * Returns -1 if not found.
 */
function getColumnIndexByHeader(regex) {
    try {
        const headers = document.querySelectorAll('#abstractTable thead th');
        for (let i = 0; i < headers.length; i++) {
            const txt = (headers[i].textContent || '').trim().toLowerCase();
            if (regex.test(txt)) return i;
        }
    } catch (e) { /* ignore */ }
    return -1;
}

/**
 * Build a normalized value for a row at a given column index or object key.
 */
function getRowValue(row, colIndexOrKey) {
    if (row == null) return '';
    if (typeof colIndexOrKey === 'number') {
        if (Array.isArray(row)) return (row[colIndexOrKey] || '').toString().trim();
        // if row is object, try to map to header name later
        return '';
    }
    // colIndexOrKey as string (object property)
    return (row[colIndexOrKey] || '').toString().trim();
}

function normalizeString(value) {
    return (value == null ? '' : value).toString().trim().toLowerCase();
}

function extractAreas(row) {
    if (Array.isArray(row)) {
        return row.slice(5).filter(Boolean).map(area => area.toString().trim());
    }
    if (row && typeof row === 'object') {
        const possibleAreas = Object.keys(row)
            .filter(key => /area|discipline/i.test(key))
            .map(key => row[key]);
        return possibleAreas.filter(Boolean).map(area => area.toString().trim());
    }
    return [];
}

function getRowIdentifier(row, fallbackIndex) {
    if (Array.isArray(row)) {
        const idCandidate = row[0];
        if (idCandidate !== undefined && idCandidate !== null && idCandidate !== '') {
            return idCandidate.toString().trim();
        }
    }

    if (row && typeof row === 'object') {
        const keys = ['id', 'ID', 'Id', 'abstractID', 'AbstractID'];
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return row[key].toString().trim();
            }
        }
    }

    return `row-${fallbackIndex}`;
}

function rowMatchesSearch(row, searchTerm) {
    if (!searchTerm) {
        return true;
    }

    const normalizedTerm = searchTerm.toLowerCase();

    if (Array.isArray(row)) {
        return row.some(cell => (cell || '').toString().toLowerCase().includes(normalizedTerm));
    }

    if (row && typeof row === 'object') {
        return Object.values(row).some(value => (value || '').toString().toLowerCase().includes(normalizedTerm));
    }

    return false;
}

function methodMatchesFilter(mainMethodValue, filterValue) {
    const method = normalizeString(mainMethodValue);
    const target = normalizeString(filterValue);

    switch (target) {
        case '':
            return true;
        case 'all-quantitative':
            return method === 'quantitative' || method === 'meta-analysis' || method === 'mixed-methods';
        case 'meta-analysis':
            return method === 'meta-analysis';
        case 'mixed-methods-quantitative':
            return method === 'mixed-methods';
        case 'all-qualitative':
            return method === 'qualitative' || method === 'meta-synthesis' || method === 'mixed-methods';
        case 'meta-synthesis':
            return method === 'meta-synthesis';
        case 'mixed-methods-qualitative':
            return method === 'mixed-methods';
        default:
            return method === target;
    }
}

function areaMatchesFilter(areaSource, filterValue) {
    const target = normalizeString(filterValue);
    if (!target) {
        return true;
    }

    if (!areaSource) {
        return false;
    }

    if (Array.isArray(areaSource)) {
        return areaSource.some(area => normalizeString(area) === target);
    }

    return areaSource.split('; ').some(area => normalizeString(area) === target);
}

/**
 * Rebuild method filter options from the provided rows (uses visible rows when possible).
 * Preserves currently selected value when possible.
 */
function populateMethodFilter(rows) {
    const sourceRows = getVisibleRowsFromDataTable().length ? getVisibleRowsFromDataTable() : (rows || []);
    // try header lookup first, fall back to known data column index (method = 1)
    let methodColIndex = getColumnIndexByHeader(/method/);
    if (methodColIndex < 0) methodColIndex = 1; // fallback to array column index used in populateTable

    // raw method counts
    const counts = {};
    sourceRows.forEach(r => {
        const methodVal = methodColIndex >= 0 ? getRowValue(r, methodColIndex) : (
            (r && typeof r === 'object' && r.Method) ? r.Method.toString().trim() : ''
        );
        const norm = (methodVal || 'Unspecified').toLowerCase();
        counts[norm] = (counts[norm] || 0) + 1;
    });

    // grouped counts used by filtering logic
    const grouped = {
        'all-quantitative': 0,
        'all-qualitative': 0,
        'meta-analysis': counts['meta-analysis'] || 0,
        'meta-synthesis': counts['meta-synthesis'] || 0,
        'mixed-methods': counts['mixed-methods'] || 0
    };
    grouped['all-quantitative'] = (counts['quantitative'] || 0) + grouped['meta-analysis'] + grouped['mixed-methods'];
    grouped['all-qualitative'] = (counts['qualitative'] || 0) + grouped['meta-synthesis'] + grouped['mixed-methods'];

    const select = document.getElementById('methodFilter');
    if (!select) return;
    const prev = select.value;

    // rebuild options
    select.innerHTML = '';
    // All option
    const total = Object.values(counts).reduce((a,b)=>a+b,0);
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.text = 'All research methods';
    select.appendChild(allOpt);

    // grouped options first (stable order)
    const groupedOrder = ['all-quantitative','meta-analysis','mixed-methods','all-qualitative','meta-synthesis'];
    groupedOrder.forEach(key => {
        if (grouped[key] !== undefined) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.text = `${key} [~${grouped[key]} matches]`;
            select.appendChild(opt);
        }
    });

    // then add any other raw methods not covered above
    Object.keys(counts).sort().forEach(k => {
        if (['quantitative','qualitative','meta-analysis','meta-synthesis','mixed-methods','unspecified'].includes(k)) return;
        const opt = document.createElement('option');
        opt.value = k;
        opt.text = `${k} [~${counts[k]} matches]`;
        select.appendChild(opt);
    });

    // restore previous selection if still present
    if (prev) {
        const exists = Array.from(select.options).some(o => o.value === prev);
        select.value = exists ? prev : '';
    }
}

function populateAreaFilter(rows) {
    const select = document.getElementById('areaFilter');
    if (!select) return;

    const sourceRows = getVisibleRowsFromDataTable().length ? getVisibleRowsFromDataTable() : (rows || []);
    const areaMatches = new Map();
    const labels = {};

    sourceRows.forEach((r, rowIndex) => {
        const rowId = getRowIdentifier(r, rowIndex);
        extractAreas(r).forEach(area => {
            const key = normalizeString(area);
            if (!key) return;
            if (!areaMatches.has(key)) {
                areaMatches.set(key, new Set());
            }
            areaMatches.get(key).add(rowId);
            if (!labels[key]) {
                labels[key] = area;
            }
        });
    });

    const prev = select.value;
    select.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.text = 'All research areas';
    select.appendChild(allOpt);

    Array.from(areaMatches.keys()).sort().forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.text = `${labels[key]} [~${areaMatches.get(key).size} matches]`;
        opt.dataset.label = labels[key];
        select.appendChild(opt);
    });

    if (prev) {
        const exists = Array.from(select.options).some(o => o.value === prev);
        select.value = exists ? prev : '';
    }
}

/**
 * Update the method filter counts based on currently visible rows,
 * optionally filtered by a selected area value.
 */
function updateMethodFilterCounts(selectedArea) {
    const select = document.getElementById('methodFilter');
    if (!select) return;

    const searchTerm = normalizeString($('#customSearch').val());
    const areaKey = normalizeString(selectedArea);
    const rows = Array.isArray(allRows) ? allRows : [];

    const counts = {};

    rows.forEach((row, rowIndex) => {
        if (!rowMatchesSearch(row, searchTerm)) {
            return;
        }

        if (areaKey) {
            const areas = extractAreas(row).map(area => normalizeString(area));
            if (!areas.includes(areaKey)) {
                return;
            }
        }

        const methodVal = getRowValue(row, 1) || 'Unspecified';
        const key = normalizeString(methodVal) || 'unspecified';
        const rowId = getRowIdentifier(row, rowIndex);

        if (!counts[key]) {
            counts[key] = new Set();
        }
        counts[key].add(rowId);
    });

    const grouped = {
        'all-quantitative': 0,
        'meta-analysis': counts['meta-analysis'] ? counts['meta-analysis'].size : 0,
        'mixed-methods': counts['mixed-methods'] ? counts['mixed-methods'].size : 0,
        'all-qualitative': 0,
        'meta-synthesis': counts['meta-synthesis'] ? counts['meta-synthesis'].size : 0
    };
    grouped['all-quantitative'] = (counts['quantitative'] ? counts['quantitative'].size : 0) + grouped['meta-analysis'] + grouped['mixed-methods'];
    grouped['all-qualitative'] = (counts['qualitative'] ? counts['qualitative'].size : 0) + grouped['meta-synthesis'] + grouped['mixed-methods'];

    Array.from(select.options).forEach(opt => {
        if (!opt.value) {
            opt.text = 'All research methods';
            return;
        }

        if (grouped[opt.value] !== undefined) {
            opt.text = `${opt.value} [~${grouped[opt.value]} matches]`;
            return;
        }

        const set = counts[normalizeString(opt.value)];
        const size = set ? set.size : 0;
        opt.text = `${opt.value} [~${size} matches]`;
    });
}

function updateAreaFilterCounts(selectedMethod) {
    const select = document.getElementById('areaFilter');
    if (!select) return;

    const searchTerm = normalizeString($('#customSearch').val());
    const methodKey = normalizeString(selectedMethod);
    const rows = Array.isArray(allRows) ? allRows : [];

    const areaMatches = new Map();
    const labels = {};

    rows.forEach((row, rowIndex) => {
        if (!rowMatchesSearch(row, searchTerm)) {
            return;
        }

        const mainMethod = getRowValue(row, 1);
        if (!methodMatchesFilter(mainMethod, methodKey)) {
            return;
        }

        const rowId = getRowIdentifier(row, rowIndex);
        extractAreas(row).forEach(area => {
            const key = normalizeString(area);
            if (!key) return;
            if (!areaMatches.has(key)) {
                areaMatches.set(key, new Set());
            }
            areaMatches.get(key).add(rowId);
            if (!labels[key]) {
                labels[key] = area;
            }
        });
    });

    Array.from(select.options).forEach(opt => {
        if (!opt.value) {
            opt.text = 'All research areas';
            return;
        }

        const key = opt.value;
        const label = opt.dataset.label || opt.text.split(' [~')[0];
        const set = areaMatches.get(key);
        const c = set ? set.size : 0;
        opt.text = `${label} [~${c} matches]`;
        if (!opt.dataset.label && labels[key]) {
            opt.dataset.label = labels[key];
        }
    });
}

function updateFilterStatus() {
    const searchValue = ($('#customSearch').val() || '').toString().trim();
    const methodValue = $('#methodFilter').val() || '';
    const areaValue = $('#areaFilter').val() || '';

    const button = $('#filterStatusBtn');
    if (!button.length) return;

    const filterActive = !!(searchValue || methodValue || areaValue);

    if (filterActive) {
        button.removeClass('green').addClass('red').text('Click to clear all filters');
    } else {
        button.removeClass('red').addClass('green').text('No filters active');
    }
}

function updateFilterNotice() {
    const notice = $('#filterNotice');
    if (!notice.length) return;

    const searchValue = ($('#customSearch').val() || '').toString().trim();
    const methodValue = $('#methodFilter').val() || '';
    const areaValue = $('#areaFilter').val() || '';

    const filters = [];

    if (searchValue) {
        filters.push(`Search: "${searchValue}"`);
    }

    if (methodValue) {
        const selectedMethod = $('#methodFilter option:selected').text().split(' [')[0];
        filters.push(`Method: "${selectedMethod}"`);
    }

    if (areaValue) {
        const selectedAreaOption = $('#areaFilter option:selected');
        const areaLabel = selectedAreaOption.data('label') || selectedAreaOption.text().split(' [')[0] || areaValue;
        filters.push(`Area: "${areaLabel}"`);
    }

    if (!filters.length) {
        notice.hide();
        adjustContentMargin();
        return;
    }

    let filteredRowCount = 0;
    if (dataTable) {
        const data = dataTable.rows({ search: 'applied' }).data().toArray();
        filteredRowCount = data.filter(row => {
            const value = Array.isArray(row) ? row[0] : row;
            return typeof value === 'string' && !value.toLowerCase().includes('end of records');
        }).length;
    }

    if (filteredRowCount > 0) {
        notice
            .html(`<strong>Active Filters:</strong> ${filters.join(' <strong>+</strong> ')} | <strong>${filteredRowCount} record(s) found.</strong>`)
            .show();
    } else {
        notice
            .html(`
                <strong>No results</strong> found with the current filter <u>combination</u>.<br>
                <strong>Active Filters:</strong> ${filters.join(' <strong>+</strong> ')}<br>
                Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">clear all</a> filters.
            `)
            .show();

        notice.find('#clearAllFiltersLink')
            .off('click')
            .on('click', function(e) {
                e.preventDefault();
                clearAllFilters();
            });
    }

    matchNoticeWidth();
    adjustContentMargin();
}
function clearAllFilters() {
    if (isResettingFilters) return;
    isResettingFilters = true;

    // clear inputs/UI
    const customSearch = document.getElementById('customSearch');
    if (customSearch) customSearch.value = '';
    const methodFilterEl = document.getElementById('methodFilter');
    const areaFilterEl = document.getElementById('areaFilter');
    if (methodFilterEl) methodFilterEl.value = '';
    if (areaFilterEl) areaFilterEl.value = '';

    // clear DataTable search and redraw
    if (dataTable) {
        dataTable.search('').columns().search('').draw();
    }

    // After DataTable redraw, rebuild filters from visible rows
    setTimeout(() => {
        populateMethodFilter(allRows);
        populateAreaFilter(allRows);
        if (dataTable) {
            dataTable.draw(false);
        }
        updateFilterStatus && updateFilterStatus();
        updateFilterNotice && updateFilterNotice();
        adjustContentMargin && adjustContentMargin();
        scheduleTableScrollReset({ smooth: false });
        isResettingFilters = false;
    }, 80);
} // end clearAllFilters()

/**
 * Less intrusive scrollbar helper: adds bottom padding when content shorter than viewport,
 * and ensures fixed bars use full width.
 */
function forceScrollbarVisibility() {
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    if (docHeight <= windowHeight) {
        document.body.style.paddingBottom = '80px';
    } else {
        document.body.style.paddingBottom = '';
    }

    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.querySelectorAll('.blue-bar, .fixed-header').forEach(el => {
        if (scrollbarWidth > 0) {
            el.style.marginRight = `${scrollbarWidth}px`;
        } else {
            el.style.removeProperty('margin-right');
        }
    });
}

// duplicate area/filter helpers removed — single canonical copy lives near populateMethodFilter
