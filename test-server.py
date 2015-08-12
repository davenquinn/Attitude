#!/usr/bin/env python

from flask import Flask

test = Flask(__name__)

from syrtis.core import app, db
from syrtis.models import Attitude

@test.route("/")
def list():
    """
    List of test cases
    """
    pass

