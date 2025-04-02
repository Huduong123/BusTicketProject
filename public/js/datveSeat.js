document.addEventListener("DOMContentLoaded", async function () {
    const seatGridContainer = document.querySelectorAll(".seat-grid");
    const seatCountElement = document.getElementById("seat-count");
    const selectedSeatsElement = document.getElementById("selected-seats");
    const ticketPriceElement = document.getElementById("ticket-price");
    const finalPriceElement = document.getElementById("final-price");
    const bookTicketBtn = document.getElementById("book-ticket-btn");

    let selectedSeats = [];
    let seatPrice = 0;
    let seatsMap = {}; // Mapping giữa seat_id và seat_number

    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get("tripId");

    if (tripId) {
        try {
            // 1️⃣ Lấy danh sách ghế từ API
            const seatResponse = await fetch(`/trips/${tripId}/seats`);
            if (!seatResponse.ok) throw new Error("Lỗi khi lấy danh sách ghế");
            const seats = await seatResponse.json();

            // Xóa các ghế mặc định
            seatGridContainer.forEach(grid => grid.innerHTML = "");

            // Lưu mapping seat_id ↔ seat_number
            seats.forEach(seat => {
                seatsMap[seat.id] = seat.seat_number;
            });

            // 2️⃣ Render danh sách ghế từ API
            seats.forEach(seat => {
                const seatLabel = document.createElement("label");
                seatLabel.classList.add("seat");

                if (seat.status === "BOOKED") {
                    seatLabel.classList.add("sold");
                } else if (seat.status === "PENDING") {
                    seatLabel.classList.add("pending");
                } else {
                    seatLabel.classList.add("available");
                }

                const seatInput = document.createElement("input");
                seatInput.type = "checkbox";
                seatInput.name = "seat";
                seatInput.value = seat.id;
                seatInput.disabled = seat.status === "BOOKED"; // Khóa ghế đã đặt

                const seatSpan = document.createElement("span");
                seatSpan.textContent = seat.seat_number;

                seatLabel.appendChild(seatInput);
                seatLabel.appendChild(seatSpan);

                if (seat.seat_number.startsWith("A")) {
                    seatGridContainer[0].appendChild(seatLabel);
                } else {
                    seatGridContainer[1].appendChild(seatLabel);
                }
            });

            // 3️⃣ Lấy giá vé từ API (CỐ ĐỊNH GIÁ VÉ)
            const priceResponse = await fetch(`/trips/${tripId}/price`);
            if (!priceResponse.ok) throw new Error("Lỗi khi lấy giá vé");

            const priceData = await priceResponse.json();
            seatPrice = parseInt(priceData.trip_price) || 0;
            
            // Giá vé cố định
            ticketPriceElement.textContent = `${seatPrice.toLocaleString("vi-VN")}đ`;

            // 4️⃣ Xử lý chọn ghế
            document.querySelectorAll(".seat input[type='checkbox']").forEach(checkbox => {
                checkbox.addEventListener("change", function () {
                    const seatId = this.value;
                    const seatLabel = this.parentElement;

                    if (this.checked) {
                        if (selectedSeats.length < 5) {
                            selectedSeats.push(seatId);
                            seatLabel.classList.add("selected");
                        } else {
                            this.checked = false;
                            alert("Bạn chỉ có thể chọn tối đa 5 ghế!");
                        }
                    } else {
                        selectedSeats = selectedSeats.filter(id => id !== seatId);
                        seatLabel.classList.remove("selected");
                    }

                    seatCountElement.textContent = selectedSeats.length;
                    selectedSeatsElement.textContent = selectedSeats.length > 0
                        ? selectedSeats.map(id => seatsMap[id]).join(", ") // Hiển thị seat_number thay vì ID
                        : "Không có";

                    const totalPrice = selectedSeats.length * seatPrice;
                    finalPriceElement.textContent = `${totalPrice.toLocaleString("vi-VN")}đ`;
                });
            });

            // 5️⃣ Xử lý đặt vé
            bookTicketBtn.addEventListener("click", async function () {
                if (selectedSeats.length === 0) {
                    alert("Vui lòng chọn ít nhất một ghế!");
                    return;
                }

                // Kiểm tra lại trạng thái ghế từ server trước khi đặt
                const seatStatusResponse = await fetch(`/trips/${tripId}/seats`);
                if (!seatStatusResponse.ok) throw new Error("Lỗi khi kiểm tra trạng thái ghế");
                const updatedSeats = await seatStatusResponse.json();

                let pendingSeatsSelected = selectedSeats.filter(seatId => {
                    const seat = updatedSeats.find(s => s.id == seatId);
                    return seat && seat.status === "PENDING";
                });

                if (pendingSeatsSelected.length > 0) {
                    alert(`Ghế ${pendingSeatsSelected.map(id => seatsMap[id]).join(", ")} đang có người đặt. Vui lòng chọn ghế khác.`);
                    return;
                }

                // 🟢 Kiểm tra thông tin khách hàng
                const customerName = document.querySelector("input[name='fullname']").value.trim();
                const customerPhone = document.querySelector("input[name='phone']").value.trim();
                const customerEmail = document.querySelector("input[name='email']").value.trim();
                const termsChecked = document.querySelector("input[name='terms']").checked;

                if (!customerName) {
                    alert("Vui lòng nhập Họ và Tên!");
                    return;
                }
                if (!customerPhone) {
                    alert("Vui lòng nhập Số điện thoại!");
                    return;
                }
                if (!customerEmail) {
                    alert("Vui lòng nhập Email!");
                    return;
                }
                if (!termsChecked) {
                    alert("Bạn cần đồng ý với điều khoản & chính sách bảo mật trước khi đặt vé.");
                    return;
                }

                // 🟢 Tiếp tục đặt vé nếu tất cả điều kiện đã thỏa mãn
                const pickupLocation = document.querySelector("select[name='pickup']").value;
                const dropoffLocation = document.querySelector("select[name='dropoff']").value;
                const totalPrice = selectedSeats.length * seatPrice; 
                const bookingData = {
                    trip_id: tripId,
                    ticket_price: seatPrice,
                    seat_ids: selectedSeats,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_email: customerEmail,
                    pickup_location: pickupLocation,
                    dropoff_location: dropoffLocation,
                    total_price_ticket: totalPrice
                };

                try {
                    const response = await fetch("/api/tickets/book", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bookingData),
                        credentials: "include"
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert(`Đặt vé thành công! Mã vé: ${data.ticket_code}`);
                        window.location.href = `/thanhtoan?trip_id=${tripId}&ticket_id=${data.ticket_id}&ticket_code=${data.ticket_code}&total_price=${selectedSeats.length * seatPrice}&customer_name=${encodeURIComponent(customerName)}&customer_phone=${encodeURIComponent(customerPhone)}&customer_email=${encodeURIComponent(customerEmail)}`;
                    } else {
                        alert(data.message || "Lỗi khi đặt vé!");
                    }
                } catch (error) {
                    console.error("Lỗi khi gửi yêu cầu đặt vé:", error);
                    alert("Có lỗi xảy ra, vui lòng thử lại!");
                }
            });

        } catch (error) {
            console.error("🔥 Lỗi khi tải dữ liệu ghế:", error);
        }
    } else {
        console.warn("Không có tripId, không thể lấy dữ liệu.");
    }
});
