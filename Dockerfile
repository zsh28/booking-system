FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN mkdir -p apps/api apps/web
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install --include=dev

COPY . .

ENV VITE_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=http://localhost:3000
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=public

RUN npx prisma generate --config apps/api/prisma.config.ts
RUN npm run build --workspace @appointment-booking/api
RUN npm run build --workspace web

FROM node:20-slim

WORKDIR /app

RUN npm install -g pm2

COPY --from=build /app/package.json /app/package-lock.json ./
RUN mkdir -p apps/api apps/web
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json

RUN npm install --omit=dev

COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build /app/apps/web/dist /app/apps/web/dist
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

ENV NODE_ENV=production
ENV API_PORT=3000
ENV VITE_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=http://localhost:3000

EXPOSE 3000 3001

CMD ["pm2-runtime", "ecosystem.config.cjs"]
