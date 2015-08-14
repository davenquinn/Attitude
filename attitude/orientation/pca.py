# -*- coding: utf-8 -*-
from __future__ import division
import numpy as N
from scipy.sparse import bsr_matrix
from scipy.sparse.linalg import svds
from ..coordinates import centered
from .base import BaseOrientation

## magnitude of vector (by row)
norm = lambda x: N.linalg.norm(x,2,1)

class PlanarModel(object):
    def __init__(self):
        self.model = N.array([
            [1,0,0], # line
            [1,1,0], # plane
            [1,1,1]  # sphere
        ]).astype(float)
        # Normalize to unit vectors
        self.model /= norm(self.model)
        self.inverted = N.linalg.inv(self.model)

    def transform(self, sv):
        sv = N.array(sv)
        if sv.ndim == 1:
            sv = N.expand_dims(sv,0)
        sv /= norm(sv)
        return N.dot(sv,self.inverted)

    def planarity(self,sv):
        res = self.transform(sv)
        # get rid of extra dimsr
        plan = res[:,1]**2-res[:,2]
        plan[plan==N.nan] = 0
        return N.squeeze(plan)

    def __call__(self, sv):
        return self.planarity(sv)

planar_model = PlanarModel()

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

        #r = N.sqrt(N.sum(N.diagonal(pca.covariance_matrix)))
        # Actually, the sum of squared errors
        # maybe should change this
        _ = self.rotated()
        sse = N.sum(_[:,2]**2)
        self.correlation_coefficient = N.sqrt(sse/len(_))

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
        Constructs the covariance matrix of residuals
        from the PCA residuals, and rotate it into
        the Cartesian coordinate plane.

        Estimator covariance:
        Cov(B) = Var(X) (X.T X)^-1

         Instead of calculating the estimator
         covariance directly as below
         xTx = N.dot(self.arr.T,self.arr)
         xTx_inv = N.linalg.inv(xTx)
         we can use SVD inverse identitites
         to show that
         (X^T X)^(-1) = U S^-2 U^T
         This is much easier to calculate

        """
        #rTr = matrix_squared(self.residuals())
        e = self.residuals()
        #sse = N.dot(e,e)/self.df_e #SSE
        #s = N.linalg.inv(self.sigma)
        #s2 = N.dot(s,s)
        #a = N.dot(s,self.U.T)
        #xTx_inv = N.dot(self.U,N.dot(s,a))

        xTx = N.dot(self.arr.T,self.arr)
        xTx_inv = N.linalg.inv(xTx)

        # sample covariance matrix
        #cov = N.dot(e.T,e)
        # alternatively we could use a data covariance
        # matrix to get the errors on the fit itself
        # N.cov(e)
        #return N.dot(cov,xTx_inv)

        cov = N.dot(e.T,e)
        return N.dot(cov,xTx_inv)

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
        nv = self.axes[2]
        strike = N.degrees(self.azimuth-N.pi/2)
        dip = N.degrees(self.slope)

        # Since PCA errors are not pinned to the XYZ plane,
        # we need to make sure our results are in the
        # right quadrant.
        if dip > 90:
            dip = 180 - dip
            strike += 180

        return strike, dip

