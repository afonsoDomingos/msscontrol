
export const caixaData = [
  { id: 1, data: '2025-10-01', descricao: 'Reforço de caixa', documento: '-', entidade: '-', entrada: 50000.00, saida: 0, saldo: 50000.00 },
  { id: 2, data: '2025-10-02', descricao: 'Autenticação de documentos', documento: '-', entidade: 'Notário', entrada: 0, saida: 2000.00, saldo: 48000.00 },
  { id: 3, data: '2025-10-03', descricao: 'INSS', documento: '-', entidade: 'INSS', entrada: 0, saida: 8998.00, saldo: 39002.00 },
  { id: 4, data: '2025-10-03', descricao: 'Aviso', documento: '-', entidade: 'Autoridade Tributária', entrada: 0, saida: 6152.46, saldo: 32849.54 },
  // Adding mock data to fill the table for visual appeal
  { id: 5, data: '2025-10-04', descricao: 'Pagamento Energia', documento: 'FT-001', entidade: 'EDM', entrada: 0, saida: 1500.00, saldo: 31349.54 },
  { id: 6, data: '2025-10-05', descricao: 'Venda de Serviços', documento: 'REC-102', entidade: 'Cliente A', entrada: 15000.00, saida: 0, saldo: 46349.54 },
];

export const bancosData = [
  { id: 1, banco: 'UBA', conta: '123456789', saldo: 250000.00, status: 'Ativo' },
  { id: 2, banco: 'Access Bank', conta: '987654321', saldo: 12500.50, status: 'Ativo' },
];

export const clientesData = [
  { id: 1, nome: 'C&J Logistica', divida: 15000.00, regularizado: false },
  { id: 2, nome: 'Pure Diets', divida: 0.00, regularizado: true },
];

export const summaryStats = {
  totalCaixa: 46349.54,
  totalBancos: 262500.50,
  totalDividas: 15000.00,
  fluxoMensal: { entrada: 65000.00, saida: 18650.46 }
};
