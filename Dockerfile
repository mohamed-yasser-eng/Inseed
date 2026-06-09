# The first base image
# Can be found at https://hub.docker.com/_/node
# We can add more than one image
FROM node:24.0.0

# Create a new directory [Folder on docker]
WORKDIR /app

# Copy package.json and package-lock.json from current directory to /app directory
COPY package*.json .

# Install all dependencies [ node_modules ]
RUN npm install 

# If we write a build script in package.json file
# RUN npm run build

# Copy all files from current directory to /app directory
COPY . .

RUN npm run build


# Expose the port the app runs on , JUST FOR DOCUMENTATION
Expose 5000

# Start the app
CMD ["npm", "run", "start"]