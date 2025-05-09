# Stage 1: Build the frontend application
FROM oven/bun:latest as builder

WORKDIR /app

# Copy package manifests
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies needed for build)
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Run the build command (builds the frontend into ./dist)
RUN bun run build

# Stage 2: Setup the production environment
FROM oven/bun:latest as runner

WORKDIR /app

# Copy production dependencies (node_modules) from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the frontend build output (dist directory)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/favicon.ico ./favicon.ico
COPY --from=builder /app/icon.png ./icon.png
# Copy the main HTML file and any other static assets needed at runtime
COPY --from=builder /app/index.html ./index.html
# If you have other static assets (images, etc.) in a 'public' folder:
# COPY --from=builder /app/public ./public

# Copy package.json (needed for 'bun run start')
COPY --from=builder /app/package.json ./package.json

# --- IMPORTANT: Copy the server entrypoint file ---
COPY --from=builder /app/index.ts ./index.ts

# Expose the port the application listens on (check index.ts)
EXPOSE ${PORT:-3000}

# Define the command to run the application using the start script
# This executes 'bun run index.ts' (from package.json) which requires index.ts
CMD ["bun", "run", "start"]

