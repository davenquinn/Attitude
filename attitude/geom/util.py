from __future__ import division
from functools import reduce
import numpy as N

def dot(*matrices):
    return reduce(N.dot, matrices)

def augment_tensor(matrix, ndim=None):
    """
    Increase the dimensionality of a tensor,
    splicing it into an identity matrix of a higher
    dimension. Useful for generalizing
    transformation matrices.
    """
    s = matrix.shape
    if ndim is None:
        ndim = s[0]+q
    arr = N.identity(ndim)
    arr[:s[0],:s[1]] = arr
    return arr
