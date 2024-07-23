FROM node:16.15.0
# Create app directory
WORKDIR /src/server
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# RUN npm cache clean --force
COPY package*.json ./
RUN npm install
RUN npm install --check-files
COPY . .
RUN npm run build
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
CMD [ "npm", "run", "prod" ]
EXPOSE 7001