const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/', paymentController.renderAdminPayments);

router.post('/cancel/:id', paymentController.cancelPayment); // cập nhật trạng thái
router.post('/delete/:id', paymentController.deletePayment); // xóa thanh toán

router.get('/search', paymentController.searchPayments);
router.get('/report', paymentController.renderReportPayments);

module.exports = router