FROM ubuntu:trusty AS base

RUN apt-get update
RUN apt-get install -y wget gnupg2 curl lsof

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && apt-get install -y google-chrome-stable build-essential git && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/builder && \
  groupadd -r builder && useradd --no-log-init -r -g builder -d /home/builder -s /sbin/nologin -c "Docker image user" builder && \
  chown -R builder:builder /home/builder

ENV HOME=/home/builder
WORKDIR /home/builder

FROM base AS node

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs

USER builder

