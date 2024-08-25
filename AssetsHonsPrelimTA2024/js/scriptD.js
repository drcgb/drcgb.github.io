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
});

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
    $('#methodFilter').on('change', function() {
        const value = $(this).val();
        console.log("Method Filter selected:", value);
        if (value) {
            filterByMethod(value);
        } else {
            dataTable.search('').draw(); // Clear the filter if no method is selected
        }
    });

    $('#areaFilter').on('change', function() {
        const value = $(this).val();
        console.log("Area Filter selected:", value);
        if (value) {
            filterByArea(value);
        } else {
            dataTable.search('').draw(); // Clear the filter if no area is selected
        }
    });
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

function filterByMethod(method) {
    dataTable.columns().every(function() {
        this.search('').draw(); // Clear existing filters on all columns
    });

    const regex = new RegExp(`Method:\\s*${method}`, 'i');
    dataTable.rows().every(function() {
        const row = this.data();
        if (regex.test(row[0])) {
            this.nodes().to$().show();
        } else {
            this.nodes().to$().hide();
        }
    });
}

function filterByArea(area) {
    dataTable.columns().every(function() {
        this.search('').draw(); // Clear existing filters on all columns
    });

    const regex = new RegExp(`Areas:\\s*.*${area}.*`, 'i');
    dataTable.rows().every(function() {
        const row = this.data();
        if (regex.test(row[0])) {
            this.nodes().to$().show();
        } else {
            this.nodes().to$().hide();
        }
    });
}
