require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

const verifyPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'admin@msservices.co.mz' });
        
        if (user) {
            console.log("User found.");
            // Test the password
            const isMatch = await bcrypt.compare('@Admin123@', user.password);
            console.log(`Password '@Admin123@' match status: ${isMatch}`);
            
            if (!isMatch) {
                console.log("Password mismatch! Re-hashing and updating...");
                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash('@Admin123@', salt);
                user.password = newHash;
                await user.save();
                console.log("Password updated to '@Admin123@' successfully.");
            }
        } else {
            console.log("User not found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyPassword();
