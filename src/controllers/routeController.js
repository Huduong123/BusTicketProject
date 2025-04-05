const Route = require('../models/routeModel');
const Location = require('../models/locationModel');
const Trip = require('../models/tripModel');
const Bus = require('../models/busModel')
const TripStop = require('../models/tripStopModel');

class RouteController {

    async getAllRoute(req, res) {
        try {
            const routes = await Route.getAllRoute();
            res.status(200).json(routes);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    async createRoute(req, res) {
        try {
            const {
                departure_location,
                destination_location,
                distance,
                travel_time,
                bus_type,
                ticket_price,
                departure_times,
                bus_ids,
                pickup_location,
                dropoff_location
            } = req.body;
    
            if (
                !departure_location || !destination_location || !distance || !travel_time ||
                !ticket_price || !departure_times || !bus_ids || !pickup_location || !dropoff_location
            ) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
            }
    
            if (departure_location === destination_location) {
                return res.status(400).json({ message: 'Điểm đi và đến không được trùng nhau' });
            }
            
            // ✅ Thêm đoạn này để kiểm tra trùng tuyến:
            const isDuplicate = await Route.checkRouteExists(departure_location, destination_location);
            if (isDuplicate) {
                return res.status(400).json({ message: 'Tuyến xe này đã tồn tại trong hệ thống' });
            }
            const times = Array.isArray(departure_times) ? departure_times : JSON.parse(departure_times);
            const buses = Array.isArray(bus_ids) ? bus_ids : JSON.parse(bus_ids);
    
            if (times.length !== buses.length) {
                return res.status(400).json({ message: 'Số lượng giờ và bus_id phải tương ứng' });
            }
    
            const daily_trip_count = times.length;
    
            // ✅ Thêm cả `bus_ids` khi tạo tuyến
            const result = await Route.createRoute(
                departure_location,
                destination_location,
                distance,
                travel_time,
                bus_type,
                ticket_price,
                daily_trip_count,
                JSON.stringify(times),
                JSON.stringify(buses) // ✅ thêm dòng này
            );
    
            const route_id = result.insertId;
            const now = new Date();
            const daysToGenerate = 7;
    
            for (let day = 0; day < daysToGenerate; day++) {
                const date = new Date(now);
                date.setDate(date.getDate() + day);
    
                for (let i = 0; i < times.length; i++) {
                    const time = times[i];
                    const bus_id = buses[i];
    
                    const [hour, minute] = time.split(':').map(Number);
                    const departure = new Date(date);
                    departure.setHours(hour, minute, 0, 0);
    
                    const [h, m] = travel_time.split(':').map(Number);
                    const arrival = new Date(departure.getTime() + ((h * 60 + m) * 60 * 1000));
    
                    const tripResult = await Trip.createTrip(
                        departure_location,
                        destination_location,
                        distance,
                        route_id,
                        bus_id,
                        departure,
                        arrival,
                        'ON_TIME',
                        ticket_price
                    );
    
                    const tripId = tripResult.tripId;
                    if (tripId) {
                        await TripStop.addTripStop(tripId, 'PICKUP', pickup_location);
                        await TripStop.addTripStop(tripId, 'DROPOFF', dropoff_location);
                    }
                }
            }
    
            res.status(201).json({
                success: true,
                message: 'Tạo tuyến và các chuyến tương ứng thành công',
                route_id
            });
    
        } catch (error) {
            console.error("❌ Lỗi tạo tuyến:", error);
            res.status(500).json({ success: false, message: 'Lỗi server', error });
        }
    }
    
    
  
    async updateRoute(req, res) {
        try {
            const { route_id } = req.params;
    
            if (!route_id) {
                return res.status(400).json({ message: "Thiếu ID tuyến xe." });
            }
    
            const {
                departure_location,
                destination_location,
                distance,
                travel_time,
                bus_type,
                ticket_price,
                departure_times,
                bus_ids,
                pickup_location,
                dropoff_location
            } = req.body;
    
            if (
                !departure_location || !destination_location || !distance || !travel_time ||
                !ticket_price || !pickup_location || !dropoff_location
            ) {
                return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
            }
    
            if (departure_location === destination_location) {
                return res.status(400).json({ message: "Điểm đi và điểm đến không được trùng nhau" });
            }
    
            let times, buses;
            try {
                times = Array.isArray(departure_times) ? departure_times : JSON.parse(departure_times);
                buses = Array.isArray(bus_ids) ? bus_ids : JSON.parse(bus_ids);
            } catch (err) {
                console.error("❌ Lỗi parse JSON:", err);
                return res.status(400).json({ message: "Dữ liệu giờ khởi hành hoặc xe buýt không hợp lệ" });
            }
    
            if (times.length !== buses.length) {
                return res.status(400).json({ message: "Số lượng giờ và bus_id phải tương ứng" });
            }
    
            const daily_trip_count = times.length;
    
            // Xóa tất cả các chuyến xe cũ của tuyến
            await Trip.deleteTripsByRouteId(route_id);
    
            // Cập nhật thông tin tuyến
            const result = await Route.updateRouteWithTrips(
                route_id,
                departure_location,
                destination_location,
                distance,
                travel_time,
                bus_type,
                ticket_price,
                daily_trip_count,
                JSON.stringify(times),
                JSON.stringify(buses)
            );
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy tuyến xe để cập nhật" });
            }
    
            // Tạo lại các chuyến xe mới
            const now = new Date();
            const daysToGenerate = 7;
    
            for (let day = 0; day < daysToGenerate; day++) {
                const date = new Date(now);
                date.setDate(date.getDate() + day);
    
                for (let i = 0; i < times.length; i++) {
                    const time = times[i];
                    const bus_id = buses[i];
    
                    const [hour, minute] = time.split(':').map(Number);
                    const departure = new Date(date);
                    departure.setHours(hour, minute, 0, 0);
    
                    const [h, m] = travel_time.split(':').map(Number);
                    const arrival = new Date(departure.getTime() + ((h * 60 + m) * 60 * 1000));
    
                    const tripResult = await Trip.createTrip(
                        departure_location,
                        destination_location,
                        distance,
                        route_id,
                        bus_id,
                        departure,
                        arrival,
                        'ON_TIME',
                        ticket_price
                    );
    
                    const tripId = tripResult.tripId;
                    if (tripId) {
                        await TripStop.addTripStop(tripId, 'PICKUP', pickup_location);
                        await TripStop.addTripStop(tripId, 'DROPOFF', dropoff_location);
                    }
                }
            }
    
            return res.status(200).json({ success: true, message: 'Cập nhật tuyến xe và các chuyến xe thành công' });
    
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật tuyến:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    

    

    async deleteRoute(req, res) {
        try {
            const { route_id } = req.params;
    
            if (!route_id) {
                return res.status(400).json({ message: "Thiếu route_id" });
            }
    
            const result = await Route.deleteRouteWithTrips(route_id);
    
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy tuyến để xóa" });
            }
    
            return res.redirect('/admins/routes');
        } catch (error) {
            console.error("❌ Lỗi khi xóa tuyến và chuyến:", error);
            return res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    
    async getAllSchedules(req, res) {
        try {
            const schedules = await Route.getSchedules(); 

            res.render("lichtrinh", { schedules }); 
        } catch (error) {
            console.error("🔥 Lỗi khi lấy lịch trình:", error);
            res.render("lichtrinh", { schedules: [], message: "Không thể tải lịch trình" });
        }
    }


    async renderAdminRoutes(req, res) {
        try {
          const routes = await Route.getRouteAdmin();
          const locations = await Location.getAllLocation();
          const allBuses = await Bus.getAllBus(); // ✅ lấy toàn bộ thông tin xe buýt
      
          res.render('admin/routes/routes', {
            title: "Quản lý Tuyến Xe",
            routes,
            locations,
            allBuses
          });
        } catch (error) {
          console.log(error);
          res.status(500).send("Lỗi khi tải danh sách tuyến xe");
        }
      }
      

    async getAllLocations(req, res) {
        try {
            const locations = await Location.getAllLocation();
            const buses = await Bus.getAllBus(); // Thêm dòng này để lấy danh sách xe buýt
            res.render('admin/routes/addroutes', { locations ,buses});
        } catch (error) {
            console.error(error);
            res.status(500).send("Lỗi khi tải trang thêm tuyến xe");
        }
    }

    async renderUpdateRoute(req, res) {
        try {
            const { route_id } = req.params;
        
            if (!route_id || route_id === "undefined") {
                return res.status(400).send("Thiếu route_id trong yêu cầu.");
            }
    
            const route = await Route.getRouteById(route_id);
            if (!route) {
                return res.status(404).send("Không tìm thấy tuyến đường.");
            }
    
            const routeDetails = await Route.getRouteDetailsById(route_id);
                // Lấy điểm đón và trả từ 1 chuyến bất kỳ thuộc tuyến này
            const anyTripId = await Trip.getAnyTripIdByRoute(route_id);
            const tripStops = await Trip.getPickupAndDropoffLocations(anyTripId);

            // Gán vào route để gửi về view
            route.pickup_location = tripStops.pickup_location;
            route.dropoff_location = tripStops.dropoff_location;

            if (!routeDetails) {
                return res.status(404).send("Không tìm thấy chi tiết tuyến xe.");
            }
    
            const locations = await Location.getAllLocation();
            
            // Lấy danh sách xe buýt chỉ phù hợp với `bus_type`
            const buses = await Bus.getBusesByType(route.bus_type);
    
            // Cập nhật dữ liệu từ routeDetails
            route.ticket_price = routeDetails.ticket_price;
            route.departure_times = routeDetails.departure_times;
            route.bus_ids = routeDetails.unique_bus_ids;
    
            res.render('admin/routes/updateroutes', { route, locations, buses });
        } catch (error) {
            console.error("Lỗi khi tải trang cập nhật tuyến xe:", error);
            res.status(500).send("Lỗi khi tải trang cập nhật tuyến xe");
        }
    }
    
    
    // tìm tuyến ở trang lich trình
    async searchTripsByRoute(req, res) {
        try {
            const { departure_location, destination_location } = req.query;
    
            if (!departure_location || !destination_location) {
                return res.status(400).json({ message: "Thiếu điểm đi hoặc điểm đến" });
            }
    
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0]; // '2025-04-03'
            const timeStr = now.toTimeString().split(' ')[0]; // 'HH:MM:SS'
            const startTime = `${todayStr} ${timeStr}`;
            const endTime = `${todayStr} 23:59:59`;
    
            const trips = await Route.getTripsByRouteInToday(departure_location, destination_location, startTime, endTime);
            res.status(200).json({ message: "Tìm chuyến theo tuyến thành công", trips });
    
        } catch (error) {
            console.error("Lỗi tìm chuyến theo tuyến:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    async findRouteTrips(req, res) {
        try {
            const { departure_location, destination_location } = req.query;
        
            if (!departure_location || !destination_location) {
              return res.status(400).json({ message: "Thiếu điểm đi hoặc điểm đến" });
            }
        
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const startTime = `${todayStr} 00:00:00`;
            const endTime = `${todayStr} 23:59:59`;
        
            const allTrips = await Route.getTripsByRouteInToday(departure_location, destination_location, startTime, endTime);
        
            const tripsExact = [];
            const tripsPartial = [];
        
            for (const trip of allTrips) {
              if (
                trip['Điểm đi'].toLowerCase() === departure_location.toLowerCase() &&
                trip['Điểm đến'].toLowerCase() === destination_location.toLowerCase()
              ) {
                tripsExact.push(trip);
              } else {
                tripsPartial.push(trip);
              }
            }
        
            const trips = [...tripsExact, ...tripsPartial]; // trùng tên lên trước
        
            res.render('index', {
              departure_location,
              destination_location,
              trips,
            });
        
          } catch (error) {
            console.error("Lỗi tìm chuyến theo tuyến:", error);
            res.status(500).render('index', {
              trips: [],
              departure_location: '',
              destination_location: '',
              message: "Lỗi khi tìm chuyến xe"
            });
          }
    }
    
    
    
    async searchRoutes(req, res) {
        try {
            const { departure, destination, busType, ticketPrice, dailyTripCount,  createdAt } = req.query;
            const status = req.query.status !== '' ? Number(req.query.status) : undefined;

            const locations = await Location.getAllLocation();
            const routes = await Route.searchRoutes({
                departure,
                destination,
                busType,
                ticketPrice,
                dailyTripCount,
                status,
                createdAt
            });
    
            // Mô tả bộ lọc đã dùng
            let searchDescription = [];
            if (departure) searchDescription.push(`Điểm đi: ${departure}`);
            if (destination) searchDescription.push(`Điểm đến: ${destination}`);
            if (busType) searchDescription.push(`Loại xe: ${busType}`);
            if (ticketPrice) searchDescription.push(`Giá vé tối đa: ${ticketPrice}`);
            if (dailyTripCount) searchDescription.push(`Số chuyến mỗi ngày: ${dailyTripCount}`);
            if (status !== undefined && status !== '') searchDescription.push(`Trạng thái: ${status === '1' ? 'Hoạt động' : 'Ngừng'}`);
            if (createdAt) searchDescription.push(`Ngày tạo: ${createdAt}`);
    
            res.render('admin/routes/routes', {
                title: "Kết quả tìm kiếm",
                routes,
                locations,
                departure,
                destination,
                busType,
                ticketPrice,
                dailyTripCount,
                status,
                createdAt,
                searchDescription: searchDescription.length ? `Đã lọc theo: ${searchDescription.join(', ')}` : ''
            });
    
        } catch (error) {
            console.error("Lỗi khi tìm kiếm tuyến xe:", error);
            res.status(500).render('admin/routes/routes', {
                title: "Lỗi tìm kiếm",
                routes: [],
                locations: [],
                message: "Không thể tìm kiếm tuyến xe"
            });
        }
    }
    
    
    async getAvailableBusesByTime(req, res) {
        try {
            const { bus_type, time, travel_time } = req.query;
    
            if (!bus_type || !time || !travel_time) {
                return res.status(400).json({ message: 'Thiếu dữ liệu' });
            }
    
            const allBuses = await Bus.getBusesByType(bus_type);
            const allRoutes = await Route.getAllRoute();
    
            const fixedDate = '2024-01-01';
            const requestedStart = new Date(`${fixedDate}T${time}:00`);
            const [h, m, s] = travel_time.split(":").map(Number);
            const requestedEnd = new Date(requestedStart.getTime() + (h * 60 + m) * 60000);
    
            const usedBusIds = new Set();
    
            for (const route of allRoutes) {
                const departureTimes = JSON.parse(route.departure_times || "[]");
                const busIds = JSON.parse(route.bus_ids || "[]");
    
                for (let i = 0; i < departureTimes.length; i++) {
                    const routeStart = new Date(`${fixedDate}T${departureTimes[i]}:00`);
                    const [rh, rm, rs] = (route.travel_time || '00:00:00').split(":").map(Number);
                    const routeEnd = new Date(routeStart.getTime() + (rh * 60 + rm) * 60000);
    
                    // ❗ So sánh giao nhau
                    if (requestedStart < routeEnd && requestedEnd > routeStart) {
                        usedBusIds.add(busIds[i]);
                    }
                }
            }
    
            const availableBuses = allBuses.filter(bus => !usedBusIds.has(bus.id.toString()));
            return res.json({ availableBuses });
    
        } catch (error) {
            console.error("Lỗi lấy xe khả dụng:", error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
    
    
}


module.exports = new RouteController();