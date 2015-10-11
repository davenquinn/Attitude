from __future__ import division
import matplotlib.pyplot as P
from mplstereonet.stereonet_math import line, pole
import numpy as N
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.patches import Polygon
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter
import seaborn

def trend_plunge(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",P.gca())
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
        el = map(N.degrees,orientation.error_ellipse(vector=True, level=level))
        lat,lon = line(el[1], el[0])

        e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        ax.add_patch(e)

def normal(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",P.gca())
    levels = kwargs.pop("levels",[1])
    normal = kwargs.pop("normal",False)
    kwargs["linewidth"] = 0

    a = kwargs.pop("alpha",0.7)
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i,level in enumerate(levels):
        _ = orientation.error_ellipse(vector=True, level=level)
        el = map(N.degrees,_)
        lat,lon = line(el[1], el[0])
        e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        ax.add_patch(e)

def plane_confidence(orientation, *args, **kwargs):
    ax = kwargs.pop('ax',P.gca())
    levels = kwargs.pop("levels",[1])

    a = kwargs.pop("alpha",[0.7])
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i, level in enumerate(levels):
        a,b = orientation.plane_errors()
        el = map(N.degrees,a)
        el2 = map(N.degrees,b)
        print(el)
        ax.plot(el[0],el[1], '.')
        #ax.fill(el,el2[::-1])
        #lat,lon = line(el[1], el[0])
        #e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
        #ax.add_patch(e)

def strike_dip(orientation, *args, **kwargs):
    ax = kwargs.pop("ax",P.gca())
    levels = kwargs.pop("levels",[1])
    spherical = kwargs.pop("spherical", False)
    kwargs["linewidth"] = 0

    a = kwargs.pop("alpha",[1])
    if len(a) != len(levels):
        a = [a]*len(levels)

    for i,level in enumerate(levels):
        el = map(N.degrees,orientation.error_ellipse(
            level=level,
            spherical=spherical
            ))

        if spherical:
            lat,lon = line(el[0], el[1])
        else:
            lat = el[0]
            lon = 90-el[1]

        e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
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
    fig = P.figure(*args, **kwargs)
    ax = fig.add_subplot(111, projection=projection)
    return fig,ax

def error_ellipse(fit):

    yloc = P.MaxNLocator(4)
    xloc = P.MaxNLocator(5)

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

def plot_aligned(pca):
    """ Plots the residuals of a principal component
        analysis of attiude data.
    """
    A = pca.rotated()
    minmax = [(A[:,i].min(),A[:,i].max()) for i in range(3)]
    lengths = [j-i for i,j in minmax]

    w = 8
    ratio = (lengths[2]*2+lengths[1])/lengths[0]*1.5
    h = w*ratio
    if h < 5: h = 5

    r = (lengths[1]+5)/(lengths[2]+5)
    if r > 5:
        r = 5

    fig = Figure(figsize=(w,h))
    fig.canvas = FigureCanvas(fig)

    def setup_axes():
        gs = GridSpec(3,1, height_ratios=[r,1,1])
        kwargs = dict()
        axes = []
        for g in gs:
            ax = fig.add_subplot(g,**kwargs)
            kwargs['sharex'] = ax
            yield ax

    axes = list(setup_axes())

    fig.subplots_adjust(hspace=0, wspace=0.1)
    kw = dict(c="#555555", s=40, alpha=0.5, zorder=5)

    #lengths = attitude.pca.singular_values[::-1]

    titles = (
        "Plan view",
        "Long cross-section",
        "Short cross-section")

    ylabels = (
        "Meters",
        "Residuals (m)",
        "Residuals (m)")

    colors = ['cornflowerblue','red']

    for title,ax,(a,b),ylabel in zip(titles,axes,
            [(0,1),(0,2),(1,2)],ylabels):

        kwargs = dict(linewidth=2, alpha=0.5)
        ax.plot(minmax[a],(0,0), c=colors[a], **kwargs)
        if b != 2:
            ax.plot((0,0),minmax[b], c=colors[b], **kwargs)

        ax.scatter(A[:,a], A[:,b], **kw)
        ax.set_aspect("equal")

        if b == 2:
            title += ": {:.0f} m".format(lengths[a])
        ax.text(0.01,.99,title,
            verticalalignment='top',
            transform=ax.transAxes)
        ax.autoscale(tight=True)
        ax.yaxis.set_ticks([])
        for spine in ax.spines.itervalues():
            spine.set_visible(False)

    ax.text(0.99,0.99,"Residuals: {:.1f} m".format(lengths[2]),
        verticalalignment='bottom',
        ha='right',
        transform=ax.transAxes)


    ax.set_xlabel("Meters")
    return fig

def aligned_residuals(pca):
    A = pca.rotated()
    fig, axes = P.subplots(2,1,
            sharex=True, frameon=False)
    fig.subplots_adjust(hspace=0, wspace=0.1)
    kw = dict(c="#555555", s=40, alpha=0.5)

    #lengths = attitude.pca.singular_values[::-1]
    lengths = (A[:,i].max()-A[:,i].min() for i in range(3))

    titles = (
        "Long cross-section (axis 3 vs. axis 1)",
        "Short cross-section (axis 3 vs. axis 2)")

    for title,ax,(a,b) in zip(titles,axes,
            [(0,2),(1,2)]):

        seaborn.regplot(A[:,a], A[:,b], ax=ax)
        ax.text(0,1,title,
            verticalalignment='top',
            transform=ax.transAxes)
        ax.autoscale(tight=True)
        for spine in ax.spines.itervalues():
            spine.set_visible(False)
    ax.set_xlabel("Meters")
    return fig

