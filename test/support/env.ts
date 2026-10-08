// Imported first: src/bridge.ts reads these at module load time, and ES imports are hoisted.
process.env.NEOS_MCP_URL = 'http://bridge.test';
process.env.NEOS_MCP_TOKEN = 'unit-test-token';
