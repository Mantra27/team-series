import pandas as pd

def excel_to_json(input_file, output_file):
    try:
        skip_rows = 5000

        # Read the Excel file, skipping the first 5000 rows
        data = pd.read_excel(input_file, usecols=[0, 3, 9], skiprows=range(1, skip_rows + 1))

        # Convert the data to a JSON format
        json_data = data.to_json(orient='records')

        # Write the JSON data to a file
        with open(output_file, 'w') as file:
            file.write(json_data)

        print("Conversion successful. JSON data saved to", output_file)
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    input_file_path = 'demo.xlsx'  # Replace with the path to your input Excel file
    output_file_path = 'output.json'  # Replace with the desired output JSON file path

    excel_to_json(input_file_path, output_file_path)
