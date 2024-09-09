import json
import os

# Load the chains.json file
def load_chains_data(file_path='chains.json'):
    if not os.path.isfile(file_path):
        print(f"{file_path} file not found.")
        return []
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {file_path}.")
        return []

# Save the selected chain data to a separate file and sort by chainId
def save_and_sort_chain_data(chain_data, output_file='selected_chains.json'):
    if not os.path.isfile(output_file):
        # If the file doesn't exist, create it with the new data
        with open(output_file, 'w') as file:
            json.dump([chain_data], file, indent=4)
    else:
        try:
            # Load existing data
            with open(output_file, 'r+') as file:
                existing_data = json.load(file)
                
                # Check if the chain data already exists
                if any(chain.get("chainId") == chain_data.get("chainId") for chain in existing_data):
                    print(f"Chain with chainId {chain_data.get('chainId')} already exists in {output_file}.")
                    return
                
                # Add new chain data
                existing_data.append(chain_data)
                # Sort by chainId
                existing_data = sorted(existing_data, key=lambda x: x.get("chainId", 0))
                # Write sorted data back to file
                file.seek(0)
                file.truncate()
                json.dump(existing_data, file, indent=4)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {output_file}.")
        except Exception as e:
            print(f"An error occurred: {e}")

# Main function to add a chain by its chainId
def add_chain_by_id(chain_id):
    chains_data = load_chains_data()
    
    # Find the chain by chainId
    chain = next((chain for chain in chains_data if chain.get("chainId") == chain_id), None)
    
    if chain:
        save_and_sort_chain_data(chain)
        print(f"Chain with chainId {chain_id} has been added and sorted in selected_chains.json.")
    else:
        print(f"No chain found with chainId {chain_id}.")

if __name__ == "__main__":
    while True:
        # Ask for user input
        chain_id_input = input("Enter the chainId (or type 'stop' to exit): ")
        
        # Check for stop condition
        if chain_id_input.lower() == "stop":
            print("Stopping program...")
            break
        
        # Attempt to parse the input as an integer chainId
        try:
            chain_id = int(chain_id_input)
            add_chain_by_id(chain_id)
        except ValueError:
            print("Invalid input. Please enter a valid chainId or 'stop' to exit.")
