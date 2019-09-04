from __future__ import division
import numpy as N
from math import factorial
from scipy.special import gamma, hyp1f1
from scipy.linalg import expm
from itertools import product
from .geom.util import dot
from .stereonet import sph2cart
from .error.axes import sampling_covariance, sampling_axes

from mplstereonet.stereonet_math import _rotate, cart2sph, sph2cart

def confluent_hypergeometric_function(k1, k2, n=10):
    val = 0
    for i,j in product(range(n), range(n)):
        top = gamma(i+0.5)*gamma(j+0.5)*k1**i*k2**j
        btm = gamma(i+j+3/2.)*factorial(i)*factorial(j)
        val += top/btm
    return val

def bingham_pdf(fit):
    """
    From the *Encyclopedia of Paleomagnetism*

    From Onstott, 1980:
    Vector resultant: R is analogous to eigenvectors
    of T.
    Eigenvalues are analogous to |R|/N.
    """
    # Uses eigenvectors of the covariance matrix
    e = fit.hyperbolic_axes #singular_values
    #e = sampling_covariance(fit) # not sure
    e = e[2]**2/e

    kappa = (e-e[2])[:-1]
    kappa /= kappa[-1]
    F = N.sqrt(N.pi)*confluent_hypergeometric_function(*kappa)


    ax = fit.axes

    Z = 1/e
    M = ax
    F = 1/hyp1f1(*1/Z)

    def pdf(coords):
        lon,lat = coords

        I = lat
        D = lon# + N.pi/2
        #D,I = _rotate(N.degrees(D),N.degrees(I),90)

        # Bingham is given in spherical coordinates of inclination
        # and declination in radians

        # From USGS bingham statistics reference

        xhat = N.array(sph2cart(lon,lat)).T

        #return F*expm(dot(xhat.T, M, N.diag(Z), M.T, xhat))

        return 1/(F*N.exp(dot(xhat.T, M, N.diag(Z), M.T, xhat)))

    return pdf

def regular_grid(**kwargs):
    n = kwargs.pop('n', 100)
    gridsize = kwargs.pop('gridsize',None)
    if gridsize is None:
        gridsize = (n,n)

    bound = N.pi/2
    nrows, ncols = gridsize
    xmin, xmax, ymin, ymax = -bound, bound, -bound, bound
    lon, lat = N.mgrid[xmin : xmax : ncols * 1j, ymin : ymax : nrows * 1j]
    return lon,lat
