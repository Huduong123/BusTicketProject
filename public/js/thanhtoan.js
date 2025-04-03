document.addEventListener("DOMContentLoaded", async function () {
  const payNowButton = document.getElementById("pay-now");
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("trip_id");
  const ticketId = urlParams.get("ticket_id");

  if (!tripId || !ticketId) {
    alert("Không tìm thấy thông tin vé!");
    return;
  }

  let totalAmount = 0;
  let ticket = null;

  try {
    const response = await fetch(`/api/tickets/detailed?trip_id=${tripId}&ticket_id=${ticketId}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (data.length === 0) {
      alert("Không tìm thấy thông tin vé!");
      return;
    }

    ticket = data[0];

    // Fill thông tin chuyến đi
    document.getElementById("trip-name").innerText = `Chuyến đi: ${ticket.trip_departure} - ${ticket.trip_destination}`;
    document.getElementById("trip_date").innerText = `${formatDepartureDate(ticket.departure_time)}`;
    document.getElementById("customer-name").innerText = `Họ và tên: ${ticket.customer_name}`;
    document.getElementById("customer-phone").innerText = `Số điện thoại: ${ticket.customer_phone}`;
    document.getElementById("customer-email").innerText = `Email: ${ticket.customer_email}`;
    document.getElementById("route-info").innerText = `Tuyến xe: ${ticket.route_departure} - ${ticket.route_destination}`;
    document.getElementById("departure-time").innerText = `Thời gian xuất bến: ${new Date(ticket.departure_time).toLocaleString("vi-VN")}`;
    document.getElementById("seat-count").innerText = `Số lượng ghế: ${ticket.seat_count}`;
    document.getElementById("seat-info").innerText = `Ghế đã chọn: ${ticket.seat_numbers}`;
    document.getElementById("pickup-location").innerText = `Điểm lên xe: ${ticket.pickup_location}`;
    document.getElementById("dropoff-location").innerText = `Điểm trả khách: ${ticket.dropoff_location}`;
    document.getElementById("ticket-price").innerText = `Giá vé: ${ticket.ticket_price.toLocaleString("vi-VN")}đ`;
    document.getElementById("total-price-ticket").innerText = `Tổng tiền: ${ticket.total_price_ticket.toLocaleString("vi-VN")}đ`;

    totalAmount = ticket.total_price_ticket;
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông tin vé:", err);
    alert("Có lỗi xảy ra khi tải thông tin vé.");
  }

  if (payNowButton) {
    payNowButton.addEventListener("click", async function () {
      try {
        const res = await fetch("/api/payments/create_vnpay_payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ticket_id: ticketId,
            email: ticket.customer_email,
            customer_name: ticket.customer_name,
            amount: totalAmount,
          }),
        });

        const result = await res.json();
        if (res.ok && result.url) {
          window.location.href = result.url;
        } else {
          alert("Không thể khởi tạo thanh toán VNPay.");
        }
      } catch (err) {
        console.error("Lỗi khi gọi VNPay:", err);
        alert("Đã xảy ra lỗi khi xử lý thanh toán.");
        window.location.href = '/';
      }
    });
  }

  function formatDepartureDate(dateString) {
    const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dateObj = new Date(dateString);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    const formattedDate = dateObj.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${dayOfWeek}, ${formattedDate}`;
  }


  // ⏳ Đếm ngược 20 phút
function startCountdown(durationInMinutes) {
  const countdownElement = document.getElementById("countdown");
  let timeRemaining = durationInMinutes * 60; // in seconds

  const countdownInterval = setInterval(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    countdownElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      alert("⏰ Hết thời gian giữ vé. Bạn sẽ được chuyển về trang chủ.");
      window.location.href = "/";
    }

    timeRemaining--;
  }, 1000);
}

startCountdown(20); // Bắt đầu đếm ngược 20 phút

});
