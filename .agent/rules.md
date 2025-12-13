# Agent Rules for radio-suite Project

## CRITICAL: Browser Testing is FORBIDDEN

**NEVER use the `browser_subagent` tool or any browser testing/automation tools on this project unless the user EXPLICITLY requests it.**

Reasons:
1. Browser testing slows down the user's machine to a crawl
2. A browser instance is already running - opening a new instance causes conflicts
3. The application requires authentication and automated browsers cannot access it
4. Browser automation frequently fails (scrolling issues, access problems)
5. This is a beta feature that should not be used automatically

**The user will perform all manual testing themselves.**

## When Browser Testing IS Allowed

Only use browser_subagent if the user:
- Explicitly says "test this in the browser"
- Specifically asks you to "open the browser" or "check in browser"
- Requests automated browser testing

If you need to verify UI changes, instead:
- Ask the user to refresh and confirm
- Review the code changes
- Check console output for errors
