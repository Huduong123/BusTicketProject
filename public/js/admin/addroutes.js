document.addEventListener("DOMContentLoaded", function () {
    const tripContainer = document.getElementById('trip-container');
    const addTripBtn = document.getElementById('add-trip-btn');
    const allBuses = Array.from(document.querySelectorAll('#bus_id option'))
        .filter(opt => opt.value !== "") // bỏ option rỗng

    // Giao diện chọn giờ + xe buýt
    addTripBtn.addEventListener('click', function () {
        const selectedBusType = document.getElementById('bus_type').value;
    
        if (!selectedBusType) {
            alert("Vui lòng chọn loại xe trước khi thêm chuyến.");
            return;
        }
    
        const filteredBuses = window.allBuses.filter(bus => bus.bus_type === selectedBusType);
    
        if (filteredBuses.length === 0) {
            alert("Không có xe buýt nào phù hợp với loại xe đã chọn.");
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
    
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.innerText = "-- Chọn xe buýt --";
        busSelect.appendChild(defaultOption);
    
        filteredBuses.forEach(bus => {
            const option = document.createElement('option');
            option.value = bus.id;
            option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
            busSelect.appendChild(option);
        });
    
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-danger btn-sm';
        removeBtn.innerHTML = '✖';
        removeBtn.addEventListener('click', () => tripDiv.remove());
    
        tripDiv.appendChild(timeInput);
        tripDiv.appendChild(busSelect);
        tripDiv.appendChild(removeBtn);
        tripContainer.appendChild(tripDiv);
    });
    
    // Submit form -> lấy dữ liệu từ các chuyến
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

        // Gán vào hidden input
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
