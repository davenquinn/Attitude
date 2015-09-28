from __future__ import division

import numpy as N

def dot(*matrices):
    return reduce(N.dot, matrices)

