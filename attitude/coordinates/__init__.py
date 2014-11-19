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
    try:
        assert coordinates.shape[1] == 3
    except Exception:
        coordinates = N.column_stack(coordinates)

    means = N.mean(coordinates,axis=0,keepdims=True)
    n = coordinates - means
    return tuple(a.flatten() for a in n.transpose())
