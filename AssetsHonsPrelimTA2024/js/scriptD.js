let allRows = [];
let dataTable;

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
        initializeDataTable();
        populateFilters(allRows);  // Combined population function
    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }

    const searchInput = document.querySelector('.custom-search-container input');
    const filterContainer = document.querySelector('.filter-container');
    const filterNotice = document.querySelector('.filter-notice');

    function matchWidths() {
        const searchWidth = searchInput.offsetWidth;
        filterContainer.style.width = `${searchWidth}px`;
        filterNotice.style.width = `${searchWidth}px`;
    }

    matchWidths();
    window.addEventListener('resize', matchWidths);

    console.log("DataTable initialized.");
});

function initializeDataTable() {
    console.log("Initializing DataTable...");

    dataTable = $('#abstractTable').DataTable({
        paging: false,
        searching: true,
        info: true,
        autoWidth: false,
        ordering: false,
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

            updateFilters(api);  // Update filter counts dynamically
        }
    });

    // Custom filter logic
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

    dataTable.draw();

    $('#customSearch').on('input', function() {
        dataTable.search($(this).val()).draw();
        updateFilterStatus();
        updateFilterNotice();
    });

    $('#methodFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
    });

    $('#areaFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
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

    console.log("DataTable initialized.");
}

let methodData = [];
let researchAreasData = [];

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

function populateFilters(rows) {
    console.log("Populating filters...");
    populateMethodFilter(rows);
    populateAreaFilter(rows);
}

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
        <optgroup label="*Quantitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative" style="font-weight: bold;">ALL Quantitative [≈${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} matches]</option>
            <option value="meta-analysis" style="padding-left: 20px;">↘ Meta-Analysis [≈${methodCounts.metaAnalysis} matches]</option>
            <option value="mixed-methods-quantitative" style="padding-left: 20px;">↘ Mixed-Methods [≈${methodCounts.mixedMethodsQuantitative} matches]</option>
        <optgroup label="*Qualitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative" style="font-weight: bold;">ALL Qualitative [≈${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} matches]</option>
            <option value="meta-synthesis" style="padding-left: 20px;">↘ Meta-Synthesis [≈${methodCounts.metaSynthesis} matches]</option>
            <option value="mixed-methods-qualitative" style="padding-left: 20px;">↘ Mixed-Methods [≈${methodCounts.mixedMethodsQualitative} matches]</option>
    `;
    console.log("Method filter populated.");
}

function populateAreaFilter(rows) {
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
    areaFilter.innerHTML = `<option value="">All Research Areas</option>
                            <optgroup label="*Listed A-Z*" style="font-weight: bold; color: grey;" disabled></optgroup>`;
    areaFilter.innerHTML += sortedAreas.map(([area, count]) => {
        return `<option value="${area}" style="text-transform: capitalize;">${area} [≈${count} matches]</option>`;
    }).join('');
    console.log("Area filter populated.");
}

function updateFilters(api) {
    updateMethodFilter(api);
    updateAreaFilter(api);
}

function updateMethodFilter(api) {
    const methodCounts = {
        quantitative: 0,
        metaAnalysis: 0,
        mixedMethodsQuantitative: 0,
        qualitative: 0,
        metaSynthesis: 0,
        mixedMethodsQualitative: 0
    };

    api.rows({ search: 'applied' }).data().each(row => {
        const mainMethod = row[1] ? row[1].toLowerCase().trim() : '';
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

    const methodFilter = $('#methodFilter');
    methodFilter.html(`
        <option value="" style="font-weight: bold;">All Methods</option>
        <optgroup label="*Quantitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-quantitative" style="font-weight: bold;">ALL Quantitative [≈${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} matches]</option>
            <option value="meta-analysis" style="padding-left: 20px;">↘ Meta-Analysis [≈${methodCounts.metaAnalysis} matches]</option>
            <option value="mixed-methods-quantitative" style="padding-left: 20px;">↘ Mixed-Methods [≈${methodCounts.mixedMethodsQuantitative} matches]</option>
        <optgroup label="*Qualitative*" style="font-weight: bold; color: grey;" disabled></optgroup>
            <option value="all-qualitative" style="font-weight: bold;">ALL Qualitative [≈${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} matches]</option>
            <option value="meta-synthesis" style="padding-left: 20px;">↘ Meta-Synthesis [≈${methodCounts.metaSynthesis} matches]</option>
            <option value="mixed-methods-qualitative" style="padding-left: 20px;">↘ Mixed-Methods [≈${methodCounts.mixedMethodsQualitative} matches]</option>
    `);
}

function updateAreaFilter(api) {
    const areaCounts = {};

    api.rows({ search: 'applied' }).data().each(row => {
        const researchAreas = row[5] ? row[5].toLowerCase().split('; ') : [];
        researchAreas.forEach(area => {
            if (area) {
                areaCounts[area] = (areaCounts[area] || 0) + 1;
            }
        });
    });

    const sortedAreas = Object.entries(areaCounts).sort(([a], [b]) => a.localeCompare(b));

    const areaFilter = $('#areaFilter');
    areaFilter.html(`<option value="">All Research Areas</option>
                     <optgroup label="*Listed A-Z*" style="font-weight: bold; color: grey;" disabled></optgroup>`);
    sortedAreas.forEach(([area, count]) => {
        areaFilter.append(`<option value="${area}" style="text-transform: capitalize;">${area} [≈${count} matches]</option>`);
    });
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
            let alertMessage = `<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | No results were found with this filter combination. Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">CLEAR ALL</a> filters.`;
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
    const filterNoticeHeight = $('#filterNotice').is(':visible') ? $('#filterNotice').outerHeight(true) : 0;
    const headerHeight = $('.fixed-header').outerHeight(true);
    const totalMargin = headerHeight + (filterNoticeHeight > 0 ? filterNoticeHeight - 40 : 0);

    $('.content').css('margin-top', totalMargin);
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
    });

    $('#areaFilter').on('change', function() {
        dataTable.draw();
        updateFilterStatus();
        updateFilterNotice();
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
});
