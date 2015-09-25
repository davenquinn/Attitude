import numpy as N

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
    (with singular dimension) added.
    """
    return vec[:,N.newaxis]
