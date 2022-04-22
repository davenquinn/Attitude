import numpy as N


def rotate_2D(angle):
    """
    Returns a 2x2 transformation matrix to rotate
    by an angle in two dimensions
    """
    return N.array([[N.cos(angle), -N.sin(angle)], [N.sin(angle), N.cos(angle)]])
