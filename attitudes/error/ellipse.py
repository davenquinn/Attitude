from __future__ import division
import numpy as N

def ellipse(center,covariance_matrix,level=1):
    """Returns error ellipse in slope-azimuth space"""
    # singular value decomposition
    U, s, rotation_matrix = N.linalg.svd(covariance_matrix)
    # semi-axes (largest first)

    saxes = N.sqrt(s)*level ## If the _area_ of a 2s ellipse is twice that of a 1s ellipse
    # If the _axes_ are supposed to be twice as long, then it should be N.sqrt(s)*width

    u = N.linspace(0, 2*N.pi, 100)
    data = N.column_stack((saxes[0]*N.cos(u), saxes[1]*N.sin(u)))
    # rotate data
    return N.dot(data, rotation_matrix)+ center
