import flwr as fl


def start_server():
    strategy = fl.server.strategy.FedAvg()

    fl.server.start_server(
        server_address="127.0.0.1:8080",
        strategy=strategy,
        config=fl.server.ServerConfig(num_rounds=3),
    )


if __name__ == "__main__":
    start_server()