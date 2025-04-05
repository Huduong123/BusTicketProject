const express = require('express');
const router = express.Router();
const busController = require('../../controllers/busController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/',checkAuthAdmin, busController.renderAdminBuses);
router.get('/add', checkAuthAdmin, busController.renderAddBus);
router.post('/add', checkAuthAdmin, busController.createBusFromAdmin);
router.get('/edit/:id', checkAuthAdmin, busController.renderEditBus);
router.post('/edit/:id', checkAuthAdmin, busController.updateBusFromAdmin);

router.post('/delete/:id', checkAuthAdmin, busController.deleteBusFromAdmin);

module.exports = router