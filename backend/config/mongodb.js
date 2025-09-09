import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URL;
    if (!uri) {
        console.error('Missing MONGODB_URL environment variable');
        process.exit(1);
    }

    mongoose.connection.on('connected', () => {
        console.log("DB Connected");
    });
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
    });

    // Connect using the URI as provided in env. Include timeouts for faster failover.
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
    });
}

export default connectDB;