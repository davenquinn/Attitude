"""
Methods for dealing with saved test data
"""
from __future__ import print_function

from os import path
import numpy as N
try:
    from StringIO import StringIO
except ImportError:
    from io import StringIO

__dirname__ = path.dirname(__file__)

def __test_fp(name):
    fn = path.basename(name)+'.txt'
    return path.join(__dirname__,'fixtures',fn)

def save_test_plane(name,*arrays):
    """
    Saves numpy array(s) defining plane data
    to text file in `test/fixtures` directory.
    This can be used to add data for inclusion
    in the testing framework for this module.

    Multiple arrays (for grouping, etc.) will
    be saved to the same file.
    """
    with open(__test_fp(name),'wb') as f:
        for i,arr in enumerate(arrays):
            N.savetxt(f, arr)
            if i != len(arrays)-1:
                print('---', file=f)

def __split_text(f):
    acc = ""
    for line in f:
        if line.strip() == '---':
            yield acc
            acc = ""
        else:
            acc += line
    yield acc

def load_test_plane(name):
    """
    Load numpy array(s) defining plane data
    from text file in `test/fixtures` directory
    """
    with open(__test_fp(name),'r') as f:
        splits = (StringIO(txt) for txt in __split_text(f))
        arrays = [N.loadtxt(fobj) for fobj in splits]
        if len(arrays) == 1:
            arrays = arrays[0]
    return arrays
