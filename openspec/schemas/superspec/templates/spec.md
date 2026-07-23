## ADDED Requirements

### Requirement: <!-- requirement name -->
<!-- One SHALL sentence. Nothing else — no rationale, no background, no "this matters because...". -->

#### Scenario: <!-- scenario name -->
- **GIVEN** <!-- starting state -->
- **WHEN** <!-- action or trigger -->
- **THEN** <!-- expected outcome -->

<!--
TERSENESS CONSTRAINT
- Requirement body: exactly one SHALL sentence. No rationale prose — that belongs in
  proposal.md or an ADR, not here.
- 1-3 scenarios per requirement. If a requirement needs more, it's probably two requirements.
- Scenario headers MUST use exactly four hashtags (####). Three hashtags or a bullet list
  instead of a heading fails silently.

--- BLOATED (do not write this) ---

### Requirement: User Authentication
The system should provide a robust and secure authentication mechanism that allows users to
log in using their credentials. This matters because we want to make sure only authorized
users can access the system, and because our previous authentication system had several
security vulnerabilities flagged in the Q3 audit, so we need to replace it with something more
modern that follows industry-standard practices for password hashing and integrates with our
existing session infrastructure.

#### Scenario: user logs in
- **WHEN** a user tries to log in with their username and password, and various other details
  are correct
- **THEN** they should generally be able to get into the system without much trouble, assuming
  everything is configured properly on the backend

--- TERSE (write this instead) ---

### Requirement: User Login
The system SHALL authenticate a user when presented with a valid username/password pair.

#### Scenario: Valid credentials
- **GIVEN** a registered user with a known password
- **WHEN** the user submits matching username and password
- **THEN** the system grants a session and returns a 200 status

#### Scenario: Invalid password
- **GIVEN** a registered user
- **WHEN** the user submits a password that does not match
- **THEN** the system denies access and returns a 401 status
-->
