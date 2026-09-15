FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PORT=8080

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server_v2.mjs ./
COPY nav_selftest.mjs ./
COPY conape_v44_publisher.mjs ./
COPY conape_v44_publisher.test.mjs ./
COPY conape_v444_csv.mjs ./
COPY conape_v444_csv.test.mjs ./
RUN node --check server_v2.mjs
RUN node --check conape_v44_publisher.mjs
RUN node --check conape_v44_publisher.test.mjs
RUN node --check conape_v444_csv.mjs
RUN node --check conape_v444_csv.test.mjs
RUN node conape_v44_publisher.test.mjs
RUN node conape_v444_csv.test.mjs
RUN chown -R pwuser:pwuser /app

USER pwuser
CMD ["node", "server_v2.mjs"]
