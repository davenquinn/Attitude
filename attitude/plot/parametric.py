from __future__ import division
"""
Functions to produce parametric representations of
conic sections in two dimensions. This can be applied
to plotting 2D slices of quadrics as well.

We could generalize this to n dimensions, but that is probably
not super useful at the moment.
"""
import numpy as N
from matplotlib import pyplot as P

defaults = dict(
    center=N.zeros(2),
    n=500)

def hyperbola(axes, **kwargs):
    """
    Plots a hyperbola that opens along y axis
    """
    center = kwargs.pop('center', defaults['center'])
    th = N.linspace(0,2*N.pi,kwargs.pop('n', 500))

    x = axes[0]*N.tan(th)+center[0]
    y = axes[1]*1/N.cos(th)+center[1]

    extrema = [N.argmin(x),N.argmax(x)]

    def remove_asymptotes(arr):
        arr[extrema] = N.nan
        return arr

    xy = tuple(remove_asymptotes(i) for i in (x,y))

    return xy


def ellipse(axes,  **kwargs):
    center = kwargs.pop('center', defaults['center'])
    th = N.linspace(0,2*N.pi,kwargs.pop('n', 500))
    return (
        axes[0]*N.cos(th)+center[0],
        axes[1]*N.sin(th)+center[1])

def __squished_ellipse(axes):
    scalar = 2
    ax1 = axes.copy()
    ax1[0] = scalar*N.sqrt(N.sqrt(3)/2)*(axes[1]**2)/axes[0]
    center = scalar*axes[1]
    return ax1, center

def __inverse_ellipse(axes, scalar=1):
    ax1 = 1/axes*axes[1]**2*scalar
    center = ax1[1]*N.sqrt(2)
    return ax1, center

def __reverse_ellipse(axes, scalar=1):
    """
    This method doesn't work as well
    """
    ax1 = axes.copy()[::-1]*scalar
    center = ax1[1]*N.sqrt(2)*scalar
    return ax1, center

def plot_conjugate_conics(ax, axes, width=None, plot_foci=False):
    hyp, = ax.plot(*hyperbola(axes))
    ax.plot(*ellipse(axes), zorder=-5, color=hyp.get_color(),alpha=0.5, linewidth=1)

    # Normal vector ellipse axes lengths
    # scales inversely with axes but can
    # be rescaled at will

    ax1,center = __squished_ellipse(axes)

    ell, = ax.plot(*ellipse(ax1, center=[0,center]))

    if plot_foci:
        # Plot hyperbola focus
        hyp_c = N.sqrt(N.sum(axes**2))
        ax.plot([0,0],[hyp_c,-hyp_c], '.', color=hyp.get_color())

        # Plot ellipse foci
        c = ax1**2
        c.sort()
        c[0] *= -1
        ell_c = N.sqrt(N.sum(c))
        # Plot ellipse foci
        ax.plot([0,0],[center+ell_c,center-ell_c], '.', color=ell.get_color())

    # Plot tangents
    xvals = N.array([-500,500])
    yvals = axes[1]/axes[0]*xvals
    kw = dict(zorder=-1, color=hyp.get_color(), linewidth=0.5)
    ax.plot(xvals, yvals, ':', **kw)
    ax.plot(xvals, -yvals, ':', **kw)

    #yvals = axes[0]/axes[1]*xvals
    kw = dict(zorder=-1, color=ell.get_color(), linewidth=0.5)
    ax.plot(yvals, xvals, ':', **kw)
    ax.plot(yvals, -xvals, ':', **kw)



    if width is None:
        width = N.linalg.norm(axes)*4
    lim = N.array([-width,width])/2
    ax.set_xlim(lim)
    ax.set_ylim(lim*0.6)
    ax.set_aspect(1)

    return ax
