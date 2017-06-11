import numpy as N
from .stereonet import UncertainPlane
from ..orientation.pca import random_pca
from ..geom.util import angle

def test_rake_angle():
    """
    Test that we can reconstruct rake angle
    """
    fit = random_pca()
    ang = fit._rake()
    ang2 = angle(fit.axes[0], fit.dip_dr)
    assert N.allclose(ang, ang2)

def test_uncertain_plane():
    """
    Test the reconstruction of a fitted plane from orientation
    of the plane expressed in spherical coordinates
    """
    fit = random_pca()
    sdr = fit.strike_dip_rake()
    ang = fit.angular_errors()

    reconstructed = UncertainPlane(*sdr, *ang)

    # Test that the nominal recovered orientation is the same
    assert N.allclose(fit.normal, reconstructed.normal)

    fax = fit.axes
    if fax[-1,-1] < 0:
        fax *= -1
    # Tolerance should be zero
    assert N.allclose(fax, reconstructed.axes, atol=0.5)

    assert N.allclose(fit.covariance_matrix, reconstructed.covariance_matrix)

