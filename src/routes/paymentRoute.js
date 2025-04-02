const express = require("express");
const router = express.Router();
const { checkAuthUser } = require("../middlewares/middlewares");
const paymentController = require("../controllers/paymentController");
const vnpayController = require("../controllers/vnpayController");

router.post("/create_vnpay_payment", checkAuthUser, vnpayController.createVNPayPayment);
router.get("/payment_return", vnpayController.handlePaymentReturn);

// CRUD
router.get("/", paymentController.getAllPayment);
router.post("/", checkAuthUser, paymentController.createPayment);
router.get("/transaction/:transaction_id", paymentController.getPaymentByTransactionId);
router.get("/:id", paymentController.getPaymentById);
router.put("/:id", checkAuthUser, paymentController.updatePayment);
router.delete("/:id", checkAuthUser, paymentController.deletePayment);

module.exports = router;
