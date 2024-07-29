const mongoose = require('mongoose');

const connectMongo = process.env.MONGODB_CONNECT_URI;

function initializeDatabase() {
    mongoose.connect(connectMongo).then(() => {
        console.log("Conectou!!");
    }).catch((err) => console.log(err));
}

module.exports = { initializeDatabase };
