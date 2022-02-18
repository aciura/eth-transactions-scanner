FROM node:12.13-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

FROM node:12.13-alpine AS runner
COPY --from=builder /usr/src/app/node_modules /node_modules
WORKDIR /usr/src/app
EXPOSE 3000
ENV NODE_PATH=/node_modules
RUN npm install -g @nestjs/cli
CMD ["npm", "run", "start:dev"]
