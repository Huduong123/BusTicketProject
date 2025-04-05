const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { checkAuthAdmin } = require('../../middlewares/middlewares');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/',checkAuthAdmin, userController.renderUserAd);
// Trang thêm người dùng
router.get('/add', checkAuthAdmin, userController.renderAddUser);

// Xử lý thêm người dùng
router.post('/add', checkAuthAdmin, userController.createUserFromAdmin);

// Sửa
router.get('/edit/:id',checkAuthAdmin, userController.renderEditUser);
router.post('/edit/:id',checkAuthAdmin, userController.editUser);

// Xóa
router.post('/delete/:id',checkAuthAdmin, userController.deleteUser);

router.get('/search', checkAuthAdmin, userController.searchUser);

module.exports = router