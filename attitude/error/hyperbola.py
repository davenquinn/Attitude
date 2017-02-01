import numpy as N

from ..geom.util import dot, augment_tensor
from ..geom.util import vector, plane, angle
from ..geom.conics import Conic, conic

def apparent_dip_correction(axes):
    """
    Produces a rotation matrix that
    rotates a dataset to correct for apparent dip
    """
    a1 = axes[0].copy()
    a1[-1] = 0
    cosa = angle(axes[0],a1,cos=True)
    _ = 1-cosa**2
    if _ > 1e-12:
        sina = N.sqrt(_)
        # Construct rotation matrix
        R= N.array([[cosa,sina],[-sina,cosa]])
    else:
        # Small angle, don't bother
        # (small angles can lead to spurious results)
        R = N.identity(2)
    return R

def hyperbolic_errors(hyp_axes, xvals,
                      transformation=None, axes=None, means=None):
    """
    Returns a function that can be used to create a view of the
    hyperbolic error ellipse from a specific direction.

    This creates a hyperbolic quadric and slices it to form a conic
    on a 2d cartesian plane aligned with the requested direction.

    A function is returned that takes x values (distance along nominal
    line) and returns y values (width of error hyperbola)

    kwargs:
        transformation  rotation to apply to quadric prior to slicing
                        (e.g. transformation into 'world' coordinates
        axes            axes on which to slice the data
    """
    if means is None:
        means = N.array([0,0])

    arr = augment_tensor(N.diag(hyp_axes))

    if transformation is None:
        transformation = N.identity(3)
    if axes is None:
        axes = N.array([[0,1,0],[0,0,1]])

    # Transform ellipsoid to dual hyperboloid
    hyp = conic(arr).dual()
    hyp = hyp.transform(augment_tensor(transformation))

    n_ = N.cross(axes[0],axes[1])

    # Create a plane containing the two axes specified
    # in the function call
    p = plane(n_) # no offset (goes through origin)
    h1 = hyp.slice(p, axes=axes)[0]

    # Major axes of the conic sliced in the requested viewing
    # geometry
    A = N.sqrt(h1.semiaxes())

    yvals = A[1]*N.cosh(N.arcsinh(xvals/A[0]))

    vals = N.array([xvals,yvals]).transpose()
    nom = N.array([xvals,N.zeros(xvals.shape)]).transpose()

    # Rotate the whole result if the PCA axes aren't aligned to the
    # major axes of the view coordinate system
    ax1 = apparent_dip_correction(axes)
    # Top
    t = dot(vals,ax1).T+means[:,N.newaxis]
    # Btm
    vals[:,-1] *= -1
    b = dot(vals,ax1).T+means[:,N.newaxis]
    return nom, b, t
