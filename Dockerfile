# Stage 1: Build the application
FROM oven/bun:latest as builder

WORKDIR /app

# Copy package manifests
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies needed for build)
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Run the build command provided by the user
# This should create the 'dist' directory with index.js and output.css
RUN bun run build

# Stage 2: Setup the production environment
FROM oven/bun:latest as runner

WORKDIR /app

# Copy production dependencies (node_modules) from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the build output (dist directory)
COPY --from=builder /app/dist ./dist

# Copy the main HTML file and any other static assets needed at runtime
# Add other directories like 'public' if they exist and are needed
COPY --from=builder /app/index.html ./index.html
# If you have other static assets (images, etc.) in a 'public' folder:
# COPY --from=builder /app/public ./public

# Copy package.json (might be needed by 'bun run start')
COPY --from=builder /app/package.json ./package.json

# Expose the port the application listens on.
# Check your index.ts or server framework docs for the default port.
# Common defaults are 3000 or 8080. Cloud Run/Fly.io inject PORT env var.
EXPOSE ${PORT:-3000}

# Define the command to run the application using the specified start command
# This executes 'bun run start' which should run the server (likely dist/index.js)
CMD ["bun", "run", "start"]

