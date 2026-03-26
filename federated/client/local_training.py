from federated.models.model import get_model, get_weights, set_weights
from federated.client.dataset import load_data


def train_local_model(global_weights):

    model = get_model()

    if global_weights:
        set_weights(model, global_weights)

    X, y = load_data()

    if len(X) == 0:
        return get_weights(model)

    model.fit(X, y)

    return get_weights(model)