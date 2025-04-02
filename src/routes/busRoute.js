const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// [GET] localhost:3000/buses - Lấy danh sách xe
router.get('/', busController.getAllBus);

// [POST] localhost:3000/buses - Thêm xe mới
router.post('/', busController.createBus);

// [PUT] localhost:3000/buses/:bus_id - Cập nhật thông tin xe
router.put('/:bus_id', busController.updateBus);

// [DELETE] localhost:3000/buses/:bus_id 
router.delete('/:bus_id', busController.deleteBus);

// [GET] localhost:3000/buses/search?license_plate=29A-12345&bus_type=Xe ghế ngồi - Tìm kiếm xe
router.get('/search', busController.searchBus);

module.exports = router;
