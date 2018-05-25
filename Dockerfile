# specify the node base image with your desired version node:<version>
FROM node:7.6

EXPOSE 8888

EXPOSE 8000

WORKDIR /usr/src/app 

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install

CMD ["npm", "start"]
