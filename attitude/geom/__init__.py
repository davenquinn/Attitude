import numpy as N
from .util import dot
from .conics import conic
from .util import angle, vector

def aligned_covariance(fit, type='noise'):
    """
    Covariance rescaled so that eigenvectors sum to 1
    and rotated into data coordinates from PCA space
    """
    cov = fit._covariance_matrix(type)
    # Rescale eigenvectors to sum to 1
    cov /= N.linalg.norm(cov)
    return dot(fit.axes,cov)

def fit_angle(fit1, fit2, degrees=True):
    """
    Finds the angle between the nominal vectors
    """
    return N.degrees(angle(fit1.normal,fit2.normal))

def fit_similarity(fit1, fit2):
    """
    Distance apart for vectors, given in
    standard deviations
    """
    cov1 = aligned_covariance(fit1)
    cov2 = aligned_covariance(fit2)
    if fit2.axes[2,2] < 0:
        cov2 *= -1
    v0 = fit1.normal-fit2.normal
    cov0 = cov1+cov2 # Axes are aligned, so no covariances

    # Find distance of point from center

    # Decompose covariance matrix
    U,s,V = N.linalg.svd(cov0)
    rotated = dot(V,v0) # rotate vector into PCA space
    val = rotated**2/N.sqrt(s)
    return N.sqrt(val.sum())

def axis_aligned_transforms():
    """
    Get transformations to map three-dimensional data down
    to slices on the xy, xz and yz planes, respectively.
    """
    I = N.eye(3)
    xy = I[:2]
    xz = N.vstack((I[0],I[2]))
    yz = I[1:]
    return xy,xz,yz

def rotate_2D(angle):
    return N.array([[N.cos(angle),-N.sin(angle)],
                    [N.sin(angle),N.cos(angle)]])
