install-app:
	yarn set version berry
	yarn plugin import workspace-tools
	yarn config set nodeLinker node-modules
	yarn workspaces focus @dalia/app

build-app:
	yarn workspaces foreach -tvp --include @dalia/app --include @dalia/precedent-iso run build
