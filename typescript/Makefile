install-app:
	yarn set version berry
	yarn plugin import workspace-tools
	yarn config set nodeLinker node-modules
	yarn workspaces focus @fgpt/app

build-app:
	yarn workspaces foreach -tvp --include @fgpt/app --include @fgpt/precedent-iso run build
