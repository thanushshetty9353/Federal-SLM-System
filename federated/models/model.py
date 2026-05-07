import torch
import torch.nn as nn


# =====================================
# DYNAMIC MODEL
# =====================================

class SimpleModel(nn.Module):

    def __init__(self, input_size):

        super(SimpleModel, self).__init__()

        # Dynamic input layer
        self.fc = nn.Linear(input_size, 2)

    def forward(self, x):

        return self.fc(x)


# =====================================
# CREATE MODEL
# =====================================

def get_model(input_size):

    return SimpleModel(input_size)


# =====================================
# SAVE MODEL
# =====================================

def save_model(model, path):

    torch.save(
        model.state_dict(),
        path
    )


# =====================================
# LOAD MODEL
# =====================================

def load_model(path, input_size):

    model = get_model(input_size)

    model.load_state_dict(
        torch.load(path)
    )

    model.eval()

    return model