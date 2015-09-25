import numpy as N

from .util import dot
from .vector import augment

def transform(conic, T):
    """
    Transforms a conic or quadric by a transformation
    matrix.
    """
    return dot(T.T,conic,T)

class Conic(N.ndarray):
    def center(conic):
        # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
        ec = N.linalg.inv(conic[:-1,:-1])
        eo = -conic[:-1,-1]
        return dot(ec,eo.T)

    def contains(ell,p):
        # Likely only works on ellipsoids
        v = augment(p)
        return transform(ell,v) <= 0


def conic(x):
    return N.array(x).view(Conic)

