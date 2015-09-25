import numpy as N

def dot(*matrices):
    return reduce(N.dot, matrices)

