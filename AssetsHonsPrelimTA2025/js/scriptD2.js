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

// Populate the method filter dropdown
function populateMethodFilter(rows) {
    const methodCounts = {
        quantitative: 0,
        metaAnalysis: 0,
        mixedMethodsQuantitative: 0,
        qualitative: 0,
        metaSynthesis: 0,
        mixedMethodsQualitative: 0
    };

    rows.forEach(row => {
        const mainMethod = row[1]?.trim().toLowerCase();
        if (mainMethod) {
            switch (mainMethod) {
                case 'quantitative':
                    methodCounts.quantitative += 1;
                    break;
                case 'meta-analysis':
                    methodCounts.metaAnalysis += 1;
                    break;
                case 'mixed-methods':
                    methodCounts.mixedMethodsQuantitative += 1;
                    methodCounts.mixedMethodsQualitative += 1;
                    break;
                case 'qualitative':
                    methodCounts.qualitative += 1;
                    break;
                case 'meta-synthesis':
                    methodCounts.metaSynthesis += 1;
                    break;
            }
        }
    });

    const methodFilter = document.getElementById("methodFilter");
    methodFilter.innerHTML = `
        <option value="" style="font-weight: bold;">All Methods</option>
        <optgroup label="Quantitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;All Quantitative [~${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} matches]</option>
            <option value="meta-analysis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Analysis [~${methodCounts.metaAnalysis} matches]</option>
            <option value="mixed-methods-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [~${methodCounts.mixedMethodsQuantitative} matches]</option>
        <optgroup label="Qualitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;All Qualitative [~${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} matches]</option>
            <option value="meta-synthesis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Synthesis [~${methodCounts.metaSynthesis} matches]</option>
            <option value="mixed-methods-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [~${methodCounts.mixedMethodsQualitative} matches]</option>
    `;

    console.log("Method filter populated.");
}

// Populate the area filter dropdown
function populateAreaFilter(rows) {
    console.log("Populating area filter...");
    const areaCountsByMethod = {};

    rows.forEach(row => {
        const mainMethod = row[1]?.trim().toLowerCase();
        const researchAreas = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '');

        researchAreas.forEach(area => {
            if (area) {
                if (!areaCountsByMethod[area]) {
                    areaCountsByMethod[area] = {
                        all: 0,
                        quantitative: 0,
                        metaAnalysis: 0,
                        mixedMethodsQuantitative: 0,
                        qualitative: 0,
                        metaSynthesis: 0,
                        mixedMethodsQualitative: 0
                    };
                }

                areaCountsByMethod[area].all += 1; // General count

                // Increment count based on the method
                switch (mainMethod) {
                    case 'quantitative':
                        areaCountsByMethod[area].quantitative += 1;
                        break;
                    case 'meta-analysis':
                        areaCountsByMethod[area].metaAnalysis += 1;
                        break;
                    case 'mixed-methods':
                        areaCountsByMethod[area].mixedMethodsQuantitative += 1;
                        areaCountsByMethod[area].mixedMethodsQualitative += 1;
                        break;
                    case 'qualitative':
                        areaCountsByMethod[area].qualitative += 1;
                        break;
                    case 'meta-synthesis':
                        areaCountsByMethod[area].metaSynthesis += 1;
                        break;
                }
            }
        });
    });

    const sortedAreas = Object.entries(areaCountsByMethod).sort(([a], [b]) => a.localeCompare(b));
    const areaFilter = document.getElementById("areaFilter");
    
    // Store the calculated counts in a global variable to be accessed later
    window.areaCountsByMethod = areaCountsByMethod;

    areaFilter.innerHTML = `<option value="">All Research Areas</option>`;
    areaFilter.innerHTML += sortedAreas.map(([area, counts]) => {
        return `<option value="${area}">${area} [~${counts.all} matches]</option>`;
    }).join('');
    
    console.log("Area filter populated.");
}

function updateAreaFilterCounts(selectedMethod) {
    // Get references
    const areaFilter = document.getElementById("areaFilter");
    const areaCountsByMethod = window.areaCountsByMethod;
    
    // If we don't have area counts data, rebuild it
    if (!areaCountsByMethod) {
        populateAreaFilter(allRows);
        return;
    }

    // Loop through each option and update the count
    Array.from(areaFilter.options).forEach(option => {
        const area = option.value;

        if (area && areaCountsByMethod[area]) {
            let count = 0;

            // Calculate count based on selected method
            switch (selectedMethod) {
                case 'all-quantitative':
                    count = areaCountsByMethod[area].quantitative + 
                            areaCountsByMethod[area].metaAnalysis + 
                            areaCountsByMethod[area].mixedMethodsQuantitative;
                    break;
                case 'meta-analysis':
                    count = areaCountsByMethod[area].metaAnalysis;
                    break;
                case 'mixed-methods-quantitative':
                    count = areaCountsByMethod[area].mixedMethodsQuantitative;
                    break;
                case 'all-qualitative':
                    count = areaCountsByMethod[area].qualitative + 
                            areaCountsByMethod[area].metaSynthesis + 
                            areaCountsByMethod[area].mixedMethodsQualitative;
                    break;
                case 'meta-synthesis':
                    count = areaCountsByMethod[area].metaSynthesis;
                    break;
                case 'mixed-methods-qualitative':
                    count = areaCountsByMethod[area].mixedMethodsQualitative;
                    break;
                default:
                    count = areaCountsByMethod[area].all; // Default to all
                    break;
            }

            // Add an asterisk if count is greater than 0
            let matchText = count === 0 ? `[~${count} matches]` : `[~${count} matches]*`;
            option.text = `${area} ${matchText}`;
        }
    });

    // Force UI updates
    updateFilterStatus();
}

function updateMethodFilterCounts(selectedArea) {
    // Prevent recursive calls during reset
    if (isResettingFilters) return;
    
    const methodFilter = document.getElementById("methodFilter");
    const areaFilter = document.getElementById("areaFilter");
    const areaCountsByMethod = window.areaCountsByMethod;

    // If no area is selected (All Research Areas), reset to original state
    if (!selectedArea || selectedArea === '') {
        isResettingFilters = true; // Set flag to prevent recursive calls
        
        // Store current method selection
        const currentMethodValue = methodFilter.value;
        
        // Update method filter counts without resetting selection
        populateMethodFilter(allRows);
        
        // Restore method selection instead of resetting
        methodFilter.value = currentMethodValue;
        
        // Update filter status and notice - ADD THIS
        updateFilterStatus();
        
        // Force a table redraw to ensure filters are properly applied
        if (dataTable) {
            dataTable.draw();
        }
        
        isResettingFilters = false; // Clear flag
        return;
    }

    // Check if the selected area exists in our data
    if (!areaCountsByMethod || !areaCountsByMethod[selectedArea]) {
        isResettingFilters = true; // Set flag to prevent recursive calls
        
        populateMethodFilter(allRows);
        methodFilter.value = '';
        
        // Reset area filter to original state
        populateAreaFilter(allRows);
        areaFilter.value = ''; // Reset to "All Research Areas"
        
        // Update filter status and notice - ADD THIS
        updateFilterStatus();
        
        if (dataTable) {
            dataTable.draw();
        }
        
        isResettingFilters = false; // Clear flag
        return;
    }

    // Get the current selected method to preserve it
    const currentMethodValue = methodFilter.value;

    // Recalculate counts for the selected area
    const methodCounts = {
        quantitative: areaCountsByMethod[selectedArea].quantitative || 0,
        metaAnalysis: areaCountsByMethod[selectedArea].metaAnalysis || 0,
        mixedMethodsQuantitative: areaCountsByMethod[selectedArea].mixedMethodsQuantitative || 0,
        qualitative: areaCountsByMethod[selectedArea].qualitative || 0,
        metaSynthesis: areaCountsByMethod[selectedArea].metaSynthesis || 0,
        mixedMethodsQualitative: areaCountsByMethod[selectedArea].mixedMethodsQualitative || 0
    };

    // Rebuild the method filter with updated counts
    methodFilter.innerHTML = `
        <option value="" style="font-weight: bold;">All Methods</option>
        <optgroup label="Quantitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;All Quantitative [~${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} matches]${(methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative) > 0 ? '*' : ''}</option>
            <option value="meta-analysis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Analysis [~${methodCounts.metaAnalysis} matches]${methodCounts.metaAnalysis > 0 ? '*' : ''}</option>
            <option value="mixed-methods-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [~${methodCounts.mixedMethodsQuantitative} matches]${methodCounts.mixedMethodsQuantitative > 0 ? '*' : ''}</option>
        <optgroup label="Qualitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;All Qualitative [~${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} matches]${(methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative) > 0 ? '*' : ''}</option>
            <option value="meta-synthesis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Synthesis [~${methodCounts.metaSynthesis} matches]${methodCounts.metaSynthesis > 0 ? '*' : ''}</option>
            <option value="mixed-methods-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [~${methodCounts.mixedMethodsQualitative} matches]${methodCounts.mixedMethodsQualitative > 0 ? '*' : ''}</option>
    `;

    // Restore the previously selected method if it's still valid
    if (currentMethodValue) {
        methodFilter.value = currentMethodValue;
    }
    
    // Update filter status and notice - ADD THIS
    updateFilterStatus();
}

function updateFilterStatus() {
    const methodFilter = document.getElementById("methodFilter");
    const areaFilter = document.getElementById("areaFilter");
    const customSearch = document.getElementById("customSearch");
    const filterStatusBtn = document.getElementById("filterStatusBtn");
    const filterNotice = document.getElementById("filterNotice");

    // Safety check
    if (!methodFilter || !areaFilter || !customSearch || !filterStatusBtn || !filterNotice) {
        return;
    }

    const hasMethodFilter = methodFilter.value !== '';
    const hasAreaFilter = areaFilter.value !== '';
    const hasSearchFilter = customSearch.value.trim() !== '';
    const hasAnyFilter = hasMethodFilter || hasAreaFilter || hasSearchFilter;

    // Check current filter notice visibility BEFORE making changes
    const wasVisible = filterNotice.style.display === "block";

    // Use requestAnimationFrame for Chrome compatibility
    requestAnimationFrame(() => {
        if (hasAnyFilter) {
            // Active filters - show red button and notice
            filterStatusBtn.textContent = "Clear all filters";
            filterStatusBtn.className = "filter-status-btn red";
            
            let filterText = "Active filters: ";
            let filters = [];
            
            if (hasSearchFilter) filters.push(`Search: "${customSearch.value}"`);
            if (hasMethodFilter) {
                const methodText = methodFilter.options[methodFilter.selectedIndex].text.trim();
                filters.push(`Method: ${methodText}`);
            }
            if (hasAreaFilter) {
                const areaText = areaFilter.options[areaFilter.selectedIndex].text.trim();
                filters.push(`Area: ${areaText}`);
            }
            
            filterNotice.textContent = filterText + filters.join(", ");
            filterNotice.style.display = "block";
            
        } else {
            // No active filters - show green button and hide notice
            filterStatusBtn.textContent = "No filters active";
            filterStatusBtn.className = "filter-status-btn green";
            filterNotice.style.display = "none";
        }
        
        // Only adjust margin if filter notice visibility actually changed
        const isNowVisible = filterNotice.style.display === "block";
        if (wasVisible !== isNowVisible) {
            adjustContentMargin();
        }
    });
}

function clearAllFilters() {
    // Set the resetting flag to prevent recursive calls
    isResettingFilters = true;
    
    // Get references to all filter elements
    const methodFilter = document.getElementById("methodFilter");
    const areaFilter = document.getElementById("areaFilter");
    const customSearch = document.getElementById("customSearch");
    
    // Clear search input and DataTable search
    customSearch.value = '';
    if (dataTable) {
        dataTable.search('').draw();
    }
    
    // Clear all filter values - important to do this BEFORE rebuilding filters
    methodFilter.value = '';
    areaFilter.value = '';
    
    // Completely rebuild filters from original data
    setTimeout(() => {
        // Rebuild filters from scratch with original data
        populateMethodFilter(allRows);
        populateAreaFilter(allRows);
        
        // Update filter status
        updateFilterStatus();
        
        // Force a complete redraw of the table
        if (dataTable) {
            dataTable.draw();
        }
        
        // Force margin adjustment
        adjustContentMargin();
        
        // Clear the resetting flag
        isResettingFilters = false;
    }, 50);
}

// Add this improved function to ensure window scrollbar is always visible
function forceScrollbarVisibility() {
    // Force body to have enough content to show scrollbar
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    if (docHeight <= windowHeight) {
        // Add padding to force scrollbar to appear
        document.body.style.paddingBottom = '100px';
    }
    
    // Force scrollbar width in UI calculations
    document.documentElement.style.setProperty('--scrollbar-width', '24px');
    
    // Ensure fixed elements don't overlap scrollbar
    document.querySelectorAll('.blue-bar, .fixed-header').forEach(el => {
        el.style.width = 'calc(100% - 24px)';
        el.style.maxWidth = 'calc(100% - 24px)';
    });
}

// Call this function at appropriate times
document.addEventListener('DOMContentLoaded', function() {
    // Add to existing DOMContentLoaded event
    setTimeout(forceScrollbarVisibility, 100);
    
    // Ensure it runs after window resize as well
    window.addEventListener('resize', function() {
        setTimeout(forceScrollbarVisibility, 100);
    });
});

