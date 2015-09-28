# -*- coding: utf-8 -*-
from __future__ import division
import numpy as N
from scipy.sparse import bsr_matrix
from scipy.linalg import lu
from scipy.sparse.linalg import svds
from itertools import chain
from seaborn.algorithms import bootstrap
from ..coordinates import centered
from .base import BaseOrientation, rotation
from ..error.ellipse import ellipse

from ..geom.util import dot
from ..geom.conics import conic

def augment(matrix):
    size = matrix.shape
    _ = N.identity(size[0]+1)
    _[:size[0],:size[1]] = matrix
    return _

def augment_vector(vec):
    return N.append(vec,[1],axis=0)

def rotate_tensor(tensor,transform):
    """
    Transforms a tensor by an affine transform
    """
    return dot(transform, tensor, transform.T)

def compose_affine(*transforms):
    """
    Returns a composite of several affine transformations.
    """
    return reduce(N.dot,reversed(transforms))

def normalize(v):
    return v/N.linalg.norm(v)

def vector_angle(v1,v2):
    _ = N.dot(normalize(v1),normalize(v2).T)
    return N.arccos(_)

## magnitude of vector (by row)
norm = lambda x: N.linalg.norm(x,2,1)

def axis_transform(pca_axes):
    """
    Creates an affine transformation matrix to
    rotate data in PCA axes into Cartesian plane
    """
    from_ = N.identity(3)
    to_ = pca_axes

    # Find inverse transform for forward transform
    # y = M x -> M = y (x)^(-1)
    # We don't need to do least-squares since
    # there is a simple transformation
    trans_matrix = N.linalg.lstsq(from_,to_)[0]
    return trans_matrix


def test_SVD(pca):
    """
    Function to test the validity of singular
    value decomposition by reconstructing original
    data.
    """
    _ = pca
    rec = N.dot(_.U,N.dot(_.sigma,_.V))
    assert N.allclose(_.arr,rec)

def covariance_matrix(self):
    """
    Constructs the covariance matrix of
    input data from
    the singular value decomposition. Note
    that this is different than a covariance
    matrix of residuals, which is what we want
    for calculating fit errors.

    Using SVD output to compute covariance matrix
    X=UΣV⊤
    XX⊤XX⊤=(UΣV⊤)(UΣV⊤)⊤=(UΣV⊤)(VΣU⊤)
    V is an orthogonal matrix (V⊤V=I),
    covariance matrix of input data: XX⊤=UΣ2U⊤

     Because the axes represent identity in the
     PCA coordinate system, the PCA major axes
     themselves represent an affine transformation
     matrix from PCA to Cartesian space
    """

    a = N.dot(self.U,self.sigma)
    cv = N.dot(a,a.T)
    # This yields the covariance matrix in Cartesian
    # coordinates
    return cv

class PCAOrientation(BaseOrientation):
    """ Gets the axis-aligned principle components
        of the dataset.
    """
    def __init__(self, arr):
        """ Requires an object implementing the
            Attitude interface
        """
        # For principal components, data needs
        # to be pre-processed to have zero mean
        self.arr = centered(arr)

        # Note: it might be desirable to further
        # standardize the data by dividing by
        # the standard deviation as such
        # self.arr /= self.arr.std(axis=0)
        # but this is not clear. Not dividing by
        # std leaves us with an eigen-analysis of
        # the *covariance matrix*, while dividing
        # by it leaves us with an eigen-analysis
        # of the *correlation matrix*

        self.n = len(self.arr)

        #ratio = self.n/1e4
        #if ratio > 2:
        #    r = N.floor(ratio)
        #    self.n /= r
        #    self.arr = self.arr[::r,:]
        res = N.linalg.svd(self.arr,
            full_matrices=False)

        self.U, s, V = res
        self.singular_values = s
        self.axes = V

        self.sigma = N.diag(self.singular_values)
        self.V = V

        self.normal = N.cross(self.axes[0], self.axes[1])

        self._vertical = N.array([0,0,1])
        self.strike = N.cross(self.normal,self._vertical)
        self.dip_dr = normalize(N.cross(self.strike,self.normal))

    def whitened(self):
        """
        Returns a 'whitened' or decorrelated version of
        the input data, where variances along all axes
        are rescaled to 1 (i.e. the covariance matrix
        becomes an identity matrix).
        """
        return N.dot(self.U,self.V.T)

    def rotated(self):
        """
        Returns a dataset 'despun' so that
        it is aligned with the princpal
        axes of the dataset.
        """
        return N.dot(self.U,self.sigma)

    def residuals(self):
        """
        Returns residuals of fit against all
        three data axes (singular values 1, 2,
        and 3). This takes the form of data along
        singular axis 3 (axes 1 and 2 define the plane)
        """
        _ = self.rotated()
        _[:,-1] = 0
        _ = N.dot(_,self.axes)
        return self.arr - _

    @property
    def covariance_matrix(self):
        """
        Constructs the covariance matrix from PCA
        residuals
        """
        return self.sigma**2/(self.n-1)

    @property
    def explained_variance(self):
        """
        Proportion of variance that is explained by the
        first two principal components (which together
        represent the planar fit). Analogous to R^2 of
        linear least squares.
        """
        v = N.diagonal(self.covariance_matrix)
        return v[0:2].sum()/v.sum()

    @property
    def coefficients(self):
        return self.axes[2]

    @property
    def azimuth(self):
        c = self.coefficients
        return N.arctan2(c[0],c[1])

    @property
    def slope(self):
        _ = self.coefficients
        mag = N.linalg.norm(_)
        return N.arccos(_[2]/mag)

    def strike_dip(self):
        """ Computes strike and dip from a normal vector.
            Results are usually exactly the same as LLSQ
            in strike (to a few decimal places) and close in dip.
            Sometimes, dips are greater by as much as 45 degrees,
            reflecting inclusion of errors in x-y plane.
        """
        n = self.axes[2]
        r = N.linalg.norm(n)
        strike = N.degrees(N.arctan2(n[0],n[1]))-90
        dip = N.degrees(N.arccos(n[2]/r))

        # Since PCA errors are not pinned to the XYZ plane,
        # we need to make sure our results are in the
        # right quadrant.
        if dip > 90:
            dip = 180 - dip
            strike += 180

        return strike, dip

    def _ellipse(self, level=1):

        cov = self.covariance_matrix
        idx = N.diag_indices(3)
        ell = N.identity(4)
        ell[idx] = 1/(level*N.diagonal(cov))**2
        ell[3,3] = -1
        ell = conic(ell)

        # Translate ellipse along 3rd major axis
        T = N.identity(4)
        T[0:3,3] = self.sigma[2]
        ell = ell.transform(T)

        # Rotate ellipse matrix into cartesian
        # plane
        R = augment(self.axes)
        ell = ell.transform(R)

        con, matrix, center = ell.projection()
        ax = con.major_axes()

        # Rotate major axes into 3d space
        axs = N.append(ax,N.zeros((2,1)),axis=1)
        axs = dot(axs,matrix[:3].T)
        u = N.linspace(0,2*N.pi,1000)

        # Get a bundle of vectors defining cone
        # which circumscribes ellipsoid
        angles = N.array([N.cos(u),N.sin(u)]).T
        # Turn into vectors
        data = dot(angles,axs)+center

        r = N.linalg.norm(data,axis=1)
        theta = N.arccos(data[:,2]/r)
        phi = N.arctan2(data[:,1],data[:,0])

        return N.column_stack((theta,phi))

    def error_ellipse(self, spherical=True, vector=False, level=1):
        e = self._ellipse(level)
        #if spherical:
        #    return e + N.array([self.azimuth+N.pi/2,0])
        return (e[:,1],e[:,0])

    def bootstrap(self):
        reg_func = lambda arr: N.linalg.svd(arr,full_matrices=False)[2][2]
        beta_boots = bootstrap(self.arr, func=reg_func)
        return yhat, yhat_boots
