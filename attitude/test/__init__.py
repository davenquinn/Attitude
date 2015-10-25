from __future__ import division, print_function
import numpy as N
from ..orientation.linear import Regression
from ..coordinates import spherical, cartesian

def spherical_plane(r,theta,coefficients=[1,1]):
    c = coefficients
    return r,theta,c[0]*N.sin(theta+c[1])

def strike_dip_plane(strike,dip):
    pass

def make_plane(x, y, coefficients):
    """z = a x + b y + c
        scatter: percentage scatter (standard deviation) in final values (0 for exact plane)
    """
    try:
        assert len(x) == len(y)
    except AssertionError:
        raise ValueError("X and Y must be the same length.")

    c = coefficients
    return c[0]*x+c[1]*y+c[2]

def randomize(plane, scatter=.05):
    return tuple(i*(1+N.random.randn(len(i))*scatter) for i in plane)

def random_plane(n=1000, limit=100):
    x,y = N.random.uniform(-limit,limit,(2,n))
    coefficients = N.random.randn(3)*N.array([1,1,limit/2])
    z = make_plane(x, y, coefficients)
    return (x,y,z),coefficients

def scattered_plane(*args,**kwargs):
    scatter = kwargs.pop("scatter",0.5)
    plane, coefficients = random_plane(*args,**kwargs)
    return randomize(plane,scatter), coefficients

def test_coordinate_transforms(n_points=1000):
    xyz = N.random.randn(3, n_points)
    for i,j in zip(xyz, cartesian(spherical(xyz))):
        assert i.all() == j.all()

def test_random_plane(n_points=1000):
    """Test that we can fit a simple plane in cartesian space"""

    n = 1e5 # A generically large number
    x,y = N.random.uniform(-n,n,(2,n_points))
    coefficients = N.random.randn(3)*10
    z = make_plane(x, y, coefficients)

    fitted_coefficients = Regression((x,y,z)).coefficients()
    print(coefficients, fitted_coefficients)
    for i, j in zip(coefficients,fitted_coefficients):
        assert i - j < 0.0001
