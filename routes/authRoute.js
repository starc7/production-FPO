import express from 'express';
import {registerController, loginController, forgotPasswordController, getAllUserController, updateUserController, getSingleUserController, updatePasswordController, getOrdersController, getAllOrdersController} from '../controllers/authController.js';
import { isAdmin, requireSignIn } from '../middlewares/authmiddlewares.js';
import ExpressFormidable from 'express-formidable';

const router = express.Router()

// Routing
// Register
router.post('/register', registerController);

// Log In
router.post('/login', loginController);

// Auth
router.get('/user-auth', requireSignIn, (req, res) => {
    res.status(200).send({ok: true})
})

router.get('/admin-auth', requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ok: true})
})

// Forgot Password
router.post('/forgot-password', ExpressFormidable(), forgotPasswordController)

router.get('/users', getAllUserController)

// Single User
router.get('/user/:pid', requireSignIn, ExpressFormidable(), getSingleUserController)


// Update User
router.put('/update-user/:pid', requireSignIn, ExpressFormidable(), updateUserController);

//Update Password
router.put('/update-password/:pid', ExpressFormidable(), updatePasswordController);

//Orders
router.get('/orders', requireSignIn, getOrdersController);

//All Orders
router.get('/all-orders', requireSignIn, isAdmin, getAllOrdersController);


export default router;