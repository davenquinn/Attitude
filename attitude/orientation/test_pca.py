from __future__ import division

import numpy as N
import pytest
from mplstereonet.stereonet_math import sph2cart
from scipy.integrate import quad
from scipy.stats import chi2

from ..error import from_normal_errors, to_normal_errors
from ..error.axes import sampling_axes, variance_axes
from ..geom.util import angle, dot, vector
from ..test import load_test_plane, random_plane, scattered_plane
from .pca import PCAOrientation, centered, random_pca


def test_rotation():
    """
    Make sure we can rotate between PCA and global coordinate systems
    """
    o = random_pca()

    Mbar = dot(o.arr, o.axes.T)
    assert N.allclose(Mbar, o.rotated())
    assert N.allclose(dot(Mbar, o.axes), o.arr)


@pytest.mark.xfail(reason="This is overly simplistic")
def test_error_angles():
    """
    Test simplistic formulation of error angle
    measurement
    """
    o = random_pca()
    err = o.angular_errors(method=variance_axes)

    mat = N.sqrt(o.covariance_matrix)

    def __vec_angle(i):
        vec = vector(mat[2, 2], mat[i, i])
        vec1 = vector(0, 1)
        return angle(vec, vec1)

    angles = [__vec_angle(i) for i in range(2)]
    assert N.allclose(err, angles)

    # Second method
    vert = vector(0, 0, 1)
    cov = N.diagonal(mat)
    vec = cov[2] / cov * N.eye(3)
    vec[:, 2] = 1
    angles = [angle(vert, vec[i]) for i in range(2)]
    assert N.allclose(err, angles)


@pytest.mark.xfail(reason="Not fully implemented")
def test_solid_angle():
    """
    Test that integration to a range of girdle
    half-widths returns the appropriate solid angles.
    """
    pairs = [(N.pi / 2, 4 * N.pi)]
    for angle, solid_angle in pairs:

        def func(theta):
            return angle

        i = quad(func, 0, N.pi / 2)[0]
        # cover for all slices of hyperbola
        assert N.allclose(8 * i, solid_angle)


def test_recovery_from_axes():
    """
    Tests the recovery of a Principal Component
    dataset from a set of precomputed axes.
    """
    for i in range(10):
        pca = random_pca()
        axes = pca.axes * pca.singular_values

        lengths = N.linalg.norm(axes, axis=0)
        assert N.allclose(lengths, pca.singular_values)

        assert N.allclose(pca.arr, dot(pca.U, pca.sigma, pca.V))
        a2 = dot(pca.arr, pca.V.T)
        assert N.allclose(a2, dot(pca.U, pca.sigma))

        sinv = N.diag(1 / pca.singular_values)
        assert N.allclose(N.identity(3), dot(pca.sigma, sinv))

        an = dot(pca.sigma, pca.V)

        inv = N.linalg.inv(an)
        a3 = dot(pca.arr, pca.V.T, sinv)
        try:
            assert N.allclose(a3, pca.U)
        except AssertionError as err:
            # For exceedingly small PCA axes,
            # recovered values of U are sometimes
            # quite different, but this is insignificant
            # in absolute terms.
            assert N.allclose(a3[:, :2], pca.U[:, :2])
            sv = pca.singular_values[2]
            assert N.allclose(a3[:, 2] * sv, pca.U[:, 2] * sv, atol=1e-10)


def test_variance_equivalence():
    """
    Simple mathematical test that eigenvector magnitudes
    are equivalent to variance (with $n-1$ degrees of freedom).
    """
    pca = random_pca()
    v = pca.rotated().var(axis=0, ddof=1)
    eig = pca.eigenvalues
    assert N.allclose(v, eig)


def test_data_matrix_multiplication():
    """
    Mathematical test of relationship between eigenvalues and
    the cross-product data matrix
    """
    pca = random_pca()
    M_bar = pca.rotated()  # Rotated data matrix
    n = len(M_bar)
    MTM = dot(M_bar.transpose(), M_bar) / (n - 1)
    assert N.allclose(MTM, N.diag(pca.eigenvalues))


def test_hyperbola_axes():
    """
    Test that the hyperbolic axes are the same as the
    squared covariance matrices
    """
    for i in range(10):
        pca = random_pca()
        hyp = pca.as_hyperbola(rotated=False)

        v1 = 1 / N.diagonal(pca.covariance_matrix)
        v1[-1] *= -1

        v2 = N.diagonal(hyp)[:-1]

        assert N.allclose(v1, v2, atol=0.0001)


def test_pca_regression_variable():
    """
    The $\\hat\\beta$ regression variable is considered the canonical
    representation of the regressor for OLS. This is also defined for
    TLS/unweighted PCA regression.
    """
    fit = random_pca()
    X = fit.arr[:, :2]
    y = fit.arr[:, -1]
    # Eigenvectors of the cross-product matrix
    sigma = fit.singular_values**2
    # B_hat from the formal definition
    B_hat = N.linalg.inv(X.T @ X - N.eye(2) * sigma[2]) @ X.T @ y
    # B_hat from SVD
    beta = -fit.axes[-1, :-1] / fit.axes[-1, -1]

    assert N.allclose(B_hat, beta)


def test_pca_recovery():
    for i in range(10):
        pca = random_pca()
        ax = pca.principal_axes

        # Test that PCA is same as if computed
        # by matrix multiplication
        v = dot(pca.axes, N.diag(pca.singular_values))
        assert N.allclose(ax, v)

        sv = N.linalg.norm(ax, axis=0)
        assert N.allclose(pca.singular_values, sv)
        ax /= sv
        assert N.allclose(ax, pca.axes)


def test_builtin_recovery():
    """
    Test recovery functions that are built into
    basic API
    """
    for i in range(10):
        pca = random_pca()
        pca2 = PCAOrientation(pca.arr, axes=pca.principal_axes)

        assert N.allclose(pca.V, pca2.V)
        assert N.allclose(pca.U, pca2.U)


def __do_component_planes(fit, component):
    ax = fit.axes
    rotated_axes = dot(component.axes, ax.T)


def test_component_planes():
    components = [centered(a) for a in load_test_plane("grouped-plane")]
    arr = N.vstack(components)
    assert arr.shape[1] == 3

    components = [PCAOrientation(c) for c in components]
    main_fit = PCAOrientation(arr)

    for c in components:
        __do_component_planes(main_fit, c)


def test_grouped_plane():
    plane = load_test_plane("grouped-plane")
    components = [centered(a) for a in plane]
    arr = N.vstack(components)
    fit = PCAOrientation(arr)

    deskewed_data = fit.rotated()

    sv = fit.singular_values
    # naive covariance for each axis, taking into account number of samples
    sample_covariance = sv**2 / (len(arr) - 1)
    assert N.allclose(sample_covariance, N.diagonal(fit._covariance_matrix("sampling")))

    # taking into account measurement noise
    noise_covariance = 4 * sv * N.var(deskewed_data, axis=0)
    assert N.allclose(noise_covariance, N.diagonal(fit._covariance_matrix("noise")))


def test_singular_values():
    """
    Singular values should represent the standard deviations along major axes of the
    dataset, scaled by the size of the dataset. E.g. they represent the sqrt(sum of deviations)
    along that axis of the dataset.

    See https://docs.scipy.org/doc/numpy/reference/generated/numpy.std.html for more information
    """
    o = random_pca()

    # Use average squared deviaion (max. likelihood estimator of variance of
    # normally distributed variables), uncorrected sample variance
    stdev = o.rotated().std(axis=0)
    assert N.allclose(o.singular_values / N.sqrt(o.n), stdev)

    # Using n-1 as the scaling factor results
    # in an unbiased estimator of variance
    # in an infinite population.
    stdev = o.rotated().std(axis=0, ddof=1)
    assert N.allclose(o.singular_values / N.sqrt(o.n - 1), stdev)


def test_normal_errors():
    """
    Test the reconstruction of normal vector errors from PCA
    and conversion back to hyperbolic errors
    """
    o = random_pca()

    hyp_axes = sampling_axes(o)
    v = to_normal_errors(hyp_axes)
    axes_reconstructed = from_normal_errors(v)

    assert N.allclose(hyp_axes, axes_reconstructed)
