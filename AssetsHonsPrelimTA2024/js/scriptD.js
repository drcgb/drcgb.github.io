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
        initializeDataTable();
        populateFilters();
        adjustTableMargin(); // Adjust the table margin on page load
    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }

    const searchInput = document.querySelector('#customSearch');

    // Link the custom search bar to DataTables' search method
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value;
        console.log("Searching for:", searchTerm); // Debugging log
        dataTable.search(searchTerm).draw(); // Apply the search term to DataTables
    });

    window.addEventListener('resize', adjustTableMargin); // Adjust the table margin on window resize
});

function adjustTableMargin() {
    const headerHeight = document.querySelector('.fixed-header').offsetHeight;
    document.querySelector('.table-container').style.marginTop = `${headerHeight}px`;
    console.log("Adjusted table margin to offset header height:", headerHeight);
}

function initializeDataTable() {
    console.log("Initializing DataTable...");

    dataTable = $('#abstractTable').DataTable({
        paging: false,
        searching: true,
        info: true,
        autoWidth: false,
        ordering: false,
        dom: '<"top"l>rt<"bottom"p><"clear">',
    });

    console.log("DataTable initialized.");

    // Simplified dropdown functionality
    $('#methodFilter').on('change', applyFilters);
    $('#areaFilter').on('change', applyFilters);
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

function populateFilters() {
    console.log("Populating filters...");
    populateMethodFilter();
    populateAreaFilter();
}

function populateMethodFilter() {
    const uniqueMethods = [...new Set(methodData)];
    const methodFilter = document.getElementById("methodFilter");

    methodFilter.innerHTML = `<option value="">All Methods</option>`;
    uniqueMethods.forEach(method => {
        methodFilter.innerHTML += `<option value="${method}" style="text-transform: capitalize;">${method.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`;
    });

    console.log("Method filter populated.");
}

function populateAreaFilter() {
    const uniqueAreas = [...new Set(researchAreasData.join('; ').split('; ').map(area => area.trim()))];
    const areaFilter = document.getElementById("areaFilter");

    areaFilter.innerHTML = `<option value="">All Research Areas</option>`;
    uniqueAreas.forEach(area => {
        areaFilter.innerHTML += `<option value="${area}" style="text-transform: capitalize;">${area.replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</option>`;
    });

    console.log("Area filter populated.");
}

function applyFilters() {
    const selectedMethod = $('#methodFilter').val();
    const selectedArea = $('#areaFilter').val();

    dataTable.rows().every(function() {
        const row = this.data();
        const rowText = row[0];

        const methodMatch = selectedMethod ? new RegExp(`Method:\\s*${selectedMethod}`, 'i').test(rowText) : true;
        const areaMatch = selectedArea ? new RegExp(`Areas:\\s*.*${selectedArea}.*`, 'i').test(rowText) : true;

        if (methodMatch && areaMatch) {
            this.nodes().to$().show();
        } else {
            this.nodes().to$().hide();
        }
    });

    dataTable.draw(); // Ensure the table redraws with the updated visibility
}
