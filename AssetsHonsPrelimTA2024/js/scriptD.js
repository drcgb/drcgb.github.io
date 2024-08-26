// Initialization and data loading
let allRows = [];
let dataTable;
let methodData = [];
let researchAreasData = [];
let allAreas = [
    "Applied Psychology", "Artificial Intelligence (AI) & Automation", "Behavioural Addictions", 
    "Biological Psychology", "Child Development", "Child Neglect", "Climate Psychology", 
    "Clinical Neuropsychology", "Clinical Psychology", "Cognitive Psychology", 
    "Communication Psychology", "Community Psychology", "Criminology", "Cultural Psychology", 
    "Cyberpsychology", "Developmental Psychology", "Educational Psychology", 
    "Environmental Psychology", "Experimental Psychology", "Forensic Psychology", 
    "Genetics", "Health Psychology", "Human Factors", "Individual Differences", 
    "Journalism Psychology", "Learning & Behaviour", "Organisational Psychology", 
    "Perception", "Performing Arts Psychology", "Personality Psychology", 
    "Political Psychology", "Positive Psychology", "Psychometrics", "Public Health", 
    "Sex Research", "Social Psychology", "Sport & Exercise Psychology"
];

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
            adjustContentMargin();
            matchNoticeWidth();
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
    });

    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const methodValue = $('#methodFilter').val().toLowerCase().trim();
        const areaValue = $('#areaFilter').val().toLowerCase().trim();

        const mainMethod = methodData[dataIndex] ? methodData[dataIndex].toLowerCase().trim() : '';
        const researchAreasContent = researchAreasData[dataIndex] ? researchAreasData[dataIndex].toLowerCase().trim() : '';

        console.log(`Checking row ${dataIndex}: Method="${mainMethod}", Areas="${researchAreasContent}"`);

        let methodMatch = methodValue === '' || mainMethod.includes(methodValue);
        let areaMatch = areaValue === '' || researchAreasContent.split('; ').includes(areaValue);

        console.log(`Method match: ${methodMatch}, Area match: ${areaMatch}`);

        return methodMatch && areaMatch;
    });

    $('#customSearch').on('input', function() {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
    });

    $('#methodFilter').on('change', async function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        await updateAreaFilterCounts(); // Update Area filter counts based on the current method filter
    });

    $('#areaFilter').on('change', async function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        await updateMethodFilterCounts(); // Update Method filter counts based on the current area filter
    });

    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            $('#methodFilter').val('');
            $('#areaFilter').val('');
            $('#customSearch').val('');

            dataTable.search('').draw();
            updateFilterStatus();
            updateFilterNotice();
            setTimeout(() => {
                populateMethodFilter(allRows); // Repopulate with all data
                populateAreaFilter(allRows); // Repopulate with all data
            }, 300); // Delay to allow table to reset first
        }
    });

    console.log("DataTable initialized.");
}

// Populate and Update Functions
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
            <option value="all-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;All Quantitative [${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative}]</option>
            <option value="meta-analysis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Analysis [${methodCounts.metaAnalysis}]</option>
            <option value="mixed-methods-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [${methodCounts.mixedMethodsQuantitative}]</option>
        <optgroup label="Qualitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;All Qualitative [${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative}]</option>
            <option value="meta-synthesis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Synthesis [${methodCounts.metaSynthesis}]</option>
            <option value="mixed-methods-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [${methodCounts.mixedMethodsQualitative}]</option>
    `;

    console.log("Method filter populated.");
}

function populateAreaFilter(rows) {
    console.log("Populating area filter...");
    const areaCounts = {};
    allAreas.forEach(area => {
        areaCounts[area.toLowerCase()] = 0;
    });

    rows.forEach(row => {
        const researchAreas = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '');
        researchAreas.forEach(area => {
            if (area) {
                areaCounts[area]++;
            }
        });
    });

    const areaFilter = document.getElementById("areaFilter");
    areaFilter.innerHTML = `<option value="" style="font-weight: bold;">All Research Areas</option>`;
    areaFilter.innerHTML += allAreas.map(area => {
        const lowerCaseArea = area.toLowerCase();
        return `<option value="${lowerCaseArea}">${area} [${areaCounts[lowerCaseArea]}]</option>`;
    }).join('');

    console.log("Area filter populated.");
}

// Update Functions
async function updateMethodFilterCounts() {
    if (!dataTable) return;

    // Get the visible rows after applying the current area filter
    const visibleRows = dataTable.rows({ filter: 'applied' }).data().toArray();
    const methodCounts = {
        quantitative: 0,
        metaAnalysis: 0,
        mixedMethodsQuantitative: 0,
        qualitative: 0,
        metaSynthesis: 0,
        mixedMethodsQualitative: 0
    };

    visibleRows.forEach(row => {
        const mainMethod = $(row[0]).find('.method-section').text().trim().toLowerCase();
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
            <option value="all-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;All Quantitative [${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative}]</option>
            <option value="meta-analysis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Analysis [${methodCounts.metaAnalysis}]</option>
            <option value="mixed-methods-quantitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [${methodCounts.mixedMethodsQuantitative}]</option>
        <optgroup label="Qualitative" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;All Qualitative [${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative}]</option>
            <option value="meta-synthesis">&nbsp;&nbsp;&nbsp;&nbsp;Meta-Synthesis [${methodCounts.metaSynthesis}]</option>
            <option value="mixed-methods-qualitative">&nbsp;&nbsp;&nbsp;&nbsp;Mixed-Methods [${methodCounts.mixedMethodsQualitative}]</option>
    `;
}

async function updateAreaFilterCounts() {
    if (!dataTable) return;

    // Get the visible rows after applying the current method filter
    const visibleRows = dataTable.rows({ filter: 'applied' }).data().toArray();
    const areaCounts = {};

    allAreas.forEach(area => {
        areaCounts[area.toLowerCase()] = 0;
    });

    visibleRows.forEach(row => {
        const researchAreas = $(row[0]).find('.areas-section').text().split(';').map(area => area.trim().toLowerCase());
        researchAreas.forEach(area => {
            if (area && areaCounts[area] !== undefined) {
                areaCounts[area]++;
            }
        });
    });

    const areaFilter = document.getElementById("areaFilter");
    areaFilter.innerHTML = `<option value="" style="font-weight: bold;">All Research Areas</option>`;
    areaFilter.innerHTML += allAreas.map(area => {
        const lowerCaseArea = area.toLowerCase();
        return `<option value="${lowerCaseArea}">${area} [${areaCounts[lowerCaseArea]}]</option>`;
    }).join('');
}

// Filter status and notice updates
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

    const filteredRowCount = filteredRows.filter(row => !$(row[0]).text().includes("End of records")).length;

    if (activeFilters.length > 0) {
        if (filteredRowCount > 0) {
            notice.html(`<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | <strong>${filteredRowCount} record(s) found.</strong>`).show();
        } else {
            let alertMessage = `<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | <strong>No results found with this filter combination.</strong> `;
            alertMessage += 'Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">CLEAR ALL</a> filters.';
            notice.html(alertMessage).show();

            $('#clearAllFiltersLink').on('click', function(e) {
                e.preventDefault();
                $('#filterStatusBtn').trigger('click');
            });
        }
    } else {
        notice.hide();
    }

    adjustContentMargin();
}

function adjustContentMargin() {
    const blueBarHeight = $('.blue-bar').outerHeight(true);
    const headerHeight = $('.fixed-header').outerHeight(true) + 5;
    const totalMargin = headerHeight + blueBarHeight;

    $('.content').css('margin-top', totalMargin);
}

function matchNoticeWidth() {
    const searchInput = document.querySelector('.custom-search-container input');
    const filterNotice = document.querySelector('.filter-notice');
    const searchWidth = searchInput.offsetWidth;
    filterNotice.style.width = `${searchWidth}px`;
}

function scrollToTop() {
    $('html, body').animate({ scrollTop: 0 }, 'fast');
}

$(document).ready(function() {
    adjustContentMargin();

    // Text Size Controls
    $('#increaseTextSize').on('click', () => adjustTextSize(true));
    $('#decreaseTextSize').on('click', () => adjustTextSize(false));
    $('#resetTextSize').on('click', resetTextSize);

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
    });

    // Close Instructions Link
    $('#closeInstructions').on('click', function(e) {
        e.preventDefault();
        $('#instructionsDetails').removeAttr('open');
        $('#instructionsToggle').text('► Instructions');
    });
});

function adjustTextSize(increase) {
    let adjustmentLevel = 0;
    const maxIncrease = 3;
    const maxDecrease = -2;
    const baseSize = 15;

    if (increase && adjustmentLevel < maxIncrease) {
        adjustmentLevel += 1;
    } else if (!increase && adjustmentLevel > maxDecrease) {
        adjustmentLevel -= 1;
    } else {
        return;
    }

    const newSize = baseSize + adjustmentLevel * 1.5;
    document.querySelector('body').style.fontSize = `${newSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${newSize}px`;
    });
}

function resetTextSize() {
    const baseSize = 15;
    document.querySelector('body').style.fontSize = `${baseSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${baseSize}px`;
    });
}

function adjustContentMargin() {
    const blueBarHeight = $('.blue-bar').outerHeight(true);
    const headerHeight = $('.fixed-header').outerHeight(true) + 5;
    const totalMargin = headerHeight + blueBarHeight;

    $('.content').css('margin-top', totalMargin);
}

