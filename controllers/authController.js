import { comparePassword, hashPassword } from '../helpers/authHelper.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js'
import JWT from 'jsonwebtoken';

export const registerController = async (req, res) => {
    try {
        const {name,email,password,phone,address, answer} = req.body

        if(!name) {
            return res.send({message: 'Name is required'})
        }
        if(!email) {
            return res.send({message: 'Email is required'})
        }
        if(!password) {
            return res.send({message: 'Password is required'})
        }
        if(!phone) {
            return res.send({message: 'Phone number is required'})
        }
        if(!address) {
            return res.send({message: 'Address is required'})
        }
        if(!answer) {
            return res.send({message: 'Answer is required'})
        }

        //Check if user already exist or not
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            return res.status(200).send({
                success:false,
                message:'User already registered, Please Log in'
            })
        }
        const hashedPassword = await hashPassword(password)

        const user = await new userModel({name,email,phone,address,password:hashedPassword,answer}).save();

        res.status(201).send({
            success:true,
            message:'User registered successfully\n Rediricting to Log In Page',
            user
        })

    } catch(error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in Registration',
            error
        })
    }
};

// Log in controller
export const loginController = async (req, res) => {
    try {
        const {email,password} = req.body

        if(!email || !password) {
            res.status(404).send({
                success:false,
                message:'Invalid Email or Password',
                
            })
        }
        const user = await userModel.findOne({email})
        if(!user) {
            return res.status(200).send({
                success:false,
                message:'Email is not registered'
            })
        }
        const match = await comparePassword(password, user.password);
        if(!match) {
            return res.status(200).send({
                success:false,
                message:'Invalid Password'
            })
        }

        // Token
        const token = await JWT.sign({ _id:user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });
        res.status(200).send({
            success:true,
            message:'User logged in successfully',
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role:user.role
            },
            token
        });

    } catch(error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message:'Error in Log in',
            error
        })
    }
}


export const forgotPasswordController = async (req, res) => {
    try {
        const {email, answer, newPassword} = req.fields;

        switch(true) {
            case !email:
                return res.status(404).send({ message: 'Email is required' });
            case !answer:
                return res.status(404).send({ message: 'Answer is required' });
            case !newPassword:
                return res.status(404).send({ message: 'New Password is required' });
        }

        const user = await userModel.findOne({email: email, answer: answer});
        
        if(!user) {
            return res.status(200).send({
                success: false,
                message: 'Invalid Email or Answer'
            })
        }
        const hashed = await hashPassword(newPassword);
        await userModel.findByIdAndUpdate(user._id, {password: hashed}, {new: true})
        res.status(200).send({
            success: true,
            message: 'Password reset successfully'
        })

    } catch(error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
            error
        })
    }
}

export const getAllUserController = async (req, res) => {
    try {
        const users = await userModel.find({}, {password: 0, __v: 0, updatedAt: 0, createdAt: 0})
        if(users) {
            res.status(200).send({
                success: true,
                users: users,
            })
        } else {
            res.status(404).send({
                success: true,
                message: 'No user found'
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in getting All user details',
            error
        })
    }
}

export const getSingleUserController = async(req, res) => {
    try {
        const user = await userModel.findById(req.params.pid);
        if(user) {
            res.status(200).send({
                success: true,
                message: 'user fetched',
                user
            })
        } else {
            res.status(200).send({
                success: true,
                message: 'No user found'
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error in getting user details',
            error
        })
    }
}

export const updateUserController = async (req, res) => {
    try {
        const { name, email, phone, address} = req.fields;

        switch (true) {
            case !name:
                return res.status(404).send({ message: 'Name is required' });
            case !email:
                return res.status(404).send({ message: 'Email is required' });
            case !phone:
                return res.status(404).send({ message: 'Phone Number is required' });
            case !address:
                return res.status(404).send({ message: 'Address is required' });
        }

        const user = await userModel.findByIdAndUpdate(
            req.params.pid,
            { name: name, phone: phone, address: address },
            { new: true }
        );

        await user.save();

        res.status(201).send({
            success: true,
            message: 'Details updated successfully',
            user,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error in updating user',
            error,
        });
    }
};


export const updatePasswordController = async(req, res) => {
    try {
        const {oldPassword, newPassword, reNewPassword} = req.fields;

        switch (true) {
            case !oldPassword:
                return res.status(200).send({ message: 'Old Password is required' });
            case !newPassword:
                return res.status(200).send({ message: 'Enter the Password again' });
            case !reNewPassword:
                return res.status(200).send({ message: 'New Password is required' })
        }

        if (newPassword != reNewPassword) {
            return res.status(200).send({success: false, message: 'New password and Re-entered password are not same'})
        }

        const us = await userModel.findById(req.params.pid)
        const match = await comparePassword(oldPassword, us.password);
        if(!match) {
            return res.status(200).send({
                success:false,
                message:'Invalid Current Password'
            })
        }

        const hashedPassword = await hashPassword(reNewPassword);

        const user = await userModel.findByIdAndUpdate(req.params.pid, {password: hashedPassword}, {new: true})

        await user.save();

        res.status(201).send({
            success: true,
            message: 'Password changed successfully',
            user,
        });

    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
            error
        })
    }
}


export const getOrdersController = async(req, res) => {
    try {
        const orders = await orderModel.find({buyer: req.user._id}).populate("products", "-photo").populate("buyer", "name")
        res.json(orders)
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success: false,
            message: 'Error whilte fetching orders',
            error
        })
    }
}

export const getAllOrdersController = async(req, res) => {
    try {
        const orders = await orderModel.find({}).populate("products", "-photo").populate("buyer", "name").sort()
        res.json(orders)
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error whilte fetching all orders',
            error
        })
    }
}