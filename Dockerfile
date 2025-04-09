FROM node:21.2.0

WORKDIR /api

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "start"]
