# -*- coding: utf-8 -*-
from __future__ import division
import numpy as N
from scipy.sparse import bsr_matrix
from scipy.sparse.linalg import svds
from seaborn.algorithms import bootstrap
from ..coordinates import centered
from .base import BaseOrientation, rotation
from ..error.ellipse import ellipse

def dot(*matrices):
    return reduce(N.dot, matrices)

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

        #r = N.sqrt(N.sum(N.diagonal(pca.covariance_matrix)))
        # Actually, the sum of squared errors
        # maybe should change this
        _ = self.rotated()
        sse = N.sum(_[:,2]**2)
        self.correlation_coefficient = N.sqrt(sse/len(_))

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
        Constructs the covariance matrix of residuals
        from the PCA residuals, and rotate it into
        the Cartesian coordinate plane.
        """
        cov = self.sigma**2/(self.n-1)

        # Standardize covariance matrix
        # (not sure why we do this yet)
        #cov /= N.diagonal(cov).sum()
        #cov[0,0] = 0
        #cov[1,1] = 0

        return cov #reduce(N.dot,[self.axes,cov,self.axes.T])

    def error_ellipsoid(self):
        pass

    def dip_normal_transform(self):
        normal = self.axes[2]
        vertical = N.array([0,0,1])
        strike = normalize(N.cross(vertical,normal))
        dip_dr = normalize(N.cross(strike,normal))

        rm = N.vstack((dip_dr,strike,normal))
        ir = N.linalg.inv(rm)

        return compose_affine(self.axes,ir)

    @property
    def rotated_covariance(self):
        """
        Rotate covariance matrix of residuals into
        coordinate system defined in terms of strike
        and dip-normal components
        """
        # Third principal component is normal to
        # the fitted plane
        total_rotation = self.dip_normal_transform()
        return rotate_tensor(self.covariance_matrix,total_rotation)

    def errors(self):
        normal = self.axes[2]
        vertical = N.array([0,0,1])
        strike = normalize(N.cross(vertical,normal))
        dip_dr = normalize(N.cross(strike,normal))

        _ = N.linalg.norm
        dip_vector = dot(
                self.dip_normal_transform(),
                self.sigma)[0]
        C = self.rotated_covariance

        std_errors = N.sqrt(N.diagonal(C))

        # For now we ignore errors in dip vector (acting
        # like we have a viewpoint of infinity
        nrm = _(dip_vector)
        strike = N.arctan2(std_errors[1],nrm)
        dip = N.arctan2(std_errors[2],nrm)

        return tuple(N.degrees(i) for i in (strike,dip))

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

    #def _ellipse(self,level, n=1000):
        #"""Returns error ellipse in slope-azimuth space"""
        ## singular value decomposition
        #U, s, rotation_matrix = N.linalg.svd(self.rotated_covariance)
        ## semi-axes (largest first)

        #saxes = N.sqrt(s)*level ## If the _area_ of a 2s ellipse is twice that of a 1s ellipse
        ## If the _axes_ are supposed to be twice as long, then it should be N.sqrt(s)*width
        #center = self.coefficients

        #u = N.linspace(0, 2*N.pi, n)
        #data = N.column_stack((saxes[0]*N.cos(u), saxes[1]*N.sin(u),N.zeros(n)))
        ## rotate data
        #return N.dot(data, rotation_matrix)+center

        ##u = N.linspace(0, 2*N.pi, n)
        ##xy_ellipse = N.column_stack((N.cos(u),N.sin(u),N.zeros(n)))
        ##transform = N.dot(xy_ellipse,self.axes)

        ##data = N.dot(transform, N.dot(N.diag(s),rotation_matrix))
        ### Project down to two dimensions
        ### data is in cartesian coordinates in x,y,z
        ### simply throw out first principal component
        ### for approximation
        ##data = data[:,:2]
        ##center = self.coefficients[:2]
        ##return data + center

    def strike_dip(self):
        """ Computes strike and dip from a normal vector.
            Results are usually exactly the same as LLSQ
            in strike (to a few decimal places) and close in dip.
            Sometimes, dips are greater by as much as 45 degrees,
            reflecting inclusion of errors in x-y plane.
        """
        strike = N.degrees(self.azimuth-N.pi/2)
        dip = N.degrees(self.slope)

        # Since PCA errors are not pinned to the XYZ plane,
        # we need to make sure our results are in the
        # right quadrant.
        if dip > 90:
            dip = 180 - dip
            strike += 180

        return strike, dip


    def error_ellipse(self, spherical=True, vector=False, level=1):
        e = self._ellipse(level)
        if spherical:
            slope = N.arctan(-e[:,0])
            azimuth = self.azimuth + N.arctan2(-e[:,1],-e[:,0])
            if vector:
                azimuth = azimuth
            return (azimuth,slope)
        return (e[:,1],e[:,0])

    def bootstrap(self):
        reg_func = lambda arr: N.linalg.svd(arr,full_matrices=False)[2][2]
        beta_boots = bootstrap(self.arr, func=reg_func)
        
        return yhat, yhat_boots
