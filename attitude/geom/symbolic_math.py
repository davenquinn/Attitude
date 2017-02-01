"""
Functions for conic geometry implemented for
use with the `sympy` symbolic math module.
Generally, for use in testing and validation.
"""
from sympy import Matrix

def center(conic):
    ec = conic[:-1,:-1].inv()
    eo = -conic[:-1,-1]
    return ec*eo

def dual(conic):
    return conic.inv()

def polar_plane(ell, point=None):
    if point is None:
        point = [0]*(ell.shape[0]-1)
    pt_ = Matrix(list(point)+[1])
    return ell*pt_

def origin_distance(polar_plane):
    return polar_plane[-1]/Matrix(polar_plane[:-1]).norm()

