const express = require('express');
const router = express.Router();

const Ticket = require('../models/ticketModel');

// GET: Hiển thị form tra cứu
router.get('/', (req, res) => {
    res.render('traCuuVe', { ticket: null, notFound: false });
});

// POST: Xử lý tra cứu
router.post('/', async (req, res) => {
    const { phone, 'ticket-code': ticketCode } = req.body;

    if (!phone || !ticketCode) {
        return res.render('traCuuVe', { ticket: null, notFound: true });
    }

    try {
        const tickets = await Ticket.searchTicketByIdOrCode(null, ticketCode);
        const ticket = tickets.find(t => t.customer_phone === phone);

        if (ticket) {
            res.render('thong-tin-tai-khoan/chi-tiet-ve', { ticket });
        } else {
            res.render('traCuuVe', { ticket: null, notFound: true });
        }
    } catch (error) {
        console.error('❌ Lỗi tra cứu vé:', error);
        res.status(500).send("Lỗi server khi tra cứu vé.");
    }
});


module.exports = router;
