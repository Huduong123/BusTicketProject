const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {checkAuthUser} = require('../middlewares/middlewares')

//[GET] localhost:3000/users/
router.get('/',checkAuthUser, userController.getAllUsers);

// [POST] localhost:3000/users/login
router.post('/login', userController.login);

router.get('/me', checkAuthUser, userController.getCurrentUser);
// [POST] localhost:3000/users/
router.post('/', userController.createUser);
//đổi mật khẩu
// [PATCH] localhost:3000/users/:id/change-password
router.patch('/:id/change-password', checkAuthUser, userController.changePassword);

// [PUT] localhost:3000/users/:id
router.put('/:id', userController.editUser);

// [DELETE] localhost:3000/user/:id
router.delete('/:id',checkAuthUser, userController.deleteUser);
//Đăng xuất
router.post('/logout', userController.logout);

module.exports = router;