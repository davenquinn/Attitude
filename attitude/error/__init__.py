from __future__ import division

import numpy as N

from ..geom.util import dot
from ..geom.vector import vector, plane
from ..geom.conics import Conic, conic

def hyperbolic_errors(hyp_axes, view_direction=None):
    """
    Returns a function that can be used to create a view of the
    hyperbolic error ellipse from a specific direction.

    This creates a hyperbolic quadric and slices it to form a conic
    on a 2d cartesian plane aligned with the requested direction.

    A function is returned that takes x values (distance along nominal
    line) and returns y values (width of error hyperbola)
    """
    if view_direction is None:
        view_direction = vector(1,0,0)

    arr = N.identity(4)*-1
    arr[:-1,:-1] = hyp_axes
    hyp = conic(arr).dual()
    p = plane(view_direction) # no offset (goes through origin)
    h1 = hyp.slice(p)[0]
    ax = N.sqrt(h1.hyperbolic_axes())
    return lambda x: ax[1]*N.cosh(
                N.arcsinh(x/ax[0]))

def asymptotes(hyp, n=1000):
    """
    Gets a cone of asymptotes for hyperbola
    """
    assert N.linalg.norm(hyp.center()) == 0

    u = N.linspace(0,2*N.pi,n)
    _ = N.ones(len(u))
    angles = N.array([N.cos(u),N.sin(u),_]).T
    return dot(angles,hyp[:-1,:-1])

