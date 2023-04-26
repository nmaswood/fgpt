FROM node:18-bullseye-slim AS build

WORKDIR /usr/src/target

RUN apt-get update && apt-get install -y ca-certificates

COPY --from=datadog/serverless-init:beta4 /datadog-init /app/datadog-init

RUN yarn set version berry && \
    yarn plugin import workspace-tools && \
    yarn config set nodeLinker node-modules

COPY package.json yarn.lock ./
COPY packages/tsconfig.base.json packages/tsconfig.base.json
COPY packages/precedent-iso packages/precedent-iso
COPY packages/precedent-node packages/precedent-node
COPY packages/job-runner packages/job-runner


RUN yarn workspaces focus @dalia/job-runner && \
    yarn workspaces foreach -tvp --include @dalia/job-runner --include @dalia/precedent-iso run build && \
    yarn cache clean;

WORKDIR "/usr/src/target/packages/job-runner"

ENTRYPOINT ["/app/datadog-init"]

CMD ["yarn", "workspace", "@dalia/job-runner", "run-server::prod"]
