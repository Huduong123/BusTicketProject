const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/',checkAuthAdmin, paymentController.renderAdminPayments);

router.post('/cancel/:id',checkAuthAdmin, paymentController.cancelPayment); // cập nhật trạng thái
router.post('/delete/:id',checkAuthAdmin, paymentController.deletePayment); // xóa thanh toán

router.get('/search',checkAuthAdmin, paymentController.searchPayments);
router.get('/report',checkAuthAdmin, paymentController.renderReportPayments);

module.exports = router