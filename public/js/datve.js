document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const tripName = urlParams.get('tripName');
    const tripDate = urlParams.get('tripDate');
    const tripId = urlParams.get('tripId');

    console.log("Trip Name:", tripName, "Trip Date:", tripDate, "Trip ID:", tripId);

    if (tripName && tripDate) {
        document.getElementById('trip-name').textContent = tripName;
        document.getElementById('trip-date').textContent = tripDate;
    }

    if (tripId) {
        try {
            const routeResponse = await fetch(`/trips/${tripId}/route`);
            if (!routeResponse.ok) throw new Error("Lỗi khi lấy thông tin tuyến");

            const routeData = await routeResponse.json();
            if (routeData) {
                document.getElementById('route-name').textContent = "Tuyến: " + routeData.route_name;
                const departureDate = new Date(routeData.departure_time);
                document.getElementById('departure-time').textContent = `Thời gian khởi hành: ${departureDate.toLocaleString('vi-VN')}`;
            }

            const pickupResponse = await fetch(`/trips/${tripId}/pickup`);
            if (!pickupResponse.ok) throw new Error("Lỗi khi lấy điểm đón");

            const pickupData = await pickupResponse.json();
            const pickupSelect = document.querySelector('.station-info .pickup select[name="pickup"]');
            pickupSelect.innerHTML = '';
            pickupData.forEach(point => {
                const option = document.createElement('option');
                option.value = point.location;
                option.textContent = point.location;
                pickupSelect.appendChild(option);
            });

            const dropoffResponse = await fetch(`/trips/${tripId}/dropoff`);
            if (!dropoffResponse.ok) throw new Error("Lỗi khi lấy điểm trả");

            const dropoffData = await dropoffResponse.json();
            const dropoffSelect = document.querySelector('.station-info .dropoff select[name="dropoff"]');
            dropoffSelect.innerHTML = '';
            dropoffData.forEach(point => {
                const option = document.createElement('option');
                option.value = point.location;
                option.textContent = point.location;
                dropoffSelect.appendChild(option);
            });

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu chuyến xe:", error);
        }
    } else {
        console.warn("tripId không có trong URL, không thể lấy dữ liệu.");
    }


});
