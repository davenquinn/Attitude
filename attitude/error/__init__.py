from __future__ import division

import numpy as N
from matplotlib.patches import Polygon

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
    #ax1 = dot(transformation,axes[0])[1:]
    #print(ax1)

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

class ErrorHyperbola(object):
    """
    A class to simplify plotting and animation of hyperbolic error
    areas that are orthogonal to the fitted plane.
    `ax.fill_between` cannot be used for these (unless
    the plane is flat), because the coordinate system
    is rotated.
    """
    def __init__(self, ax, data=None,**kw):
        #self.n, = ax.plot([],[], '-', **kw)
        patch = Polygon([[0,0]], **kw)
        self.poly = ax.add_patch(patch)
        if data is not None:
            self.set_data(data)

    def set_data(self, n):
        #self.n.set_data(n[0][0],n[0][1])
        coords = N.concatenate((n[1],n[2][:,::-1]),axis=1).T
        self.poly.set_xy(coords)
        #self.b.set_data(n[1][0],n[1][1])
        #self.t.set_data(n[2][0],n[2][1])

