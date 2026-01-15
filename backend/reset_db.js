require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Caixa, Banco, Cliente, User } = require('./models');

const resetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Connected to database for reset.");

        // 1. Clean all main collections
        console.log("🧹 Clearing collections...");
        await Caixa.deleteMany({});
        await Banco.deleteMany({});
        await Cliente.deleteMany({});
        await User.deleteMany({});
        
        // Also clean the dynamic ClientTransaction collection
        // Since it's not exported directly in models (it's accessed via mongoose.model in server.js),
        // we access it via connection if it exists, or define it quickly to delete.
        // Assuming 'ClientTransaction' model is registered if server ran, 
        // but simple script might not have it registered.
        // Let's define it or get it safely.
        try {
            const ClientTransaction = mongoose.model('ClientTransaction') || mongoose.model('ClientTransaction', new mongoose.Schema({}, { strict: false }));
            await ClientTransaction.deleteMany({});
            console.log("   - Client Transactions cleared.");
        } catch (e) {
            // Check if model missing, define simple one to clear
             const clientTxSchema = new mongoose.Schema({}, { strict: false });
             const ClientTransaction = mongoose.models.ClientTransaction || mongoose.model('ClientTransaction', clientTxSchema);
             await ClientTransaction.deleteMany({});
             console.log("   - Client Transactions cleared (via new ref).");
        }

        console.log("✅ All business data cleared.");

        // 2. Re-create Admin User so user is not locked out
        console.log("👤 Re-creating Admin user...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('@Admin123@', salt);
        
        await User.create({
            email: 'admin@msservices.co.mz',
            password: hashedPassword,
            name: 'Administrador'
        });
        console.log("   - Admin user restored (admin@msservices.co.mz / @Admin123@)");

        console.log("✨ Database Reset Complete! System is clean and ready. 🚀");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error resetting database:", err);
        process.exit(1);
    }
};

resetDB();
