const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/adminDashBoardController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


// GET /admins/dashboard
router.get('/', checkAuthAdmin, dashboardController.showDashboard);


module.exports = router