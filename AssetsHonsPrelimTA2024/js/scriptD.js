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
        populateFilters(allRows);
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

            updateFilters(api);
        }
    });

    dataTable.draw();

    // Simplified dropdown functionality: no event listeners for now.
    $('#methodFilter').on('change', function() {
        dataTable.column(0).search(this.value).draw();
    });

    $('#areaFilter').on('change', function() {
        dataTable.column(0).search(this.value).draw();
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
    const methods = new Set(rows.map(row => row[1]?.trim().toLowerCase()).filter(Boolean));
    const methodFilter = document.getElementById("methodFilter");

    methodFilter.innerHTML = `<option value="">All Methods</option>`;
    methods.forEach(method => {
        methodFilter.innerHTML += `<option value="${method}" style="text-transform: capitalize;">${method.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`;
    });

    console.log("Method filter populated.");
}

function populateAreaFilter(rows) {
    const areas = new Set();
    rows.forEach(row => {
        row.slice(5, 11).forEach(area => {
            if (area?.trim()) {
                areas.add(area.trim().toLowerCase());
            }
        });
    });

    const areaFilter = document.getElementById("areaFilter");

    areaFilter.innerHTML = `<option value="">All Research Areas</option>`;
    areas.forEach(area => {
        areaFilter.innerHTML += `<option value="${area}" style="text-transform: capitalize;">${area.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`;
    });

    console.log("Area filter populated.");
}

function updateFilters(api) {
    updateMethodFilter(api);
    updateAreaFilter(api);
}

function updateMethodFilter(api) {
    const methodFilter = $('#methodFilter');
    const methods = new Set(api.column(0).data().map(row => row.match(/Method:\s([^\s]+)/)?.[1]?.toLowerCase()).filter(Boolean));
    
    methodFilter.html(`<option value="">All Methods</option>`);
    methods.forEach(method => {
        methodFilter.append(`<option value="${method}" style="text-transform: capitalize;">${method.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`);
    });
}

function updateAreaFilter(api) {
    const areaFilter = $('#areaFilter');
    const areas = new Set();

    api.column(0).data().each(row => {
        const areaMatch = row.match(/Areas:\s(.+)$/);
        if (areaMatch) {
            areaMatch[1].split('; ').forEach(area => {
                if (area) {
                    areas.add(area.toLowerCase());
                }
            });
        }
    });

    areaFilter.html(`<option value="">All Research Areas</option>`);
    areas.forEach(area => {
        areaFilter.append(`<option value="${area}" style="text-transform: capitalize;">${area.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`);
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
});
