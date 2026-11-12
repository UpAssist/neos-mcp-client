# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.5.0](https://github.com/UpAssist/neos-mcp-client/compare/2.4.0...2.5.0) (2026-11-12)


### Features

* describe references in the tool descriptions ([2a0aedb](https://github.com/UpAssist/neos-mcp-client/commit/2a0aedbd3ad7503f0d62a9da27fbf06fa3f2f544)), closes [UpAssist/neos-mcp#14](https://github.com/UpAssist/neos-mcp/issues/14)


### Bug Fixes

* allow an empty list for references in the types ([af7ed4c](https://github.com/UpAssist/neos-mcp-client/commit/af7ed4c4c29538316ce3a7992a8017e37c901e51))
* run the tests with a glob so npm test works on Node 22 and newer ([#8](https://github.com/UpAssist/neos-mcp-client/issues/8)) ([6a17c1c](https://github.com/UpAssist/neos-mcp-client/commit/6a17c1c89b7b7835397497e732f46feac3b6c91b)), closes [#7](https://github.com/UpAssist/neos-mcp-client/issues/7)

## [2.4.0](https://github.com/UpAssist/neos-mcp-client/compare/2.3.0...2.4.0) (2026-11-02)


### Features

* content dimensions for the node tools and neos_create_node_variant ([#10](https://github.com/UpAssist/neos-mcp-client/issues/10)) ([46f0553](https://github.com/UpAssist/neos-mcp-client/commit/46f0553142faa9579e041517905277901eff617a))
* dimensions for preview, pending changes and publishing; fix typecheck ([#10](https://github.com/UpAssist/neos-mcp-client/issues/10)) ([d591f17](https://github.com/UpAssist/neos-mcp-client/commit/d591f17ac8d4859661ca70b97159e931b3100009))

## [2.3.0](https://github.com/UpAssist/neos-mcp-client/compare/2.2.0...2.3.0) (2026-10-13)


### Features

* add multi-site support to the tools ([#5](https://github.com/UpAssist/neos-mcp-client/issues/5)) ([dbffad3](https://github.com/UpAssist/neos-mcp-client/commit/dbffad3106b39f1f4ba21603e7adc078ca99892e))


### Bug Fixes

* refuse site-scoped publish when the bridge has no multi-site support ([0076e8d](https://github.com/UpAssist/neos-mcp-client/commit/0076e8deed841fe912c7aa22c97869378b8de8cb))

## [2.2.0](https://github.com/UpAssist/neos-mcp-client/compare/2.1.0...2.2.0) (2026-10-12)


### Features

* document link property values for the write tools ([#4](https://github.com/UpAssist/neos-mcp-client/issues/4)) ([c775e8f](https://github.com/UpAssist/neos-mcp-client/commit/c775e8f314c20b60923f8779ac3acf1e00bf7d48))

## [2.1.0](https://github.com/UpAssist/neos-mcp-client/compare/2.0.2...2.1.0) (2026-10-08)


### Features

* add neos_upload_asset tool ([0870e67](https://github.com/UpAssist/neos-mcp-client/commit/0870e6756da461b051fa51c50a6dea41faddead6))

### [2.0.2](https://github.com/UpAssist/neos-mcp-client/compare/2.0.1...2.0.2) (2026-09-23)


### Bug Fixes

* send X-MCP-Token and explicit Content-Length headers to bridge ([94db801](https://github.com/UpAssist/neos-mcp-client/commit/94db8017e0e8d3943dcddcf331af629ea25ff8cf))

### [2.0.1](https://github.com/UpAssist/neos-mcp-client/compare/2.0.0...2.0.1) (2026-04-16)


### Bug Fixes

* lazily auto-detect API version to survive server restarts ([c3e4a4a](https://github.com/UpAssist/neos-mcp-client/commit/c3e4a4a2ae598ed700a5eae84ecc5473729b9b2d))
* remove pretty-printing from getSiteContext to reduce token usage ([96d57db](https://github.com/UpAssist/neos-mcp-client/commit/96d57db5abd14112d4178eb7690720981493f5aa))

## 0.2.0 (2026-03-25)


### Features

* add getDocumentProperties and restart tools, add release scripts ([f376691](https://github.com/UpAssist/neos-mcp-client/commit/f376691b05ad97fba2b4f8eb7e2eb3352dc0ddd1))
* initial Neos MCP client ([0343b15](https://github.com/UpAssist/neos-mcp-client/commit/0343b159d70e8a09f6221bb8ca436b78c3eb43d9))
