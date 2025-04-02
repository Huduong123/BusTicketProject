const TripStop = require('../models/tripStopModel');

class TripStopController {


     async getAllTripStop(req, res) {
           try {
               const tripStop = await TripStop.getAllTripStop();
               res.status(200).json(tripStop);
           } catch (error) {
               console.log(error);
               res.status(500).json({ message: 'Lỗi server' });
           }
       }
    async getPickupPoints(req, res) {
        try {
            const tripId = req.params.trip_id;
            const pickupPoints = await TripStop.getTripStopsList(tripId, 'PICKUP');
            if (pickupPoints && pickupPoints.length) {
                res.status(200).json(pickupPoints);
            } else {
                res.status(404).json({ message: 'Không tìm thấy điểm đón cho chuyến xe' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }
        async getDropoffPoints(req, res) {
            try {
                const tripId = req.params.trip_id;
                const dropoffPoints = await TripStop.getTripStopsList(tripId, 'DROPOFF');
                if (dropoffPoints && dropoffPoints.length) {
                    res.status(200).json(dropoffPoints);
                } else {
                    res.status(404).json({ message: 'Không tìm thấy điểm trả cho chuyến xe' });
                }
            } catch (error) {
                console.log(error);
                res.status(500).json(error);
            }
        }


        
            async addPickupPoint(req, res) {
                try {
                    const { trip_id } = req.params;
                    const { location } = req.body;
            
                    if (!trip_id || !location) {
                        return res.status(400).json({ message: 'Thiếu thông tin điểm đón' });
                    }
            
                    const success = await TripStop.addTripStop(trip_id, 'PICKUP', location);
                    if (success) {
                        return res.status(201).json({ message: 'Thêm điểm đón thành công' });
                    } else {
                        return res.status(500).json({ message: 'Lỗi khi thêm điểm đón' });
                    }
                } catch (error) {
                    console.error('🔥 Lỗi khi thêm điểm đón:', error);
                    res.status(500).json({ message: 'Lỗi server', error });
                }
            }
            
            async addDropoffPoint(req, res) {
                try {
                    const { trip_id } = req.params;
                    const { location } = req.body;
            
                    if (!trip_id || !location) {
                        return res.status(400).json({ message: 'Thiếu thông tin điểm trả' });
                    }
            
                    const success = await TripStop.addTripStop(trip_id, 'DROPOFF', location);
                    if (success) {
                        return res.status(201).json({ message: 'Thêm điểm trả thành công' });
                    } else {
                        return res.status(500).json({ message: 'Lỗi khi thêm điểm trả' });
                    }
                } catch (error) {
                    console.error(' Lỗi khi thêm điểm trả:', error);
                    res.status(500).json({ message: 'Lỗi server', error });
                }
            }


            async updateTripStop(req, res) {
                try {
                    const { stop_id } = req.params;
                    const { trip_id, stop_type, location } = req.body;
        
                    if (!stop_id || !trip_id || !stop_type || !location ) {
                        return res.status(400).json({ message: ' Vui lòng nhập đầy đủ thông tin' });
                    }
        
                    const success = await TripStop.updateTripStop(stop_id, trip_id, stop_type, location);
        
                    if (success) {
                        res.status(200).json({ message: ' Cập nhật điểm dừng thành công' });
                    } else {
                        res.status(400).json({ message: ' Không có thay đổi nào được thực hiện' });
                    }
                } catch (error) {
                    console.error("Lỗi cập nhật điểm dừng:", error);
                    res.status(500).json({ message: 'Lỗi server khi cập nhật điểm dừng', error });
                }
            }
            async deleteTripStop(req, res) {
                try {
                    const { stop_id } = req.params;
        
                    if (!stop_id) {
                        return res.status(400).json({ message: 'Thiếu stop_id trong yêu cầu.' });
                    }
        
                    const success = await TripStop.deleteTripStop(stop_id);
        
                    if (success) {
                        res.status(200).json({ message: 'Xóa điểm dừng thành công' });
                    } else {
                        res.status(404).json({ message: 'Không tìm thấy điểm dừng để xóa' });
                    }
                } catch (error) {
                    console.error("Lỗi khi xóa điểm dừng:", error);
                    res.status(500).json({ message: 'Lỗi server khi xóa điểm dừng', error });
                }
            }
            
}

module.exports = new TripStopController();