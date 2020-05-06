FROM python:3.8-alpine

RUN apk add --no-cache make

WORKDIR /docs

COPY requirements.pip .

RUN python -m venv .venv \
 && source .venv/bin/activate \
 && pip install --no-cache-dir --requirement requirements.pip

COPY build .

VOLUME /docs

CMD ./build
