document.addEventListener("DOMContentLoaded", async () => {
    let allRows = [];
    let dataTable;
    let methodData = []; // Declare methodData at the top level
    let researchAreasData = []; // Declare researchAreasData at the top level

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

                // Remove existing "End of records" row
                $('#abstractTable tbody .end-of-records').remove();

                // Add "End of records" row at the end
                if (rows === 0 || rows > 0) {
                    $('#abstractTable tbody').append('<tr class="end-of-records"><td style="text-align: center; font-weight: bold; padding: 10px;">End of records</td></tr>');
                }
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
            const searchText = $(this).val().trim().toLowerCase();
            const filteredRows = allRows.filter(row => {
                const combinedText = row.join(' ').toLowerCase();
                return combinedText.includes(searchText);
            });

            populateMethodFilter(filteredRows);  // Update method counts
            populateAreaFilter(filteredRows);    // Update area counts

            dataTable.search(searchText).draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        });

        $('#methodFilter').on('change', function() {
            const selectedMethodValue = $('#methodFilter').val().toLowerCase().trim();
            const filteredRows = allRows.filter(row => {
                const mainMethod = row[1]?.trim().toLowerCase() || '';
                return selectedMethodValue === '' || mainMethod === selectedMethodValue;
            });

            populateAreaFilter(filteredRows);    // Update area counts

            dataTable.draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        });

        $('#areaFilter').on('change', function() {
            const selectedAreaValue = $('#areaFilter').val().toLowerCase().trim();
            const filteredRows = allRows.filter(row => {
                const researchAreasContent = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '').join('; ');
                return selectedAreaValue === '' || researchAreasContent.includes(selectedAreaValue);
            });

            const currentMethod = $('#methodFilter').val();
            populateMethodFilter(filteredRows, currentMethod);  // Update method counts

            dataTable.draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
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
            const methodAndAreas = `<strong class="areas-section">Areas:</strong> ${researchAreas.filter(Boolean).join('; ')}`;

            methodData.push(mainMethod.toLowerCase().trim());
            researchAreasData.push(researchAreas.filter(Boolean).join('; ').toLowerCase().trim());

            return `<tr><td><br>${titleWithID}<br>${preliminaryAbstract}<br><br>${methodAndAreas}<br><br></td></tr>`;
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
    
        rows.forEach(row => {
            const mainMethod = row[1]?.trim().toLowerCase();
            const researchAreasContent = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '').join('; ');
    
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
            <optgroup label="[Quantitative]">
                <option value="all-quantitative">&#x279E; All Quantitative [~${methodCounts.quantitative + methodCounts.metaAnalysis + methodCounts.mixedMethodsQuantitative} records]</option>
                <option value="meta-analysis">&#x21B3; Meta-Analysis [~${methodCounts.metaAnalysis} records]</option>
                <option value="mixed-methods-quantitative">&#x21B3; Mixed-Methods [~${methodCounts.mixedMethodsQuantitative} records]</option>
            </optgroup>
            <optgroup label="[Qualitative]">
                <option value="all-qualitative">&#x279E; All Qualitative [~${methodCounts.qualitative + methodCounts.metaSynthesis + methodCounts.mixedMethodsQualitative} records]</option>
                <option value="meta-synthesis">&#x21B3; Meta-Synthesis [~${methodCounts.metaSynthesis} records]</option>
                <option value="mixed-methods-qualitative">&#x21B3; Mixed-Methods [~${methodCounts.mixedMethodsQualitative} records]</option>
            </optgroup>
        `;
    
        $('#methodFilter').val(selectedMethod);
    
        console.log("Method filter populated.");
    }

    function populateAreaFilter(rows) {
        console.log("Populating area filter...");
        const areaCounts = {};
        rows.forEach(row => {
            const researchAreas = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '');
            researchAreas.forEach(area => {
                if (area) {
                    const titleCaseArea = toTitleCase(area);
                    areaCounts[titleCaseArea] = (areaCounts[titleCaseArea] || 0) + 1;
                }
            });
        });

        const sortedAreas = Object.entries(areaCounts).sort(([a], [b]) => a.localeCompare(b));

        const areaFilter = document.getElementById("areaFilter");
        areaFilter.innerHTML = `<option value="" style="font-weight: bold;">All Research Areas</option>
                                <option value="" disabled style="color: grey;">[Listed A—Z]</option>`;
        areaFilter.innerHTML += sortedAreas.map(([area, count]) => {
            return `<option value="${area.toLowerCase()}">${area} [~${count} records]</option>`;
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
                let alertMessage = '<strong>No results found with the current filter combination.</strong> ';
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
        const filterNoticeHeight = $('#filterNotice').is(':visible') ? $('#filterNotice').outerHeight(true) : 0;
        const headerHeight = $('.fixed-header').outerHeight(true);
        const totalMargin = headerHeight + (filterNoticeHeight > 0 ? filterNoticeHeight - 40 : 0);

        $('.content').css('margin-top', totalMargin);
    }

    // Attach event listeners
    adjustContentMargin();

    $('#customSearch').on('input', function() {
        if (dataTable) {
            dataTable.search($(this).val()).draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        } else {
            console.error("DataTable is not initialized.");
        }
    });

    $('#methodFilter').on('change', function() {
        if (dataTable) {
            const selectedMethodValue = $('#methodFilter').val().toLowerCase().trim();
            const filteredRows = allRows.filter(row => {
                const mainMethod = row[1]?.trim().toLowerCase() || '';
                return selectedMethodValue === '' || mainMethod === selectedMethodValue;
            });

            populateAreaFilter(filteredRows);    // Update area counts

            dataTable.draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        } else {
            console.error("DataTable is not initialized.");
        }
    });

    $('#areaFilter').on('change', function() {
        if (dataTable) {
            const selectedAreaValue = $('#areaFilter').val().toLowerCase().trim();
            const filteredRows = allRows.filter(row => {
                const researchAreasContent = row.slice(5, 11).map(area => area?.trim().toLowerCase() || '').join('; ');
                return selectedAreaValue === '' || researchAreasContent.includes(selectedAreaValue);
            });

            const currentMethod = $('#methodFilter').val();
            populateMethodFilter(filteredRows, currentMethod);  // Update method counts

            dataTable.draw();
            updateFilterStatus();
            updateFilterNotice();
            window.scrollTo(0, 0);
        } else {
            console.error("DataTable is not initialized.");
        }
    });

    $('#filterStatusBtn').on('click', function() {
        if ($(this).hasClass('red')) {
            if (dataTable) {
                $('#methodFilter').val('');
                $('#areaFilter').val('');
                $('#customSearch').val('');
    
                // Clear DataTables native search and redraw
                dataTable.search('').draw();
    
                // Repopulate filters to reset counts
                populateMethodFilter(allRows);
                populateAreaFilter(allRows);
    
                // Update filter status and notice
                updateFilterStatus();
                updateFilterNotice();
    
                // Scroll the window to the top instantly
                window.scrollTo(0, 0);
            } else {
                console.error("DataTable is not initialized.");
            }
        }
    });
    
    
});
