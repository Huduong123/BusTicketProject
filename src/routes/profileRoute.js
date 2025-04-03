const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { checkAuthUser } = require('../middlewares/middlewares');





router.get('/TAPay', (req, res) => {
    res.render('thong-tin-tai-khoan/TAPay');
  });
router.get('/thong-tin-chung', (req, res) => {
  res.render('thong-tin-tai-khoan/thong-tin-chung')
})
router.get('/lich-su-mua-ve', checkAuthUser, ticketController.getTicketsByUser);
router.get('/lich-su-mua-ve', (req, res) => {
  res.render('thong-tin-tai-khoan/lich-su-mua-ve')
})
router.get('/resetpassword', (req, res) => {
  res.render('thong-tin-tai-khoan/resetpassword')
})

router.get('/xem-chi-tiet-ve/:ticket_id', checkAuthUser, ticketController.viewTicketDetail);

module.exports = router