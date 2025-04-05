const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');

const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/',checkAuthAdmin, adminController.renderAdminAccounts); // render danh sách tài khoản admin
router.get('/add', checkAuthAdmin, (req, res) => {
    res.render('admin/accountAdmin/addAdmin');
});

module.exports = router