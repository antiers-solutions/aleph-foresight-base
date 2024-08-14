FROM node:18.20.3
# Create app directory
WORKDIR /src/server
# Install app dependencies
COPY . .
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source

CMD [ "npm", "run", "start" ]
EXPOSE 7001