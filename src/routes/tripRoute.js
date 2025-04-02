const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripStopController = require('../controllers/tripStopController');
// [GET] localhost:3000/trips
router.get('/', tripController.getAllTrip);

router.get('/trip-stop', tripStopController.getAllTripStop);
// [GET] localhost:3000/trips/:trip_id/route
router.get('/:trip_id/route', tripController.getRouteAndTime);






//TRIP STOP

// [GET] localhost:3000/trips/:trip_id/pickup - lấy danh sách điểm đón
router.get('/:trip_id/pickup', tripStopController.getPickupPoints);

// [GET] localhost:3000/trips/:trip_id/dropoff - lấy danh sách điểm trả
router.get('/:trip_id/dropoff', tripStopController.getDropoffPoints);

// [POST] localhost:3000/trips/:trip_id/pickup - Thêm điểm đón mới
router.post('/:trip_id/pickup', tripStopController.addPickupPoint);

// [POST] localhost:3000/trips/:trip_id/dropoff - Thêm điểm trả mới
router.post('/:trip_id/dropoff', tripStopController.addDropoffPoint);
// [PUT] localhost:3000/trips/stop/:stop_id - Cập nhật điểm dừng
router.put('/stop/:stop_id', tripStopController.updateTripStop);
// [DELETE] localhost:3000/trips/stop/:stop_id - Xóa điểm dừng
router.delete('/stop/:stop_id', tripStopController.deleteTripStop);





// [GET] localhost:3000/trips/:trip_id/price - Lấy giá vé của chuyến xe
router.get('/:trip_id/price', tripController.getTripPrice);
// [GET] localhost:3000/trips/:trip_id/seats - Lấy danh sách ghế của chuyến xe
router.get('/:trip_id/seats', tripController.getSeatsByTrip);

// [GET] localhost:3000/trips/search?departure_location=Đà Nẵng&destination_location= TP. HCM&departure_time=2025-01-21
router.get('/search', tripController.searchTrips);

// [GET] localhost:3000/trips/search-details?departure_location=Hà Nội&destination_location=TP. HCM&departure_time=2025-01-21
router.get('/search-details', tripController.searchTripsWithDetails);
// tìm tuyến xe 



module.exports = router