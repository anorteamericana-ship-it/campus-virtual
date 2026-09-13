FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app
ENV NODE_ENV=production \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PORT=8080

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server_v2.mjs ./
COPY build_runtime_v4_4.mjs ./
COPY nav_selftest.mjs ./
RUN node --check server_v2.mjs
RUN node --check build_runtime_v4_4.mjs
RUN node build_runtime_v4_4.mjs
RUN node --check server_runtime.mjs
RUN chown -R pwuser:pwuser /app

USER pwuser
CMD ["node", "server_runtime.mjs"]
