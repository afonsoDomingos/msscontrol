
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'admin@msservices.co.mz' });
        
        if (admin) {
            console.log(`✅ Admin User Found: ${admin.email}`);
            console.log(`Name: ${admin.name}`);
            console.log(`ID: ${admin._id}`);
            // Do not log the password hash for security, but we know it's there.
        } else {
            console.log('❌ Admin User NOT Found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
