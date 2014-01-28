from __future__ import division
from ..regression import Regression
import numpy as N
from scipy.linalg import eig

def rotation(angle):
	"""Rotation about the Z axis (in the XY plane)"""
	return N.array([[N.cos(angle),-N.sin(angle),0],
		[N.sin(angle), N.cos(angle),0],
		[0           , 0           ,1]])

def axes(matrix):
	"""
	Computes the ellipse axes lengths for a covariance matrix
	"""
	return N.sqrt(eig(matrix[0:2,0:2])[0])

class Orientation(object):
	def __init__(self, coordinates):
		self.fit = Regression(coordinates)
		
		values = self.fit.coefficients()
		val = values[0]**2+values[1]**2
		self.azimuth = N.arctan2(-values[1], -values[0])
		self.rotation = rotation(-self.azimuth)
		self.coefficients = N.dot(self.rotation, values)
		self.slope = N.arctan(-self.coefficients[0]) 

	def covariance_matrix(self):
		return N.dot(self.rotation,self.fit.covariance_matrix())

	def standard_errors(self):
		return N.sqrt(N.diagonal(self.covariance_matrix()))

	def strike_dip(self, uncertainties=False):
		return tuple(N.degrees(i) for i in (-self.azimuth,self.slope))

	def strike_dip_errors(self, errors=False):
		return tuple(N.degrees(i) for i in self.standard_errors()[0:2])
