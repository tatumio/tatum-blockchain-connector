FROM mongo:bionic

RUN apt-get -qq update
RUN apt-get install -y software-properties-common make build-essential
RUN apt-get install -y git git-core curl wget nano zip

# WRITING CONF FILE
RUN mkdir /root/.lyra

# CLONING REPO
WORKDIR /opt
RUN git clone https://github.com/scryptachain/scrypta-idanodejs
WORKDIR /opt/scrypta-idanodejs

# INSTALL NODEJS
RUN curl -q https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get update
RUN apt-get install -y nodejs
RUN npm install -g npm

# SETTING UP MONGODB
RUN mkdir -p mongodb_data configdb \
	&& chown -R mongodb:mongodb mongodb_data configdb
RUN ulimit -n 640000

# BUILDING IDANODE
RUN npm install
RUN npm run build
RUN node create_conf.js

# DOWNLOADING WALLET
RUN wget https://github.com/scryptachain/scrypta/releases/download/2.0.1/lyra-2.0.1-linux-server.zip
RUN unzip lyra-2.0.1-linux-server.zip
RUN mv lyrad /usr/bin/lyrad
RUN mv lyra-cli /usr/bin/lyra-cli
RUN rm -rf bin
RUN rm lyra-2.0.1-linux-server.zip

# BLOCKCHAIN BOOTSTRAP DOWNLOAD
WORKDIR /root/.lyra
RUN wget https://bs.scryptachain.org/latest.zip
RUN rm -rf blocks chainstate database
RUN unzip latest.zip

# IDANODE BOOTSTRAP SCRIPT
WORKDIR /opt
RUN echo "#!/bin/bash" > bootstrap.sh
RUN echo "rm idanode_bootstrap.gz" >> bootstrap.sh
RUN echo "wget https://sfo2.digitaloceanspaces.com/scrypta/idanode_bootstrap.gz" >> bootstrap.sh
RUN echo "rm -rf ./scrypta-idanodejs/mongodb_data" >> bootstrap.sh
RUN echo "mkdir ./scrypta-idanodejs/mongodb_data" >> bootstrap.sh
RUN echo "tar -xvzf idanode_bootstrap.gz --strip-components 1" >> bootstrap.sh
RUN echo "sleep 20s" >> bootstrap.sh
RUN echo "mongod --dbpath=./scrypta-idanodejs/mongodb_data &" >> bootstrap.sh
RUN echo "sleep 20s" >> bootstrap.sh
RUN echo "mongorestore --db idanodejs --drop idanodejs" >> bootstrap.sh
RUN echo "sleep 20s" >> bootstrap.sh
RUN echo "rm -rf idanodejs" >> bootstrap.sh
RUN chmod 777 bootstrap.sh

WORKDIR /opt/scrypta-idanodejs

EXPOSE 3001

ENTRYPOINT [ "/opt/scrypta-idanodejs/run.sh" ]
CMD tail -f /dev/null