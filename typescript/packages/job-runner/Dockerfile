FROM node:18-bullseye-slim AS build

WORKDIR /usr/src/target

RUN apt-get update && apt-get install -y ca-certificates


RUN yarn set version berry && \
    yarn plugin import workspace-tools && \
    yarn config set nodeLinker node-modules

COPY package.json yarn.lock ./
COPY packages/tsconfig.base.json packages/tsconfig.base.json
COPY packages/precedent-iso packages/precedent-iso
COPY packages/precedent-node packages/precedent-node
COPY packages/job-runner packages/job-runner


RUN yarn workspaces focus @fgpt/job-runner && \
    yarn workspaces foreach -tvp --include @fgpt/job-runner --include @fgpt/precedent-iso run build && \
    yarn cache clean;

WORKDIR "/usr/src/target/packages/job-runner"

CMD ["yarn", "workspace", "@fgpt/job-runner", "run-server::prod"]
