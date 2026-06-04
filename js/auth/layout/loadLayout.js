async function loadLayout() {
    const response = await fetch("/components/layout.html");
    const layout = await response.text();

    console.log(layout.length);

    const container = document.getElementById("layout-container");

    if (container) {
        container.innerHTML = layout;
    }
}

loadLayout();

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
        return;
    }

    sidebar.classList.toggle("expanded");
}