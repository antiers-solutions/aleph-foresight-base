module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testRegex: ".spec.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  coverageDirectory: "./coverage",
  collectCoverageFrom: ["**/*.(t|j)s"],
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testPathIgnorePatterns: ["/node_modules/"],
  setupFilesAfterEnv: [
    "<rootDir>/src/tests/connection/helper/testSetup.spec.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/responses/",
    "src/mongoDB",
    "src/utils",
    "src/server.ts",
    "src/constants/server.constant.ts",
    "src/config",
    "src/tests/connection/helper"
  ],
};
