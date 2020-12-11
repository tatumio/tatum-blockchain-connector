FROM mongo:bionic

RUN apt-get -qq update
RUN apt-get install -y software-properties-common make build-essential
RUN apt-get install -y git git-core curl wget nano zip

# CLONING REPO
WORKDIR /opt
RUN mkdir /root/.lyra
RUN echo "datadir=/opt/data/lyra" > /root/.lyra/lyra.conf
RUN mkdir /opt/data
RUN mkdir /opt/data/lyra
RUN mkdir /opt/data/idanode
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

# BLOCKCHAIN BOOTSTRAP SCRIPT
WORKDIR /opt
RUN echo "#!/bin/bash" > bootstrap_blockchain.sh
RUN echo "pkill lyrad" >> bootstrap_blockchain.sh
RUN echo "cd /opt/data/lyra" >> bootstrap_blockchain.sh
RUN echo "wget https://bs.scryptachain.org/latest.zip" >> bootstrap_blockchain.sh
RUN echo "pkill lyrad" >> bootstrap_blockchain.sh
RUN echo "rm- -rf blocks chainstate database" >> bootstrap_blockchain.sh
RUN echo "unzip -o latest.zip" >> bootstrap_blockchain.sh
RUN echo "lyrad -datadir=/opt/data/lyra &" >> bootstrap_blockchain.sh

# IDANODE BOOTSTRAP SCRIPT
WORKDIR /opt
RUN echo "#!/bin/bash" > bootstrap_idanode.sh
RUN echo "lyra-cli stop" >> bootstrap_idanode.sh
RUN echo "rm idanode_bootstrap.gz" >> bootstrap_idanode.sh
RUN echo "wget https://sfo2.digitaloceanspaces.com/scrypta/idanode_bootstrap.gz" >> bootstrap_idanode.sh
RUN echo "lyra-cli stop" >> bootstrap_blockchain.sh
RUN echo "rm -rf /opt/data/idanode" >> bootstrap_idanode.sh
RUN echo "mkdir /opt/data/idanode" >> bootstrap_idanode.sh
RUN echo "tar -xvzf idanode_bootstrap.gz --strip-components 1" >> bootstrap_idanode.sh
RUN echo "sleep 20s" >> bootstrap_idanode.sh
RUN echo "mongod --dbpath=/opt/data/idanode &" >> bootstrap.sh
RUN echo "mongorestore --db idanodejs --drop idanodejs" >> bootstrap_idanode.sh
RUN echo "sleep 20s" >> bootstrap_idanode.sh
RUN echo "rm -rf idanodejs" >> bootstrap_idanode.sh
RUN echo "lyrad -datadir=/opt/data/lyra &" >> bootstrap_idanode.sh
RUN chmod 777 bootstrap_idanode.sh

WORKDIR /opt/scrypta-idanodejs

EXPOSE 3001

ENTRYPOINT [ "/opt/scrypta-idanodejs/run.sh" ]
CMD tail -f /dev/null