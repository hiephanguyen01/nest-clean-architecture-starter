FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS dependencies
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM dependencies AS development
COPY . .
RUN npm run prisma:generate
CMD ["npm", "run", "start:dev"]

FROM dependencies AS build
COPY . .
RUN npm run prisma:generate && npm run build
RUN npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --chown=node:node --from=build /app/package.json ./package.json
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
