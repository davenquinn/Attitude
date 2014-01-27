from __future__ import division
import numpy as N
import logging as log
from uncertainties import ufloat
import mcerp
from mcerp import umath

def atan2(y,x):
    angle = 0;
    if x < y:
        angle = N.pi
        x = -x
        y = -y
    if x < -y:
        angle -= N.pi/2
        tmp = x
        x = -y
        y = tmp
    angle += umath.atan(y/x)
    if angle > N.pi:
        angle -= 2*N.pi
    return angle
umath.atan2 = atan2

def analytical(values):
    """No error is propagated"""
    values = [c for c,e in values]
    val = values[0]**2+values[1]**2
    slope = N.arctan2(val,N.sqrt(val))
    azimuth = N.arctan2(-values[1], -values[0])
    res = [-N.degrees(azimuth), N.degrees(slope)]
    return [ufloat(i,0) for i in res] 

def monte_carlo(values):
    """Tests the regression using Monte Carlo methods from the mcerp package"""
   
    def process_input(values):
        for c,e in values:
            if e <= 0:
                yield c
            else:
                yield mcerp.N(c,e)

    def process_output(result):
        for i in result:
            try:
                yield ufloat(i.mean,i.std)
            except AttributeError:
                yield ufloat(float(i),0)

    values = list(process_input(values))

    val = values[0]**2+values[1]**2
    slope = umath.atan2(val,umath.sqrt(val))
    azimuth = umath.atan2(-values[1], -values[0])

    res = [-umath.degrees(azimuth), umath.degrees(slope)]
    return list(process_output(res))

def strike_dip(fit, strategy=analytical):
    """Converts planar fit to strike and dip using the defined strategy (i.e. monte carlo vs. first_order)"""
    coef = fit.coefficients()[0:2].T
    errors = fit.standard_errors()[0:2].T
    return strategy(zip(coef, errors))   