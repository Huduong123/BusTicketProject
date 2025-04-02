
const Trip = require('../models/tripModel');
const Location = require('../models/locationModel');
const Bus = require('../models/busModel');
const Route = require('../models/routeModel');
const TripStop = require('../models/tripStopModel');

class TripController {

    async getAllTrip(req, res) {
        try {
            const trips = await Trip.getAllTrip();
            res.status(200).json(trips);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    async renderAdminTrips(req, res) {
        try {
            let page = parseInt(req.query.page) || 1;  // Lấy số trang từ query params, mặc định là 1
            let limit = 10;  // Số lượng chuyến xe trên mỗi trang
            let offset = (page - 1) * limit;
    
            // Đếm tổng số chuyến xe
            let totalTrips = await Trip.countTotalTrips();
            let totalPages = totalTrips > 0 ? Math.ceil(totalTrips / limit) : 1;

    
            // Lấy danh sách chuyến xe có phân trang
            const trips = await Trip.getTripWithPagination(limit, offset);
            const routes = await Route.getRoutewithDepartureAndDestination();
            const locations = await Location.getAllLocation();
    
            res.render('admin/trips/trips', {
                trips,
                routes: routes || [],
                locations: locations || [],
                currentPage: page,
                totalPages
            });
    
        } catch (error) {
            console.error("Error in renderAdminTrips:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    async createTrip(req, res) {
        try {
            const { 
                departure_location, destination_location, distance, 
                route_id, bus_id, departure_time, estimated_arrival_time, 
                status, trip_price, pickup_location, dropoff_location 
              } = req.body;
    
            if (!departure_location || !destination_location || !distance || !route_id || !bus_id || !departure_time || !estimated_arrival_time || !status || !trip_price) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
            }
            if (!pickup_location || !dropoff_location) {
                return res.status(400).json({ message: 'Vui lòng nhập đủ điểm đón và điểm trả' });
              }
            
            // ✅ Kiểm tra điểm đi và điểm đến không trùng nhau
            if (departure_location === destination_location) {
                return res.status(400).json({ message: 'Điểm đi và điểm đến không được trùng nhau' });
            }
            const result = await Trip.createTrip(
                departure_location, destination_location, distance, 
                route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price
            );
    
            if (result.success) {
                res.status(201).json({ message: 'Thêm chuyến xe thành công', tripId: result.tripId });
            } else {
                res.status(500).json({ message: 'Lỗi khi thêm chuyến xe', error: result.error });
            }
    // ✅ Sau khi thêm chuyến xong, thêm:
if (result.success && result.tripId) {
    const tripId = result.tripId;
    await TripStop.addTripStop(tripId, 'PICKUP', pickup_location);
    await TripStop.addTripStop(tripId, 'DROPOFF', dropoff_location);
  }
        } catch (error) {
            console.error("Lỗi khi thêm chuyến xe:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    
    

    async updateTrip(req, res) {
        try {
            const { trip_id } = req.params;
            const { departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price } = req.body;
    
            if (!trip_id) {
                return res.status(400).json({ message: 'Thiếu trip_id trong yêu cầu.' });
            }
                   // ✅ Kiểm tra điểm đi và điểm đến không trùng nhau
            if (departure_location === destination_location) {
                return res.status(400).json({ message: 'Điểm đi và điểm đến không được trùng nhau' });
            }
            const existingTrip = await Trip.getTripById(trip_id);
            if (!existingTrip) {
                return res.status(404).json({ message: 'Không tìm thấy chuyến xe để cập nhật.' });
            }

            const result = await Trip.updateTrip(trip_id, departure_location, destination_location, distance, route_id, bus_id, departure_time, estimated_arrival_time, status, trip_price);
    
            if (result.affectedRows === 0) {
                return res.status(400).json({ message: 'Không có thay đổi nào được thực hiện.' });
            }
    
            res.status(200).json({ message: 'Cập nhật chuyến xe thành công', result });
    
        } catch (error) {
            console.error("Lỗi cập nhật chuyến xe:", error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật chuyến xe', error });
        }
    }
    


    async deleteTrip(req, res) {
        try {
            const { trip_id } = req.params;
    
            // Gọi model để xóa chuyến đi
            const result = await Trip.deleteTrip(trip_id);
    
            if (result.success) {
                //res.status(200).json({ message: ' Xóa chuyến đi thành công' });
                return res.redirect('/admins/trips');
            } else {
                res.status(400).json({ message: ' Không tìm thấy chuyến đi để xóa' });
            }
        } catch (error) {
            console.log(" Lỗi khi xóa chuyến đi:", error);
            res.status(500).json({ message: " Lỗi server khi xóa chuyến đi", error });
        }
    }
    

    async searchTrips(req, res) {
        try {
            const { departure_location, destination_location, departure_time } = req.query;
    
      
    
            // Gọi phương thức tìm kiếm từ Model
            const trips = await Trip.searchTrips(departure_location, destination_location, departure_time);
    
            if (trips.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy chuyến đi nào phù hợp" });
            }
    
            res.status(200).json({ message: "Tìm chuyến đi thành công", trips });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    async searchTripsWithDetails(req, res) {
        try {
            const { departure_location, destination_location, departure_time } = req.query;
    
            if (!departure_location || !destination_location || !departure_time) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin tìm kiếm" });
            }
    
            const trips = await Trip.searchTripsWithDetails(departure_location, destination_location, departure_time);
    
            if (trips.length === 0) {
                return res.status(200).json({ message: "Không tìm thấy chuyến đi nào phù hợp", trips: [] });
            }
    
            res.status(200).json({ message: "Tìm chuyến đi thành công", trips });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    

    async searchTripsAdvanced(req, res) {
        try {
            const filters = req.query; // Lấy các tham số tìm kiếm từ query string
            
            // Gọi phương thức tìm kiếm từ Model
            const trips = await Trip.searchTripsAdvanced(filters);
            const routes = await Route.getRoutewithDepartureAndDestination();
            const buses = await Bus.getAllBus();
            const locations = await Location.getAllLocation();
            // Tạo một chuỗi mô tả bộ lọc tìm kiếm
        let searchDescription = [];
        if (filters.departure_location) searchDescription.push(`Điểm đi: ${filters.departure_location}`);
        if (filters.destination_location) searchDescription.push(`Điểm đến: ${filters.destination_location}`);
        if (filters.route_id) searchDescription.push(`Tuyến xe: ${filters.route_id}`);
        if (filters.departure_time) searchDescription.push(`Thời gian khởi hành: ${filters.departure_time}`);
        if (filters.estimated_arrival_time) searchDescription.push(`Thời gian đến: ${filters.estimated_arrival_time}`);
        if (filters.status) searchDescription.push(`Trạng thái: ${filters.status}`);
        
        res.render('admin/trips/trips', {
            trips,
            routes: routes || [],
            buses: buses || [],
            locations: locations || [],
            filters,
            searchDescription: searchDescription.length ? `Bạn đã tìm kiếm chuyến xe với các thông tin: ${searchDescription.join(', ')}` : ''
        });
            // if (trips.length === 0) {
            //     return res.status(404).json({ message: "Không tìm thấy chuyến đi nào phù hợp" });
            // }
    
           // res.status(200).json({ message: "Tìm chuyến đi thành công", trips });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    async getRouteAndTime(req, res) {
        try {
            const tripId = req.params.trip_id;
            const data = await Trip.getRouteAndTime(tripId);
            if (data) {
                res.status(200).json(data);
            } else {
                res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }




    async getAllLocationTrip(req, res) {
        try {
            const locations = await Location.getAllLocation();
            const buses = await Bus.getAllBus();
            const routes = await Route.getRoutewithDepartureAndDestination();
         

            res.render('admin/trips/addtrips', { locations, buses , routes});
        } catch (error) {
            console.error(error);
            res.status(500).send("Lỗi khi tải trang thêm chuyến xe");
        }
    }
    async getSeatsByTrip(req, res) {
        try {
            const { trip_id } = req.params;
            if (!trip_id) {
                return res.status(400).json({ message: "Thiếu trip_id trong yêu cầu." });
            }
    
            const seats = await Trip.getSeatsByTripId(trip_id);
            if (seats.length > 0) {
                res.status(200).json(seats);
            } else {
                res.status(404).json({ message: "Không tìm thấy danh sách ghế cho chuyến xe này." });
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách ghế:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    
    async renderUpdateTrip(req, res) {
        try {
            const { trip_id } = req.params;
            if (!trip_id) {
                return res.status(400).send("Thiếu trip_id trong yêu cầu.");
            }
            const trip = await Trip.getTripById(trip_id);
            if (!trip) {
                return res.status(404).send("Không tìm thấy chuyến xe.");
            }
            const locations = await Location.getAllLocation();
            const buses = await Bus.getAllBus();
            const routes = await Route.getRoutewithDepartureAndDestination();
            res.render('admin/trips/updatetrips', { trip, locations, buses, routes });
        } catch (error) {
            console.log(error);
            res.status(500).send("Lỗi khi tải trang cập nhật chuyến xe");
            
        }
    }
    async getTripPrice(req, res) {
        try {
            const { trip_id } = req.params;
    
            if (!trip_id) {
                return res.status(400).json({ message: "Thiếu trip_id trong yêu cầu." });
            }
    
            const trip = await Trip.getTripByIdPrice(trip_id);
            if (!trip) {
                return res.status(404).json({ message: "Không tìm thấy chuyến xe." });
            }
    
            res.status(200).json({ trip_price: trip.trip_price });
        } catch (error) {
            console.error("Lỗi khi lấy giá vé:", error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    
    
}

module.exports = new TripController();