from __future__ import print_function
import numpy as N

def euler_angles(rotation_matrix):
    """ Compute Euler angles from rotation matrix"""
    r = rotation_matrix
    if r.shape[1] == 2:
        angles = [N.arctan2(r[1,0], r[0,0]),
                  N.pi/2-N.arctan2(r[1,0],-r[0,0])]
        return N.array(angles)

    return [N.arctan2(r[2,1],r[2,2]),
              N.arctan2(-r[2, 0], N.sqrt(r[0,0]**2 + r[1,0]**2)),
              N.arctan2(r[1, 0],r[0, 0])]


def ellipse(center,covariance_matrix,level=1):
    """Returns error ellipse in slope-azimuth space"""
    # singular value decomposition
    U, s, rotation_matrix = N.linalg.svd(covariance_matrix)
    # semi-axes (largest first)
    saxes = N.sqrt(s)*level ## If the _area_ of a 2s ellipse is twice that of a 1s ellipse
    # If the _axes_ are supposed to be twice as long, then it should be N.sqrt(s)*width
    volume = N.pi*N.prod(saxes)
    # rotation matrix
    angles = euler_angles(rotation_matrix)

    u = N.linspace(0, 2*N.pi, 100)
    data = N.column_stack((saxes[0]*N.cos(u), saxes[1]*N.sin(u)))
    # rotate data
    return N.dot(data, rotation_matrix)+ center
