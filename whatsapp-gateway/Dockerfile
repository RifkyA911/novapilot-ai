# syntax=docker/dockerfile:1
FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY . .

ENV WA_GATEWAY_PORT=3002
ENV NOVAPILOT_BACKEND_URL=http://backend:8088

EXPOSE 3002

CMD ["bun", "run", "src/index.ts", "--mock"]
