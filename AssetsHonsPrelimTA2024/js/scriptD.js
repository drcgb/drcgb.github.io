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

// Function to adjust content margin
function adjustContentMargin() {
  requestAnimationFrame(() => {
    const headerHeight = $('.fixed-header').outerHeight(true) + 40;
    const totalMargin = headerHeight;

    // Set the margin-top for the content area
    $('.content').css('margin-top', totalMargin);
  });
}

// Event listener for DOMContentLoaded to handle data loading and initialization
document.addEventListener("DOMContentLoaded", async () => {
  // Step 1: Set toggleLogging to 'true' to enable console logging to debug the data loading process
  toggleLogging(false); // Turn logging on(true)/off(false) for this section

  try {
    console.log("Loading XLSX data...");
    const response = await fetch("AssetsHonsPrelimTA2024/data/Prelim_Hons_Thesis_Titles_and_Abstracts_2024_FinalX.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
    console.log("Data loaded:", allRows);

    // Step 2: Disable logging after debugging
    toggleLogging(false); // Turn console logging on(true)/off(false) after the debugging is done

    // Populate and initialize components
    populateTable(allRows);
    populateMethodFilter(allRows);
    populateAreaFilter(allRows);
    initializeDataTable();

    requestAnimationFrame(() => {
      adjustContentMargin(); // Adjust after the initial load
      matchNoticeWidth();
    });

    // Adjustments on window resize
    window.addEventListener('resize', () => {
      adjustContentMargin(); // Adjust margin on window resize
      matchNoticeWidth(); // Match filter notice width to search input
    });

  } catch (err) {
    console.error('Error loading XLSX data:', err); // Keep error logging enabled
  }
});

$(document).ready(function() {
    // Adjust content margin initially
    adjustContentMargin();

    // Instructions Toggle
    $('#instructionsToggle').on('click', function() {
        const detailsElement = $('#instructionsDetails');
        if (detailsElement.prop('open')) {
            detailsElement.removeAttr('open');
            $(this).text('► Instructions');
        } else {
            detailsElement.attr('open', true);
            $(this).text('▼ Instructions');
        }
        adjustContentMargin(); // Adjust margin when instructions toggle changes
    });

    // Close Instructions Link
    $('#closeInstructions').on('click', function(e) {
        e.preventDefault();
        $('#instructionsDetails').removeAttr('open');
        $('#instructionsToggle').text('► Instructions');
        adjustContentMargin(); // Adjust margin when instructions are closed
    });
});

function adjustContentMargin() {
    const filterNoticeHeight = $('#filterNotice').is(':visible') ? $('#filterNotice').outerHeight(true) : 0;
    const headerHeight = $('.fixed-header').outerHeight(true);
    const totalMargin = headerHeight + (filterNoticeHeight > 0 ? filterNoticeHeight - 40 : 0);

    $('.content').css('margin-top', totalMargin);
}


function initializeDataTable() {
    console.log("Initializing DataTable...");

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
    console.log("Populating table...");
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
    console.log("Populating method filter...");
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
    const areaFilter = document.getElementById("areaFilter");
    const areaCountsByMethod = window.areaCountsByMethod;

    Array.from(areaFilter.options).forEach(option => {
        const area = option.value;

        if (area && areaCountsByMethod[area]) {
            let count = 0;

            switch (selectedMethod) {
                case 'all-quantitative':
                    count = areaCountsByMethod[area].quantitative + areaCountsByMethod[area].metaAnalysis + areaCountsByMethod[area].mixedMethodsQuantitative;
                    break;
                case 'meta-analysis':
                    count = areaCountsByMethod[area].metaAnalysis;
                    break;
                case 'mixed-methods-quantitative':
                    count = areaCountsByMethod[area].mixedMethodsQuantitative;
                    break;
                case 'all-qualitative':
                    count = areaCountsByMethod[area].qualitative + areaCountsByMethod[area].metaSynthesis + areaCountsByMethod[area].mixedMethodsQualitative;
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

            // Add an asterisk if the count is greater than 0
            let matchText = count === 0 ? `[~${count} matches]` : `[~${count} matches]*`;
            option.text = `${area} ${matchText}`;
        }
    });
}

function updateMethodFilterCounts(selectedArea) {
    const methodFilter = document.getElementById("methodFilter");
    const areaCountsByMethod = window.areaCountsByMethod;

    Array.from(methodFilter.options).forEach(option => {
        const methodValue = option.value;

        if (methodValue) {
            let count = 0;

            switch (methodValue) {
                case 'all-quantitative':
                    count = areaCountsByMethod[selectedArea].quantitative + areaCountsByMethod[selectedArea].metaAnalysis + areaCountsByMethod[selectedArea].mixedMethodsQuantitative;
                    break;
                case 'meta-analysis':
                    count = areaCountsByMethod[selectedArea].metaAnalysis;
                    break;
                case 'mixed-methods-quantitative':
                    count = areaCountsByMethod[selectedArea].mixedMethodsQuantitative;
                    break;
                case 'all-qualitative':
                    count = areaCountsByMethod[selectedArea].qualitative + areaCountsByMethod[selectedArea].metaSynthesis + areaCountsByMethod[selectedArea].mixedMethodsQualitative;
                    break;
                case 'meta-synthesis':
                    count = areaCountsByMethod[selectedArea].metaSynthesis;
                    break;
                case 'mixed-methods-qualitative':
                    count = areaCountsByMethod[selectedArea].mixedMethodsQualitative;
                    break;
                default:
                    count = areaCountsByMethod[selectedArea].all; // Default to all
                    break;
            }

            // Add an asterisk if the count is greater than 0
            let matchText = count === 0 ? `[~${count} matches]` : `[~${count} matches]*`;
            option.text = `${option.text.split('[')[0].trim()} ${matchText}`;
        }
    });
}


$(document).ready(function() {
    // Adjust content margin initially
    adjustContentMargin();

    $('#customSearch').on('input', function() {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#methodFilter').on('change', function() {
        const selectedMethod = $(this).val();
        updateAreaFilterCounts(selectedMethod); // Update area filter counts based on the selected method
        dataTable.draw(); // Re-filter the table based on the new method selection
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#areaFilter').on('change', function() {
        const selectedArea = $(this).val();
        updateMethodFilterCounts(selectedArea); // Update method filter counts based on the selected area
        dataTable.draw(); // Re-filter the table based on the new area selection
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });
 
    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            $('#methodFilter').val('');
            $('#areaFilter').val('');
            $('#customSearch').val('');
    
            // Reset the method and research area filter counts to default
            populateMethodFilter(allRows);  // Re-populate the method filter with default counts
            populateAreaFilter(allRows);    // Re-populate the area filter with default counts
    
            dataTable.search('').draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        }
    });

    // Event listeners for text size controls
    document.getElementById('increaseTextSize').addEventListener('click', () => adjustTextSize(true));
    document.getElementById('decreaseTextSize').addEventListener('click', () => adjustTextSize(false));
    document.getElementById('resetTextSize').addEventListener('click', resetTextSize);

});

function updateFilterStatus() {
    const searchValue = $('#customSearch').val().trim();
    const methodValue = $('#methodFilter').val();
    const areaValue = $('#areaFilter').val();

    const filterActive = searchValue !== '' || methodValue !== '' || areaValue !== '';

    const button = $('#filterStatusBtn');
    if (filterActive) {
        button.removeClass('green').addClass('red').text('Click to clear all filters');
    } else {
        button.removeClass('red').addClass('green').text('No filters active');
    }
}

function updateFilterNotice() {
    const searchValue = $('#customSearch').val().trim();
    const methodValue = $('#methodFilter').val();
    const areaValue = $('#areaFilter').val();

    let activeFilters = [];
    if (searchValue) activeFilters.push(`Search: "${searchValue}"`);
    if (methodValue) activeFilters.push(`Method: "${methodValue}"`);
    if (areaValue) activeFilters.push(`Area: "${areaValue}"`);

    const notice = $('#filterNotice');
    const filteredRows = dataTable.rows({ filter: 'applied' }).data().toArray();

    const filteredRowCount = filteredRows.filter(row => !row[0].includes("End of records")).length;

    if (activeFilters.length > 0) {
        if (filteredRowCount > 0) {
            notice.html(`<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | <strong>${filteredRowCount} record(s) found.</strong>`).show();
        } else {
            let alertMessage = `<strong>No results</strong> found with the current filter <u>combination</u>.
            <strong> Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} 
                                Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">CLEAR ALL</a> filters.`;
            notice.html(alertMessage).show();

            $('#clearAllFiltersLink').on('click', function(e) {
                e.preventDefault();

                $('#filterStatusBtn').trigger('click');
            });
        }
    } else {
        notice.hide();
    }
    
    adjustContentMargin();  // Recalculate margin after updating notice

}

function adjustContentMargin() {
    const headerHeight = $('.fixed-header').outerHeight(true) + 40;
    const totalMargin = headerHeight;

    // Set the margin-top for the content area
    $('.content').css('margin-top', totalMargin);
}

function matchNoticeWidth() {
    const searchInput = document.querySelector('.custom-search-container input');
    const filterNotice = document.querySelector('.filter-notice');
    const searchWidth = searchInput.offsetWidth;
    filterNotice.style.width = `${searchWidth}px`;
}


// Variables to track the current adjustment level
let adjustmentLevel = 0;
const maxIncrease = 3;
const maxDecrease = -2;

// Adjust text size for the entire page
function adjustTextSize(increase) {
    if (increase && adjustmentLevel < maxIncrease) {
        adjustmentLevel += 1;
    } else if (!increase && adjustmentLevel > maxDecrease) {
        adjustmentLevel -= 1;
    } else {
        return; // No adjustment needed
    }

    // Calculate the new font size based on adjustment level
    const baseSize = 14; // Default font size in px
    const newSize = baseSize + adjustmentLevel * 1.5; // Adjust by 1.5px per step

    // Apply the new font size to all relevant elements
    document.querySelector('body').style.fontSize = `${newSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper, select, option').forEach(el => {
        el.style.fontSize = `${newSize}px`;
    });
}

// Reset text size to default
function resetTextSize() {
    adjustmentLevel = 0; // Reset adjustment level
    const baseSize = 14; // Default font size in px

    // Reset font size for all relevant elements
    document.querySelector('body').style.fontSize = `${baseSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper, select, option').forEach(el => {
        el.style.fontSize = `${baseSize}px`;
    });
}

