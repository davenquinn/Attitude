from __future__ import division

import numpy as N

from ..geom.util import dot, augment_tensor
from ..geom.util import vector, plane, angle

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

def pca_to_mapping(pca,**extra_props):
    """
    A helper to return a mapping of a PCA result set suitable for
    reconstructing a planar error surface in other software packages

    kwargs: method (defaults to sampling axes)
    """
    from .axes import sampling_axes
    method = extra_props.pop('method',sampling_axes)
    return dict(
        axes=pca.axes.tolist(),
        covariance=method(pca).tolist(),
        **extra_props)

def to_normal_errors(axes):
    """
    A temporary method that gets normal vector errors
    corresponding with a fitted orientation
    """
    ax1 = 1/axes*axes[2]**2
    return ax1

def from_normal_errors(ax1):
    """
    Hyperbolic error axis lengths for planes from the equivalent
    representation for normal vector endpoints
    """
    return ax1[2]**2/ax1

def average_orientation(orientations):
    """
    Find the average orientation of a set of fitted or reconstructed
    orientations, taking into account uncertainty.
    """
    raise NotImplementedError()
