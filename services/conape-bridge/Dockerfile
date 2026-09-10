FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PORT=8080

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
COPY start_c3_6_2.mjs ./
COPY server_c3_7.mjs ./
COPY server_c3_7_3.mjs ./
COPY server_c3_7_4.mjs ./
RUN chown -R pwuser:pwuser /app

USER pwuser
CMD ["node", "server_c3_7_4.mjs"]
