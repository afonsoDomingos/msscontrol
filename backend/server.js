
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
    // Aggregation for totals using $sum (much more reliable than getLastSaldo)
    const getTotals = async (Model) => {
      const stats = await Model.aggregate([
        { $group: { _id: null, entrada: { $sum: "$entrada" }, saida: { $sum: "$saida" } } }
      ]);
      return stats[0] || { entrada: 0, saida: 0 };
    };

    const caixaTotals = await getTotals(Caixa);
    const bancoTotals = await getTotals(Banco);

    // Client totals
    const ClientTransaction = mongoose.model('ClientTransaction');
    const clientTotals = await getTotals(ClientTransaction);

    // Supplier totals
    const SupplierTransaction = mongoose.model('SupplierTransaction');
    const supplierTotals = await getTotals(SupplierTransaction);

    const totalCaixa = caixaTotals.entrada - caixaTotals.saida;
    const totalBancos = bancoTotals.entrada - bancoTotals.saida;
    const totalDividas = clientTotals.entrada - clientTotals.saida;
    const totalFornecedores = supplierTotals.entrada - supplierTotals.saida;

    // Monthly Data for Graph (Current Year)
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
      totalDividas,
      totalFornecedores,
      totalEntradas: clientTotals.entrada,
      totalSaidas: clientTotals.saida,
      monthlyStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for Recalculating Balances (Sequential based on Date)
const recalculateBalances = async (Model, filter = {}) => {
  // Get all transactions sorted by date and then by creation order
  const transactions = await Model.find(filter).sort({ data: 1, createdAt: 1 });
  let currentBalance = 0;

  for (const trx of transactions) {
    currentBalance += (trx.entrada || 0) - (trx.saida || 0);
    await Model.findByIdAndUpdate(trx._id, { saldo: currentBalance });
  }
};

// 2. Caixa CRUD
app.get('/api/caixa', authMiddleware, async (req, res) => {
  try {
    const transactions = await Caixa.find().sort({ data: 1, createdAt: 1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/caixa', authMiddleware, async (req, res) => {
  try {
    const newItem = new Caixa(req.body);
    await newItem.save();
    await recalculateBalances(Caixa);
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Caixa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalculateBalances(Caixa);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    await Caixa.findByIdAndDelete(req.params.id);
    await recalculateBalances(Caixa);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Bancos CRUD
app.get('/api/bancos', authMiddleware, async (req, res) => {
  try {
    const items = await Banco.find().sort({ data: 1, createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bancos', authMiddleware, async (req, res) => {
  try {
    const newItem = new Banco(req.body);
    await newItem.save();
    await recalculateBalances(Banco);
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bancos/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Banco.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalculateBalances(Banco);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bancos/:id', authMiddleware, async (req, res) => {
  try {
    await Banco.findByIdAndDelete(req.params.id);
    await recalculateBalances(Banco);
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
    const items = await mongoose.model('ClientTransaction').find({ clienteId: id }).sort({ data: 1, createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clientes/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const ClientTransaction = mongoose.model('ClientTransaction');
    const newItem = new ClientTransaction({
      ...req.body,
      clienteId: id
    });
    await newItem.save();
    await recalculateBalances(ClientTransaction, { clienteId: id });
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clientes Transactions (Sub-resource pattern)
app.put('/api/clientes/:clientId/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const ClientTransaction = mongoose.model('ClientTransaction');
    const updated = await ClientTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalculateBalances(ClientTransaction, { clienteId: req.params.clientId });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clientes/:clientId/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const ClientTransaction = mongoose.model('ClientTransaction');
    await ClientTransaction.findByIdAndDelete(req.params.id);
    await recalculateBalances(ClientTransaction, { clienteId: req.params.clientId });
    res.json({ message: 'Deleted' });
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
    const items = await mongoose.model('SupplierTransaction').find({ fornecedorId: id }).sort({ data: 1, createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fornecedores/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const SupplierTransaction = mongoose.model('SupplierTransaction');
    const newItem = new SupplierTransaction({
      ...req.body,
      fornecedorId: id
    });
    await newItem.save();
    await recalculateBalances(SupplierTransaction, { fornecedorId: id });
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fornecedores Transactions (Sub-resource pattern)
app.put('/api/fornecedores/:fornecedorId/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const SupplierTransaction = mongoose.model('SupplierTransaction');
    const updated = await SupplierTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalculateBalances(SupplierTransaction, { fornecedorId: req.params.fornecedorId });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fornecedores/:fornecedorId/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const SupplierTransaction = mongoose.model('SupplierTransaction');
    await SupplierTransaction.findByIdAndDelete(req.params.id);
    await recalculateBalances(SupplierTransaction, { fornecedorId: req.params.fornecedorId });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
console.log(`Starting server... Attempting to run on PORT: ${PORT}`);
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
