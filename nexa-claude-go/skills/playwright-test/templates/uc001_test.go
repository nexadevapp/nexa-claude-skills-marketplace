//go:build e2e

// Example E2E test for UC-001 (Manage Items). Copy to e2e/uc<NNN>_test.go and adapt.
//
// Test rules (enforced for every test in this file):
//
//  1. ONE page.Goto per test — at the entry point only. All later navigation happens through
//     UI interactions (clicks, form submits, htmx swaps).
//  2. Test data is set up through createUser (and the pool) — that is setup, not navigation.
//     Records the journey creates belong to the test user and are removed with it.
//  3. Wait for specific UI elements (heading, table row, form field) with web-first assertions.
//     Never wait for network idle or sleep.
//  4. Every UC is one TestUC<NNN> function; every scenario is a subtest named
//     "<scenario>/<journey>" whose first line is useCase(t, "UC-NNN", "<scenario>", refs...).
//     Pure bug regressions are TestBUG<NNN> functions starting with bug(t, "BUG-NNN").
package e2e

import (
	"testing"

	"github.com/mxschmitt/playwright-go"
)

// loginViaUI performs the login form flow without asserting success, so it serves both happy
// and failure paths. It holds the single page.Goto of any test that calls it.
func loginViaUI(t *testing.T, page playwright.Page, u testUser) {
	t.Helper()
	_, err := page.Goto("/login")
	must(t, err)
	must(t, expect.Locator(page.GetByLabel("Email")).ToBeVisible())
	must(t, page.GetByLabel("Email").Fill(u.Email))
	must(t, page.GetByLabel("Password").Fill(u.Password))
	must(t, page.GetByRole(*playwright.AriaRoleButton, playwright.PageGetByRoleOptions{Name: "Sign in"}).Click())
}

func logoutViaUI(t *testing.T, page playwright.Page) {
	t.Helper()
	must(t, page.GetByRole(*playwright.AriaRoleButton, playwright.PageGetByRoleOptions{Name: "Sign out"}).Click())
	must(t, expect.Locator(page.GetByLabel("Email")).ToBeVisible()) // back on the login screen
}

func link(page playwright.Page, name string) playwright.Locator {
	return page.GetByRole(*playwright.AriaRoleLink, playwright.PageGetByRoleOptions{Name: name})
}

func button(page playwright.Page, name string) playwright.Locator {
	return page.GetByRole(*playwright.AriaRoleButton, playwright.PageGetByRoleOptions{Name: name})
}

func heading(page playwright.Page, name string) playwright.Locator {
	return page.GetByRole(*playwright.AriaRoleHeading, playwright.PageGetByRoleOptions{Name: name})
}

func TestUC001(t *testing.T) {
	// Suite-level user shared by the subtests; deleted when TestUC001 ends.
	owner := createUser(t, nil)

	// MSS: the full happy path as one test — entry point to final outcome.
	t.Run("MSS/user creates an item and sees it in the list", func(t *testing.T) {
		useCase(t, "UC-001", "MSS")
		page := newPage(t)

		// 1. Log in (the only page.Goto in this test, inside the helper)
		loginViaUI(t, page, owner)

		// 2. Navigate to Items through the UI — never page.Goto("/items")
		must(t, link(page, "Items").Click())
		must(t, expect.Locator(heading(page, "Items")).ToBeVisible())

		// 3. Open the create form through the UI
		must(t, button(page, "Add New").Click())

		// 4. Submit empty to verify validation (an htmx swap — wait for what it renders)
		must(t, button(page, "Save").Click())
		// Verifies BR-001: Mandatory Field Validation
		must(t, expect.Locator(page.GetByText("Name is required")).ToBeVisible())

		must(t, page.GetByLabel("Name").Fill("E2E Test Item"))
		must(t, page.GetByLabel("Description").Fill("Created by E2E test"))
		must(t, button(page, "Save").Click())

		// 5. Verify the final outcome
		// Verifies Success Postcondition: Item Stored and Visible
		must(t, expect.Locator(page.Locator("table tbody tr")).ToContainText([]string{"E2E Test Item"}))

		logoutViaUI(t, page)
	})

	// AF-1: empty state. A fresh user owns no items, so the empty state is reachable without
	// deleting anyone else's data.
	t.Run("AF-1/user with no items sees the empty state", func(t *testing.T) {
		useCase(t, "UC-001", "AF-1")
		page := newPage(t)
		fresh := createUser(t, nil)

		loginViaUI(t, page, fresh)
		must(t, link(page, "Items").Click())
		must(t, expect.Locator(heading(page, "Items")).ToBeVisible())
		must(t, expect.Locator(page.GetByText("No items found")).ToBeVisible())

		logoutViaUI(t, page)
	})

	// AF-2: per-test user override — a suspended user is stopped after login.
	t.Run("AF-2/suspended user sees the account-locked screen", func(t *testing.T) {
		useCase(t, "UC-001", "AF-2")
		page := newPage(t)
		suspended := createUser(t, map[string]any{"status": "SUSPENDED"})

		loginViaUI(t, page, suspended)
		must(t, expect.Locator(page.GetByText("Account suspended")).ToBeVisible())
	})

	// AF-3: `refs` carries both a CR delta on top of UC-001 and a BUG regression guard.
	//   CR-001: add a Category field to the item form, surface it in the list.
	//   BUG-001: an empty Category used to return 500; it must show a validation error.
	t.Run("AF-3/user creates a categorized item, empty category is rejected", func(t *testing.T) {
		useCase(t, "UC-001", "AF-3", "CR-001", "BUG-001")
		page := newPage(t)

		loginViaUI(t, page, owner)
		must(t, link(page, "Items").Click())
		must(t, button(page, "Add New").Click())
		must(t, page.GetByLabel("Name").Fill("CR-Widget"))
		must(t, page.GetByLabel("Description").Fill("Item with a category"))

		// BUG-001 regression guard: empty Category must show validation, not crash.
		must(t, button(page, "Save").Click())
		must(t, expect.Locator(page.GetByText("Category is required")).ToBeVisible())

		// CR-001: fill the new Category field.
		_, err := page.GetByLabel("Category").SelectOption(playwright.SelectOptionValues{Values: &[]string{"hardware"}})
		must(t, err)
		must(t, button(page, "Save").Click())

		// Verifies CR-001: the list shows the category next to the name.
		must(t, expect.Locator(page.Locator("table tbody tr")).ToContainText([]string{"CR-Widget", "hardware"}))

		logoutViaUI(t, page)
	})
}

// Pure bug regression — no clean use case home. In a real project it lives in its own
// e2e/bug<NNN>_test.go file.
func TestBUG002(t *testing.T) {
	bug(t, "BUG-002")
	page := newPage(t)

	// Owns its single page.Goto: the credentials are deliberately invalid, so no test user.
	_, err := page.Goto("/login")
	must(t, err)
	must(t, page.GetByLabel("Email").Fill("üser@example.com"))
	must(t, page.GetByLabel("Password").Fill("does-not-matter"))
	must(t, button(page, "Sign in").Click())

	// Pre-fix: the server returned 500. Post-fix: a friendly invalid-credentials message.
	must(t, expect.Locator(page.GetByText("Invalid credentials")).ToBeVisible())
}
