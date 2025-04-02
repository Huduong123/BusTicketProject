document.addEventListener("DOMContentLoaded", function () {
    const tripContainer = document.getElementById("trip-container");
    const addTripBtn = document.getElementById("add-trip-btn");
    const busTypeSelect = document.getElementById("bus_type");
    const updateRouteForm = document.getElementById("updateRouteForm");

    // Lọc xe buýt theo loại xe được chọn
    window.filterBusesByType = function () {
        const selectedBusType = busTypeSelect.value;

        document.querySelectorAll("select[name='bus_ids[]']").forEach(busSelect => {
            // Xóa tất cả option hiện tại
            busSelect.innerHTML = `<option value="">-- Chọn xe buýt --</option>`;

            // Lọc danh sách xe buýt theo loại xe
            const filteredBuses = window.allBuses.filter(bus => bus.bus_type === selectedBusType);
            filteredBuses.forEach(bus => {
                const option = document.createElement("option");
                option.value = bus.id;
                option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                busSelect.appendChild(option);
            });
        });
    };

    // Thêm chuyến xe mới
    function addTrip(time = "", selectedBusId = "") {
        const tripDiv = document.createElement("div");
        tripDiv.classList.add("d-flex", "align-items-center", "gap-2", "mb-2");

        // Input chọn thời gian khởi hành
        const timeInput = document.createElement("input");
        timeInput.type = "time";
        timeInput.className = "form-control";
        timeInput.name = "departure_times[]";
        timeInput.required = true;
        if (time) timeInput.value = time;

        // Dropdown chọn xe buýt (Lọc theo bus_type)
        const busSelect = document.createElement("select");
        busSelect.className = "form-select";
        busSelect.name = "bus_ids[]";
        busSelect.required = true;

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.innerText = "-- Chọn xe buýt --";
        busSelect.appendChild(defaultOption);

        // Lọc xe buýt theo loại xe đã chọn
        const selectedBusType = busTypeSelect.value;
        const filteredBuses = window.allBuses.filter(bus => bus.bus_type === selectedBusType);

        filteredBuses.forEach(bus => {
            const option = document.createElement("option");
            option.value = bus.id;
            option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
            if (bus.id == selectedBusId) option.selected = true;
            busSelect.appendChild(option);
        });

        // Xóa chuyến xe
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-danger btn-sm";
        removeBtn.innerHTML = "✖";
        removeBtn.addEventListener("click", () => {
            tripDiv.remove();
            updateDailyTripCount(); // Cập nhật lại số lượng chuyến
        });

        // Thêm vào giao diện
        tripDiv.appendChild(timeInput);
        tripDiv.appendChild(busSelect);
        tripDiv.appendChild(removeBtn);
        tripContainer.appendChild(tripDiv);

        updateDailyTripCount(); // Cập nhật lại số lượng chuyến
    }

    // Tải dữ liệu chuyến xe hiện có
    function loadExistingTrips() {
        const route = window.preloadedRoute;
        tripContainer.innerHTML = ""; // Xóa nội dung cũ để tránh lặp
        if (route.departure_times && route.departure_times.length > 0) {
            route.departure_times.forEach((time, index) => {
                addTrip(time, route.bus_ids[index]);
            });
        }
    }

    // Khi thay đổi loại xe, cập nhật danh sách xe buýt
    busTypeSelect.addEventListener("change", function () {
        document.querySelectorAll("select[name='bus_ids[]']").forEach(select => {
            select.innerHTML = `<option value="">-- Chọn xe buýt --</option>`;
            const selectedBusType = busTypeSelect.value;
            const filteredBuses = window.allBuses.filter(bus => bus.bus_type === selectedBusType);
            filteredBuses.forEach(bus => {
                const option = document.createElement("option");
                option.value = bus.id;
                option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                select.appendChild(option);
            });
        });
    });

    // Xử lý khi bấm "Thêm chuyến"
    addTripBtn.addEventListener("click", function () {
        addTrip();
    });

    // Cập nhật daily_trip_count dựa trên số lượng chuyến
    function updateDailyTripCount() {
        const tripCount = document.querySelectorAll("input[name='departure_times[]']").length;
        document.getElementById('daily_trip_count').value = tripCount;
        console.log("Daily trip count updated:", tripCount);
    }

    updateRouteForm.addEventListener("submit", async function (event) {
        event.preventDefault();
    
        const times = [];
        const busIds = [];
    
        document.querySelectorAll("input[name='departure_times[]']").forEach(input => {
            if (input.value) times.push(input.value);
        });
    
        document.querySelectorAll("select[name='bus_ids[]']").forEach(select => {
            if (select.value) busIds.push(select.value);
        });
    
        if (times.length !== busIds.length || times.length === 0) {
            alert("Số lượng giờ khởi hành và số lượng xe buýt phải tương ứng và không được để trống.");
            return;
        }
    
        // Lấy travel_time
        const hour = document.getElementById('travel_hours').value;
        const minute = document.getElementById('travel_minutes').value;
    
        if (!hour || !minute) {
            alert("Vui lòng chọn đầy đủ thời gian di chuyển.");
            return;
        }
    
        const travel_time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
        const formData = new FormData(updateRouteForm);
        const jsonData = Object.fromEntries(formData.entries());
    
        const routeId = jsonData.route_id; // lấy từ hidden input
    
        jsonData.departure_times = times;
        jsonData.bus_ids = busIds;
        jsonData.travel_time = travel_time;
        jsonData.daily_trip_count = Math.max(times.length, busIds.length);
    
        try {
            const response = await fetch(`/admins/routes/${routeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert(result.message || "Cập nhật thành công");
                window.location.href = "/admins/routes";
            } else {
                const messageBox = document.getElementById('messageBox');
                const messageText = document.getElementById('messageText');
                messageBox.classList.add('alert-danger');
                messageText.innerText = result.message || 'Có lỗi xảy ra!';
                messageBox.style.display = 'block';
            }
    
        } catch (err) {
            console.error("❌ Lỗi khi gọi API cập nhật:", err);
            alert("Lỗi kết nối đến server.");
        }
    });
    

    // Load dữ liệu sẵn có khi trang được load
    loadExistingTrips();
});
