require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./models');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'admin@msservices.co.mz' });
        
        if (admin) {
            console.log(`✅ Admin user found:`);
            console.log(`   - Name: ${admin.name}`);
            console.log(`   - Email: ${admin.email}`);
            console.log(`   - ID: ${admin._id}`);
        } else {
            console.log("❌ Admin user NOT found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
