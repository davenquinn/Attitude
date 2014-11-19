import numpy as N

def spherical(coordinates):
    """No error is propagated"""
    x,y,z = coordinates
    r = N.sqrt(x**2+y**2+z**2)
    theta = N.arccos(z/r)
    phi = N.arctan2(y,x)
    return r,theta,phi

def cartesian(spherical):
    r,theta,phi = spherical
    z = r*N.cos(theta)
    zc = r*N.sin(theta)
    x = zc*N.sin(phi)
    y = zc*N.cos(phi)
    return x,y,z

def centered(coordinates):
    """ Centers coordinate distribution with respect to its
        mean on all three axes. This is used as the input to
        the regression model, so it can be converted easily
        into radial coordinates.
    """
    coordinates = N.array(coordinates)
    assert coordinates.shape[1] == 3
    means = N.mean(coordinates,axis=0)
    return coordinates - means
