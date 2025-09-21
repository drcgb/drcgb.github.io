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
    
    // Use a more powerful selector that targets everything
    $('body, table, #abstractTable, #abstractTable *, th, td, tr, tbody, thead, .dataTables_wrapper, .filter-status-btn, .filter-notice').css('font-size', function() {
        return (parseFloat($(this).css('font-size')) * factor) + 'px';
    });
    
    // Force direct style application to table cells with !important
    $('#abstractTable td, #abstractTable th').attr('style', function(i, style) {
        return (style || '') + 'font-size: ' + (parseFloat($(this).css('font-size')) * factor) + 'px !important;';
    });
    
    // Store the current level and factor in localStorage
    localStorage.setItem('fontSizeAdjustLevel', fontSizeAdjustLevel.toString());
    const currentFactor = parseFloat(localStorage.getItem('fontSizeFactor') || '1');
    localStorage.setItem('fontSizeFactor', (currentFactor * factor).toString());
    
    // Update button states
    updateFontSizeButtonStates();
}

function resetFontSize() {
    // Should match the selectors from adjustFontSize()
    $('body, table, #abstractTable, #abstractTable *, th, td, tr, tbody, thead, .dataTables_wrapper, .filter-status-btn, .filter-notice').css('font-size', '');
    
    // Remove inline styles with !important
    $('#abstractTable td, #abstractTable th').removeAttr('style');
    
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

    // Add a small alias so DOMContentLoaded can call adjustScrollbarVisibility()
    function adjustScrollbarVisibility() {
        // alias to the safer helper
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
    });
    
    // Method filter change handler
    $('#methodFilter').on('change', function() {
        const selectedMethod = $(this).val();
        updateAreaFilterCounts(selectedMethod);
        if (dataTable) {
            dataTable.draw();
        }
        updateFilterStatus();
        adjustContentMargin(); // Force margin adjustment
    });
    
    // Area filter change handler
    $('#areaFilter').on('change', function() {
        const selectedArea = $(this).val();
        
        // If selecting "All research areas", we need to properly update method filter counts
        if (selectedArea === '') {
            // We need to properly refresh the method filter with correct counts
            populateMethodFilter(allRows);
            
            // Just update the table directly
            if (dataTable) {
                dataTable.draw();
            }
            updateFilterStatus();
        } else {
            // Normal behavior for selecting a specific area
            updateMethodFilterCounts(selectedArea);
            if (dataTable) {
                dataTable.draw();
            }
            updateFilterStatus();
        }

        // Add this to both if/else branches:
        adjustContentMargin(); // Force margin adjustment
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
    
    // Initialize button states
    updateFontSizeButtonStates();
});

// Initialize DataTable
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
        }
    });

    // Custom filtering logic
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const methodValue = $('#methodFilter').val().toLowerCase().trim();
        const areaValue = $('#areaFilter').val().toLowerCase().trim();

        const mainMethod = methodData[dataIndex] ? methodData[dataIndex].toLowerCase().trim() : '';
        const researchAreasContent = researchAreasData[dataIndex] ? researchAreasData[dataIndex].toLowerCase().trim() : '';

        let methodMatch = false;

        switch (methodValue) {
            case '':
                methodMatch = true;
                break;
            case 'all-quantitative':
                methodMatch = mainMethod === 'quantitative' || mainMethod === 'meta-analysis' || mainMethod === 'mixed-methods';
                break;
            case 'meta-analysis':
                methodMatch = mainMethod === 'meta-analysis';
                break;
            case 'mixed-methods-quantitative':
                methodMatch = mainMethod === 'mixed-methods';
                break;
            case 'all-qualitative':
                methodMatch = mainMethod === 'qualitative' || mainMethod === 'meta-synthesis' || mainMethod === 'mixed-methods';
                break;
            case 'meta-synthesis':
                methodMatch = mainMethod === 'meta-synthesis';
                break;
            case 'mixed-methods-qualitative':
                methodMatch = mainMethod === 'mixed-methods';
                break;
        }

        const areaMatch = areaValue === '' || researchAreasContent.split('; ').includes(areaValue);

        return methodMatch && areaMatch;
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
    if (window.dataTable && typeof dataTable.rows === 'function' && Array.isArray(allRows) && allRows.length) {
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
    allOpt.text = `All research methods [~${total} matches]`;
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

/**
 * Update the method filter counts based on currently visible rows,
 * optionally filtered by a selected area value.
 */
function updateMethodFilterCounts(selectedArea) {
    const visible = getVisibleRowsFromDataTable();
    // try header lookup first, fall back to known data column indexes
    let methodColIndex = getColumnIndexByHeader(/method/);
    if (methodColIndex < 0) methodColIndex = 1; // mainMethod is at index 1 in allRows
    let areaColIndex = getColumnIndexByHeader(/area|research area|discipline/);
    if (areaColIndex < 0) areaColIndex = 5; // research areas start at index 5 in row arrays
    const counts = {};

    visible.forEach(r => {
        // If an area is selected, skip rows that don't match
        if (selectedArea && selectedArea !== '') {
            // when rows are arrays, research areas are from index 5 onward — build a string to compare
            let areaVal = '';
            if (Array.isArray(r)) {
                areaVal = r.slice(5).filter(Boolean).join('; ').toString().trim();
            } else {
                areaVal = areaColIndex >= 0 ? getRowValue(r, areaColIndex) : ((r && r.Area) ? r.Area.toString().trim() : '');
            }
            if ((areaVal || '').toLowerCase() !== selectedArea.toLowerCase()) return;
        }

        const methodVal = methodColIndex >= 0 ? getRowValue(r, methodColIndex) : (
            (r && typeof r === 'object' && r.Method) ? r.Method.toString().trim() : ''
        );
        const key = (methodVal || 'Unspecified').toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
    });

    const select = document.getElementById('methodFilter');
    if (!select) return;

    Array.from(select.options).forEach(opt => {
        if (!opt.value) {
            // "All" option — compute total
            const tot = Object.values(counts).reduce((a,b)=>a+b,0);
            opt.text = `All research methods [~${tot} matches]`;
            return;
        }
        const c = counts[opt.value.toLowerCase()] || 0;
        opt.text = `${opt.value} [~${c} matches]`;
    });
}

/**
 * Improved clearAllFilters: clear UI, clear DataTable search, then rebuild filters from the
 * resulting visible rows (with a tiny delay to let DataTable update).
 */
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
        if (dataTable) dataTable.draw(false);
        updateFilterStatus && updateFilterStatus();
        adjustContentMargin && adjustContentMargin();
        isResettingFilters = false;
    }, 80);
}

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
    document.querySelectorAll('.blue-bar, .fixed-header').forEach(el => {
        el.style.width = '100%';
        el.style.maxWidth = '100%';
    });
}

