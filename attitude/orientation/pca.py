# -*- coding: utf-8 -*-
from __future__ import division
import numpy as N
from scipy.sparse import bsr_matrix
from scipy.sparse.linalg import svds
from itertools import chain
from seaborn.algorithms import bootstrap
from ..coordinates import centered
from .base import BaseOrientation, rotation
from ..error.ellipse import ellipse

def augment(matrix):
    size = matrix.shape
    _ = N.identity(size[0]+1)
    _[:size[0],:size[1]] = matrix
    return _

def dot(*matrices):
    return reduce(N.dot, matrices)

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

        self.normal = self.axes[2]*self.singular_values[2]
        self._vertical = N.array([0,0,1])
        self.strike = normalize(N.cross(self._vertical,self.normal))
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

    def unscented_transform(self):
        """
        Unscented transform of covariance matrix
        of normal vector
        """
        normal = self.sigma[2]
        # Normal vector (stays the same
        # in rotated coordinate system)

        cov = self.covariance_matrix

        vertical = N.array([0,0,1])
        north = N.array([0,1,0])

        def dip_dr(normal):
            # Rotate vector into cartesian frame
            n = N.dot(normal,self.axes.T)

            strike = -N.arctan2(-n[1],-n[0])
            mag = N.linalg.norm(n)
            dp = N.arccos(n[2]/mag)
            dp_dr = strike + N.pi/2

            return N.array([dp_dr,dp])

        # Create symmetric set of sigma points
        m = (2*cov)**(0.5)
        pts = N.vstack((m.T + normal, m.T - normal))/6

        # Sigma points in dip-dir/dip frame
        sph_points = N.apply_along_axis(dip_dr,1,pts)

        est_mean = N.mean(sph_points, axis=0)
        arrs = N.dstack(tuple(N.outer(i,i)
            for i in sph_points-est_mean))
        cov_r = arrs.mean(axis=2)/cov.sum()
        return est_mean, cov_r

    def errors(self):
        #_ = self.standard_errors()[1:]
        mean, cov = self.unscented_transform()
        #C = self.covariance_matrix
        #C /= C.sum()
        #cov = rotate_tensor(C,self.axes)[1:,1:]

        return tuple(N.degrees(i) for i in N.diagonal(cov))

    #def errors(self):
        #normal = self.axes[2]
        #vertical = N.array([0,0,1])
        #strike = normalize(N.cross(vertical,normal))
        #dip_dr = normalize(N.cross(strike,normal))

        #_ = N.linalg.norm
        #dip_vector = dot(
                #self.dip_normal_transform(),
                #self.sigma)[0]
        #C = self.rotated_covariance

        #std_errors = N.sqrt(N.diagonal(C))

        ## For now we ignore errors in dip vector (acting
        ## like we have a viewpoint of infinity
        #nrm = _(dip_vector)
        #strike = N.arctan2(std_errors[1],nrm)
        #dip = N.arctan2(std_errors[2],nrm)

        #return tuple(N.degrees(i) for i in (strike,dip))

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
        north = N.array([0,1,0])
        _ = vector_angle(self.strike,north)
        strike = N.degrees(_)

        _ = vector_angle(self.normal,self._vertical)
        dip = N.degrees(_)

        # Since PCA errors are not pinned to the XYZ plane,
        # we need to make sure our results are in the
        # right quadrant.
        if dip > 90:
            dip = 180 - dip
            strike += 180

        return strike, dip

    def _ellipse(self, level=1):
        import sympy as S

        x0,x1,x2,p0,p1,p2 = S.symbols('x_0,x_1,x_2,p_0,p_1,p_2')
        X = S.Matrix(4,1,[x0,x1,x2,1])

        cov = self.covariance_matrix
        idx = N.diag_indices(3)
        ell = N.identity(4)
        ell[idx] = 1/(level*N.diagonal(cov))**2
        ell[3,3] = -1

        normal = N.cross(self.sigma[0],self.sigma[1])

        # Translate ellipse along 3rd major axis
        T = N.identity(4)
        T[0:3,3] = normal
        ell = dot(T.T,ell,T)

        # Rotate ellipse matrix into cartesian
        # plane
        R = augment(self.axes)
        ell = dot(R.T,ell,R)

        origin = N.array([0,0,0]).T

        # matrix defining conic
        A = S.Matrix(4,4,ell.flatten())

        # Check that we have an ellipse
        assert N.linalg.det(ell[:3,:3]) > 0

        # equation of conic
        conic = X.T*A*X

        # equation of plane polar to origin (containing all points of tangency to origin)
        _ = augment_vector(origin)
        pole = S.Matrix(4,1,_)
        polar = pole.T*A*X

        sol0 = []
        sol1 = []
        for u in N.linspace(0,N.pi,50):
            # equation of plane through origin at angle
            ang = N.array([N.cos(u),N.sin(u),0])
            n = augment_vector(N.cross(ang,normal))
            n = S.Matrix(4,1,n)
            blade = n.T*(X-pole)

            # Form system of equations
            eqns = [S.Eq(i,S.zeros(1)) for i in (conic,polar,blade)]

            # Solve
            sol = S.solve(eqns)

            def spherical(solution):
                d = N.array([complex(solution[i]) for i in (x0,x1,x2)])
                r = N.linalg.norm(d)
                theta = N.arctan(d[0]/d[1])
                phi = N.arcsin(d[2]/r)
                return N.array([theta.real,phi.real])

            sol0.append(spherical(sol[0]))
            sol1.append(spherical(sol[1]))

        sol = N.vstack(chain(sol0,sol1))
        return sol

    def error_ellipse(self, spherical=True, vector=False, level=1):
        e = self._ellipse(level)
        #if spherical:
        if spherical:
            return e + N.array([self.azimuth+N.pi/2,0])
        return (e[:,1],e[:,0])

    def bootstrap(self):
        reg_func = lambda arr: N.linalg.svd(arr,full_matrices=False)[2][2]
        beta_boots = bootstrap(self.arr, func=reg_func)
        return yhat, yhat_boots
