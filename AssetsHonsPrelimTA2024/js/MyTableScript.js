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
            // Initialize methodData and researchAreasData
            methodData = [];
            researchAreasData = [];

            populateTable(allRows);
            populateMethodFilter(allRows);
            populateAreaFilter(allRows);
            initializeDataTable();
        } else {
            console.error("No data loaded from XLSX file.");
        }
    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }

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
        if (methodValue) activeFilters.push(`Method: "${methodValue}"`);
        if (areaValue) active
