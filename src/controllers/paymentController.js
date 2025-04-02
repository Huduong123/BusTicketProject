const Payment = require('../models/paymentModel');

class PaymentController {
    async getAllPayment(req, res) {
        try {
            const payments = await Payment.getAllPayment();
            res.status(200).json(payments);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getPaymentById(req, res) {
        try {
            const payment = await Payment.getPaymentById(req.params.id);
            if (!payment) {
                return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
            }
            res.status(200).json(payment);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getPaymentByTransactionId(req, res) {
        try {
            const { transaction_id } = req.params;
            const payment = await Payment.getPaymentByTransactionId(transaction_id);
            if (!payment) {
                return res.status(404).json({ message: 'Không tìm thấy thanh toán với transaction_id này' });
            }
            res.status(200).json(payment);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
    async createPayment(req, res) {
        try {
        const user_id = req.user ? req.user.id : null;
            const { ticket_id, payment_status, amount, payment_method } = req.body;

            if (!ticket_id || !user_id || !amount || !payment_method) {
                return res.status(400).json({ message: "Thiếu thông tin thanh toán" });
            }

            const { payment_id, transaction_id } = await Payment.createPayment({ ticket_id, user_id, payment_status, amount, payment_method });

            res.status(201).json({ message: 'Thanh toán thành công', payment_id, transaction_id });
        } catch (error) {
            console.error("❌ Lỗi trong controller:", error.message);
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }

    async updatePayment(req, res) {
        try {
            const paymentId = req.params.id;
            const { ticket_id, user_id, payment_status, amount, payment_method } = req.body;
    
            if (!ticket_id || !user_id || !payment_status || !amount || !payment_method) {
                return res.status(400).json({ message: "⚠️ Thiếu thông tin cập nhật thanh toán" });
            }
    
            const result = await Payment.updatePayment(paymentId, { ticket_id, user_id, payment_status, amount, payment_method });
    
            if (result.error) {
                return res.status(404).json({ message: result.error });
            }
    
            res.status(200).json({ message: '✅ Cập nhật thanh toán thành công' });
        } catch (error) {
            console.error("🔥 Lỗi khi cập nhật thanh toán:", error);
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    }
    
    async deletePayment(req, res) {
        try {
            const result = await Payment.deletePayment(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy thanh toán' });
            }
            res.status(200).json({ message: 'Xóa thanh toán thành công' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }


    async renderAdminPayments(req, res) {
        try {
          const payments = await Payment.getAllPaymentDetails();
      
          res.render('admin/payments/payments', {
            title: "Quản lý Thanh toán",
            payments
          });
        } catch (error) {
          console.log(error);
          res.status(500).send("Lỗi khi tải danh sách thanh toán");
        }
      }
      
      async cancelPayment(req, res) {
        try {
          const { id } = req.params;
          const result = await Payment.updatePaymentStatus(id, 'CANCELED');
          if (result === 0) return res.status(404).send("Không tìm thấy thanh toán.");
          res.redirect('/admins/payments');
        } catch (error) {
          console.error("❌ Lỗi khi hủy thanh toán:", error);
          res.status(500).send("Lỗi khi hủy thanh toán.");
        }
      }
      async searchPayments(req, res) {
        try {
          const filters = {
            transaction_id: req.query.transaction_id || '',
            user_name: req.query.user_name || '',
            customer_name: req.query.customer_name || '',
            customer_phone: req.query.customer_phone || '',
            payment_method: req.query.payment_method || '',
            payment_status: req.query.payment_status || '',
            payment_date: req.query.payment_date || '',
          };
      
          const payments = await Payment.searchPaymentDetailsAdmin(filters);
      
          res.render('admin/payments/payments', {
            title: "Quản lý Thanh toán",
            payments,
            ...filters // truyền lại giá trị cũ vào form
          });
        } catch (err) {
          console.error("❌ Lỗi tìm kiếm thanh toán:", err);
          res.status(500).send("Lỗi server");
        }
      }
      async renderReportPayments(req, res) {
        try {
          const { day, month, year } = req.query;
      
          const [reportByDay, reportByMonth, reportByYear] = await Promise.all([
            Payment.getRevenueByDay(),
            Payment.getRevenueByMonth(),
            Payment.getRevenueByYear(),
          ]);
      
          let totalByDay = null;
          let totalByMonth = null;
          let totalByYear = null;
      
          if (day) {
            const result = await Payment.getTotalRevenueByExactDay(day);
            totalByDay = result?.total || 0;
          }
      
          if (month) {
            const result = await Payment.getTotalRevenueByExactMonth(month);
            totalByMonth = result?.total || 0;
          }
      
          if (year) {
            const result = await Payment.getTotalRevenueByExactYear(year);
            totalByYear = result?.total || 0;
          }
      
          res.render('admin/payments/reportpayments', {
            title: "Thống kê doanh thu",
            reportByDay,
            reportByMonth,
            reportByYear,
            totalByDay,
            totalByMonth,
            totalByYear,
            day,
            month,
            year,
          });
        } catch (error) {
          console.error("❌ Lỗi thống kê doanh thu:", error);
          res.status(500).send("Lỗi khi tải thống kê doanh thu");
        }
      }
      
      
}

module.exports = new PaymentController();
