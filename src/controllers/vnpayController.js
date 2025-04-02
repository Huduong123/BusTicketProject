const crypto = require("crypto");
const moment = require("moment");
const Payment = require("../models/paymentModel");
const sendMail = require("../utils/sendMail"); // 📩 THÊM DÒNG NÀY
const successModel = require('../models/successModel'); // ✅ Thêm dòng này

const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURNURL;

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

exports.createVNPayPayment = (req, res) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const { amount, ticket_id, email, customer_name } = req.body;
    const user_id = req.user?.id;
    if (!amount || !ticket_id || !email || !customer_name || !user_id) {
        return res.status(400).json({ message: "Thiếu dữ liệu đầu vào" });
    }

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const expireDate = moment(date).add(15, "minutes").format("YYYYMMDDHHmmss");
    const orderId = moment(date).format("DDHHmmss");
    const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `ticket_${ticket_id}_user_${user_id}_email_${email}_name_${customer_name}`,
        vnp_OrderType: "billpayment",
        vnp_Amount: amount * 100,
        vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    vnp_Params = sortObject(vnp_Params);
    const signData = Object.entries(vnp_Params).map(([k, v]) => `${k}=${v}`).join('&');
    const signed = crypto.createHmac("sha512", vnp_HashSecret).update(Buffer.from(signData, "utf-8")).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;
    vnp_Params['vnp_SecureHashType'] = 'SHA512';

    const paymentUrl = `${vnp_Url}?${Object.entries(vnp_Params).map(([k, v]) => `${k}=${v}`).join('&')}`;
    res.json({ url: paymentUrl });
};

exports.handlePaymentReturn = async (req, res) => {
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const signData = Object.entries(sortedParams).map(([k, v]) => `${k}=${v}`).join("&");
    const signed = crypto.createHmac("sha512", vnp_HashSecret).update(Buffer.from(signData, "utf-8")).digest("hex");

    if (signed === secureHash) {
        if (vnp_Params.vnp_ResponseCode === "00") {
            try {
                const parts = vnp_Params.vnp_OrderInfo.split("_");
                const ticketId = parts[1];
                const userId = parts[3];
                const email = parts[5];
                const customerName = parts.slice(7).join("_");

                const amount = parseInt(vnp_Params.vnp_Amount) / 100;
                const transactionId = vnp_Params.vnp_TransactionNo;

                const paymentData = {
                    ticket_id: ticketId,
                    user_id: userId,
                    payment_status: "COMPLETED",
                    amount,
                    payment_method: "VNPAY",
                    transaction_id: transactionId,
                };

                await Payment.createPayment(paymentData);
                const ticketInfo = await successModel.getTicketInfo(ticketId);

                const formattedDepartureTime = new Date(ticketInfo.departure_time).toLocaleString("vi-VN");
                
                await sendMail({
                  to: email,
                  subject: "Xác nhận thanh toán vé xe thành công",
                  html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <h2 style="color: #e74c3c;">Biên nhận thanh toán</h2>
                      <p style="font-size: 14px;">(Payment Receipt)</p>
                    </div>
                
                    <p>Xin chào <strong>${ticketInfo.customer_name}</strong>,</p>
                    <p>Thanh toán của bạn cho vé <strong>#${ticketInfo.ticket_code}</strong> đã được xác nhận thành công.</p>
                
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;" border="1">
                      <tr><th colspan="2" style="background-color: #f5f5f5; padding: 10px;">Thông tin vé</th></tr>
                      <tr><td style="padding: 8px;">Tuyến xe</td><td style="padding: 8px;">${ticketInfo.tuyen_xe}</td></tr>
                      <tr><td style="padding: 8px;">Thời gian khởi hành</td><td style="padding: 8px;">${formattedDepartureTime}</td></tr>
                      <tr><td style="padding: 8px;">Số ghế</td><td style="padding: 8px;">${ticketInfo.seat_numbers}</td></tr>
                      <tr><td style="padding: 8px;">Điểm đón</td><td style="padding: 8px;">${ticketInfo.pickup_location}</td></tr>
                      <tr><td style="padding: 8px;">Điểm trả</td><td style="padding: 8px;">${ticketInfo.dropoff_location}</td></tr>
                      <tr><td style="padding: 8px;">Biển số xe</td><td style="padding: 8px;">${ticketInfo.license_plate}</td></tr>
                      <tr><td style="padding: 8px;">Phương thức thanh toán</td><td style="padding: 8px;">${ticketInfo.payment_method}</td></tr>
                      <tr><td style="padding: 8px;">Mã hóa đơn</td><td style="padding: 8px;">${ticketInfo.ma_hoa_don}</td></tr>
                      <tr><td style="padding: 8px;">Giá vé</td><td style="padding: 8px;">${ticketInfo.ticket_price.toLocaleString()} VND</td></tr>
                      <tr><td style="padding: 8px;">Tổng cộng</td><td style="padding: 8px;"><strong style="color: #8e44ad;">${ticketInfo.total_price_ticket.toLocaleString()} VND</strong></td></tr>
                    </table>
                
                    <p style="margin-top: 20px; font-weight: bold; color: #2c3e50;">Cảm ơn bạn đã sử dụng dịch vụ của FUTA Bus Lines!</p>
                  </div>
                `
                
                });

                return res.redirect(`/thongtin-vemua/thanhtoan-thanhcong?ticketId=${ticketId}`);

            } catch (err) {
                console.error("❌ Lỗi lưu DB hoặc gửi mail:", err);
                return res.send("<h2>✅ Thanh toán thành công nhưng lỗi hệ thống!</h2>");
            }
        } else {
            return res.send(`<h2>❌ Thanh toán thất bại (mã ${vnp_Params.vnp_ResponseCode})</h2>`);
        }
    } else {
        return res.send("<h2>❌ Thanh toán thất bại (sai chữ ký)</h2>");
    }
};
