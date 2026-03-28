import torch
import torch.nn as nn


class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()

        # Example: binary classification
        self.fc = nn.Linear(1, 2)

    def forward(self, x):
        return self.fc(x)


def get_model():
    return SimpleModel()


def save_model(model, path):
    torch.save(model.state_dict(), path)


def load_model(path):
    model = get_model()
    model.load_state_dict(torch.load(path))
    model.eval()
    return model