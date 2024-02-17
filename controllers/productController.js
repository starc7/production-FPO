import slugify from "slugify";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import fs from 'fs';
import braintree from "braintree";
import dotenv from 'dotenv';

dotenv.config();

// PAYMENT
var gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
  });

// export const braintreeTokenController = async (req, res) => {
//     try {
//         await gateway.clientToken.generate({}, function(err, response) {
//             if(err) {
//                 res.status(500).send(err)
//             } else {
//                 res.send(response)
//             }
//         })
//     } catch (error) {
//         console.log(error)
//     }
// }

export const braintreeTokenController = async (req, res) => {
    try {
        const response = await gateway.clientToken.generate({});
        res.send(response);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};


export const braintreePaymentController = async (req, res) => {
    try {
        const {cart, nonce} = req.body
        let total = 0
        cart.map( (i) => {total += i.price});
        let newTransaction = gateway.transaction.sale({
            amount: total,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true
            }
        },
        function(error, result) {
            if(result) {
                const order = new orderModel({
                    products: cart,
                    payment: result,
                    buyer: req.user._id
                }).save();
                res.json({ok: true})
            } else {
                res.status(500).send(error)
            }
        }
        )
    } catch (error) {
        console.log(error)
    }
}

export const addProductController = async (req, res) => {
    try {
        const {name, description, price, quantity, shipping} = req.fields
        const {photo} = req.files

        switch(true) {
            case !name:
                return res.status(404).send({message: 'Name is required'});
            case !description:
                return res.status(404).send({message: 'Description is required'});
            case !price:
                return res.status(404).send({message: 'Price is required'});
            case !quantity:
                return res.status(404).send({message: 'Quantity is required'});
            case !shipping:
                return res.status(404).send({message: 'Shipping is required'});
            case photo && photo.size > 2000000:
                return res.status(404).send({message: 'Image is required and should less than 2 MB'})
        }
        const existingProduct = await productModel.findOne({name})
        if(existingProduct) {
            return res.status(404).send({success: false, message:'Product already exists'})
        }
        const product = new productModel({...req.fields, slug:slugify(name)})
        if(photo) {
            product.photo.data = fs.readFileSync(photo.path)
            product.photo.contentType = photo.type;
        }
        await product.save();
        res.status(201).send({
            success: true,
            message: 'Product added successfully',
            product,
        });

    } catch(error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in adding product',
            error
        })
    }
}

export const getSingleProductController = async(req, res) => {
    try {
        const product = await productModel.findOne({slug:req.params.slug})
        if(product) {
            res.send({
                success: true,
                message: 'Product fetched',
                product
            })
        } else {
            res.send({
                success: true,
                message: 'No Product found'
            })
        }
    } catch(error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in getting Product details',
            error
        })
    }
}


export const getAllProductController = async (req, res) => {
    try {
        const product = await productModel.find({});
        if(product) {
            res.status(200).send({
                success: true,
                products: product,
            });
        } else {
            res.status(404).send({
                success: true,
                message: 'No product available'
            })
        }
    } catch(error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in getting Product details',
            error
        })
    }
}

export const deleteSingleProductController = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.pid)
        if(product) {
            await productModel.findByIdAndDelete(req.params.pid)
            res.status(200).send({
            success: true,
            message: 'Product deleted successfully',
            product
        })
        } else {
            res.status(200).send({
                success: true,
                message: 'Product does not exist'
            })
        }

    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Error in getting Product details',
            error: error
        })
    }
}

export const updateProductController = async (req, res) => {
    try {
        const { name, description, price, quantity, shipping } = req.fields;
        const { photo } = req.files || {}; 

        switch (true) {
            case !name:
                return res.status(404).send({ message: 'Name is required' });
            case !description:
                return res.status(404).send({ message: 'Description is required' });
            case !price:
                return res.status(404).send({ message: 'Price is required' });
            case !quantity:
                return res.status(404).send({ message: 'Quantity is required' });
            case !shipping:
                return res.status(404).send({ message: 'Shipping is required' });
            case photo && photo.size > 2000000:
                return res.status(404).send({ message: 'Image is required and should be less than 2 MB' });
        }

        const product = await productModel.findByIdAndUpdate(
            req.params.pid,
            { ...req.fields, slug: slugify(name) },
            { new: true }
        );

        if (photo) {
            product.photo = {
                data: fs.readFileSync(photo.path),
                contentType: photo.type,
            };
        }

        await product.save();

        res.status(201).send({
            success: true,
            message: 'Product updated successfully',
            product,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error in updating product',
            error,
        });
    }
};



export const getPhotoController = async(req, res) => {
    try {
        const product = await productModel.findById(req.params.pid).select("photo");
        if(product.photo.data) {
            res.set('Content-type', product.photo.contentType)
            res.status(200).send(product.photo.data)
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in fetching image'
        })
    }
}

export const productFilterController = async(req, res) => {
    try {
        const {radio} = req.body
        let args = {}
        if(radio.length) args.price = {$gte: radio[0], $lte: radio[1]}
        const products = await productModel.find(args)
        res.status(200).send({
            success: true,
            products,
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: "Error in filtering",
            error
        })
    }
}


export const searchProductController = async(req, res) => {
    try {
        const {keyword} = req.params
        const result = await productModel.find({$or: [
            {name: {$regex: keyword, $options:"i"}},
            {description: {$regex: keyword, $options:"i"}}
        ]}).select("-photo");
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in searching',
            error
        })
    }
}