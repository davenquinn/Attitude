from __future__ import division, print_function
from ..regression import Regression
import numpy as N
from scipy.linalg import eig
from ..error.ellipse import ellipse
from ..coordinates import centered

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
		assert len(coordinates) >= 3
		self.fit = Regression(centered(coordinates))

		values = self.fit.coefficients()
		val = values[0]**2+values[1]**2
		self.azimuth = -N.arctan2(-values[1], -values[0])
		self.rotation = rotation(self.azimuth)
		self.coefficients = N.dot(self.rotation,values)
		self.slope = N.arctan(-self.coefficients[0])

	def covariance_matrix(self):
		return N.dot(self.rotation,self.fit.covariance_matrix())

	def standard_errors(self):
		return N.sqrt(N.diagonal(self.covariance_matrix()))

	def strike_dip(self, uncertainties=False):
		c = tuple(N.degrees(i) for i in (self.azimuth,self.slope))
		if uncertainties:
			return c,self.errors()
		return c

	def dip_direction(self, uncertainties=False):
		s,d = self.strike_dip()
		s+=90
		if uncertainties:
			return (s,d),self.errors()
		return (s,d)

	def gradient(self, uncertainties=False):
		return self.azimuth,self.slope

	def errors(self):
		return tuple(N.degrees(i) for i in self.standard_errors()[:2])

	def error_ellipse(self, spherical=True, vector=False, level=1):
		e = ellipse(tuple(self.coefficients[:2]), self.covariance_matrix()[:2,:2], level=level)
		if spherical:
			slope = N.arctan(-e[:,0])
			azimuth = self.azimuth + N.arctan2(-e[:,1],-e[:,0])
			if vector:
				azimuth = azimuth + N.pi/2
			return (azimuth,slope)
		return (e[:,1],e[:,0])
