from __future__ import division
from functools import reduce
import numpy as N

def dot(*matrices):
    return reduce(N.dot, matrices)

