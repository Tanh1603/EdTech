FROM node:22-alpine

WORKDIR /app

COPY dist/apps/api-gateway .

RUN npm --omit=dev --ignore-scripts --force install && npm cache clean --force

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

CMD ["node", "main.js"]
