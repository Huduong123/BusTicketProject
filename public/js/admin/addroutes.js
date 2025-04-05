document.addEventListener("DOMContentLoaded", function () {
    const tripContainer = document.getElementById('trip-container');
    const addTripBtn = document.getElementById('add-trip-btn');

    // Sự kiện thêm chuyến
    addTripBtn.addEventListener('click', function () {
        const selectedBusType = document.getElementById('bus_type').value;
        const travelHours = document.getElementById('travel_hours').value;
        const travelMinutes = document.getElementById('travel_minutes').value;

        if (!selectedBusType || !travelHours || !travelMinutes) {
            alert("Vui lòng chọn Loại xe và Thời gian di chuyển (giờ, phút) trước khi thêm chuyến.");
            return;
        }

        const tripDiv = document.createElement('div');
        tripDiv.classList.add('d-flex', 'align-items-center', 'gap-2', 'mb-2');

        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.className = 'form-control';
        timeInput.required = true;

        const busSelect = document.createElement('select');
        busSelect.className = 'form-select';
        busSelect.required = true;
        busSelect.disabled = true;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm';
        removeBtn.innerHTML = '✖';
        removeBtn.addEventListener('click', () => tripDiv.remove());

        // Khi thay đổi giờ => load lại danh sách xe khả dụng
        timeInput.addEventListener('change', async () => {
            const time = timeInput.value;
            const busType = document.getElementById('bus_type').value;
            const hours = document.getElementById('travel_hours').value;
            const minutes = document.getElementById('travel_minutes').value;

            if (!time || !busType || !hours || !minutes) {
                alert("Vui lòng chọn đủ loại xe và thời gian di chuyển trước.");
                timeInput.value = '';
                return;
            }

            const travelTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

            try {
                const res = await fetch(`/admins/routes/available-buses-by-time?bus_type=${busType}&time=${time}&travel_time=${travelTime}`);
                const data = await res.json();

                busSelect.innerHTML = '<option value="">-- Chọn xe buýt --</option>';
                data.availableBuses.forEach(bus => {
                    const option = document.createElement('option');
                    option.value = bus.id;
                    option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                    busSelect.appendChild(option);
                });

                busSelect.disabled = false;
            } catch (err) {
                console.error('Lỗi khi lấy danh sách xe khả dụng:', err);
            }
        });

        tripDiv.appendChild(timeInput);
        tripDiv.appendChild(busSelect);
        tripDiv.appendChild(removeBtn);
        tripContainer.appendChild(tripDiv);
    });

    // Khi đổi loại xe → cập nhật lại toàn bộ danh sách xe buýt trong từng chuyến
    document.getElementById('bus_type').addEventListener('change', async () => {
        const busType = document.getElementById('bus_type').value;
        const hours = document.getElementById('travel_hours').value;
        const minutes = document.getElementById('travel_minutes').value;

        if (!busType || !hours || !minutes) return;

        const travelTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        const tripItems = tripContainer.querySelectorAll('div');
        for (let trip of tripItems) {
            const timeInput = trip.querySelector('input[type="time"]');
            const busSelect = trip.querySelector('select');
            const time = timeInput.value;

            if (!time) {
                busSelect.innerHTML = '<option value="">-- Chọn xe buýt --</option>';
                busSelect.disabled = true;
                continue;
            }

            try {
                const res = await fetch(`/admins/routes/available-buses-by-time?bus_type=${busType}&time=${time}&travel_time=${travelTime}`);
                const data = await res.json();

                busSelect.innerHTML = '<option value="">-- Chọn xe buýt --</option>';
                data.availableBuses.forEach(bus => {
                    const option = document.createElement('option');
                    option.value = bus.id;
                    option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                    busSelect.appendChild(option);
                });

                busSelect.disabled = false;
            } catch (err) {
                console.error('Lỗi khi cập nhật danh sách xe khi đổi loại:', err);
            }
        }
    });

    // Gửi form
    const form = document.getElementById('addRouteForm');
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const times = [];
        const busIds = [];

        const tripItems = tripContainer.querySelectorAll('div');
        for (let trip of tripItems) {
            const timeInput = trip.querySelector('input[type="time"]');
            const busSelect = trip.querySelector('select');

            if (!timeInput.value || !busSelect.value) {
                alert("Vui lòng nhập đầy đủ giờ khởi hành và chọn xe buýt cho mỗi chuyến.");
                return;
            }

            times.push(timeInput.value);
            busIds.push(busSelect.value);
        }

        document.getElementById('departure_times').value = JSON.stringify(times);
        document.getElementById('bus_ids').value = JSON.stringify(busIds);

        const formData = new FormData(form);
        const jsonData = Object.fromEntries(formData.entries());

        const hours = document.getElementById('travel_hours').value;
        const minutes = document.getElementById('travel_minutes').value;

        if (!hours || !minutes) {
            alert("Vui lòng chọn đầy đủ giờ và phút.");
            return;
        }

        jsonData.travel_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        jsonData.departure_times = times;
        jsonData.bus_ids = busIds;
        jsonData.pickup_location = document.getElementById('pickup_location').value;
        jsonData.dropoff_location = document.getElementById('dropoff_location').value;

        try {
            const response = await fetch('/admins/routes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = "/admins/routes";
            } else {
                const messageBox = document.getElementById('messageBox');
                const messageText = document.getElementById('messageText');
                messageBox.classList.add('alert-danger');
                messageText.innerText = result.message || 'Có lỗi xảy ra!';
                messageBox.style.display = 'block';
            }
        } catch (error) {
            console.error('Lỗi:', error);
        }
    });
});
