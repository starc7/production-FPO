import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB Database');
    } catch(error) {
        console.log(`Error while connecting with MongoDB is ${error}`);
    }
};

export default connectDB;