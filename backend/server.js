
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Caixa, Banco, Cliente, Fornecedor, User } = require('./models');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'mss_secret_key_123';

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected to Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- Routes ---

// --- Routes ---

// 0. Auth Routes
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Dashboard Stats (Protected)
// 1. Dashboard Stats (Protected)
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const getLastSaldo = async (Model) => {
        const lastEntry = await Model.findOne().sort({ createdAt: -1 });
        return lastEntry ? lastEntry.saldo : 0;
    };
    
    const getLastClientSaldo = async (clienteId) => {
        const lastEntry = await mongoose.model('ClientTransaction')
           .findOne({ clienteId })
           .sort({ createdAt: -1 });  // Use createdAt to ensure sequence
        return lastEntry ? lastEntry.saldo : 0;
    };

    const totalCaixa = await getLastSaldo(Caixa);
    const totalBancos = await getLastSaldo(Banco);
    
    // Aggregation for Clients
    const clientes = await Cliente.find();
    let totalDividas = 0; // "Dívidas" meaning Net Balance of all clients
    let totalEntradasAll = 0;
    let totalSaidasAll = 0;

    const ClientTransaction = mongoose.model('ClientTransaction');
    
    // Warning: Loop queries. Optimized approach would be aggregate.
    for (const c of clientes) {
        const saldo = await getLastClientSaldo(c._id);
        totalDividas += saldo;

        // Sum for globals? Or just keep balance?
        // User asked for "Total Entradas / Saídas" global.
        const stats = await ClientTransaction.aggregate([
            { $match: { clienteId: c._id } },
            { $group: { _id: null, totalEntrada: { $sum: "$entrada" }, totalSaida: { $sum: "$saida" } } }
        ]);
        if (stats.length > 0) {
            totalEntradasAll += stats[0].totalEntrada;
            totalSaidasAll += stats[0].totalSaida;
        }
    }
    
    // Monthly Data for Graph (All Clients Consolidated)
    const currentYear = new Date().getFullYear();
    const monthlyStats = await ClientTransaction.aggregate([
        { $match: { ano: currentYear } },
        { 
            $group: { 
                _id: "$mes", 
                entrada: { $sum: "$entrada" }, 
                saida: { $sum: "$saida" } 
            } 
        },
        { $sort: { _id: 1 } }
    ]);
    
    res.json({ 
        totalCaixa, 
        totalBancos, 
        totalDividas, // Global Balance of Clients
        totalEntradas: totalEntradasAll,
        totalSaidas: totalSaidasAll,
        monthlyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Caixa CRUD
app.get('/api/caixa', authMiddleware, async (req, res) => {
  try {
    const transactions = await Caixa.find().sort({ data: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/caixa', authMiddleware, async (req, res) => {
  try {
    // Auto-calculate saldo? Or allow manual?
    // Let's assume manual entry or simple calc based on previous.
    // Excel usually has manual control. Let's just save what is sent, 
    // BUT we can improve this by recalculating saldo based on previous record if needed.
    // For simplicity and flexibility: save provided data.
    const newItem = new Caixa(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Caixa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    await Caixa.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Bancos CRUD
app.get('/api/bancos', authMiddleware, async (req, res) => {
  try {
    const items = await Banco.find().sort({ data: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bancos', authMiddleware, async (req, res) => {
  try {
    const newItem = new Banco(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bancos/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Banco.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bancos/:id', authMiddleware, async (req, res) => {
  try {
    await Banco.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Clientes Profile CRUD
app.get('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const items = await Cliente.find().sort({ nome: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const newItem = new Cliente(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clientes/:id', authMiddleware, async (req, res) => {
  try {
    // Ideally delete transactions too
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Cliente Ledger/Transactions
app.get('/api/clientes/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const items = await mongoose.model('ClientTransaction').find({ clienteId: id }).sort({ data: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clientes/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const newItem = new (mongoose.model('ClientTransaction'))({
        ...req.body,
        clienteId: id
    });
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Fornecedores Profile CRUD
app.get('/api/fornecedores', authMiddleware, async (req, res) => {
  try {
    const items = await Fornecedor.find().sort({ nome: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fornecedores', authMiddleware, async (req, res) => {
  try {
    const newItem = new Fornecedor(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fornecedores/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Fornecedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fornecedores/:id', authMiddleware, async (req, res) => {
  try {
    await Fornecedor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Fornecedor Ledger/Transactions
app.get('/api/fornecedores/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const items = await mongoose.model('SupplierTransaction').find({ fornecedorId: id }).sort({ data: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fornecedores/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const newItem = new (mongoose.model('SupplierTransaction'))({
        ...req.body,
        fornecedorId: id
    });
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
