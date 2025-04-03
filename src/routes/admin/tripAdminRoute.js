const express = require('express');
const router = express.Router();
const tripController = require('../../controllers/tripController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/addtrips',checkAuthAdmin, tripController.getAllLocationTrip);

// [GET] localhost:3000/admins/trips/update/:route_id
router.get('/update/:trip_id', checkAuthAdmin, tripController.renderUpdateTrip);

// [GET] localhost:3000/admins/trips/
router.get('/', checkAuthAdmin, tripController.renderAdminTrips);

// [POST] localhost:3000/admins/trips/
router.post('/',checkAuthAdmin, tripController.createTrip);

// [PUT] localhost:3000/admins/trips/:trip_id
router.put('/:trip_id', checkAuthAdmin,tripController.updateTrip);

// Thêm route để xử lý xóa chuyến đi (POST request)
router.post('/delete/:trip_id', checkAuthAdmin, tripController.deleteTrip);
// [DELETE] localhost:3000/trips/:trip_id
router.delete('/:trip_id',checkAuthAdmin, tripController.deleteTrip);

// [GET] localhost:3000/admins/trips/search
router.get('/search',checkAuthAdmin, tripController.searchTripsAdvanced);
module.exports = router