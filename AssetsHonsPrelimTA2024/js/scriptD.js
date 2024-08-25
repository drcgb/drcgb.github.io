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

    // Custom filtering logic
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const methodValue = $('#methodFilter').val().toLowerCase().trim();
        const areaValue = $('#areaFilter').val().toLowerCase().trim();

        const mainMethod = methodData[dataIndex] ? methodData[dataIndex].toLowerCase().trim() : '';
        const researchAreasContent = researchAreasData[dataIndex] ? researchAreasData[dataIndex].toLowerCase().trim() : '';

        let methodMatch = methodValue === '' || mainMethod.includes(methodValue);
        let areaMatch = areaValue === '' || researchAreasContent.split('; ').includes(areaValue);

        return methodMatch && areaMatch;
    });

    dataTable.draw(); // Apply filters initially
}

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
        <optgroup label="*Quantitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative">ALL Quantitative [${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} record(s)]</option>
            <option value="meta-analysis">↘ Meta-Analysis [${methodCounts.metaAnalysis} record(s)]</option>
            <option value="mixed-methods-quantitative">↘ Mixed-Methods [${methodCounts.mixedMethodsQuantitative} record(s)]</option>
        <optgroup label="*Qualitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">ALL Qualitative [${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} record(s)]</option>
            <option value="meta-synthesis">↘ Meta-Synthesis [${methodCounts.metaSynthesis} record(s)]</option>
            <option value="mixed-methods-qualitative">↘ Mixed-Methods [${methodCounts.mixedMethodsQualitative} record(s)]</option>
    `;
    console.log("Method filter populated.");
}

function populateAreaFilter(rows) {
    console.log("Populating area filter...");
    const areaCounts = {
        "Applied Psychology": 0,
        "Artificial Intelligence (AI) & Automation": 0,
        "Behavioural Addictions": 0,
        "Biological Psychology": 0,
        "Child Development": 0,
        "Child Neglect": 0,
        "Climate Psychology": 0,
        "Clinical Neuropsychology": 0,
        "Clinical Psychology": 0,
        "Cognitive Psychology": 0,
        "Communication Psychology": 0,
        "Community Psychology": 0,
        "Criminology": 0,
        "Cultural Psychology": 0,
        "Cyberpsychology": 0,
        "Developmental Psychology": 0,
        "Educational Psychology": 0,
        "Environmental Psychology": 0,
        "Experimental Psychology": 0,
        "Forensic Psychology": 0,
        "Genetics": 0,
        "Health Psychology": 0,
        "Human Factors": 0,
        "Individual Differences": 0,
        "Journalism Psychology": 0,
        "Learning & Behaviour": 0,
        "Organisational Psychology": 0,
        "Perception": 0,
        "Performing Arts Psychology": 0,
        "Personality Psychology": 0,
        "Political Psychology": 0,
        "Positive Psychology": 0,
        "Psychometrics": 0,
        "Public Health": 0,
        "Sex Research": 0,
        "Social Psychology": 0,
        "Sport & Exercise Psychology": 0
    };

    rows.forEach(row => {
        const researchAreas = row.slice(5, 11).map(area => area?.trim() || '');
        researchAreas.forEach(area => {
            if (area && areaCounts.hasOwnProperty(area)) {
                areaCounts[area] += 1;
            }
        });
    });

    const areaFilter = document.getElementById("areaFilter");
    areaFilter.innerHTML = `<option value="" style="font-weight: bold;">All Research Areas</option>`;
    areaFilter.innerHTML += Object.entries(areaCounts).map(([area, count]) => {
        return `<option value="${area.toLowerCase()}">${area} [${count} record(s)]</option>`;
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
    if (methodValue) activeFilters.push(`Method: "${methodValue}"`);
    if (areaValue) activeFilters.push(`Area: "${areaValue}"`);

    const notice = $('#filterNotice');
    const filteredRows = dataTable.rows({ filter: 'applied' }).data().toArray();

    const filteredRowCount = filteredRows.filter(row => !row[0].includes("End of records")).length;

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

    adjustContentMargin();  // Recalculate margin after updating notice
}

function adjustContentMargin() {
    const blueBarHeight = $('.blue-bar').outerHeight(true); // Get the height of the blue bar
    const headerHeight = $('.fixed-header').outerHeight(true) + 5;

    // Adjust the total margin so that it only adds the filter notice height if needed
    const totalMargin = headerHeight + blueBarHeight;

    // Set the margin-top for the content area
    $('.content').css('margin-top', totalMargin);
}

function matchNoticeWidth() {
    const searchInput = document.querySelector('.custom-search-container input');
    const filterNotice = document.querySelector('.filter-notice');
    const searchWidth = searchInput.offsetWidth;
    filterNotice.style.width = `${searchWidth}px`;
}

// Scroll to top when filter changes
function scrollToTop() {
    $('html, body').animate({ scrollTop: 0 }, 'fast');
}

$(document).ready(function() {
    // Adjust content margin initially
    adjustContentMargin();

    $('#customSearch').on('input', function() {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
        scrollToTop();
    });

    $('#methodFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        scrollToTop();
    });

    $('#areaFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        scrollToTop();
    });

    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            $('#methodFilter').val('');
            $('#areaFilter').val('');
            $('#customSearch').val('');

            dataTable.search('').draw();
            updateFilterStatus();
            updateFilterNotice();
            scrollToTop();
        }
    });

    // Event listeners for text size controls
    document.getElementById('increaseTextSize').addEventListener('click', () => adjustTextSize(true));
    document.getElementById('decreaseTextSize').addEventListener('click', () => adjustTextSize(false));
    document.getElementById('resetTextSize').addEventListener('click', resetTextSize);
});