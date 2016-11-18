from __future__ import division

import numpy as N

from ..geom.util import dot, augment_tensor
from ..geom.vector import vector, plane
from ..geom.conics import Conic, conic

def hyperbolic_errors(hyp_axes, xvals,
                      transformation=None, axes=None, means=None):
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

    arr = augment_tensor(hyp_axes)

    if transformation is None:
        transformation = N.identity(3)
    if axes is None:
        axes = N.array([[0,1,0],[0,0,1]])

    hyp = conic(arr).dual()
    hyp = hyp.transform(augment_tensor(transformation))

    n_ = N.cross(axes[0],axes[1])

    ax1 = dot(axes,transformation,axes.T)
    #ax1 = transformation[:2,:2]
    assert len(ax1) == 2

    p = plane(n_) # no offset (goes through origin)
    h1 = hyp.slice(p, axes=axes)[0]

    ax = N.sqrt(h1.hyperbolic_axes())

    yvals = ax[1]*N.cosh(N.arcsinh(xvals/ax[0]))

    vals = N.array([xvals,yvals]).transpose()
    nom = N.array([xvals,N.zeros(xvals.shape)]).transpose()

    # Top
    t = dot(vals,ax1).T+means[:,N.newaxis]
    # Btm
    vals[:,-1] *= -1
    b = dot(vals,ax1).T+means[:,N.newaxis]
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

