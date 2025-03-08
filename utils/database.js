const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds instead of 30
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain at least 5 socket connections
    retryWrites: true,
    retryReads: true,
    w: 'majority'
};

// Connect to MongoDB
async function connectToDatabase() {
    try {
        // Check if MONGODB_URI is set
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in the environment variables');
            return false;
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('Connected to MongoDB');
        
        // Load all models
        loadModels();
        
        return true;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        return false;
    }
}

// Load all models from the models directory
function loadModels() {
    const modelsPath = path.join(__dirname, '..', 'models');
    
    // Check if models directory exists
    if (!fs.existsSync(modelsPath)) {
        console.warn('Models directory does not exist');
        return;
    }
    
    // Load all model files
    const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
    
    for (const file of modelFiles) {
        try {
            require(path.join(modelsPath, file));
            console.log(`Loaded model: ${file}`);
        } catch (error) {
            console.error(`Failed to load model ${file}:`, error);
        }
    }
}

// Handle connection errors
mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectToDatabase, 5000); // Try to reconnect after 5 seconds
});

// Handle process termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = {
    connectToDatabase,
    mongoose
}; 