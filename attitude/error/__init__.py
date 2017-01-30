from __future__ import division

import numpy as N

from .hyperbola import hyperbolic_errors
from ..geom.util import dot, augment_tensor
from ..geom.vector import vector, plane, angle
from ..geom.conics import Conic, conic

def error_bounds(hyp_errors):
    nominal, width = hyp_errors
    return nominal-width, nominal+width

def asymptotes(hyp, n=1000):
    """
    Gets a cone of asymptotes for hyperbola
    """
    assert N.linalg.norm(hyp.center()) == 0

    u = N.linspace(0,2*N.pi,n)
    _ = N.ones(len(u))
    angles = N.array([N.cos(u),N.sin(u),_]).T
    return dot(angles,hyp[:-1,:-1])

