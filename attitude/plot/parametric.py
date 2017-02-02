import numpy as N
"""
Functions to produce parametric representations of
conic sections in two dimensions. This can be applied
to plotting 2D slices of quadrics as well.

We could generalize this to n dimensions, but that is probably
not super useful at the moment.
"""

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

