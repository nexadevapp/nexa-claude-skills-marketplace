//go:build e2e

// Traceability helpers: link each E2E test to its use case, change requests, and bug fixes,
// and fail the test when a referenced document does not exist.
//
// Copy verbatim to e2e/trace_test.go. Do not modify; a future plugin update may bring fixes.
//
// Usage — one top-level test per use case, one subtest per scenario:
//
//	func TestUC007(t *testing.T) {
//		t.Run("MSS/volunteer adds an entry", func(t *testing.T) {
//			useCase(t, "UC-007", "MSS", "CR-002")
//			...
//		})
//	}
//
//	func TestBUG002(t *testing.T) {
//		bug(t, "BUG-002")
//		...
//	}
//
// Select by ID with go test: -run 'TestUC007', -run 'TestUC007/AF-1', -run 'TestBUG002'.
package e2e

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

var scenarioID = regexp.MustCompile(`^(MSS|AF-\d+|EX-\d+)$`)

// useCase links t to a use case scenario (MSS, AF-N, EX-N). refs are the CR-NNN change
// requests the test verifies and the BUG-NNN bugs it guards against.
func useCase(t *testing.T, uc, scenario string, refs ...string) {
	t.Helper()
	requireDoc(t, "use_cases", uc)
	if !scenarioID.MatchString(scenario) {
		t.Fatalf("[trace] scenario %q is not MSS, AF-N, or EX-N", scenario)
	}
	for _, ref := range refs {
		switch {
		case strings.HasPrefix(ref, "CR-"):
			requireDoc(t, "change_requests", ref)
		case strings.HasPrefix(ref, "BUG-"):
			requireDoc(t, "bugs", ref)
		default:
			t.Fatalf("[trace] reference %q is neither CR-NNN nor BUG-NNN", ref)
		}
	}
	t.Logf("[trace] use-case=%s scenario=%s refs=%s", uc, scenario, strings.Join(refs, ","))
}

// bug links t to a bug with no use case home — a pure regression test.
func bug(t *testing.T, id string) {
	t.Helper()
	requireDoc(t, "bugs", id)
	t.Logf("[trace] bug-fix=%s", id)
}

// requireDoc fails t unless docs/<folder>/ holds <id>.md or a file named <id>-... or <id>....
// go test runs in e2e/, so docs/ is one level up.
func requireDoc(t *testing.T, folder, id string) {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join("..", "docs", folder))
	if err != nil {
		t.Fatalf("[trace] docs/%s/ not readable — Nexa project layout expected: %v", folder, err)
	}
	for _, e := range entries {
		name := e.Name()
		if name == id+".md" || strings.HasPrefix(name, id+"-") || strings.HasPrefix(name, id+".") {
			return
		}
	}
	t.Fatalf("[trace] %s not found under docs/%s/ — broken reference", id, folder)
}
