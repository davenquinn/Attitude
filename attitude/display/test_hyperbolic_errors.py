"""
Test module to make sure that simple representations of
hyperbolic errors are equivalent to more generalized
expressions.
"""
import numpy as N
from scipy.stats import chi2

from ..error.axes import sampling_axes
from ..geom.conics import conic
from ..geom.util import augment_tensor, dot, plane
from ..orientation.test_pca import random_pca
from .plot.cov_types.regressions import hyperbola


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
        return level * b * N.sqrt(x**2 / (a * n) + 1 / n)

    # Top values of error bar only
    t = N.array([xvals, y(xvals)])
    return t


def hyperbola_from_axes(cov, xvals, n=1, level=1):
    # Plot hyperbola
    cov[-1] = level * N.sqrt(cov[-1] / n)

    def y(x):
        return cov[-1] * N.sqrt(x**2 / cov[1] + 1)

    # Top values of error bar only
    t = N.array([xvals, y(xvals)])
    return t


def test_sampling_covariance():
    """
    Test the creation of hyperbolic errors
    along direction of maximum angular variability
    """
    fit = random_pca()

    sv = fit.singular_values
    n = len(fit.arr)

    cov = sv**2 / (n - 1)

    xvals = N.linspace(-100, 100, 100)
    level = chi2.ppf(0.95, n - 3)

    # use only direction of maximum angular
    # variation
    cov2d = cov[1:]

    res1 = simple_hyperbola(cov2d, xvals, n, N.sqrt(level))
    res2 = hyperbola(
        cov2d,
        N.identity(2),  # rotation
        N.array([0, 0]),  # mean
        xvals,
        n=n,
        level=N.sqrt(level),
    )
    # Get only top values
    res2 = (res2[0], res2[-1])

    for a, b in zip(res1, res2):
        assert N.allclose(a, b)

    # Scale axes before sending to plotting function
    cov[-1] = level * cov[-1] / n
    res3 = simple_hyperbola(cov[1:], xvals)
    for a, b in zip(res1, res3):
        assert N.allclose(a, b)


def test_dual_conic():
    fit = random_pca()
    angle = N.pi / 8
    # Hyperbolic axes
    hyp_axes = N.array([100, 10, 0.02])  # sampling_axes(fit)

    arr = augment_tensor(N.diag(hyp_axes))
    # Transform ellipsoid to dual hyperboloid
    hyp = conic(arr).dual()

    axes = N.array([[N.cos(angle), N.sin(angle), 0], [0, 0, 1]])

    n_ = N.cross(axes[0], axes[1])

    # Create a plane containing the two axes specified
    # in the function call
    p = plane(n_)  # no offset (goes through origin)
    h1 = hyp.slice(p, axes=axes)[0]

    # Major axes of the conic sliced in the requested viewing
    # geometry
    H = N.sqrt(h1.semiaxes())

    ## Simple methods
    h = N.sqrt(1 / hyp_axes)
    v = [h[0] * N.cos(angle), h[1] * N.sin(angle), h[2]]
    a = 1 / N.linalg.norm([v[0], v[1]])
    b = 1 / N.abs(v[2])
    H1 = [a, b]
    assert N.allclose(H, H1)
