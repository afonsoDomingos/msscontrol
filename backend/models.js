const mongoose = require('mongoose');

const LedgerSchema = {
  n_ordem: { type: String, default: '' },
  data: { type: String, required: true },
  descricao: { type: String, required: true },
  documento: { type: String, default: '-' },
  entidade: { type: String, default: '-' },
  entrada: { type: Number, default: 0 },
  saida: { type: Number, default: 0 },
  saldo: { type: Number, default: 0 },
  observacao: { type: String, default: '' },
};

const CaixaSchema = new mongoose.Schema(LedgerSchema, { timestamps: true });
const BancoSchema = new mongoose.Schema(LedgerSchema, { timestamps: true });

// Client is now an Entity Profile
const ClienteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  nuit: { type: String, default: '' },
  endereco: { type: String, default: '' },
  contacto: { type: String, default: '' },
  email: { type: String, default: '' },
}, { timestamps: true });

// Supplier Profile
const FornecedorSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  nuit: { type: String, default: '' },
  endereco: { type: String, default: '' },
  contacto: { type: String, default: '' },
  email: { type: String, default: '' },
}, { timestamps: true });

// Ledger specifically for a Client
const ClientTransactionSchema = new mongoose.Schema({
  ...LedgerSchema,
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  mes: { type: Number, required: true }, // 1-12
  ano: { type: Number, required: true }  // 2026
}, { timestamps: true });

// Ledger specifically for a Supplier
const SupplierTransactionSchema = new mongoose.Schema({
  ...LedgerSchema,
  fornecedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornecedor', required: true },
  mes: { type: Number, required: true },
  ano: { type: Number, required: true }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Admin' }
});

module.exports = {
  Caixa: mongoose.model('Caixa', CaixaSchema),
  Banco: mongoose.model('Banco', BancoSchema),
  Cliente: mongoose.model('Cliente', ClienteSchema),
  ClientTransaction: mongoose.model('ClientTransaction', ClientTransactionSchema),
  Fornecedor: mongoose.model('Fornecedor', FornecedorSchema),
  SupplierTransaction: mongoose.model('SupplierTransaction', SupplierTransactionSchema),
  User: mongoose.model('User', UserSchema)
};
