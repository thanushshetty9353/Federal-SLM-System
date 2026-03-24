import subprocess

def start_federated_training():
    # Start Flower server
    subprocess.Popen(["python", "federated/server.py"])

    # Start multiple clients (simulate orgs)
    subprocess.Popen(["python", "node_client/client.py"])
    subprocess.Popen(["python", "node_client/client.py"])