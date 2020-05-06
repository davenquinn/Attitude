FROM python:3.8-slim

WORKDIR /source/docs

COPY docs/requirements.pip .

RUN apt-get update && apt-get -y upgrade && apt-get -y install make pandoc \
 && pip install --no-cache-dir --requirement requirements.pip

COPY . /source

RUN pip install --no-cache-dir -e /source
