FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/web/package.json ./apps/

RUN npm install --include=dev

COPY . .

ENV VITE_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=http://localhost:3000

RUN npx prisma generate --config apps/api/prisma.config.ts
RUN npm run build --workspace @appointment-booking/api
RUN npm run build --workspace web

FROM node:20-slim

WORKDIR /app

RUN npm install -g pm2

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json
COPY --from=build /app/apps/web/dist /app/apps/web/dist

ENV NODE_ENV=production
ENV API_PORT=3000
ENV VITE_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=http://localhost:3000

EXPOSE 3000 3001

CMD ["pm2-runtime", "ecosystem.config.cjs"]
