from flwr.server.strategy import FedAvg


class CustomStrategy(FedAvg):
    def aggregate_fit(self, rnd, results, failures):
        print(f"🔁 Aggregating round {rnd}")
        return super().aggregate_fit(rnd, results, failures)