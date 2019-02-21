FROM ubuntu:trusty AS base

# Install Chromium.
RUN apt-get update && \
  apt-get install -y wget gnupg2 curl && \
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
  echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
  apt-get update && apt-get install -y google-chrome-stable build-essential git && \
  rm -rf /var/lib/apt/lists/*

FROM base AS node

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs
