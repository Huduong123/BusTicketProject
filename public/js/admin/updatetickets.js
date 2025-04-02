document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("updateTicketForm");
  const ticketId = form.dataset.ticketId;

  const selectedSeatsContainer = document.getElementById("selectedSeats");
  const availableSeatsSelect = document.getElementById("availableSeats");

  // Hiển thị selector
  window.showSeatSelector = () => {
    document.getElementById("seatSelector").style.display = "block";
  };

  // Xóa ghế đang chọn
  window.removeSeat = (btn) => {
    btn.parentElement.remove();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const customer_name = document.getElementById("customer_name").value;
    const customer_phone = document.getElementById("customer_phone").value;

    // Lấy danh sách ghế đang hiển thị (ghế giữ lại)
    let seats = Array.from(document.querySelectorAll(".selected-seat")).map(el =>
      el.dataset.seat
    );

    // Lấy ghế chọn thêm từ danh sách dropdown
    const selectedOptions = Array.from(availableSeatsSelect.selectedOptions).map(opt => opt.value);

    // Gộp danh sách
    const allSeats = [...seats, ...selectedOptions];

    // Kiểm tra số ghế hợp lệ
    const maxSeats = parseInt(document.querySelectorAll(".selected-seat").length) + selectedOptions.length;
    const expectedSeats = parseInt(form.dataset.expectedSeats || maxSeats);

    if (allSeats.length !== expectedSeats) {
      return alert(`Bạn phải chọn đúng ${expectedSeats} ghế.`);
    }

    try {
      const res = await fetch(`/admins/tickets/update/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name,
          customer_phone,
          seat_numbers: allSeats,
          status: "BOOKED",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Cập nhật vé thành công!");
        window.location.href = "/admins/tickets";
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("❌ Lỗi khi gửi yêu cầu cập nhật:", error);
      alert("Đã xảy ra lỗi khi cập nhật.");
    }
  });
});
