let methodData = [];
let researchAreasData = [];

document.addEventListener("DOMContentLoaded", async () => {
    let allRows = [];
    let dataTable;

    try {
        console.log("Loading XLSX data...");
        const response = await fetch("AssetsHonsPrelimTA2024/data/Prelim_Hons_Thesis_Titles_and_Abstracts_2024_FinalX.xlsx");
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
        console.log("Data loaded:", allRows);

        if (allRows.length > 0) {
            populateTable(allRows);  // This function now can access methodData and researchAreasData
            populateMethodFilter(allRows);
            populateAreaFilter(allRows);
            initializeDataTable();
        } else {
            console.error("No data loaded from XLSX file.");
        }
    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }

    const searchInput = document.querySelector('.custom-search-container input');
    const filterNotice = document.querySelector('.filter-notice');

    function matchNoticeWidth() {
        const searchWidth = searchInput.offsetWidth;
        filterNotice.style.width = `${searchWidth}px`;
    }

    matchNoticeWidth();
    window.addEventListener('resize', matchNoticeWidth);

    function initializeDataTable() {
        const tableElement = $('#abstractTable');
        if (!tableElement.length) {
            console.error('Table element not found in DOM.');
            return;
        }

        console.log("Initializing DataTable...");

        dataTable = tableElement.DataTable({
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
                console.log("Running drawCallback...");
                const api = this.api();
                const rows = api.rows({ search: 'applied' }).data().length;

                // Remove existing "End of records" row
                $('#abstractTable tbody .end-of-records').remove();

                // Add "End of records" row at the end
                if (rows === 0 || rows > 0) {
                    $('#abstractTable tbody').append('<tr class="end-of-records"><td style="text-align: center; font-weight: bold; padding: 10px;">End of records</td></tr>');
                }
            }
        });

        if (!dataTable) {
            console.error("DataTable initialization failed.");
        } else {
            console.log("DataTable initialized successfully.");
        }
    }

    function populateTable(rows) {
        console.log("Populating table...");
        methodData = [];  // Clear methodData and researchAreasData
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

    // ... (rest of your code remains the same)
});
