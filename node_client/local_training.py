import numpy as np

class DummyModel:
    def __init__(self):
        self.weights = np.random.rand(5)

    def set_weights(self, w):
        self.weights = w

    def train(self, data):
        self.weights += np.random.rand(5) * 0.01

    def get_weights(self):
        return self.weights


def train_local_model(global_weights, data):
    model = DummyModel()
    model.set_weights(global_weights)
    model.train(data)
    return model.get_weights()