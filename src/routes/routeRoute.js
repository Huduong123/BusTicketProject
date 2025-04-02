const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');


// Hiển thị danh sách tuyến xe cho người dùng
router.get('/lichtrinh', routeController.getAllSchedules);

router.get('/lichtrinh/routes', routeController.getAllRoute);

router.get('/lichtrinh/search-trips-by-route', routeController.searchTripsByRoute);
router.get('/lichtrinh/find-route', routeController.findRouteTrips);

module.exports = router
