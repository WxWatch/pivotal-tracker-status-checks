FROM node

WORKDIR /opt/app
EXPOSE 3069
CMD ["npm", "start"]

COPY package.json /opt/app
COPY dist /opt/app
