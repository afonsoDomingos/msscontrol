
import pandas as pd
import sys

file_path = "Resumo de Bancos, Caixa e Clientes.xlsx"

try:
    # Load the Excel file ensuring we get all sheets
    xl = pd.ExcelFile(file_path)
    print(f"File found: {file_path}")
    print(f"Sheet names: {xl.sheet_names}")
    
    for sheet_name in xl.sheet_names:
        print(f"\n--- Analyzing Sheet: {sheet_name} ---")
        df = xl.parse(sheet_name)
        
        print(f"Dimensions: {df.shape}")
        print("Columns:")
        print(df.columns.tolist())
        
        print("\nFirst 5 rows:")
        print(df.head().to_string())
        
        print("\nBasic Statistics:")
        print(df.describe().to_string())
        
        print("\nMissing Values:")
        print(df.isnull().sum().to_string())

except Exception as e:
    print(f"Error reading file: {e}")
