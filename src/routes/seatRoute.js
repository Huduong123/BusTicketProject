const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');


// [GET] localhost:3000/seats/
router.get('/', seatController.getAllSeat);


router.get('/search', seatController.searchSeats);

router.get('/:id', seatController.getSeatById);

router.post('/', seatController.addSeat);

router.put('/:id', seatController.updateSeat);

router.delete('/:id', seatController.deleteSeat);


module.exports = router;
