# Use a node alpine image install packages and run the start script
FROM node:10-alpine
WORKDIR /app
EXPOSE 3000

# Install dependancies
ENV NODE_ENV production
COPY ["package.json", "package-lock.json", "/app/"]
RUN npm ci --silent > /dev/null

# Copy in our source code
COPY docs /app/docs
COPY web /app/web

# Start up
CMD [ "npm", "start" ]
