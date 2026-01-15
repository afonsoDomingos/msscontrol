
import pandas as pd

file_path = "Resumo de Bancos, Caixa e Clientes.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"SHEETS Found: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        print(f"\nSHEET: {sheet}")
        print(f"SHAPE: {df.shape}")
        print(f"COLUMNS: {list(df.columns)}")
        print("HEAD (first 5 rows, compact):")
        # Print just the values of the first few rows to avoid misalignment
        for i, row in df.head().iterrows():
            print(f"Row {i}: {row.values}")

except Exception as e:
    print(f"ERROR: {e}")
