const express = require('express');
const router = express.Router();
const routeController = require('../../controllers/routeController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());

router.get('/addroutes',checkAuthAdmin, routeController.getAllLocations);
// [GET] localhost:3000/admins/routes/update/:route_id
router.get('/update/:route_id',checkAuthAdmin,  routeController.renderUpdateRoute);

// [GET] localhost:3000/admins/routes
router.get('/', checkAuthAdmin, routeController.renderAdminRoutes);

// [POST] localhost:3000/admins/routes/
router.post('/', checkAuthAdmin, routeController.createRoute);
// [PUT] 
router.put('/:route_id', checkAuthAdmin,routeController.updateRoute);


//  [POST] localhost:3000/routes/delete/:route_id
router.post('/delete/:route_id', checkAuthAdmin, routeController.deleteRoute);

router.get('/search', checkAuthAdmin,routeController.searchRoutes);

// [GET] Lấy xe theo loại và giờ, loại trừ xe đã dùng ở giờ đó
router.get('/available-buses-by-time', checkAuthAdmin, routeController.getAvailableBusesByTime);

module.exports = router
