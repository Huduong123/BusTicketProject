document.addEventListener("DOMContentLoaded", async function () {
    const paymentMethods = document.querySelectorAll(".method input");
    const paymentLabels = document.querySelectorAll(".method");
    const paymentAppText = document.querySelector(".payment-instructions ol li:first-child");
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get("trip_id");
    const ticketId = urlParams.get("ticket_id");
    const payNowButton = document.getElementById("pay-now");
    if (!tripId || !ticketId) {
      alert("Không tìm thấy thông tin vé!");
      return;
    }
  
    let totalAmount = 0;
    let userId = null;
    let selectedPaymentMethod = null;
    let ticket = null;
  
    try {
      const response = await fetch(`/api/tickets/detailed?trip_id=${tripId}&ticket_id=${ticketId}`, {
        method: "GET",
        credentials: "include",
      });
  
      if (response.status === 401 || response.status === 403) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.setItem("returnUrl", window.location.href);
        loginModal.show();
        return;
      }
  
      const data = await response.json();
      if (data.length === 0) {
        alert("Không tìm thấy thông tin vé!");
        return;
      }
  
      ticket = data[0];
  
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
      document.getElementById("total-price").innerText = `${ticket.total_price_ticket.toLocaleString("vi-VN")}đ`;
  
      totalAmount = ticket.total_price_ticket;
      userId = ticket.user_id;
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin vé:", error);
      alert("Có lỗi xảy ra khi tải thông tin vé.");
    }
  
    paymentMethods.forEach((method, index) => {
      method.addEventListener("change", function () {
        paymentLabels.forEach(label => label.classList.remove("active"));
        paymentLabels[index].classList.add("active");
  
        selectedPaymentMethod = method.nextElementSibling.getAttribute("alt");
        paymentAppText.innerText = `Mở ${selectedPaymentMethod} trên điện thoại`;
      });
    });
  
    if (payNowButton) {
      payNowButton.addEventListener("click", async function () {
        if (!selectedPaymentMethod) {
          alert("Vui lòng chọn phương thức thanh toán trước khi tiếp tục!");
          return;
        }
  
        if (selectedPaymentMethod !== "VNPAY") {
          alert("Hiện tại chỉ hỗ trợ VNPay cho demo.");
          return;
        }
  
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
          console.log("📦 Kết quả API:", result);
          if (res.ok && result.url) {
            window.location.href = result.url; // Chuyển đến link QR của VNPAY
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
  });