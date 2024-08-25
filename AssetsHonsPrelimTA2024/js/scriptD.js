let allRows = [];
let dataTable;
let methodData = [];
let researchAreasData = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Loading XLSX data...");
        const response = await fetch("AssetsHonsPrelimTA2024/data/Prelim_Hons_Thesis_Titles_and_Abstracts_2024_FinalX.xlsx");
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
        console.log("Data loaded:", allRows);

        populateTable(allRows);
        populateMethodFilter(allRows);
        populateAreaFilter(allRows);
        initializeDataTable();

        window.addEventListener('resize', () => {
            adjustContentMargin(); // Adjust margin on window resize
            matchNoticeWidth(); // Match filter notice width to search input
        });

    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }
});

window.onload = function() {
    adjustContentMargin();
    matchNoticeWidth();
};

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
            case 'quantitative':
            case 'meta-analysis':
                methodMatch = mainMethod === methodValue;
                break;
            case 'mixed-methods-quantitative':
                methodMatch = mainMethod === 'mixed-methods';
                break;
            case 'all-qualitative':
                methodMatch = mainMethod === 'qualitative' || mainMethod === 'meta-synthesis' || mainMethod === 'mixed-methods';
                break;
            case 'qualitative':
            case 'meta-synthesis':
                methodMatch = mainMethod === methodValue;
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
        const titleWithID = `<strong>ID: </strong>${abstractID}&nbsp&nbsp <strong>|</strong>&nbsp&nbsp <strong class="method-section">Method:</strong> ${mainMethod}${methodDetail ? ` (${methodDetail})` : ''} &nbsp <br><br> <strong class="abstract-title">${preliminaryTitle}</strong>`;
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
    const areaCounts = {};
    rows.forEach(row => {
        const researchAreas = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '');
        researchAreas.forEach(area => {
            if (area) {
                areaCounts[area] = (areaCounts[area] || 0) + 1;
            }
        });
    });

    const sortedAreas = Object.entries(areaCounts).sort(([a], [b]) => a.localeCompare(b));

    const areaFilter = document.getElementById("areaFilter");
    areaFilter.innerHTML = `<option value="">All Research Areas</option>`;
    areaFilter.innerHTML += sortedAreas.map(([area, count]) => {
        return `<option value="${area}">${area} [~${count} matches]</option>`;
    }).join('');
    console.log("Area filter populated.");
}

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
    if (methodValue) activeFilters.push(`Method: "${methodValue.replace('↘ ', '')}"`); // Remove the arrow for display
    if (areaValue) activeFilters.push(`Area: "${areaValue}"`);

    const notice = $('#filterNotice');
    const filteredRows = dataTable.rows({ filter: 'applied' }).data().toArray();

    const filteredRowCount = filteredRows.filter(row => !row[0].includes("End of records")).length;

    if (activeFilters.length > 0) {
        let filterText = `<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | `;
        if (filteredRowCount > 0) {
            notice.html(`${filterText}<strong>${filteredRowCount} record(s) found.</strong>`).show();
        } else {
            notice.html(`${filterText}<strong>No results found with this filter combination.</strong> Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">CLEAR ALL</a> filters.`).show();
            $('#clearAllFiltersLink').on('click', function(e) {
                e.preventDefault();
                $('#filterStatusBtn').trigger('click');
            });
        }
    } else {
        notice.hide();
    }

    adjustContentMargin();  // Recalculate margin after updating notice

    // Add a slight delay before resetting scroll position
    setTimeout(() => {
    content.scrollTo(0, 0);
    }, 65);  // 65 milliseconds delay
}

function adjustContentMargin() {
   /* const filterNoticeHeight = $('#filterNotice').is(':visible') ? $('#filterNotice').outerHeight(true) : 0;*/
   /* const  const instructionsHeight = $('#instructionsDetails').is(':visible') && $('#instructionsDetails').attr('open') ? $('#instructionsDetails').outerHeight(true) : 0; */
    const blueBarHeight = $('.blue-bar').outerHeight(true); // Get the height of the blue bar
    const headerHeight = $('.fixed-header').outerHeight(true) + blueBarHeight;

    // Adjust the total margin so that it only adds the filter notice height if needed
    const totalMargin = headerHeight + instructionsHeight;

   // Set the margin-top for the content area
    $('.content').css('margin-top', totalMargin);
}

function matchNoticeWidth() {
    const searchInput = document.querySelector('.custom-search-container input');
    const filterNotice = document.querySelector('.filter-notice');
    const searchWidth = searchInput.offsetWidth;
    filterNotice.style.width = `${searchWidth}px`;
}

$(document).ready(function() {
    // Adjust content margin initially
    adjustContentMargin();

    // Event listeners for instructions toggle
    $('#instructionsToggle').on('click', function() {
        toggleInstructions();
    });

    $('#closeInstructions').on('click', function(e) {
        e.preventDefault();
        toggleInstructions();
    });
});

// Function to toggle instructions
function toggleInstructions() {
    const details = document.getElementById("instructionsDetails");
    details.open = !details.open;
    console.log('Instructions toggled:', details.open);
    const toggleLink = document.getElementById("instructionsToggle");
    toggleLink.textContent = details.open ? '▼ Instructions' : '► Instructions';
    adjustContentMargin();
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
    const baseSize = 15; // Default font size in px
    const newSize = baseSize + adjustmentLevel * 1.5; // Adjust by 1.5px per step

    // Apply the new font size to all relevant elements
    document.querySelector('body').style.fontSize = `${newSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${newSize}px`;
    });
}

// Reset text size to default
function resetTextSize() {
    adjustmentLevel = 0; // Reset adjustment level
    const baseSize = 15; // Default font size in px

    // Reset font size for all relevant elements
    document.querySelector('body').style.fontSize = `${baseSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${baseSize}px`;
    });
}


$(document).ready(function() {
    adjustContentMargin();

    $('#customSearch').on('input', function() {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#methodFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#areaFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            $('#methodFilter').val('');
            $('#areaFilter').val('');
            $('#customSearch').val('');

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
    document.getElementById('closeInstructions').addEventListener('click', function(event) {
        event.preventDefault();
        document.querySelector('.instructions').style.display = 'none';
    });
});
