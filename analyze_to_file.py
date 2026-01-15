
import pandas as pd
import sys

file_path = "Resumo de Bancos, Caixa e Clientes.xlsx"
output_file = "analysis_result.txt"

with open(output_file, 'w', encoding='utf-8') as f:
    try:
        xl = pd.ExcelFile(file_path)
        f.write(f"SHEETS: {xl.sheet_names}\n")
        
        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            f.write(f"\n--- SHEET: {sheet} ---\n")
            f.write(f"SHAPE: {df.shape}\n")
            f.write(f"COLUMNS: {list(df.columns)}\n")
            f.write("HEAD:\n")
            f.write(df.head().to_string())
            f.write("\n")
            
    except Exception as e:
        f.write(f"ERROR: {e}\n")

print("Done writing analysis.")
