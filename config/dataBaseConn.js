const mongoose = require('mongoose');

const connectMongo = process.env.MONGODB_CONNECT_URI;

async function initializeDatabase() {
    try {
        await mongoose.connect(connectMongo);
        console.log("Conectou!");
    } catch (err) {
        console.error("Erro ao conectar ao MongoDB:", err);
    }
}

module.exports = { initializeDatabase };
