from __future__ import division
import numpy as N

import logging
log = logging.getLogger(__name__)

def add_ones(a):
    """Adds a column of 1s at the end of the array"""
    arr = N.ones((a.shape[0],a.shape[1]+1))
    arr[:,:-1] = a
    return arr

def matrix_squared(array):
    """Returns a pseudo-squared matrix by solving X^T.X"""
    return N.dot(array.transpose(),array)

class Regression(object):
    def __init__(self, coordinates):
        """
        Solves plane equation Z = a(C[0])+b(C[1])+c by solving linear equation Cm=Z where m=[a,b,c]
        C and Z are the dependent and independent variables, respectively.
        """
        coordinates = N.array(coordinates)
        if len(coordinates[0]) > 3:
            coordinates = N.swapaxes(coordinates, 0, 1)

        self.C = add_ones(coordinates[:,0:2])
        self.Z = coordinates[:,-1]
        self.__coefficients__ = None
        self.__covariance__ = None

        self.nobs = self.Z.shape[0]                     # number of observations
        self.ncoef = self.C.shape[1]                    # number of coef.
        self.df_e = self.nobs - self.ncoef              # degrees of freedom, error 
        self.df_r = self.ncoef - 1                      # degrees of freedom, regression 
        self.n,self.k = self.C.shape

    def coefficients(self):
        if self.__coefficients__ is not None:
            return self.__coefficients__
        self.xTx = N.linalg.inv(matrix_squared(self.C))
        self.xy = N.dot(self.C.transpose(),self.Z)
        self.__coefficients__ = N.dot(self.xTx,self.xy)
        return self.__coefficients__

    def predictions(self):
        return self.C[:,0], self.C[:,1], N.dot(self.C,self.coefficients())

    def residuals(self):
        return self.Z - self.predictions()[2]

    @property
    def covariance_matrix(self):
        if self.__covariance__ is not None:
            return self.__covariance__
        if self.n == self.k:
            # solution is fully defined (i.e. only three points)
            self.__covariance__ = N.zeros((self.n,self.k))
        else:
            #rTr = matrix_squared(self.residuals())
            e = self.residuals()
            sse = N.dot(e,e)/self.df_e #SSE
            self.__covariance__ = N.dot(sse,self.xTx)
        return self.__covariance__

    def standard_errors(self):
        """Gets the standard errors of the coefficients"""
        return N.sqrt(N.diagonal(self.covariance_matrix))
