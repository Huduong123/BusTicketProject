const express = require('express');
const router = express.Router();
const ticketController = require('../../controllers/ticketController');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));



router.get('/', ticketController.renderAdminTickets);
router.get('/update/:ticket_id', ticketController.renderUpdateTicket);
router.put('/update/:ticket_id', ticketController.updateTicket);

router.post('/cancel/:ticket_id', ticketController.cancelTicket);
router.post('/remove/:ticket_id', ticketController.removeTicket);

router.get('/search', ticketController.searchTickets);

module.exports = router