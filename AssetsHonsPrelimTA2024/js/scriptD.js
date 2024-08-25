let allRows = [];
let dataTable;
let methodData = [];
let researchAreasData = [];
let areaCounts = {};
let methodCounts = {};

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

window.onload = function () {
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
        drawCallback: function (settings) {
            const api = this.api();
            const rows = api.rows({ search: 'applied' }).data().length;

            $('#abstractTable tbody .end-of-records').remove();
            if (rows === 0 || rows > 0) {
                $('#abstractTable tbody').append('<tr class="end-of-records"><td style="text-align: center; font-weight: bold; padding: 10px;">End of records</td></tr>');
            }

            updateMethodFilterCounts();
            updateAreaFilterCounts();
        }
    });

    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
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

    dataTable.draw();
}

function populateTable(rows) {
    console.log("Populating table...");
    methodData = [];
    researchAreasData = [];
    methodCounts = {
        quantitative: 0,
        metaAnalysis: 0,
        mixedMethodsQuantitative: 0,
        qualitative: 0,
        metaSynthesis: 0,
        mixedMethodsQualitative: 0
    };
    areaCounts = {};

    const tbody = document.querySelector("#abstractTable tbody");
    tbody.innerHTML = rows.map(row => {
        const [abstractID, mainMethod = '', methodDetail = '', preliminaryTitle = '', preliminaryAbstract = '', ...researchAreas] = row;
        const titleWithID = `<strong>ID: </strong>${abstractID}&nbsp&nbsp <strong>|</strong>&nbsp&nbsp <strong class="method-section">Method:</strong> ${mainMethod}${methodDetail ? ` (${methodDetail})` : ''} &nbsp <br><br> <strong class="abstract-title">${preliminaryTitle}</strong>`;
        const methodAndAreas = `<strong class="areas-section">Areas:</strong> ${researchAreas.filter(Boolean).join('; ')}`;

        methodData.push(mainMethod.toLowerCase().trim());
        researchAreasData.push(researchAreas.filter(Boolean).join('; ').toLowerCase().trim());

        if (mainMethod) {
            switch (mainMethod.toLowerCase().trim()) {
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

        researchAreas.forEach(area => {
            if (area) {
                const areaLower = area.trim().toLowerCase();
                areaCounts[areaLower] = (areaCounts[areaLower] || 0) + 1;
            }
        });

        return `<tr><td><br>${titleWithID}<br>${preliminaryAbstract}<br><br>${methodAndAreas}<br><br></td></tr>`;
    }).join('');

    tbody.innerHTML += `<tr class="end-of-records"><td><strong>End of records</strong></td></tr>`;
    console.log("Table populated.");
}

function populateMethodFilter() {
    console.log("Populating method filter...");
    const methodFilter = document.getElementById("methodFilter");
    methodFilter.innerHTML = `
        <option value="" style="font-weight: bold;">All Methods</option>
        <optgroup label="*Quantitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative">ALL Quantitative [~${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} record(s)]</option>
            <option value="meta-analysis">↘ Meta-Analysis [~${methodCounts.metaAnalysis} record(s)]</option>
            <option value="mixed-methods-quantitative">↘ Mixed-Methods [~${methodCounts.mixedMethodsQuantitative} record(s)]</option>
        <optgroup label="*Qualitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative">ALL Qualitative [~${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} record(s)]</option>
            <option value="meta-synthesis">↘ Meta-Synthesis [~${methodCounts.metaSynthesis} record(s)]</option>
            <option value="mixed-methods-qualitative">↘ Mixed-Methods [~${methodCounts.mixedMethodsQualitative} record(s)]</option>
    `;
    console.log("Method filter populated.");
}

function populateAreaFilter() {
    console.log("Populating area filter...");
    const areaFilter = document.getElementById("areaFilter");
    areaFilter.innerHTML = `
        <option value="" style="font-weight: bold;">All Research Areas</option>
        <option value="applied psychology">Applied Psychology [~${areaCounts['applied psychology'] || 0} record(s)]</option>
        <option value="artificial intelligence (ai) & automation">Artificial Intelligence (AI) & Automation [~${areaCounts['artificial intelligence (ai) & automation'] || 0} record(s)]</option>
        <option value="behavioural addictions">Behavioural Addictions [~${areaCounts['behavioural addictions'] || 0} record(s)]</option>
        <option value="biological psychology">Biological Psychology [~${areaCounts['biological psychology'] || 0} record(s)]</option>
        <option value="child development">Child Development [~${areaCounts['child development'] || 0} record(s)]</option>
        <option value="child neglect">Child Neglect [~${areaCounts['child neglect'] || 0} record(s)]</option>
        <option value="climate psychology">Climate Psychology [~${areaCounts['climate psychology'] || 0} record(s)]</option>
        <option value="clinical neuropsychology">Clinical Neuropsychology [~${areaCounts['clinical neuropsychology'] || 0} record(s)]</option>
        <option value="clinical psychology">Clinical Psychology [~${areaCounts['clinical psychology'] || 0} record(s)]</option>
        <option value="cognitive psychology">Cognitive Psychology [~${areaCounts['cognitive psychology'] || 0} record(s)]</option>
        <option value="communication psychology">Communication Psychology [~${areaCounts['communication psychology'] || 0} record(s)]</option>
        <option value="community psychology">Community Psychology [~${areaCounts['community psychology'] || 0} record(s)]</option>
        <option value="criminology">Criminology [~${areaCounts['criminology'] || 0} record(s)]</option>
        <option value="cultural psychology">Cultural Psychology [~${areaCounts['cultural psychology'] || 0} record(s)]</option>
        <option value="cyberpsychology">Cyberpsychology [~${areaCounts['cyberpsychology'] || 0} record(s)]</option>
        <option value="developmental psychology">Developmental Psychology [~${areaCounts['developmental psychology'] || 0} record(s)]</option>
        <option value="educational psychology">Educational Psychology [~${areaCounts['educational psychology'] || 0} record(s)]</option>
        <option value="environmental psychology">Environmental Psychology [~${areaCounts['environmental psychology'] || 0} record(s)]</option>
        <option value="experimental psychology">Experimental Psychology [~${areaCounts['experimental psychology'] || 0} record(s)]</option>
        <option value="forensic psychology">Forensic Psychology [~${areaCounts['forensic psychology'] || 0} record(s)]</option>
        <option value="genetics">Genetics [~${areaCounts['genetics'] || 0} record(s)]</option>
        <option value="health psychology">Health Psychology [~${areaCounts['health psychology'] || 0} record(s)]</option>
        <option value="human factors">Human Factors [~${areaCounts['human factors'] || 0} record(s)]</option>
        <option value="individual differences">Individual Differences [~${areaCounts['individual differences'] || 0} record(s)]</option>
        <option value="journalism psychology">Journalism Psychology [~${areaCounts['journalism psychology'] || 0} record(s)]</option>
        <option value="learning & behaviour">Learning & Behaviour [~${areaCounts['learning & behaviour'] || 0} record(s)]</option>
        <option value="organisational psychology">Organisational Psychology [~${areaCounts['organisational psychology'] || 0} record(s)]</option>
        <option value="perception">Perception [~${areaCounts['perception'] || 0} record(s)]</option>
        <option value="performing arts psychology">Performing Arts Psychology [~${areaCounts['performing arts psychology'] || 0} record(s)]</option>
        <option value="personality psychology">Personality Psychology [~${areaCounts['personality psychology'] || 0} record(s)]</option>
        <option value="political psychology">Political Psychology [~${areaCounts['political psychology'] || 0} record(s)]</option>
        <option value="positive psychology">Positive Psychology [~${areaCounts['positive psychology'] || 0} record(s)]</option>
        <option value="psychometrics">Psychometrics [~${areaCounts['psychometrics'] || 0} record(s)]</option>
        <option value="public health">Public Health [~${areaCounts['public health'] || 0} record(s)]</option>
        <option value="sex research">Sex Research [~${areaCounts['sex research'] || 0} record(s)]</option>
        <option value="social psychology">Social Psychology [~${areaCounts['social psychology'] || 0} record(s)]</option>
        <option value="sport & exercise psychology">Sport & Exercise Psychology [~${areaCounts['sport & exercise psychology'] || 0} record(s)]</option>
    `;
    console.log("Area filter populated.");
}

function updateMethodFilterCounts() {
    populateMethodFilter();
}

function updateAreaFilterCounts() {
    populateAreaFilter();
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

            $('#clearAllFiltersLink').on('click', function (e) {
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

$(document).ready(function () {
    adjustContentMargin();

    $('#customSearch').on('input', function () {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#methodFilter').on('change', function () {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#areaFilter').on('change', function () {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#filterStatusBtn').on('click', function () {
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

    document.getElementById('increaseTextSize').addEventListener('click', () => adjustTextSize(true));
    document.getElementById('decreaseTextSize').addEventListener('click', () => adjustTextSize(false));
    document.getElementById('resetTextSize').addEventListener('click', resetTextSize);
});

function adjustTextSize(increase) {
    if (increase && adjustmentLevel < maxIncrease) {
        adjustmentLevel += 1;
    } else if (!increase && adjustmentLevel > maxDecrease) {
        adjustmentLevel -= 1;
    } else {
        return;
    }

    const baseSize = 15;
    const newSize = baseSize + adjustmentLevel * 1.5;
    document.querySelector('body').style.fontSize = `${newSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${newSize}px`;
    });
}

function resetTextSize() {
    adjustmentLevel = 0;
    const baseSize = 15;
    document.querySelector('body').style.fontSize = `${baseSize}px`;
    document.querySelectorAll('.instructions, .blue-bar, .filter-status-btn, .filter-container, table, th, td, .dataTables_wrapper').forEach(el => {
        el.style.fontSize = `${baseSize}px`;
    });
}