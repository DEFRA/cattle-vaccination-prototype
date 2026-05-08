# Update the prototype from definitions.

The flow to update is specified as an argument (e.g. `/update-prototype test-list`). The argument maps to a file in `docs/flows/` — e.g. `test-list` → `docs/flows/test-list.md`.

If no argument is provided, list the available flows from `docs/flows/` and ask the user which one to update.

- Read the flow definition file at `docs/flows/<argument>.md`
- Compare this with the existing implementation and tests for that flow
- Summarise the differences and request approval to plan
- If approval to plan is given create a test and implementation plan and request approval to implement
- If approval to implement is given, implement the change and ensure the tests pass
- Update the flow definition file to match how it now works, after the change

## CRITICAL INSTRUCTIONS TO THE AGENT
It is critical that two separate approvals are sought from the user, approval to plan and approval to implement are separate and **MUST NOT** be combined.
