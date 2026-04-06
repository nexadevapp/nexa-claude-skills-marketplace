import { test, expect } from "@playwright/test";

test.describe("UC-001: Calculate Sum", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // --- MSS: Main Success Scenario ---

  test("MSS: enters two valid numbers, clicks Calculate, displays the sum", async ({
    page,
  }) => {
    await page.getByLabel("First Number").fill("1234");
    await page.getByLabel("Second Number").fill("5678");
    await page.getByRole("button", { name: "Calculate" }).click();

    // Result value should show the formatted sum
    await expect(page.getByTestId("result-value")).toHaveText("6,912");
    // Equation line confirming the calculation
    await expect(page.getByText("1,234 + 5,678 = 6,912")).toBeVisible();
    // Input fields retain their values
    await expect(page.getByLabel("First Number")).toHaveValue("1234");
    await expect(page.getByLabel("Second Number")).toHaveValue("5678");
  });

  test("MSS: calculates sum of two single-digit numbers", async ({ page }) => {
    await page.getByLabel("First Number").fill("3");
    await page.getByLabel("Second Number").fill("7");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByTestId("result-value")).toHaveText("10");
    await expect(page.getByText("3 + 7 = 10")).toBeVisible();
  });

  test("MSS: calculates sum of large numbers near the 10-digit limit", async ({
    page,
  }) => {
    await page.getByLabel("First Number").fill("9999999999");
    await page.getByLabel("Second Number").fill("1");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByTestId("result-value")).toHaveText(
      "10,000,000,000"
    );
  });

  // --- AF1: Empty Input ---

  test("AF1: both fields empty shows error for each", async ({ page }) => {
    await page.getByRole("button", { name: "Calculate" }).click();

    // Both fields should show "This field is required"
    const requiredErrors = page.getByText("This field is required");
    await expect(requiredErrors).toHaveCount(2);
    // No result displayed
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Error summary shown
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).toBeVisible();
    // Input fields retain their (empty) values
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
  });

  test("AF1: first field empty, second valid", async ({ page }) => {
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("This field is required")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention: second field keeps its value
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("5");
  });

  test("AF1: first field valid, second field empty", async ({ page }) => {
    await page.getByLabel("First Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("This field is required")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention: first field keeps its value
    await expect(page.getByLabel("First Number")).toHaveValue("5");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
  });

  // --- AF2: Non-Numeric Input ---

  test("AF2: non-numeric input in first field", async ({ page }) => {
    await page.getByLabel("First Number").fill("abc");
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Must be a number")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input value preserved
    await expect(page.getByLabel("First Number")).toHaveValue("abc");
  });

  test("AF2: non-numeric input in second field", async ({ page }) => {
    await page.getByLabel("First Number").fill("5");
    await page.getByLabel("Second Number").fill("!@#");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Must be a number")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    await expect(page.getByLabel("Second Number")).toHaveValue("!@#");
  });

  // --- AF3: Zero or Negative ---

  test("AF3: zero in first field", async ({ page }) => {
    await page.getByLabel("First Number").fill("0");
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(
      page.getByText("Must be a positive natural number (1 or greater)")
    ).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention
    await expect(page.getByLabel("First Number")).toHaveValue("0");
    await expect(page.getByLabel("Second Number")).toHaveValue("5");
  });

  test("AF3: negative number in second field", async ({ page }) => {
    await page.getByLabel("First Number").fill("5");
    await page.getByLabel("Second Number").fill("-3");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(
      page.getByText("Must be a positive natural number (1 or greater)")
    ).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    await expect(page.getByLabel("Second Number")).toHaveValue("-3");
  });

  // --- AF4: Decimal Number ---

  test("AF4: decimal in first field", async ({ page }) => {
    await page.getByLabel("First Number").fill("3.5");
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Must be a whole number")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention
    await expect(page.getByLabel("First Number")).toHaveValue("3.5");
    await expect(page.getByLabel("Second Number")).toHaveValue("5");
  });

  test("AF4: decimal in second field", async ({ page }) => {
    await page.getByLabel("First Number").fill("5");
    await page.getByLabel("Second Number").fill("2.99");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Must be a whole number")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention
    await expect(page.getByLabel("First Number")).toHaveValue("5");
    await expect(page.getByLabel("Second Number")).toHaveValue("2.99");
  });

  // --- AF5: Exceeds 10 Digits ---

  test("AF5: number exceeding 10 digits in first field", async ({ page }) => {
    await page.getByLabel("First Number").fill("12345678901");
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Maximum 10 digits allowed")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention
    await expect(page.getByLabel("First Number")).toHaveValue("12345678901");
    await expect(page.getByLabel("Second Number")).toHaveValue("5");
  });

  test("AF5: number exceeding 10 digits in second field", async ({ page }) => {
    await page.getByLabel("First Number").fill("5");
    await page.getByLabel("Second Number").fill("99999999999");
    await page.getByRole("button", { name: "Calculate" }).click();

    await expect(page.getByText("Maximum 10 digits allowed")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // Input retention
    await expect(page.getByLabel("First Number")).toHaveValue("5");
    await expect(page.getByLabel("Second Number")).toHaveValue("99999999999");
  });

  // --- AF6: Clear Resets Everything ---

  test("AF6: clear resets inputs and result after successful calculation", async ({
    page,
  }) => {
    // First do a successful calculation
    await page.getByLabel("First Number").fill("10");
    await page.getByLabel("Second Number").fill("20");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByTestId("result-value")).toHaveText("30");

    // Click Clear
    await page.getByRole("button", { name: "Clear" }).click();

    // Inputs should be empty
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
    // Result should be back to placeholder
    await expect(page.getByText("Result will appear here")).toBeVisible();
    // No result value visible
    await expect(page.getByTestId("result-value")).not.toBeVisible();
  });

  test("AF6: clear resets inputs and error messages after validation failure", async ({
    page,
  }) => {
    // Trigger errors
    await page.getByLabel("First Number").fill("abc");
    await page.getByLabel("Second Number").fill("-1");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByText("Must be a number")).toBeVisible();

    // Click Clear
    await page.getByRole("button", { name: "Clear" }).click();

    // Inputs should be empty
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
    // Error messages should be gone
    await expect(page.getByText("Must be a number")).not.toBeVisible();
    await expect(
      page.getByText("Must be a positive natural number (1 or greater)")
    ).not.toBeVisible();
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).not.toBeVisible();
    // Default placeholder visible again
    await expect(page.getByText("Result will appear here")).toBeVisible();
  });

  // --- MSS Step 1: Initial Page State ---

  test("MSS Step 1: initial page state has empty fields, both buttons, placeholder, no errors or result", async ({
    page,
  }) => {
    // Both fields are empty
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
    // Both buttons visible
    await expect(
      page.getByRole("button", { name: "Calculate" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
    // Placeholder shown
    await expect(page.getByText("Result will appear here")).toBeVisible();
    // No result value visible
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    // No error messages visible
    await expect(page.getByText("This field is required")).not.toBeVisible();
    await expect(page.getByText("Must be a number")).not.toBeVisible();
    await expect(
      page.getByText("Must be a positive natural number (1 or greater)")
    ).not.toBeVisible();
    await expect(page.getByText("Must be a whole number")).not.toBeVisible();
    await expect(
      page.getByText("Maximum 10 digits allowed")
    ).not.toBeVisible();
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).not.toBeVisible();
  });

  // --- Error Recovery Round-Trips ---

  test("P1: error recovery — empty fields, then fill valid inputs, Calculate succeeds", async ({
    page,
  }) => {
    // Step 1: trigger validation error with empty fields
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByText("This field is required")).toHaveCount(2);
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();

    // Step 2: correct the input
    await page.getByLabel("First Number").fill("10");
    await page.getByLabel("Second Number").fill("20");
    await page.getByRole("button", { name: "Calculate" }).click();

    // Step 3: result appears, errors disappear
    await expect(page.getByTestId("result-value")).toHaveText("30");
    await expect(page.getByText("This field is required")).toHaveCount(0);
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).not.toBeVisible();
  });

  test("P1: error recovery — non-numeric input, then fix to valid, Calculate succeeds", async ({
    page,
  }) => {
    // Step 1: trigger non-numeric error
    await page.getByLabel("First Number").fill("abc");
    await page.getByLabel("Second Number").fill("5");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByText("Must be a number")).toBeVisible();
    await expect(page.getByTestId("result-value")).not.toBeVisible();

    // Step 2: correct the first field
    await page.getByLabel("First Number").fill("7");
    await page.getByRole("button", { name: "Calculate" }).click();

    // Step 3: result appears, errors disappear
    await expect(page.getByTestId("result-value")).toHaveText("12");
    await expect(page.getByText("7 + 5 = 12")).toBeVisible();
    await expect(page.getByText("Must be a number")).not.toBeVisible();
    await expect(
      page.getByText("Please fix the errors above to calculate")
    ).not.toBeVisible();
  });

  // --- BR-003: Compute on Submit Only ---

  test("BR-003: no result appears until Calculate is clicked", async ({
    page,
  }) => {
    // Fill both fields
    await page.getByLabel("First Number").fill("42");
    await page.getByLabel("Second Number").fill("58");

    // Before clicking Calculate: no result, placeholder still shown
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    await expect(page.getByText("Result will appear here")).toBeVisible();

    // Now click Calculate — result should appear
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByTestId("result-value")).toHaveText("100");
  });

  // --- BR-002: No Persistence After Reload ---

  test("BR-002: inputs and result are gone after page reload", async ({
    page,
  }) => {
    // Calculate a sum
    await page.getByLabel("First Number").fill("100");
    await page.getByLabel("Second Number").fill("200");
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(page.getByTestId("result-value")).toHaveText("300");

    // Reload the page
    await page.reload();

    // Inputs should be empty
    await expect(page.getByLabel("First Number")).toHaveValue("");
    await expect(page.getByLabel("Second Number")).toHaveValue("");
    // Result gone, placeholder back
    await expect(page.getByTestId("result-value")).not.toBeVisible();
    await expect(page.getByText("Result will appear here")).toBeVisible();
  });
});
