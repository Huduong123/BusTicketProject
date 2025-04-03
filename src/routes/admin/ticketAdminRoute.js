const express = require('express');
const router = express.Router();
const ticketController = require('../../controllers/ticketController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));



router.get('/',checkAuthAdmin, ticketController.renderAdminTickets);
router.get('/update/:ticket_id',checkAuthAdmin, ticketController.renderUpdateTicket);
router.put('/update/:ticket_id',checkAuthAdmin, ticketController.updateTicket);

router.post('/cancel/:ticket_id',checkAuthAdmin, ticketController.cancelTicket);
router.post('/remove/:ticket_id',checkAuthAdmin, ticketController.removeTicket);

router.get('/search',checkAuthAdmin, ticketController.searchTickets);

module.exports = router