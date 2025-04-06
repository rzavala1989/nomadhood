FROM oven/bun:1.0.0

WORKDIR /app

COPY bun.lockb ./
COPY package.json ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun prisma generate

CMD ["bun", "run", "dev"]
