FROM python:3.8-slim AS attitude-dev

WORKDIR /source/docs

COPY requirements.pip /source
COPY docs/requirements.pip /source/docs

RUN apt-get update \
 && apt-get -y upgrade \
 && apt-get -y install make pandoc \
 && pip install --no-cache-dir -r /source/requirements.pip \
 && pip install --no-cache-dir -r /source/docs/requirements.pip

COPY . /source

RUN pip install --no-cache-dir -e /source
