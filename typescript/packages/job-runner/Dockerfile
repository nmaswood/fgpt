FROM node:18-bullseye-slim AS build

WORKDIR /usr/src/target

RUN apt-get update && apt-get install -y ca-certificates build-essential python3 curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*;

RUN yarn set version berry && \
    yarn plugin import workspace-tools && \
    yarn config set nodeLinker node-modules

COPY package.json yarn.lock ./
COPY packages/tsconfig.base.json packages/tsconfig.base.json
COPY packages/precedent-iso packages/precedent-iso
COPY packages/precedent-node packages/precedent-node
COPY packages/job-runner packages/job-runner


RUN YARN_ENABLE_INLINE_BUILDS=true yarn workspaces focus @fgpt/job-runner && \
    yarn workspaces foreach -tvp --include @fgpt/job-runner --include @fgpt/precedent-iso --include @fgpt/precedent-node run build && \
    yarn cache clean;

WORKDIR "/usr/src/target/packages/job-runner"

CMD ["yarn", "run-job-runner"]
