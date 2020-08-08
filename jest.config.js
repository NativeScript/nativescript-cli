module.exports = {
  roots: ["<rootDir>"],
  preset: "ts-jest",
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: "(/__tests__/.*|(\\.|/))\\.ts?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // coverageDirectory: 'coverage',
  // collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
  setupFiles: [
    "<rootDir>/__tests__/test-bootstrap.ts"
  ]
};
