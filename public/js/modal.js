document.addEventListener("DOMContentLoaded", function () {
    const loginModalEl = document.getElementById("loginModal");
    const registerModalEl = document.getElementById("registerModal");

    const loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;
    const registerModal = registerModalEl ? new bootstrap.Modal(registerModalEl) : null;

    const openLoginBtn = document.getElementById("openLoginModal");
    if (openLoginBtn && loginModal) {
        openLoginBtn.addEventListener("click", function () {
            loginModal.show();
        });
    }

    const openRegisterBtn = document.getElementById("openRegisterModal");
    if (openRegisterBtn && loginModal && registerModal) {
        openRegisterBtn.addEventListener("click", function () {
            loginModal.hide();
            setTimeout(() => registerModal.show(), 100);
        });
    }

    const backToLoginBtn = document.getElementById("backToLogin");
    if (backToLoginBtn && loginModal && registerModal) {
        backToLoginBtn.addEventListener("click", function () {
            registerModal.hide();
            setTimeout(() => loginModal.show(), 100);
        });
    }
});
