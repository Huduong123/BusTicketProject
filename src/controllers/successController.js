const successModel = require('../models/successModel');

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + 'xxxx' + phone.slice(-3);
}

function maskEmail(email) {
  if (!email) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 3) {
    return user[0] + '*'.repeat(user.length - 1) + '@' + domain;
  }
  return user.slice(0, 3) + '*'.repeat(user.length - 3) + '@' + domain;
}


class SuccessController{
  async getSuccessPage(req, res) {
    try {
      const ticketId = req.query.ticketId;
      if (!ticketId) {
        return res.status(400).send("Thiếu tham số ticketId");
      }

      const successData = await successModel.getTicketInfo(ticketId);
      if (!successData) {
        return res.status(404).send("Không tìm thấy thông tin vé");
      }

      // Ẩn thông tin
      successData.customer_phone_masked = maskPhone(successData.customer_phone);
      successData.customer_email_masked = maskEmail(successData.customer_email);

      res.render('thanhtoan-thanhcong', { successData });
    } catch (error) {
      console.error("Lỗi controller:", error);
      res.status(500).send("Lỗi hệ thống");
    }
  }
    
}

module.exports = {
  getSuccessPage: new SuccessController().getSuccessPage,
  maskPhone,
  maskEmail
};

