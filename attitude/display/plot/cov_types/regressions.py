"""
A temporary module for holding regression functions before merging
with the main regression functionality of the module
"""
import numpy as N
from ....geom import dot

def hyperbola(cov, axes, means, xvals, n=1,level=1):

    cov1 = dot(axes.T,cov,axes)
    # Plot hyperbola
    a = N.sqrt(cov[0]) #hyp_axes[0]
    b = N.sqrt(cov[-1]) #hyp_axes[-1]

    #a = N.sqrt(cov[0])#1[0]) #hyp_axes[0]
    #b = N.sqrt(cov[-1])#1[-1]) #hyp_axes[-1]
    u = lambda x: N.arcsinh(x/a)
    y = lambda x: b*N.cosh(u(x))

    def y(x):
        return level*b*N.sqrt(x**2/(a**2*n)+1/n)

    # Top
    vals = N.array([xvals,y(xvals)]).transpose()
    t = dot(vals,axes).T+means[:,N.newaxis]
    # Btm
    vals = N.array([xvals,-y(xvals)]).transpose()
    b = dot(vals,axes).T+means[:,N.newaxis]
    return t[0],b[1],t[1]

def bootstrap_resampled(data, func, n=10000):
    l = len(data)
    # Initialize the resampler
    rs = N.random.RandomState()

    boot_dist = []
    for i in range(n):
        resampler = rs.randint(0, l, l)
        sample = data.take(resampler, axis=0)
        boot_dist.append(func(sample))
    return N.array(boot_dist)

def bootstrap_noise(data, func, n=10000, std=1, symmetric=True):
    """
    Bootstrap by adding noise
    """
    boot_dist = []
    arr = N.zeros(data.shape)
    for i in range(n):
        if symmetric:
            # Noise on all three axes
            arr = N.random.randn(*data.shape)*std
        else:
            # Only z-coordinate noise
            arr[:,-1] = N.random.randn(data.shape[0])*std
        boot_dist.append(func(data+arr))
    return N.array(boot_dist)
