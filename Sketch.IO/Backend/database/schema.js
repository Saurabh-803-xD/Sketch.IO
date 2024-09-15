// require('dotenv').config();
const mongoose = require("mongoose");
const { connect, Schema, model } = mongoose;

async function connectToDatabase() {
    try {
        // First attempt to connect using the environment variable
        const connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sketch', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');
        return connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with failure code
    }
}

connectToDatabase();

const userSchema = new Schema({
    userName: String,
    userId: String,
    points: Number,
    room: String
});

const User = model("User", userSchema);

// Use CommonJS module export
module.exports = { User };
