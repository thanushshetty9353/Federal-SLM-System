import torch
import torch.nn as nn


class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()

        # Input = 1 (age)
        # Output = 2 classes (Healthy / Disease)
        self.fc = nn.Linear(1, 2)

    def forward(self, x):
        return self.fc(x)


def get_model():
    return SimpleModel()