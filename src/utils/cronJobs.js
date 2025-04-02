const cron = require('node-cron');
const Ticket = require('../models/ticketModel');
const Route = require('../models/routeModel');
const Trip = require('../models/tripModel');
const TripStop = require('../models/tripStopModel');

// 🕒 1. Xóa vé hết hạn (mỗi phút)
cron.schedule('* * * * *', async () => {
    try {
        console.log("🕒 Cron Job: Kiểm tra vé hết hạn...");
        await Ticket.deleteExpiredTickets();
    } catch (error) {
        console.error("❌ Lỗi khi xóa vé hết hạn:", error);
    }
});

// 🕛 2. Tạo chuyến xe mới nếu qua ngày (mỗi phút)
cron.schedule('0 0 * * *', async () => {
    try {
        console.log("🕛 Cron Job: Kiểm tra và tạo chuyến mới cho các tuyến...");

        const routes = await Route.getRouteAdmin();
        const today = new Date();
        today.setHours(0, 0, 0, 0); // reset về 00:00:00

        for (const route of routes) {
            const times = JSON.parse(route.departure_times || '[]');
            const buses = JSON.parse(route.bus_ids || '[]');

            if (times.length !== buses.length) {
                console.warn(`⚠️ Tuyến ID ${route.id} có số giờ và xe không khớp.`);
                continue;
            }

            const latestTripDate = await Trip.getLatestTripDateByRoute(route.id);
            const latestDate = latestTripDate ? new Date(latestTripDate) : new Date(today);
            latestDate.setDate(latestDate.getDate() + 1); // Ngày tiếp theo cần tạo

            const targetDateStr = latestDate.toISOString().split("T")[0];
            console.log(`📅 Tạo chuyến cho ngày ${targetDateStr} (route_id: ${route.id})`);

            for (let i = 0; i < times.length; i++) {
                const time = times[i];
                const bus_id = buses[i];

                const [hour, minute] = time.split(':').map(Number);
                const departure = new Date(latestDate);
                departure.setHours(hour, minute, 0, 0);

                const [h, m] = route.travel_time.split(':').map(Number);
                const arrival = new Date(departure.getTime() + (h * 60 + m) * 60000);

                const result = await Trip.createTrip(
                    route.departure_location,
                    route.destination_location,
                    route.distance,
                    route.id,
                    bus_id,
                    departure,
                    arrival,
                    'ON_TIME',
                    route.ticket_price
                );

                if (result.success && result.tripId) {
                    const oldTripId = await Trip.getAnyTripIdByRoute(route.id, result.tripId);
                    // thêm hàm phụ để lấy 1 trip_id cũ
                
                    if (oldTripId) {
                        const { pickup_location, dropoff_location } = await Trip.getPickupAndDropoffLocations(oldTripId);
                
                        if (pickup_location) {
                            await TripStop.addTripStop(result.tripId, 'PICKUP', pickup_location);
                        }
                        if (dropoff_location) {
                            await TripStop.addTripStop(result.tripId, 'DROPOFF', dropoff_location);
                        }
                    } else {
                        console.warn(`⚠️ Không tìm thấy trip mẫu cho route ${route.id} để lấy điểm đón/trả.`);
                    }
                
                    console.log(`✅ Tạo chuyến ID ${result.tripId} thành công`);
                }
            }
        }

        console.log("✅ Hoàn tất tạo các chuyến xe mới.");
    } catch (error) {
        console.error("❌ Lỗi trong cron job tạo chuyến:", error);
    }
});
