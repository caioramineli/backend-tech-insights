const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserFinance', required: true, }
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;