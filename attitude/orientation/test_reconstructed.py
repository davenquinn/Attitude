import numpy as N
from .reconstructed import ReconstructedPlane
from .pca import random_pca
from ..geom.util import angle

def test_rake_angle():
    """
    Test that we can reconstruct rake angle
    """
    fit = random_pca()
    ang = fit._rake()
    ang2 = angle(fit.axes[0], fit.dip_dr)
    assert N.allclose(ang, ang2)

def test_reconstructed_plane():
    """
    Test the reconstruction of a fitted plane from orientation
    of the plane expressed in spherical coordinates
    """
    fit = random_pca()
    sdr = fit.strike_dip_rake()
    ang = fit.angular_errors()

    reconstructed = ReconstructedPlane(*sdr, *ang)

    # Test that the nominal recovered orientation is the same
    assert N.allclose(fit.normal, reconstructed.normal)

    fax = fit.axes
    rax = reconstructed.axes
    if fax[-1,-1] < 0:
       fax *= -1
    # Tolerance should be zero
    assert N.allclose(fax, rax, atol=0.02)

    cov = N.diag(fit.covariance_matrix / fit.covariance_matrix[-1,-1])
    rcov = N.diag(reconstructed.covariance_matrix)
    assert N.allclose(cov, rcov)

