# -*- coding: utf-8 -*-
from __future__ import division
from mplstereonet.stereonet_math import line, pole
import logging
import numpy as N
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.patches import Polygon
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter
import seaborn

from ...geom.vector import vector,plane

log = logging.getLogger(__name__)

def plot_aligned(pca, sparse=True, **kwargs):
    """ Plots the residuals of a principal component
        analysis of attiude data.
    """
    colormap = kwargs.pop('colormap',None)

    A = pca.rotated()
    # Flip the result if upside down
    if pca.normal[2] < 0:
        A[:,-1] *= -1
    minmax = [(A[:,i].min(),A[:,i].max()) for i in range(3)]
    lengths = [j-i for i,j in minmax]

    if sparse:
        l = len(A)
        if l > 10000:
            i = N.ceil(l/10000)
            A = A[::i]

    log.info("Plotting with {} points".format(len(A)))

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

    hyp = pca.as_hyperbola(rotated=False)
    d = N.abs(N.diagonal(hyp)[:-1])
    hyp_axes = N.sqrt(1/d)

    for title,ax,(a,b),ylabel in zip(titles,axes,
            [(0,1),(0,2),(1,2)],ylabels):

        kw = dict(linewidth=2, alpha=0.5)
        bounds = minmax[a]
        ax.plot(bounds,(0,0), c=colors[a], **kw)
        if b != 2:
            ax.plot((0,0),minmax[b], c=colors[b], **kw)
        else:
            title += ": {:.0f} m".format(lengths[a])

            # Plot hyperbola
            u = lambda x: N.arcsinh(x/hyp_axes[a])
            y = lambda x: hyp_axes[-1]*N.cosh(u(x))
            bounds = minmax[0]
            x_ = N.linspace(bounds[0],bounds[1],100)

            vals = y(x_)
            ax.plot(x_,vals, color='#aaaaaa',alpha=0.5)
            ax.plot(x_,-vals, color='#aaaaaa',alpha=0.5)

        x,y = A[:,a], A[:,b]
        kw = dict(alpha=0.5, zorder=5)

        if colormap is None:
            ax.plot(x,y,c="#555555", linestyle='None', marker='.',**kw)
        else:
            ax.scatter(x,y,c=A[:,-1], cmap=colormap, **kw)

        ax.set_aspect("equal")

        ax.text(0.01,.99,title,
            verticalalignment='top',
            transform=ax.transAxes)
        ax.autoscale(tight=True)
        ax.yaxis.set_ticks([])
        for spine in ax.spines.values():
            spine.set_visible(False)

    ax.text(0.99,0.99,"Residuals: {:.1f} m".format(lengths[2]),
        verticalalignment='bottom',
        ha='right',
        transform=ax.transAxes)


    ax.set_xlabel("Meters")
    return fig
