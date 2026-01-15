
import pandas as pd

file_path = "Resumo de Bancos, Caixa e Clientes.xlsx"
sheet_name = "Uba"
path_out = "analysis_uba_direct.txt"

with open(path_out, "w", encoding="utf-8") as f:
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        f.write(f"--- Detailed Analysis of '{sheet_name}' ---\n")
        
        # Locate header row
        header_row_index = -1
        for i, row in df.iterrows():
            row_str = " ".join([str(x) for x in row.values if pd.notna(x)]).lower()
            if "data" in row_str or "descrição" in row_str or "valor" in row_str or "saldo" in row_str:
                header_row_index = i
                break
                
        if header_row_index != -1:
            f.write(f"Found potential header at row {header_row_index + 1}\n")
            df_clean = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row_index)
            f.write(f"Columns found: {list(df_clean.columns)}\n")
            f.write("\nFirst 5 data rows:\n")
            f.write(df_clean.head().to_string())
            
            numeric_cols = [c for c in df_clean.columns if "entrada" in str(c).lower() or "saida" in str(c).lower() or "valor" in str(c).lower() or "credito" in str(c).lower() or "debito" in str(c).lower()]
            
            if numeric_cols:
                f.write(f"\n\nNumeric Summaries for {numeric_cols}:\n")
                for col in numeric_cols:
                    total = pd.to_numeric(df_clean[col], errors='coerce').sum()
                    f.write(f"Total {col}: {total:,.2f}\n")
        else:
            f.write("Could not automatically detect a standard header row.\n")

    except Exception as e:
        f.write(f"Error: {e}\n")
