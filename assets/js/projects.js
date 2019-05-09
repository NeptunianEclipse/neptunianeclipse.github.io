let cachedScrollY = 0;
let container;

document.addEventListener("DOMContentLoaded", () => {
    const entries = document.getElementsByClassName("project-entry");
    container = document.getElementsByClassName("container")[0];

    for(let entry of entries) {
        let detailsContainer = entry.nextElementSibling;
        entry.addEventListener("click", (e) => showDetails(detailsContainer));

        let closeButton = detailsContainer.getElementsByClassName("close-button")[0];
        closeButton.addEventListener("click", (e) => hideDetails(detailsContainer));
        
        let modalDarken = detailsContainer.getElementsByClassName("modal-darken")[0];
        modalDarken.addEventListener("click", (e) => hideDetails(detailsContainer));
    }

    const showGamesCheck = document.getElementsByClassName("projects-games-check")[0];
    const projectGrid = document.getElementsByClassName("project-grid")[0];

    showGamesCheck.addEventListener("input", (e) => projectGrid.classList.toggle("show-games"));
});

function showDetails(detailsContainer) {
    detailsContainer.classList.add("visible");
    cachedScrollY = window.scrollY;
    container.style.top = -window.scrollY + 'px';
    document.body.classList.add("noscroll");
}

function hideDetails(detailsContainer) {
    detailsContainer.classList.remove("visible");
    document.body.classList.remove("noscroll");
    container.style.top = 0;
    window.scroll(window.scrollX, cachedScrollY);
}