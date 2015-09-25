import numpy as N
from numpy.linalg import norm

def vector(*args):
    """
    A single vector in any coordinate basis,
    as a numpy array.
    """
    return N.array(args)

def augment(vec):
    """
    Augment a vector in any orthonormal basis
    with a trailing to form a homogeneous
    coordinate vector in that coordinate system.
    """
    return N.append(vec,[1])

def column(vec):
    """
    Return a vector with a new trailing axis
    (of singular dimension) added.
    """
    return vec[:,N.newaxis]

def angle(v1,v2, cos=False):
    """
    Find the angle between two vectors.

    :param cos: If True, the cosine of the
    angle will be returned. False by default.
    """
    n = (norm(v1)*norm(v2))
    _ = dot(v1,v2)/n
    return _ if cos else N.arccos(_)
