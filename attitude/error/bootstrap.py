from __future__ import division

import numpy as N
from seaborn.algorithms import bootstrap


def bootstrap(array):
    """
    Provides a bootstrap resampling of an array. Provides another
    statistical method to estimate the variance of a dataset.

    For a `PCA` object in this library, it should be applied to
    `Orientation.array` method.
    """
    reg_func = lambda a: N.linalg.svd(a, full_matrices=False)[2][2]
    beta_boots = bootstrap(array, func=reg_func)
    return yhat, yhat_boots
