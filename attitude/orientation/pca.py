# -*- coding: utf-8 -*-
from __future__ import division
import numpy as N
from scipy.sparse import bsr_matrix
from scipy.linalg import lu
from scipy.sparse.linalg import svds
from scipy.integrate import quad
from itertools import chain
from ..coordinates import centered
from .base import BaseOrientation, rotation
from ..error.ellipse import ellipse

from ..geom.util import dot
from ..geom.vector import vector
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

def ellipse(axes, n=1000):
    """
    Get a parameterized set of vectors defining
    ellipse for a major and minor axis length.
    Resulting vector bundle has major axes
    along axes given.
    """
    u = N.linspace(0,2*N.pi,n)
    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    angles = N.array([N.cos(u),N.sin(u)]).T
    return dot(angles,axes)

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
    @classmethod
    def from_axes(axes):
        """
        Recovers a principal component dataset from
        a set of axes (singular values*principal axes)
        of the dataset.
        """
        pass

    def __init__(self, arr, axes=None):
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

        ## Get from axes if these are defined
        # In this case, axes must be equivalent
        # to self.axes*self.singular_values
        if axes is not None:
            s = N.linalg.norm(axes,axis=0)
            V = axes/s
        else:
            # Get singular values
            res = N.linalg.svd(self.arr,
                full_matrices=False)

            self.U, s, V = res

        self.singular_values = s
        self.axes = V

        self.sigma = N.diag(self.singular_values)
        self.V = V

        # Similar to normal vector, but not rotated into
        # Cartesian frame
        self.offset = N.cross(self.sigma[0],self.sigma[1])

        self.normal = self.axes[2]

        self._vertical = N.array([0,0,1])
        self.strike = N.cross(self.normal,self._vertical)
        self.dip_dr = normalize(N.cross(self.strike,self.normal))

        # Hyperbolic form of PCA
        self.hyp = self.as_hyperbola(rotated=False)
        d = N.abs(N.diagonal(self.hyp)[:-1])
        self.hyp_axes = N.sqrt(1/d)

    def solid_angle(self):
        """
        Numerical integration method to find the
        solid angle (in steradians) within the limits
        of an error hyperbola for the given planar fit.
        """
        d = N.diag(N.sqrt(self.covariance_matrix))[:2]
        def func(theta):
            th = N.array([N.cos(theta),N.sin(theta)])
            r = N.linalg.norm(dot(d,th))
            return self.__angular_error(r)
        i = quad(func, 0, N.pi/2)[0]
        # cover for all slices of hyperbola
        return 8*i

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

    def __angular_error(self, axis_length):
        """
        The angular error for an in-plane axis of
        given length (either a PCA major axis or
        an intermediate direction).
        """
        return N.arctan2(self.hyp_axes[-1],axis_length)

    def angular_errors(self):
        """
        Minimum and maximum angular errors
        corresponding to 1st and 2nd axes
        of PCA distribution.
        """
        return tuple(self.__angular_error(i)
                for i in self.hyp_axes[:-1])
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

    def as_conic(self, level=1):

        if dot(self.axes[2],vector(0,0,1)) < 0:
            self.axes *= -1

        cov = self.covariance_matrix
        idx = N.diag_indices(3)
        ell = N.identity(4)
        ell[idx] = 1/cov[idx]*level**2 #cov*level**2#
        ell[3,3] = -1
        ell = conic(ell)

        # Translate ellipse along 3rd major axis
        ell = ell.translate(self.offset)

        # Rotate ellipse matrix into cartesian
        # plane
        R = augment(self.axes)
        return ell.transform(R)

    def as_hyperbola(self, rotated=False):
        """
        Hyperbolic error area
        """
        idx = N.diag_indices(3)
        _ = 1/self.covariance_matrix[idx]
        d = list(_)
        d[-1] *= -1

        arr = N.identity(4)*-1
        arr[idx] = d
        hyp = conic(arr)
        if rotated:
            R = augment(self.axes)
            hyp = hyp.transform(R)
        return hyp

    def _ellipse(self, level=1):

        ell = self.as_conic(level=level)

        con, matrix, center = ell.projection()
        ax = con.major_axes()

        # Rotate major axes into 3d space
        axs_ = N.append(ax,N.zeros((2,1)),axis=1)
        axs = dot(axs_,matrix[:3])
        u = N.linspace(0,2*N.pi,1000)

        # Get a bundle of vectors defining cone
        # which circumscribes ellipsoid
        angles = N.array([N.cos(u),N.sin(u)]).T
        # Turn into vectors
        return dot(angles,axs),center

    def plane_errors(self, sheet='upper',**kwargs):
        level = kwargs.pop('level',1)

        from mplstereonet.stereonet_math import cart2sph
        d = N.sqrt(self.covariance_matrix)

        ell = ellipse(d[:2], **kwargs)
        res = d[2]*level

        # Switch hemispheres if PCA is upside-down
        if self.normal[2] < 0:
            res *= -1

        if sheet == 'upper':
            ell += res
        elif sheet == 'lower':
            ell -= res

        _ = dot(ell,self.axes).T
        lon,lat = cart2sph(-_[2],_[0],_[1])
        return N.array(list(zip(lon,lat)))

    def error_coords(self, **kwargs):

        # Support for multiple levels of errors
        # (not sure if this directly corresponds
        # to sigma).
        levels = kwargs.pop('levels',None)

        u = 'upper'
        l = 'lower'

        def _(half, level=1):
            lonlat = self.plane_errors(half,
                    level=level, **kwargs)
            return N.degrees(lonlat).tolist()

        def __(level):
            return dict(
                upper=_(u, level),
                lower=_(l, level))

        out = dict(nominal=_('nominal'))
        if levels is None:
            i = __(1)
        else:
            i = {l:__(l) for l in levels}
        out.update(i)
        return out

    @property
    def slope(self):
        _ = self.coefficients
        mag = N.linalg.norm(_)
        return N.arccos(_[2]/mag)

    def error_ellipse(self, spherical=True, vector=False, level=1):
        data,center = self._ellipse(level)
        data += center

        r = N.linalg.norm(data,axis=1)
        plunge = N.arcsin(data[:,2]/r)
        trend = N.arctan2(data[:,0],data[:,1])

        #m = N.linalg.norm(axs,axis=1)
        #c = N.linalg.norm(center)
        #a_dist = [N.degrees(N.arctan2(i,c)) for i in m]

        #if spherical:
        #    return e + N.array([self.azimuth+N.pi/2,0])
        return (trend,plunge)
