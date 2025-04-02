const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/', userController.renderUserAd);
// Sửa
router.get('/edit/:id', userController.renderEditUser);
router.post('/edit/:id', userController.editUser);

// Xóa
router.post('/delete/:id', userController.deleteUser);
module.exports = router