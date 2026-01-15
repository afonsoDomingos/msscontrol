
import React from 'react';
import LedgerTable from '../components/LedgerTable';

const Caixa = () => {
  return (
    <LedgerTable 
      title="Fluxo de Caixa" 
      endpoint="/caixa" 
      entityLabel="Nome da Entidade" 
    />
  );
};

export default Caixa;
