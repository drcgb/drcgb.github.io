document.addEventListener("DOMContentLoaded", async () => {
    let allRows = [];
    let dataTable;
    let methodData = [];
    let researchAreasData = [];

    try {
        console.log("Loading XLSX data...");
        const response = await fetch("AssetsHonsPrelimTA2024/data/Prelim_Hons_Thesis_Titles_and_Abstracts_2024_FinalX.xlsx");
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
        console.log("Data loaded:", allRows);

        if (allRows.length > 0) {
            populateTable(allRows);
            initializeDataTable();
            updateFilterCounts(); // Initialize filter counts on load
        } else {
            console.error("No data loaded from XLSX file.");
        }
    } catch (err) {
        console.error('Error loading XLSX data:', err);
    }

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

        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            const methodValue = $('#methodFilter').val().toLowerCase().trim();
            const areaValue = $('#areaFilter').val().toLowerCase().trim();

            const mainMethod = methodData[dataIndex] ? methodData[dataIndex].toLowerCase().trim() : '';
            const researchAreasContent = researchAreasData[dataIndex] ? researchAreasData[dataIndex].toLowerCase().trim() : '';

            // Filter based on Method
            let methodMatch = methodValue === '' || mainMethod === methodValue ||
                (methodValue === 'all-quantitative' && ['quantitative', 'meta-analysis', 'mixed-methods'].includes(mainMethod)) ||
                (methodValue === 'all-qualitative' && ['qualitative', 'meta-synthesis', 'mixed-methods'].includes(mainMethod));

            // Filter based on Research Areas using areaValue directly
            const areaMatch = areaValue === '' || researchAreasContent.includes(areaValue);

            return methodMatch && areaMatch;
        });

        dataTable.draw();

        $('#customSearch').on('input', function() {
            dataTable.search($(this).val()).draw();
            updateFilterCounts();
            updateFilterStatus();
            updateFilterNotice();
        });

        $('#methodFilter').on('change', function() {
            populateAreaFilter(allRows);  // Update area filter based on selected method
            dataTable.draw();
            updateFilterCounts();
            updateFilterStatus();
            updateFilterNotice();
        });

        $('#areaFilter').on('change', function() {
            dataTable.draw();  // Simply redraw the table, filtering is already handled in the ext search
            updateFilterCounts();
            updateFilterStatus();
            updateFilterNotice();
        });

        $('#filterStatusBtn').on('click', function() {
            if ($(this).hasClass('red')) {
                $('#methodFilter').val('');
                $('#areaFilter').val('');
                $('#customSearch').val('');

                dataTable.search('').draw();

                updateFilterCounts(); // Reset counts when clearing filters
                updateFilterStatus();
                updateFilterNotice();

                populateMethodFilter(allRows); // Reset method filter options
                populateAreaFilter(allRows); // Reset area filter options

                window.scrollTo(0, 0);
            }
        });

        console.log("DataTable initialized successfully.");
    }

    function populateTable(rows) {
        console.log("Populating table...");
        methodData = [];
        researchAreasData = [];

        const tbody = document.querySelector("#abstractTable tbody");
        tbody.innerHTML = rows.map(row => {
            const [abstractID, mainMethod = '', methodDetail = '', preliminaryTitle = '', preliminaryAbstract = '', ...researchAreas] = row;
            const titleWithID = `<strong>ID: </strong>${abstractID}&nbsp&nbsp <strong>|</strong>&nbsp&nbsp <strong class="method-section">Method:</strong> ${mainMethod}${methodDetail ? ` (${methodDetail})` : ''} &nbsp <br><br> <strong class="abstract-title">${preliminaryTitle}</strong>`;
            const methodAndAreas = `<strong class="areas-section"><br>Areas: </strong>${researchAreas.filter(Boolean).join('; ')}<br>`;

            methodData.push(mainMethod.toLowerCase().trim());
            researchAreasData.push(researchAreas.filter(Boolean).join('; ').toLowerCase().trim());

            return `<tr><td><br>${titleWithID}<br>${preliminaryAbstract}<br>${methodAndAreas}</td></tr>`;
        }).join('');

        tbody.innerHTML += `<tr class="end-of-records"><td><strong>End of records</strong></td></tr>`;
        console.log("Table populated.");
    }

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    function populateMethodFilter(rows, selectedMethod = '') {
        console.log("Populating method filter...");
    
        const selectedAreaValue = $('#areaFilter').val().toLowerCase().trim();
        const methodCounts = {
            quantitative: 0,
            metaAnalysis: 0,
            mixedMethodsQuantitative: 0,
            qualitative: 0,
            metaSynthesis: 0,
            mixedMethodsQualitative: 0
        };
    
        rows.forEach((row, index) => {
            const mainMethod = row[1]?.trim().toLowerCase();
            const researchAreasContent = researchAreasData[index];
    
            const areaMatch = selectedAreaValue === '' || researchAreasContent.includes(selectedAreaValue);
    
            if (mainMethod && areaMatch) {
                switch (mainMethod) {
                    case 'quantitative':
                        methodCounts.quantitative += 1;
                        break;
                    case 'meta-analysis':
                        methodCounts.metaAnalysis += 1;
                        break;
                    case 'mixed-methods':
                        methodCounts.mixedMethodsQuantitative += 1;  // Count for quantitative mixed-methods
                        methodCounts.mixedMethodsQualitative += 1;  // Count for qualitative mixed-methods
                        break;
                    case 'qualitative':
                        methodCounts.qualitative += 1;
                        break;
                    case 'meta-synthesis':
                        methodCounts.metaSynthesis += 1;
                        break;
                    default:
                        // Handle any methods that don't fit the predefined categories
                        break;
                }
            }
        });
    
        // Ensure that we properly sum the mixed-methods counts
        const totalMixedMethods = (methodCounts.mixedMethodsQuantitative || 0) + (methodCounts.mixedMethodsQualitative || 0);
    
        const methodFilter = document.getElementById("methodFilter");
        methodFilter.innerHTML = `
            <option value="" style="font-weight: bold;">All Methods</option>
            <optgroup label="[Quantitative]" class="optgroup-bold">
                <option value="all-quantitative">&#x2192; ALL Quantitative [≈${(methodCounts.quantitative || 0) + (methodCounts.metaAnalysis || 0) + (methodCounts.mixedMethodsQuantitative || 0)} records]</option>
                <option value="meta-analysis">&nbsp;&nbsp;&nbsp;&#x2198; Meta-Analysis [≈${methodCounts.metaAnalysis || 0} records]</option>
                <option value="mixed-methods-quantitative">&nbsp;&nbsp;&nbsp;&#x2198; Mixed-Methods [≈${methodCounts.mixedMethodsQuantitative || 0} records]</option>
            </optgroup>
            <optgroup label="[Qualitative]" class="optgroup-bold">
                <option value="all-qualitative">&#x2192; ALL Qualitative [≈${(methodCounts.qualitative || 0) + (methodCounts.metaSynthesis || 0) + (methodCounts.mixedMethodsQualitative || 0)} records]</option>
                <option value="meta-synthesis">&nbsp;&nbsp;&nbsp;&#x2198; Meta-Synthesis [≈${methodCounts.metaSynthesis || 0} records]</option>
                <option value="mixed-methods">&nbsp;&nbsp;&nbsp;&#x2198; Mixed-Methods [≈${totalMixedMethods} records]</option>
            </optgroup>
        `;
    
        $('#methodFilter').val(selectedMethod);
    
        console.log("Method filter populated.");
    }
   

    function populateAreaFilter(rows) {
        console.log("Populating area filter...");

        const selectedMethodValue = $('#methodFilter').val().toLowerCase().trim();
        const areaCounts = {};

        rows.forEach((row, index) => {
            const mainMethod = row[1]?.trim().toLowerCase();
            const researchAreas = researchAreasData[index].split('; ').map(area => area.trim().toLowerCase());

            const methodMatch = selectedMethodValue === '' || mainMethod === selectedMethodValue ||
                (selectedMethodValue === 'all-quantitative' && ['quantitative', 'meta-analysis', 'mixed-methods'].includes(mainMethod)) ||
                (selectedMethodValue === 'all-qualitative' && ['qualitative', 'meta-synthesis', 'mixed-methods'].includes(mainMethod));

            if (methodMatch) {
                researchAreas.forEach(area => {
                    if (area) {
                        const titleCaseArea = toTitleCase(area);
                        areaCounts[titleCaseArea] = (areaCounts[titleCaseArea] || 0) + 1;
                    }
                });
            }
        });

        const sortedAreas = Object.entries(areaCounts).sort(([a], [b]) => a.localeCompare(b));

        const areaFilter = document.getElementById("areaFilter");
        areaFilter.innerHTML = `<option value="" style="font-weight: bold;">All Research Areas</option>
                                <option value="" disabled style="color: grey;">[Listed A—Z]</option>`;
        areaFilter.innerHTML += sortedAreas.map(([area, count]) => {
            return `<option value="${area.toLowerCase()}">${area} [≈${count} records]</option>`;
        }).join('');

        console.log("Area filter populated.");
    }

    function updateFilterCounts() {
        const currentMethod = $('#methodFilter').val();
        populateMethodFilter(allRows, currentMethod);
        populateAreaFilter(allRows);
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
                let alertMessage = `<strong>Active Filters:</strong> ${activeFilters.join(' <strong>+</strong> ')} | <strong>No results found with this filter combination.</strong><br>`;
                alertMessage += `Try adjusting the individual filters or <a href="#" id="clearAllFiltersLink" style="font-weight: bold; color: red;">CLEAR ALL</a> filters.`;
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

    adjustContentMargin();

    $('#customSearch').on('input', function() {
        if (dataTable) {
            dataTable.search($(this).val()).draw();
            updateFilterCounts();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        } else {
            console.error("DataTable is not initialized.");
        }
    });

    $('#methodFilter').on('change', function() {
        if (dataTable) {
            populateAreaFilter(allRows); // Update area filter based on selected method
            dataTable.draw();
            updateFilterCounts();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        } else {
            console.error("DataTable is not initialized.");
        }
    });

    $('#areaFilter').on('change', function() {
        dataTable.draw();  // Simply redraw the table, filtering is already handled in the ext search
        updateFilterCounts();
        updateFilterStatus();
        updateFilterNotice();
        window.scrollTo(0, 0);
    });

    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            if (dataTable) {
                $('#methodFilter').val('');
                $('#areaFilter').val('');
                $('#customSearch').val('');

                dataTable.search('').draw();

                updateFilterCounts(); // Reset counts when clearing filters
                updateFilterStatus();
                updateFilterNotice();

                populateMethodFilter(allRows); // Reset method filter options
                populateAreaFilter(allRows); // Reset area filter options

                window.scrollTo(0, 0);
            } else {
                console.error("DataTable is not initialized.");
            }
        }
    });
});
