document.addEventListener("DOMContentLoaded", () => {
    const navButton = document.querySelector(".nav-button");
    const navList = document.querySelector(".nav-list");
    const navButtonOption = navButton.querySelector(".nav-option");

    navButton.addEventListener("click", event => {
        navList.classList.toggle('expanded');
        navButtonOption.classList.toggle('selected')

        // toggleExpand(navList);
    });

});

function toggleExpand(element) {
    if(!element.style.height || element.style.height == '0px') {
        element.style.height = Array.prototype.reduce.call(element.childNodes, function(p, c) {return p + (c.offsetHeight || 0);}, 0) + 'px';
    } else {
        element.style.height = '0px';
    }
}