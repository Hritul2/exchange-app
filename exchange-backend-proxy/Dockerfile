# Use a specific node version
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the app (you can adjust this command based on your project)
RUN npm run build

# Expose the port the app will run on
EXPOSE 8080

# Start the app
CMD ["npm", "run", "start"]
