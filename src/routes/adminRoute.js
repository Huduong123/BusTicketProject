const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
//const routeController = require('../controllers/routeController');
const { checkAuthAdmin } = require('../middlewares/middlewares');

const routeAdminRoute = require('../routes/admin/routeAdminRoute');
router.use('/routes', routeAdminRoute);

const tripAdminRoute = require('../routes/admin/tripAdminRoute');
router.use('/trips', tripAdminRoute);

const ticketAdminRoute= require('../routes/admin/ticketAdminRoute');
router.use('/tickets', ticketAdminRoute);

const paymentAdminRoute = require('../routes/admin/paymentAdminRoute');
router.use('/payments', paymentAdminRoute)

const userAdminRoute = require('../routes/admin/userAdminRoute');
router.use('/users', userAdminRoute)

const busAdminRoute = require('../routes/admin/busAdminRoute');
router.use('/buses', busAdminRoute)
router.get('/auth/login-admin', (req, res) => {
    res.render('admin/dangnhapAdmin');
});
router.get('/', checkAuthAdmin, adminController.getAdminPage);

const dashboardAdminRoute = require('../routes/admin/dashboardAdminRoute');
router.use('/dashboard', dashboardAdminRoute);

// [GET] localhost:3000/admins
router.get('/list',checkAuthAdmin, adminController.getAllAdmin);
// [POST] localhost:3000/admins (Thêm admin)
router.post('/',checkAuthAdmin, adminController.addAdmin);

// [POST] localhost:3000/admins/login
router.post('/login', adminController.login);

// [PUT] localhost:3000/admins/:id (Cập nhật admin)
router.put('/:id',checkAuthAdmin, adminController.updateAdmin);

// [DELETE] localhost:3000/admins/:id (Xóa admin)
router.delete('/:id',checkAuthAdmin, adminController.deleteAdmin);

const authAdminRoute = require('../routes/admin/authAdminRoute');
router.use('/auth', authAdminRoute);
const accountAdminRoute = require('../routes/admin/accountAdminRoute');
router.use('/admin', accountAdminRoute); // Điều hướng /admins/admin đến listAdmin


router.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard');
});
router.get('/logout', adminController.logout);
module.exports = router;
