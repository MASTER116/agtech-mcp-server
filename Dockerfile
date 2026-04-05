FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-slim
WORKDIR /app
RUN addgroup --system mcp && adduser --system --ingroup mcp mcp
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER mcp
ENV TRANSPORT=http
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["node", "dist/index.js"]
