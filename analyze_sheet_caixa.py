
import pandas as pd

file_path = "Resumo de Bancos, Caixa e Clientes.xlsx"
sheet_name = "Caixa Outubro"


path_out = "analysis_caixa_direct.txt"
with open(path_out, "w", encoding="utf-8") as f:
    try:
        # Read the sheet, skipping the first few rows to find the header
        # Based on previous output, row 3 (index 3) had "Entradas e Saidas Caixa", so real headers might be around row 5-6.
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        f.write(f"--- Detailed Analysis of '{sheet_name}' ---\n")
        
        # Locate header row: look for a row that has "Data" or "Descrição" or "Entrada"
        header_row_index = -1
        for i, row in df.iterrows():
            # strict check creates issues if encoding differs, so just check string presence
            row_str = " ".join([str(x) for x in row.values if pd.notna(x)]).lower()
            if "data" in row_str or "descrição" in row_str or "valor" in row_str or "saldo" in row_str:
                header_row_index = i
                break
                
        if header_row_index != -1:
            f.write(f"Found potential header at row {header_row_index + 1}\n")
            # Reload with correct header
            df_clean = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row_index)
            f.write(f"Columns found: {list(df_clean.columns)}\n")
            f.write("\nFirst 5 data rows:\n")
            f.write(df_clean.head().to_string())
            
            # Calculate some totals if possible
            # Check for numeric columns like 'Entrada', 'Saida', 'Saldo'
            numeric_cols = [c for c in df_clean.columns if "entrada" in str(c).lower() or "saida" in str(c).lower() or "valor" in str(c).lower()]
            
            if numeric_cols:
                f.write(f"\n\nNumeric Summaries for {numeric_cols}:\n")
                for col in numeric_cols:
                    # Force numeric conversation
                    total = pd.to_numeric(df_clean[col], errors='coerce').sum()
                    f.write(f"Total {col}: {total:,.2f}\n")
        else:
            f.write("Could not automatically detect a standard header row (Data/Descrição/Valor).\n")
            f.write("Raw first 10 rows:\n")
            f.write(df.head(10).to_string())

    except Exception as e:
        f.write(f"Error: {e}\n")

