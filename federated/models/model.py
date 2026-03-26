from sklearn.linear_model import LogisticRegression
import numpy as np


def get_model():
    return LogisticRegression()


def get_weights(model):
    return [model.coef_, model.intercept_]


def set_weights(model, weights):
    model.coef_ = weights[0]
    model.intercept_ = weights[1]