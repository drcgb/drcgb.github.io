$(document).ready(function() {
    let allRows = [];
    let dataTable;

    // Load and populate data
    document.addEventListener("DOMContentLoaded", async () => {
        try {
            console.log("Loading XLSX data...");
            const response = await fetch("Prelim_Hons_Thesis_Titles_and_Abstracts_2024_FinalX.xlsx");
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1);
            console.log("Data loaded:", allRows);

            populateTable(allRows);
            populateMethodFilter(allRows);
            populateAreaFilter(allRows);
            initializeDataTable();
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

        console.log("DataTable initialized.");
    });

    // Additional JavaScript goes here...
});
