
# Stage 1: Build NestJS application
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Install all dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma configuration and schema
COPY prisma ./prisma
COPY prisma7.config.ts ./

# Generate Prisma Client
RUN npx prisma generate

# Copy application source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Stage 2: Production runtime
FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies and generated Prisma Client
COPY --from=build /app/node_modules ./node_modules

# Copy compiled NestJS application
COPY --from=build /app/dist ./dist

# Run as a non-root user
USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
