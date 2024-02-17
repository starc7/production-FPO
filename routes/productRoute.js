import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authmiddlewares.js";
import { addProductController, braintreePaymentController, braintreeTokenController, deleteSingleProductController, getAllProductController, getPhotoController, getSingleProductController, productFilterController, searchProductController, updateProductController } from "../controllers/productController.js";
import ExpressFormidable from 'express-formidable';

const router = express.Router();

router.post('/add-product', requireSignIn, isAdmin, ExpressFormidable(), addProductController);
router.get('/products', getAllProductController);
router.get('/getPhoto/:pid', getPhotoController);
router.get('/products/:slug', getSingleProductController);
router.delete('/products/:pid', requireSignIn, isAdmin, ExpressFormidable(), deleteSingleProductController);
router.put('/update-product/:pid', requireSignIn, isAdmin, ExpressFormidable(), updateProductController);
router.post('/product-filter', productFilterController)
router.get('/search/:keyword', searchProductController)

// PAYMENT
router.get('/braintree/token', braintreeTokenController)
router.post('/braintree/payment', requireSignIn, braintreePaymentController)


export default router;