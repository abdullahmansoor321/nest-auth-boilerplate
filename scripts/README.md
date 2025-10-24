Scripts for validation, e2e and cleanup

- full-validation-tests.js
  - Run: node ./scripts/full-validation-tests.js
  - Runs a set of registration/login edge-case tests against your running app (default http://localhost:3000).
  - Tracks created accounts and attempts to delete them via Prisma at the end.

- e2e-tests.js
  - Run: node ./scripts/e2e-tests.js
  - Quick smoke e2e checks used during development.

- cleanup-test-data.js
  - Run: node ./scripts/cleanup-test-data.js
  - Deletes users where the email contains the string `e2e.` or `e2e-`.
  - You can override the pattern with the env var EMAIL_PATTERN. Example:
    - Linux/macOS: EMAIL_PATTERN=mytest node ./scripts/cleanup-test-data.js
    - Windows PowerShell: $env:EMAIL_PATTERN = 'mytest'; node ./scripts/cleanup-test-data.js

Notes
- These scripts are intended for development usage only. They may delete user rows that match the pattern.
- Ensure the Nest app is running before running `full-validation-tests.js` or `e2e-tests.js`.
