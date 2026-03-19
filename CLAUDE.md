# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A GOV.UK Prototype Kit application for prototyping cattle vaccination user journeys, built on the [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk) (Express.js + Nunjucks), owned by Defra DDTS.

Bovine TB (bTB) currently have a test called SICCT but there is a new type of test coming called DIVA - and this new test is coming because of a new vaccine which breaks the original SICCT tests. The service this prototype is helping to develop will be to aid DIVA testing, and any 'mixed' herds where there is an animal with the new vaccine, and cannot be SICCT tested as it will give a false positive.

## Commands

```bash
npm run dev          # Start development server with hot reload (http://localhost:3000)
npm start            # Start production server
npm test             # Run unit tests with Jest
npm run format       # Auto-format code with Prettier
npm run format:check # Check formatting without writing
```

## Code Style

Configured via `.prettierrc.js`:
- No semicolons
- Single quotes
- 2-space indentation
- No trailing commas

## Architecture

The app follows the standard GOV.UK Prototype Kit pattern:

- **`app/routes.js`** — Express route handlers. Add all custom routes here.
- **`app/views/`** — Nunjucks templates. Templates extend the GOV.UK layout via `govuk-prototype-kit`.
- **`app/assets/`** — SCSS and JS assets, compiled by the kit. Entry points are `application.scss` and `application.js`.
- **`app/filters.js`** — Custom Nunjucks filters available in all templates.
- **`app/data/session-data-defaults.js`** — Initial session state, accessible in routes and templates.
- **`app/config.json`** — Service name and plugin settings (GOV.UK rebrand is enabled).

Request flow: HTTP request → `routes.js` → Nunjucks template → HTML response. Session data persists across requests within a user session but is ephemeral (lost on server restart) — this is by design for a prototype.

## Testing

Unit tests live in `test/routes.test.js` and are run with [Jest](https://jestjs.io/) + [supertest](https://github.com/ladjs/supertest).

The `govuk-prototype-kit` module is mocked so tests run without the full kit server. Each test creates a minimal Express app with a stubbed `req.session.data` and asserts the correct redirect destination.

To add tests for new routes, follow the pattern in `test/routes.test.js`: add a `describe` block for the flow and individual `it` assertions for each redirect outcome.

## Deployment

- Deployed to Defra's CDP (Core Delivery Platform) via GitHub Actions on push to `main`
- Docker images use `defradigital/node` base images
- HTTPS is handled by the CDP nginx layer, not the app
- Basic auth password configured via `PASSWORD` or `PASSWORD_KEYS` environment variables (see `.env.template`)
- Secrets managed via CDP Portal, not committed to the repo
