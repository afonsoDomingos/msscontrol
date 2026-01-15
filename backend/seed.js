
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Caixa, Banco, Cliente, User } = require('./models');

// Mock Data structure from previous steps
const caixaData = [
  { data: '2025-10-01', descricao: 'Reforço de caixa', documento: '-', entidade: '-', entrada: 50000.00, saida: 0, saldo: 50000.00 },
  { data: '2025-10-02', descricao: 'Autenticação de documentos', documento: '-', entidade: 'Notário', entrada: 0, saida: 2000.00, saldo: 48000.00 },
  { data: '2025-10-03', descricao: 'INSS', documento: '-', entidade: 'INSS', entrada: 0, saida: 8998.00, saldo: 39002.00 },
  { data: '2025-10-03', descricao: 'Aviso', documento: '-', entidade: 'Autoridade Tributária', entrada: 0, saida: 6152.46, saldo: 32849.54 },
];

const bancosData = [
  { banco: 'UBA', conta: '123456789', saldo: 250000.00, status: 'Ativo' },
  { banco: 'Access Bank', conta: '987654321', saldo: 12500.50, status: 'Ativo' },
];

const clientesData = [
  { nome: 'C&J Logistica', divida: 15000.00, regularizado: false },
  { nome: 'Pure Diets', divida: 0.00, regularizado: true },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to seed.");

        // Clean existing
        await Caixa.deleteMany({});
        await Banco.deleteMany({});
        await Cliente.deleteMany({});
        await User.deleteMany({}); // Clear users
        console.log("Cleared old data.");

        // Create Admin User
        // Using bcrypt hash for '@Admin123@'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('@Admin123@', salt);
        
        await User.create({
            email: 'admin@msservices.co.mz',
            password: hashedPassword,
            name: 'Administrador'
        });

        // Insert new
        await Caixa.insertMany(caixaData);
        await Banco.insertMany(bancosData);
        await Cliente.insertMany(clientesData);

        console.log("Database Seeded Successfully! 🌱");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
