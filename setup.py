import os
import re

def setup():
    print("Welcome to Chiaseed Setup Utility")
    print("---------------------------------")
    
    config_path = "assets/js/config.js"
    if not os.path.exists(config_path):
        print(f"Error: {config_path} not found. Are you running this in the chiaseed root?")
        return

    with open(config_path, "r") as f:
        content = f.read()

    new_name = input("Enter your Platform Name [Chiaseed Quiz Platform]: ") or "Chiaseed Quiz Platform"
    new_genai = input("Enter GenAI API Endpoint [https://api.your-domain.com/genai]: ") or "https://api.your-domain.com/genai"
    new_data = input("Enter Data/Tracking API Endpoint [https://api.your-domain.com/data]: ") or "https://api.your-domain.com/data"
    
    # Replace Platform Name
    content = re.sub(r'name:\s*".*?"', f'name: "{new_name}"', content)
    # Replace Endpoints
    content = re.sub(r'genai:\s*".*?"', f'genai: "{new_genai}"', content)
    content = re.sub(r'data:\s*".*?"', f'data: "{new_data}"', content)

    with open(config_path, "w") as f:
        f.write(content)

    print("\n---------------------------------")
    print("Setup Complete!")
    print(f"Modified {config_path} with your custom settings.")
    print("You can now add your JSON files to the 'json/' directory and update the subjects in config.js.")

if __name__ == "__main__":
    setup()
