import subprocess
import time
import urllib.request
import json
import os
import sys

def check_ngrok_running():
    try:
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=2) as response:
            data = json.loads(response.read().decode())
            if data.get("tunnels"):
                return data["tunnels"][0]["public_url"]
    except Exception:
        pass
    return None

def start_ngrok():
    print("Starting ngrok on port 8000...")
    # Start ngrok in a separate process
    try:
        process = subprocess.Popen(
            ["ngrok", "http", "8000"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        return process
    except FileNotFoundError:
        print("Error: ngrok command not found. Please ensure ngrok is installed and in your PATH.")
        sys.exit(1)

def update_env_file(url):
    env_path = os.path.join("frontend", ".env")
    if not os.path.exists(env_path):
        print(f"Creating new {env_path} file...")
        with open(env_path, "w") as f:
            f.write(f"EXPO_PUBLIC_API_URL={url}\n")
        return

    # Read existing env file
    with open(env_path, "r") as f:
        lines = f.readlines()

    updated = False
    new_lines = []
    for line in lines:
        if line.strip().startswith("EXPO_PUBLIC_API_URL="):
            new_lines.append(f"EXPO_PUBLIC_API_URL={url}\n")
            updated = True
        else:
            new_lines.append(line)

    if not updated:
        new_lines.append(f"EXPO_PUBLIC_API_URL={url}\n")

    with open(env_path, "w") as f:
        f.writelines(new_lines)

    print(f"Updated {env_path} successfully!")

def main():
    # 1. Check if ngrok is already running
    url = check_ngrok_running()
    
    if url:
        print(f"ngrok is already running at: {url}")
    else:
        # 2. Start ngrok
        proc = start_ngrok()
        # Wait for ngrok to initialize
        for i in range(5):
            print(f"Waiting for ngrok to start (attempt {i+1}/5)...")
            time.sleep(2)
            url = check_ngrok_running()
            if url:
                break
        
        if not url:
            print("Failed to start ngrok or retrieve the public URL.")
            print("Please check if ngrok is authenticated. Run: ngrok config add-authtoken <your-token>")
            sys.exit(1)
            
    print(f"\n==========================================")
    print(f"[*] ngrok tunnel is live!")
    print(f"URL: {url}")
    print(f"==========================================\n")
    
    # 3. Update env file
    update_env_file(url)

if __name__ == "__main__":
    main()
