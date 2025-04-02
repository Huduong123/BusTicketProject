document.addEventListener("DOMContentLoaded", function () {
    const oneWayRadio = document.querySelector('input[value="one-way"]');
    const roundTripRadio = document.querySelector('input[value="round-trip"]');
    const dateGroup = document.querySelector(".date-group");
    const endDate = document.getElementById("end-date");
    const endDateGroup = endDate ? endDate.parentElement : null;

    function toggleEndDateVisibility() {
        if (!endDateGroup) return; // Nếu không tìm thấy, thoát khỏi hàm tránh lỗi

        if (oneWayRadio.checked) {
            endDateGroup.style.display = "none"; // Ẩn Ngày về
            dateGroup?.classList.remove("flex-row"); // Chuyển về dạng dọc nếu dateGroup tồn tại
        } else if (roundTripRadio.checked) {
            endDateGroup.style.display = "flex"; // Hiển thị Ngày về
            dateGroup?.classList.add("flex-row"); // Hiển thị dạng hàng ngang nếu dateGroup tồn tại
        }
    }

    // Khởi tạo hiển thị trên trang
    toggleEndDateVisibility();

    // Lắng nghe sự kiện thay đổi radio
    oneWayRadio.addEventListener("change", toggleEndDateVisibility);
    roundTripRadio.addEventListener("change", toggleEndDateVisibility);




});