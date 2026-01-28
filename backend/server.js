
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Caixa, Banco, Cliente, Fornecedor, User, AuditLog } = require('./models');
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

// Helper for Logging
const logAction = async (req, action, resource, details) => {
  try {
    const log = new AuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action,
      resource,
      details
    });
    await log.save();
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// Helper for Recalculating Balances (Sequential based on Date)
const recalculateBalances = async (Model, filter = {}) => {
  const transactions = await Model.find(filter).sort({ data: 1, createdAt: 1 });
  let currentBalance = 0;

  for (const trx of transactions) {
    currentBalance += (trx.entrada || 0) - (trx.saida || 0);
    await Model.findByIdAndUpdate(trx._id, { saldo: currentBalance });
  }
};

// 1. Dashboard Stats (Enhanced with BI and Alerts)
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // For Custom Filters
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.data = { $gte: startDate, $lte: endDate };
    }

    const getTotals = async (Model, extraFilter = {}) => {
      const stats = await Model.aggregate([
        { $match: extraFilter },
        { $group: { _id: null, entrada: { $sum: "$entrada" }, saida: { $sum: "$saida" } } }
      ]);
      return stats[0] || { entrada: 0, saida: 0 };
    };

    const caixaTotals = await getTotals(Caixa, dateFilter);
    const bancoTotals = await getTotals(Banco, dateFilter);

    const ClientTransaction = mongoose.model('ClientTransaction');
    const clientTotals = await getTotals(ClientTransaction, dateFilter);

    const SupplierTransaction = mongoose.model('SupplierTransaction');
    const supplierTotals = await getTotals(SupplierTransaction, dateFilter);

    // Business Intelligence: Group by Category
    const getByCategory = async (Model) => {
      return await Model.aggregate([
        { $match: { ...dateFilter, saida: { $gt: 0 } } },
        { $group: { _id: "$categoria", value: { $sum: "$saida" } } },
        { $sort: { value: -1 } }
      ]);
    };
    const expensesByCategory = await getByCategory(Caixa); // Consolidate multiple if needed

    // Alerts: Items Due Soon (next 7 days)
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const alerts = await SupplierTransaction.find({
      vencimento: { $gte: today, $lte: nextWeekStr },
      saida: { $gt: 0 }
    }).populate('fornecedorId');

    const totalCaixa = caixaTotals.entrada - caixaTotals.saida;
    const totalBancos = bancoTotals.entrada - bancoTotals.saida;
    const totalDividas = clientTotals.entrada - clientTotals.saida;
    const totalFornecedores = supplierTotals.entrada - supplierTotals.saida;

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
      monthlyStats,
      expensesByCategory,
      alertsCount: alerts.length,
      alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Caixa CRUD
app.get('/api/caixa', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) filter.data = { $gte: startDate, $lte: endDate };

    const transactions = await Caixa.find(filter)
      .sort({ data: 1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Caixa.countDocuments(filter);
    res.json({ transactions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/caixa', authMiddleware, async (req, res) => {
  try {
    const newItem = new Caixa(req.body);
    await newItem.save();
    await recalculateBalances(Caixa);
    await logAction(req, 'CREATE', 'Caixa', newItem);
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    const updatedItem = await Caixa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await recalculateBalances(Caixa);
    await logAction(req, 'UPDATE', 'Caixa', updatedItem);
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/caixa/:id', authMiddleware, async (req, res) => {
  try {
    const oldItem = await Caixa.findById(req.params.id);
    await Caixa.findByIdAndDelete(req.params.id);
    await recalculateBalances(Caixa);
    await logAction(req, 'DELETE', 'Caixa', oldItem);
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

// 8. Audit Logs Route
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
console.log(`Starting server... Attempting to run on PORT: ${PORT}`);
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
