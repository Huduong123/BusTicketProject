document.addEventListener("DOMContentLoaded", function () {
    const tripContainer = document.getElementById('trip-container');
    const addTripBtn = document.getElementById('add-trip-btn');
    const allBuses = Array.from(document.querySelectorAll('#bus_id option'))
        .filter(opt => opt.value !== "") // bỏ option rỗng

        const renderTripSelectOptions = (selectElement, selectedBusId = null) => {
            const selectedBusIds = Array.from(document.querySelectorAll('#trip-container select'))
                .map(s => s.value)
                .filter(val => val); // chỉ giữ các giá trị đã chọn
        
            // Nếu đang cập nhật một select cụ thể thì bỏ qua busId đang hiển thị trong nó
            if (selectedBusId) {
                const index = selectedBusIds.indexOf(selectedBusId);
                if (index !== -1) selectedBusIds.splice(index, 1);
            }
        
            // Xóa hết option cũ
            selectElement.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.innerText = '-- Chọn xe buýt --';
            selectElement.appendChild(defaultOption);
        
            const selectedType = document.getElementById('bus_type').value;
            const filteredBuses = window.allBuses.filter(bus =>
                bus.bus_type === selectedType &&
                !selectedBusIds.includes(bus.id.toString())
            );
        
            filteredBuses.forEach(bus => {
                const option = document.createElement('option');
                option.value = bus.id;
                option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                selectElement.appendChild(option);
            });
        
            // Nếu đang cập nhật và bus_id vẫn hợp lệ thì gán lại
            if (selectedBusId && !selectedBusIds.includes(selectedBusId)) {
                const option = document.createElement('option');
                const bus = window.allBuses.find(b => b.id.toString() === selectedBusId);
                if (bus) {
                    option.value = bus.id;
                    option.textContent = `${bus.license_plate} - ${bus.bus_type}`;
                    option.selected = true;
                    selectElement.appendChild(option);
                }
            }
        };
        
        const refreshAllBusSelects = () => {
            const selects = document.querySelectorAll('#trip-container select');
            selects.forEach(select => {
                const currentVal = select.value;
                renderTripSelectOptions(select, currentVal);
            });
        };
        
        addTripBtn.addEventListener('click', function () {
            const selectedBusType = document.getElementById('bus_type').value;
            if (!selectedBusType) {
                alert("Vui lòng chọn loại xe trước khi thêm chuyến.");
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
        
            busSelect.addEventListener('change', refreshAllBusSelects);
        
            renderTripSelectOptions(busSelect);
        
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn btn-danger btn-sm';
            removeBtn.innerHTML = '✖';
            removeBtn.addEventListener('click', () => {
                tripDiv.remove();
                refreshAllBusSelects();
            });
        
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
