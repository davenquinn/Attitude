from __future__ import division

import numpy as N

from ..geom.util import dot
from ..geom.vector import vector, plane
from ..geom.conics import Conic, conic

def hyperbolic_errors(hyp_axes, xvals, view_direction=None, transformation=None, means=None):
    """
    Returns a function that can be used to create a view of the
    hyperbolic error ellipse from a specific direction.

    This creates a hyperbolic quadric and slices it to form a conic
    on a 2d cartesian plane aligned with the requested direction.

    A function is returned that takes x values (distance along nominal
    line) and returns y values (width of error hyperbola)
    """
    if means is None:
        means = N.array([0,0])

    if view_direction is None:
        view_direction = vector(1,0,0)

    arr = N.identity(4)*-1
    arr[:-1,:-1] = hyp_axes
    n_ = view_direction/N.linalg.norm(view_direction)
    p = plane(n_) # no offset (goes through origin)

    hyp = conic(arr).dual()
    if transformation is not None:
        hyp = hyp.transform(transformation)

        # projection of axes
        ax1 = conic(transformation).slice(p)[0]
    else:
        ax1 = N.identity(2)


    h1 = hyp.slice(p)[0]

    ax = N.sqrt(h1.hyperbolic_axes())
    #nominal = ax1[0,1]*xvals
    yvals = ax[1]*N.cosh(N.arcsinh(xvals/ax[0]))

    vals = N.array([xvals,yvals]).transpose()
    nom = N.array([xvals,N.zeros(xvals.shape)]).transpose()

    ax1 = ax1[:2,:2]
    # Top
    t = dot(nom+vals,ax1).T+means[:,N.newaxis]
    # Btm
    vals[:,-1] *= -1
    b = dot(nom+vals,ax1).T+means[:,N.newaxis]
    return nom, b, t

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

