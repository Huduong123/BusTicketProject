const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

router.get('/login-admin', (req, res) => {
    res.render('admin/dangnhapAdmin');
});

router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

module.exports = router;
