document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const header = document.querySelector(".admin-header");
    const mainContainer = document.querySelector(".main-container");

    menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("hidden");
        header.classList.toggle("sidebar-hidden");
        mainContainer.classList.toggle("sidebar-hidden");
    });
});
