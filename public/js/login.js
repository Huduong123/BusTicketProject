document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownMenu = document.querySelector(".dropdown-menu");
    const navRight = document.querySelector(".nav-right");
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal")); 
    let returnUrl = "/";
    async function fetchCurrentUser() {
        try {
            const response = await fetch("/users/me");
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    updateNavBar(data.user);
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy user:", error);
        }
    }
    function updateNavBar(user) {
        if (navRight) {
            navRight.innerHTML = `
                <div class="dropdown">
                    <span id="userDropdown">Chào, ${user.full_name} ▼</span>
                    <div class="dropdown-menu">
                        <a href="/thong-tin-tai-khoan/thong-tin-chung">Thông tin tài khoản</a>
                        <a href="/thong-tin-tai-khoan/lich-su-mua-ve">Lịch sử mua vé</a>
                        <a href="/thong-tin-tai-khoan/resetpassword">Đặt lại mật khẩu</a>
                        <a href="#" class="logout-link">Đăng xuất</a>
                    </div>
                </div>
            `;

            const logoutBtn = document.querySelector(".logout-link");
            logoutBtn.addEventListener("click", async function (event) {
                event.preventDefault();
                const confirmLogout = confirm("Bạn có chắc chắn muốn đăng xuất không?");
                if (!confirmLogout) return;

                try {
                    const response = await fetch("/users/logout", { method: "POST" });
                    if (response.ok) {
                        alert("Đăng xuất thành công!");
                        window.location.href = "/";
                    } else {
                        alert("Lỗi đăng xuất");
                    }
                } catch (error) {
                    console.error("Lỗi đăng xuất:", error);
                    alert("Lỗi server");
                }
            });
        }
    }
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
    
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
    
            try {
                const response = await fetch("/users/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                    credentials: "include", 
                });
    
                const data = await response.json();
                if (response.ok) {
                    alert("Đăng nhập thành công!");
    
                    updateNavBar(data.user);
                    loginModal.hide();

                    const savedReturnUrl = localStorage.getItem("returnUrl");
                    const pendingPayment = localStorage.getItem("pendingPayment");
    
                    localStorage.removeItem("returnUrl"); 
                    localStorage.removeItem("pendingPayment"); // ✅ Xóa dữ liệu lưu trữ để tránh lặp lại
    
                    if (pendingPayment) {
                        // 🟢 Gửi lại thanh toán ngay sau khi đăng nhập
                        const paymentData = JSON.parse(pendingPayment);
                        await fetch("/api/payments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(paymentData),
                            credentials: "include",
                        });
    
                        alert("Thanh toán đã được xử lý sau khi đăng nhập!");
                        window.location.href = "/"; 
                    } else if (savedReturnUrl && savedReturnUrl.includes("/thanhtoan")) {
                        window.location.href = savedReturnUrl;
                    } else {
                        window.location.href = "/";
                    }
                } else {
                    alert(data.message || "Lỗi đăng nhập");
                }
            } catch (error) {
                console.error("Lỗi đăng nhập:", error);
                alert("Lỗi server");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const full_name = document.getElementById("fullname").value;
            const username = document.getElementById("usernameRegister").value;
            const phone = document.getElementById("phoneRegister").value;
            const email = document.getElementById("emailRegister").value;
            const password = document.getElementById("passwordRegister").value;
            const confirmPassword = document.getElementById("confirmPasswordRegister").value;


            if (password !== confirmPassword) {
                alert("Mật khẩu xác nhận không khớp!");
                return;
            }

            try {
                const response = await fetch("/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ full_name, username, phone,email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Đăng ký thành công!");
                    window.location.href = "/";
                } else {
                    alert(data.message || "Lỗi đăng ký");
                }
            } catch (error) {
                console.error("Lỗi đăng ký:", error);
                alert("Lỗi server");
            }
        });
    }

 
    

    // Xử lý dropdown menu
    if (userDropdown && dropdownMenu) {
        userDropdown.addEventListener("mouseenter", function () {
            dropdownMenu.style.display = "block";
        });

        dropdownMenu.addEventListener("mouseleave", function () {
            dropdownMenu.style.display = "none";
        });
    }
    document.getElementById("openLoginModal")?.addEventListener("click", function () {
        returnUrl = window.location.pathname; // 🟢 Lưu trang hiện tại
        console.log("🔄 Lưu trang trước khi đăng nhập:", returnUrl);
    });


    fetchCurrentUser();
});

