FROM python:3.8-slim

WORKDIR /source/docs

RUN apt-get update \
 && apt-get -y upgrade \
 && apt-get -y install curl gnupg git nodejs make pandoc \
 && curl -sL https://deb.nodesource.com/setup_12.x | bash \
 && apt-get -y install nodejs

COPY requirements.pip /source
COPY docs/requirements.pip /source/docs

RUN pip install --no-cache-dir -r /source/requirements.pip \
 && pip install --no-cache-dir -r /source/docs/requirements.pip \
 && npm install -g stylus

EXPOSE 8000

COPY . /source
RUN pip install --no-cache-dir -e /source
