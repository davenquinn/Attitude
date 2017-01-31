"""
Test module to make sure that simple representations of
hyperbolic errors are equivalent to more generalized
expressions.
"""
import numpy as N
from scipy.stats import chi2

from ..display.plot.cov_types.regressions import hyperbola
from ..orientation.test_pca import random_pca
from ..orientation.pca import augment as augment_matrix
from .conics import Conic, conic
from ..error import hyperbolic_errors
from ..error.axes import sampling_axes
from .util import vector, plane, dot

def simple_hyperbola(cov, xvals, n=1, level=1):
    """
    Simple hyperbolic error bounds for 2d errors
    using quadratic formulation.

    Returns tuple of
        ( distance from center of distribution,
          width of error bar)
    in unrotated coordinate space
    """
    assert len(cov) == 2
    a = cov[0]
    # Plot hyperbola
    b = N.sqrt(cov[-1])

    def y(x):
        return level*b*N.sqrt(x**2/(a*n)+1/n)

    # Top values of error bar only
    t = N.array([xvals,y(xvals)])
    return t

# Create a basic fit to test against
# (we could probably speed this up)
fit = random_pca()

sv = fit.singular_values
n = len(fit.arr)

covariance = sv**2/(n-1)

xvals = N.linspace(-100,100,100)
level = N.sqrt(chi2.ppf(0.95,n-3))

def test_sampling_covariance():
    """
    Test the creation of hyperbolic errors
    along direction of maximum angular variability
    """
    # use only direction of maximum angular
    # variation
    cov = covariance[1:]

    res1 = simple_hyperbola(cov,xvals, n, level)
    res2 = hyperbola(
        cov,
        N.identity(2), # rotation
        N.array([0,0]), # mean
        xvals,
        n=n,
        level=level)

    # In axis-aligned frame, magnitude of top and bottom
    # of error bars should be the same
    assert N.allclose(
        N.abs(res2[1]),
        res2[2])
    # Get only top values (bottom will be the same
    # implicitly)
    res2 = (res2[0],res2[-1])

    for a,b in zip(res1,res2):
        assert N.allclose(a,b)

def test_hyperbolic_simple():
    """
    Convert to hyperbolic axes before projection into
    plane of maximum angular variability
    """
    # Integrate error level at first
    hyp_axes = N.copy(covariance)
    hyp_axes[-1]*=level**2/n
    hyp_axes = hyp_axes[1:]
    cov = covariance[1:]

    res1 = simple_hyperbola(cov,xvals, n, level)
    res2 = simple_hyperbola(hyp_axes,xvals)
    for a,b in zip(res1,res2):
        assert N.allclose(a,b)

def test_hyperbolic_projection():
    """
    Fully projective mechanism to get hyperbolic error
    bounds in a generalized way along any axes associated with
    the plane.
    """
    # Convert covariance into hyperbolic axes
    # using assumptions of normal vectorization
    hyp_axes = N.copy(covariance)
    hyp_axes[-1]*=level**2/n

    d = 1/hyp_axes
    #d[-1] *= -1
    ndim = len(d)
    arr = N.identity(ndim+1)*-1

    arr[N.diag_indices(ndim)] = d
    hyp = conic(arr)

    # Check if we can get to this from
    # conic axes
    c1 = Conic.from_axes(hyp_axes)
    cd = c1.dual()
    #assert cd.is_hyperbolic()
    assert N.allclose(hyp, cd)
    #assert hyp.is_hyperbolic()

    # Get hyperbolic slice on yz plane
    # (corresponding to maximum angle of variation)
    normal = vector(1,0,0) # normal to plane (view direction)
    p = plane(normal) # no offset (goes through origin)

    h1 = cd.slice(p)[0]
    #assert h1.is_hyperbolic()

    # Not sure why we need to reverse array
    # but it seems to work
    d = N.abs(N.diagonal(h1)[:-1])[::-1]
    axes = N.sqrt(1/d)

    assert N.allclose(axes**2,hyp_axes[1:])

    u = lambda x: N.arcsinh(x/axes[0])
    y = lambda x: axes[1]*N.cosh(u(x))

    # Test that this is the same as our simple conception
    y0 = y(xvals)
    y1 = simple_hyperbola(hyp_axes[1:],xvals)[1]
    axes = N.array([[0,1,0],[0,0,1]])
    y2 = hyperbolic_errors(hyp_axes,xvals, axes=axes)[2][1]
    assert N.allclose(y0,y1)
    assert N.allclose(y0,y2)

def test_sampling_covariance():
    hyp_axes = covariance.copy()
    hyp_axes[-1]*=level**2/n
    a = sampling_axes(fit)
    N.allclose(a,hyp_axes)


def test_minimum_variation():
    hyp_axes = sampling_axes(fit)
    hax2 = N.delete(hyp_axes,1,0)

    res1 = simple_hyperbola(hax2,xvals)[1]
    axes = N.array([[1,0,0],[0,0,1]])
    res2 = hyperbolic_errors(hyp_axes,xvals,axes=axes)
    for a,b in zip(res1,res2[2][1]):
        assert N.allclose(a,b)

def test_error_projection():
    """
    Test projection of errors into error ellipsoid and
    hyperboloid, and recovery of angular errors
    """
    axial_lengths = N.array([500,200,10])
    errors = N.array([30,15,10])

    axes = N.identity(3)*axial_lengths
    normal = N.cross(axes[0],axes[1])

    c = Conic.from_axes(axial_lengths)
    pass
