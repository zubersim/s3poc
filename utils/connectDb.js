// db.js
const mongoose = require("mongoose");
require("dotenv").config();

const mongoDB = process.env.MONGODB_URI || "mongodb://localhost:27017/test";

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);

    // Define event handlers
    const eventHandlers = {
      connected: () => console.log("Connected to MongoDB"),
      error: (err) => console.error("Error connecting to MongoDB:", err),
      disconnected: () => console.log("Disconnected from MongoDB"),
      reconnected: () => console.log("Reconnected to MongoDB"),
    };

    // Attach event listeners
    for (const [event, handler] of Object.entries(eventHandlers)) {
      mongoose.connection.on(event, handler);
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
