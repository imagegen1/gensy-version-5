// Test function to verify Sentry is working
export function testSentryError() {
  // This function will trigger an error that should be captured by Sentry
  throw new Error("Test error for Sentry verification - This is intentional for testing");
}

// Test function for undefined function call
export function testUndefinedFunction() {
  // @ts-ignore - Intentionally calling undefined function for Sentry test
  myUndefinedFunction();
}
