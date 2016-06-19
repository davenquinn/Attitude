# -*- coding: utf-8 -*-
from __future__ import division
import matplotlib
from mplstereonet.stereonet_math import line, pole
import numpy as N
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.patches import Polygon
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter, MaxNLocator

from ...geom.vector import vector,plane
from .pca_aligned import plot_aligned

def get_axes():
    import matplotlib.pyplot as P
    return P.gca()

def trend_plunge(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",current_axes())
    levels = kwargs.pop("levels",[1])
    #kwargs["linewidth"] = 0
    defaults = dict(
        linewidth=0)
    kwargs.update({k:kwargs.pop(k,v)
        for k,v in defaults.items()})

    a = kwargs.pop("alpha",[0.7])
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i,level in enumerate(levels):
        el = [N.degrees(i) for i in
            orientation.error_ellipse(vector=True, level=level)]
        lat,lon = line(el[1], el[0])

        e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        ax.add_patch(e)

def normal(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",current_axes())
    levels = kwargs.pop("levels",[1])
    normal = kwargs.pop("normal",False)
    kwargs["linewidth"] = 0

    a = kwargs.pop("alpha",0.7)
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i,level in enumerate(levels):
        _ = orientation.error_ellipse(vector=True, level=level)
        el = [N.degrees(i) for i in _]
        lat,lon = line(el[1], el[0])
        e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        ax.add_patch(e)

def plane_confidence(orientation, *args, **kwargs):
    ax = kwargs.pop('ax',current_axes())
    levels = kwargs.pop("levels",[1])

    a = kwargs.pop("alpha",[0.7])
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i, level in enumerate(levels):
        a,b = orientation.plane_errors()
        el = [N.degrees(i) for i in a]
        el2 = [N.degrees(i) for i in b]
        print(el)
        ax.plot(el[0],el[1], '.')
        #ax.fill(el,el2[::-1])
        #lat,lon = line(el[1], el[0])
        #e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        #ax.add_patch(e)

def strike_dip(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",current_axes())
    levels = kwargs.pop("levels",[1])
    spherical = kwargs.pop("spherical", False)
    kwargs["linewidth"] = 0

    a = kwargs.pop("alpha",[1])
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i,level in enumerate(levels):
        el = [N.degrees(ell) for ell in
                orientation.error_ellipse(
                    level=level,
                    spherical=spherical)]

        if spherical:
            lat,lon = line(el[0], el[1])
        else:
            lat = el[0]
            lon = 90-el[1]

        e = Polygon(list(zip(lat,lon)), alpha=a[i], **kwargs)
        ax.add_patch(e)

def strike_dip_montecarlo(orientation, n=10000, ax=None, level=1):
    o = orientation
    arr = N.dot(N.random.randn(n,3)*level,o.covariance_matrix)
    arr += o.sigma[2] # Normal vector to fit

    arr = N.dot(arr,o.axes) # Rotate into cartesian coords

    mag = N.linalg.norm(arr,axis=1)
    strike = N.degrees(N.arctan2(arr[:,0],arr[:,1]))
    dip = N.degrees(N.arccos(arr[:,2]/mag))

    ax.pole(strike,dip,'r.')


def setup_figure(*args, **kwargs):
    projection = kwargs.pop("projection","stereonet")
    fig = Figure(*args, **kwargs)
    fig.canvas = FigureCanvas(fig)
    ax = fig.add_subplot(111, projection=projection)
    return fig,ax

def error_ellipse(fit):

    yloc = MaxNLocator(4)
    xloc = MaxNLocator(5)

    def func(val, pos):
        return u"{0}\u00b0".format(val)

    formatter = FuncFormatter(func)

    fig, ax = setup_figure(projection=None, figsize=(4,3))
    ax.yaxis.set_major_locator(yloc)
    ax.xaxis.set_major_locator(xloc)
    ax.xaxis.set_major_formatter(formatter)
    ax.yaxis.set_major_formatter(formatter)
    ax.invert_yaxis()

    strike_dip(fit,
        ax=ax,
        levels=[1,2,3],
        alpha=[0.5,0.4,0.3],
        spherical=False,
        facecolor='red')

    ax.autoscale_view()
    ax.set_ylabel("Dip")
    ax.set_xlabel("Strike")
    return fig

def error_asymptotes(pca,**kwargs):
    """
    Plots asymptotic error bounds for
    hyperbola on a stereonet.
    """
    ax = kwargs.pop("ax",current_axes())

    lon,lat = pca.plane_errors('upper', n=1000)
    ax.plot(lon,lat,'-')

    lon,lat = pca.plane_errors('lower', n=1000)
    ax.plot(lon,lat,'-')

    ax.plane(*pca.strike_dip())

