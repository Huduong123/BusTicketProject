const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { checkAuthUser } = require('../middlewares/middlewares');


router.get('/', ticketController.getAllTicket);



router.get('/find', ticketController.searchTicketByIdOrCode);
router.get('/detailed',checkAuthUser, ticketController.getDetailedTickets);


router.get('/:id', ticketController.getTicketById);

// Đặt vé tạm thời + Lưu ghế vào ticket_seats
router.post('/book', checkAuthUser,ticketController.addTicket);

// Xóa vé hết hạn (cron job)
router.delete('/expired', ticketController.deleteExpiredTickets);


router.put('/:id', ticketController.updateTicket);


router.delete('/:id', ticketController.deleteTicket);
router.post('/tra-cuu-ve', ticketController.findTicketByCodeAndPhone);

module.exports = router;
