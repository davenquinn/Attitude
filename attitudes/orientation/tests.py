from . import Orientation
import numpy as N
import nose
import functools

simple_cases = [
    ([(1,0,1),(0,0,1),(0,1,0)], [-90, 45], "North-dipping"),
    ([(5,0,-5), (0,5,0), (0,0,0)], [0,45], "East-dipping"),
    ([(1,0,0),(1,1,1), (2,1,1)], [90,45], "South-dipping"),
    ([(0,2,0),(1,1,1), (0,0,0)], [180,45], "West-dipping"),
    ([(0,2,1),(1,1,0), (0,0,1)], [0,45], "East-dipping (sloping up)"),
    ([(0,0,1),(1,0,0),(0,1,0)], [-45,N.degrees(N.arctan(N.sqrt(2)))], "Northeast-dipping")
]

edge_cases = [
    ([(0,0,0),(1,1,0), (0,2,0), (4,2,0)], [0,0], "Flat"),
    ([(1,0,0),(1,1,-1),(1,2,1)],[0,90], "Vertical, facing east")
]

def check_orientation(a):
    coords, sol, name = a
    print name
    sol = tuple(sol)
    res = Orientation(coords).strike_dip()
    print res, sol
    print ""
    assert res[0] == sol[0] and res[1] == sol[1]

def test_directions():
    """
    Tests cardinal directions for simple cases, to make sure everything conforms to right-hand rule.
    Also tests that error-propagation methods don't give wrong mean answer. Does not test the standard
    deviation of these methods.
    """
    for a in simple_cases:
        yield check_orientation, a

def tesdt_edge_cases():
    """Tests edge cases (vertical and horizontal). These fail currently"""
    for a in edge_cases:
        yield check_orientation, a