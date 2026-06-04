async function loadLayout() {

    const response = await fetch("/components/layout.html");
    const layout = await response.text();

    const container = document.getElementById("layout-container");

    if(container){
        container.innerHTML = layout;
    }

    initLayout();
}

function initLayout(){
    console.log("Layout carregado!");
}

loadLayout();

function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    if(!sidebar){
        return;
    }

    sidebar.classList.toggle("expanded");
}