
import React from 'react';
import LedgerTable from '../components/LedgerTable';

const Bancos = () => {
  return (
    <LedgerTable 
      title="Movimento Bancário" 
      endpoint="/bancos" 
      entityLabel="Banco / Entidade" 
    />
  );
};

export default Bancos;
