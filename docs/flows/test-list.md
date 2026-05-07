# Test List Flow

## Purpose

For vets or field officers preparing a list of cattle for skin testing at a specific farm. The service looks up the farm's cattle from the Cattle Tracing System, allows the user to confirm which animals will be tested (removing any that are too young, deceased, etc.), and produces a formatted print-ready skin test list — either SICCT, DIVA, or both.

There are two sub-flows within this feature:

- **Prepare skin test** — the full workflow: find a farm, choose test type, optionally assign cattle to lists (for mixed herds), then format and confirm the list. Cattle can be removed from the list using a back-navigation link on the skin test list page.
- **Simple download list** — a shorter path that goes straight from test-type selection to a formatted preview list without the cattle-removal steps.

---

## Flow 1: Prepare Skin Test

### Step 1: Search

**URL:** `/test-list/search`

**User sees:**

- Heading: "Prepare a test list"
- Description: "You're preparing a list of cattle for skin testing."
- Text input: "Enter a CPH, farm name, postcode or ear tag"
- Search button

**User action:** Enters a search term and submits.

**Routing logic:**

- Empty search → validation error stays on this page
- Valid search term → Search results

---

### Step 2: Search Results

**URL:** `/test-list/search-results`

**User sees:**

- Number of farms matched
- Grouped list of farms, each with farm name, location, postcode, cattle count
- Farms with multiple holdings show separate radio options per CPH
- If no results: "No results found" with a link to search again

**User action:** Selects a specific CPH holding radio button and continues.

**Routing logic:**

- No selection → validation error
- Selection made → Confirm herd

---

### Step 3: Confirm Herd

**URL:** `/test-list/confirm-herd`

**User sees:**

- Farm name as heading
- Summary list: farm name, CPH, address, number of cattle (sourced from CTS with caveat it may not be up to date)
- Optionally: vaccinated count, TB status, day 1 of last TB test, last breakdown
- Continue button
- "Choose a different farm" link

**User action:** Confirms the herd details and continues.

**Next step:** Select visit task

---

### Step 4: Select Visit Task

**URL:** `/test-list/select-visit-task` (GET) — form POSTs to `/test-list/select-journey`

**User sees:**

- Farm name as caption
- Radio: "Prepare a list of cattle for skin tests" (only option currently)
- Continue button

**User action:** Selects the task and continues.

**Next step:** Prepare skin test type

---

### Step 5: Prepare Skin Test Type

**URL:** `/test-list/prepare-skin-test-type`

**User sees:**

- Farm name as caption
- Heading: "Are the cattle vaccinated against bovine TB?"
- Radios:
  - "Yes, the herd is all BCG vaccinated" (DIVA) — hint: DIVA is used for BCG vaccinated cattle
  - "None of the herd has been BCG vaccinated" (SICCT) — hint: SICCT is used for unvaccinated cattle
  - "The herd has a mix of vaccinated and unvaccinated cattle" (DIVA and SICCT) — hint: you'll need both tests

**User action:** Selects the test type and continues.

**Routing logic:**

- SICCT selected + farm has vaccinated cattle → Warning (Step 5a)
- DIVA selected + farm has unvaccinated cattle → Warning (Step 5a)
- Both (DIVA and SICCT) → Assign cattle (Step 6)
- SICCT or DIVA with no mismatch → Skin test list (Step 10) directly

---

### Step 5a: Vaccination Mismatch Warning (conditional)

**URL:** `/test-list/prepare-skin-test-warning`

**User sees:**

- Farm name as caption
- Warning text explaining the mismatch:
  - SICCT with vaccinated cattle: warns that SICCT is not appropriate for BCG vaccinated animals; lists up to 10 mismatched ear tags
  - DIVA with unvaccinated cattle: warns that DIVA is only appropriate for vaccinated animals; lists up to 10 mismatched ear tags
- Radios:
  - "Switch to Both" — prepare SICCT for unvaccinated and DIVA for vaccinated
  - "Continue with SICCT only" / "Continue with DIVA only" — only matching cattle will appear on the list
- Continue button

**User action:** Chooses whether to switch to Both or continue with the original choice.

**Routing logic:**

- Switch to Both → Assign cattle (Step 6)
- Continue with original → Skin test list (Step 10) directly

---

### Step 6: Assign Cattle — Both SICCT and DIVA only

These steps only appear when the test type is "Both" (DIVA and SICCT).

#### Step 6a: Assign Mode

**URL:** `/test-list/prepare-skin-test-assign`

**User sees:**

- Caption: farm name – DIVA and SICCT
- Heading: "How would you like to assign cattle to each test?"
- Radios:
  - "Assign automatically based on vaccination status" — vaccinated → DIVA, unvaccinated → SICCT
  - "Choose which cattle go on each list manually"
- Continue button

**Routing logic:**

- Automatic → Skin test list (Step 10) directly, cattle split by vaccination status
- Manual → Assign order (Step 6b)

#### Step 6b: Assign Order (manual only)

**URL:** `/test-list/prepare-skin-test-assign-order`

**User sees:**

- Radios: "Choose SICCT cattle first" / "Choose DIVA cattle first"

**Routing logic:**

- Selection made → Assign cattle for first chosen test (Step 6c)

#### Step 6c: Assign Cattle (manual only — runs twice)

**URL:** `/test-list/prepare-skin-test-assign-cattle`

**User sees:**

- Caption: farm name – [current test label], (step 1 of 2) or (step 2 of 2)
- Two-column layout with sort controls on the left
- Table of all animals (or remaining animals on step 2), each with a checkbox, ear tag, age, DOB, sex, breed — VAX and DUP flags shown where relevant
- "Continue" button (first pass) or "Save changes" (edit mode)

**User action:** Ticks every animal for the current test list and continues.

**Routing logic (first pass):**

- After confirming first test selection → Assign cattle for second test (same page, second pass)

**Routing logic (second pass):**

- After confirming second test selection → Skin test list (Step 10) directly

This page is also available as `/test-list/prepare-skin-test-assign-cattle/edit/:test` for editing assignments from the skin test list page.

---

### Step 7: Remove Cattle (optional — accessed from Step 10)

**URL:** `/test-list/prepare-skin-test-untested`

This step is not part of the forward flow. It is reached by clicking the "Remove cattle from list" link on the skin test list page (Step 10).

**User sees:**

- Caption: farm name – [test type]
- Heading: "Remove cattle"
- Two-column layout with sort controls on the left
- Table of all candidates (filtered by test type / assignments), each with a checkbox, ear tag, age, DOB, sex, breed — VAX and DUP flags shown
- "Continue" button
- "Skip — every animal will be tested" link

**User action:** Ticks any cattle to be excluded and continues (or skips if all will be tested).

**Routing logic:**

- Some animals ticked → Reason per animal (Step 8), one per selected animal
- No animals ticked → Skin test list (Step 10) directly
- Skip link → Skin test list (Step 10) directly

---

### Step 8: Reason for Removal (per animal, loops)

**URL:** `/test-list/prepare-skin-test-untested-reason/:index`

**User sees:**

- Progress indicator: "Cattle X of Y"
- Animal details: large ear tag display with VAX/DUP flags, age, DOB, sex, breed
- Radios: reason why this animal will not be tested
  - "Cattle too young"
  - "Cattle deceased"
  - "Other reason" (with conditional text input for free text)
- "Save and continue" button

**User action:** Selects a reason and continues. Repeats for each removed animal.

**Next step:** After the last animal → Confirm removals (Step 9)

---

### Step 9: Confirm Removals

**URL:** `/test-list/prepare-skin-test-untested-confirm`

**User sees:**

- If no animals removed: message confirming every animal will appear; option to go back and mark some
- If animals removed: count of excluded animals with a table showing ear tag, age, DOB, sex, breed, reason
- "Continue to list settings" button
- "Change which cattle will not be tested" link (if animals removed)

**Next step:** Skin test list (Step 10)

---

### Step 10: Skin Test List — Format and Preview

**URL:** `/test-list/skin-test-list`

**User sees:**

- Farm name and test label as caption (e.g. "Birch Hollow Farm - SICCT – Step 1 of 2")
- Contextual inset text for Both journey (e.g. "This list is for SICCT only. You'll prepare a separate DIVA list…")
- Two-column layout:
  - **Settings panel** (left): sort, order, text size, orientation, line spacing, column toggles, emphasise last 4 digits checkbox — all update live without submitting; "Apply changes" re-sorts
  - **Preview panel** (right): formatted A4-style sheet with farm summary table (CPH, cattle count, date list was made), DUP/VAX key, and the skin test recording table with A and B measurement rows per animal and columns for skin measurements, reaction description, and overall result
- Continue link (navigates to Confirmed — does not save or submit)
- "Remove cattle from list" link → Remove cattle step (Step 7)
- "Change cattle on the SICCT/DIVA list" links (Both journey only)

**Settings panel controls:**
| Control | Options |
|---|---|
| Preview options | Emphasise last 4 digits of ear tag |
| Columns | Age, DOB, Sex, Breed (toggleable) |
| Sort by | Ear tag (last 4 digits), Ear tag (full), Age, Sex, Breed, DOB |
| Order | Ascending / Descending |
| Text size | Smaller / Standard / Large |
| Page orientation | Portrait / Landscape |
| Line spacing | Tight / Standard / Spaced |

**User action:** Adjusts settings, then clicks Continue to go to the confirmed page.

**Routing logic:**

- Continue → Skin test list confirmed (Step 11)

---

### Step 11: Skin Test List Confirmed

**URL:** `/test-list/skin-test-list-confirmed`

**User sees:**

- Heading: "You can now print your list"
- If Both journey, SICCT confirmed: prompt to continue to the DIVA list with a Continue button (POSTs to `/test-list/prepare-skin-test-next`, which sets phase to `diva` and redirects back to Step 10)
- If Both journey, both lists confirmed: download links for SICCT and DIVA PDFs; "Save lists to print later" button; links to prepare another list or exit
- If single test journey: download link for PDF; "Save list to print later" button; links to prepare another list or exit

**Journey ends here** (or loops back through Step 10 for the second list in a Both journey via POST to `/test-list/prepare-skin-test-next`).

---

## Flow 2: Simple Download List

A shorter path for producing a formatted skin test list without the cattle-removal steps.

### Step 1: Test Type

**URL:** `/test-list/test-type` (entry point — requires farm to be selected first via search/confirm flow)

**User sees:**

- Heading: "Which skin test are you preparing a list for?"
- Radios: SICCT / DIVA / Both SICCT and DIVA (with hint text)

**Next step:** Download list

---

### Step 2: Download List

**URL:** `/test-list/download-list`

**User sees:**

- Heading with selected test type as caption
- Two-column layout:
  - **Settings panel**: file format (PDF/CSV), emphasise last 4 digits, columns, sort by, order, text size, orientation, line spacing
  - **Preview panel**: formatted sheet with farm summary and cattle table (no skin measurement sub-columns — simplified layout for initial list preparation)

**Settings panel controls:**
| Control | Options |
|---|---|
| File format | Printable list (PDF) / CSV |
| Preview options | Emphasise last 4 digits |
| Columns | Age, DOB, Sex, Breed, Test type (SICCT/DIVA — shown only when Both selected) |
| Sort by | Ear tag, Age, DOB, Sex, Breed, Test type (when Both) |
| Order | Ascending / Descending |
| Text size | Smaller / Standard / Large |
| Page orientation | Portrait / Landscape |
| Line spacing | Tight / Standard / Spaced |

**Journey ends here** — user prints/downloads the list.

---

## Routing Summary (Prepare Skin Test)

```
search
  → search-results
    → confirm-herd
      → select-visit-task (POST: /test-list/select-journey)
        → prepare-skin-test-type
            ├── [mismatch] → prepare-skin-test-warning
            │                   ├── switch-both → prepare-skin-test-assign
            │                   └── continue    → skin-test-list
            ├── Both → prepare-skin-test-assign
            │             ├── auto  → skin-test-list
            │             └── manual → prepare-skin-test-assign-order
            │                            → prepare-skin-test-assign-cattle (×2)
            │                              → skin-test-list
            └── SICCT/DIVA (no mismatch) → skin-test-list

skin-test-list
  ├── [optional back-nav] "Remove cattle" link
  │     → prepare-skin-test-untested
  │           ├── some animals → prepare-skin-test-untested-reason (×N)
  │           │                    → prepare-skin-test-untested-confirm
  │           │                      → skin-test-list
  │           └── none / skip → skin-test-list
  └── Continue → skin-test-list-confirmed
                   ├── Both, SICCT confirmed
                   │     → POST /prepare-skin-test-next → skin-test-list (DIVA phase)
                   └── final → journey ends
```

---

## Session Data Keys

| Key                                      | Set by                 | Purpose                                                                       |
| ---------------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `tl_cattleSearch`                        | Search page            | Search term entered                                                           |
| `tl_selectedCattle`                      | Search results         | Chosen CPH                                                                    |
| `tl_herd`                                | Confirm herd           | Full farm record (farm, CPH, address, cattle count)                           |
| `tl_journey`                             | Select visit task      | Always `"prepare-skin-test"` for now                                          |
| `tl_prepareSkinTestType`                 | Prepare skin test type | `"SICCT"`, `"DIVA"`, or `"Both"`                                              |
| `tl_prepareSkinTestPhase`                | Routes                 | `"sicct"` or `"diva"` — tracks which list is being prepared in a Both journey |
| `tl_warningContext`                      | Routes                 | `"SICCT-with-vax"` or `"DIVA-without-vax"` — triggers warning page            |
| `tl_prepareAssignMode`                   | Assign page            | `"auto"` or `"manual"`                                                        |
| `tl_prepareAssignFirstTest`              | Assign order page      | `"sicct"` or `"diva"` — which list to fill first                              |
| `tl_prepareAssignCurrentTest`            | Assign cattle page     | `"sicct"` or `"diva"` — which test is currently being assigned                |
| `tl_prepareAssignCompletedTests`         | Assign cattle page     | Array of test keys already assigned (e.g. `["sicct"]`)                        |
| `tl_prepareSkinTestAssignments`          | Assign cattle page     | `{ sicct: [...officialIds], diva: [...officialIds] }`                         |
| `tl_prepareSkinTestUntested`             | Remove cattle page     | Array of `officialId` strings to exclude                                      |
| `tl_prepareSkinTestUntestedReasons`      | Reason pages           | Map of `officialId → reason code`                                             |
| `tl_prepareSkinTestUntestedReasonOthers` | Reason pages           | Map of `officialId → free text`                                               |
| `tl_currentPrepareUntestedIndex`         | Reason pages           | Current index in the reason-per-animal loop                                   |
| `tl_prepareSkinTestUntestedSortBy`       | Remove/assign pages    | Active sort field on remove cattle and assign cattle pages                    |
| `tl_prepareSkinTestUntestedSortDirection`| Remove/assign pages    | `"asc"` or `"desc"` for those pages                                           |
| `tl_skinTestPreviewOptions`              | Skin test list page    | Visible column names + `"Emphasise-last-five"` flag                           |
| `tl_skinTestSortBy`                      | Skin test list page    | Active sort field                                                             |
| `tl_skinTestSortDirection`               | Skin test list page    | `"asc"` or `"desc"`                                                           |
| `tl_skinTestPreviewTextSize`             | Skin test list page    | `"small"`, `"standard"`, or `"large"`                                         |
| `tl_skinTestPreviewOrientation`          | Skin test list page    | `"portrait"` or `"landscape"`                                                 |
| `tl_skinTestPreviewSpacing`              | Skin test list page    | `"tight"`, `"standard"`, or `"spaced"`                                        |

---

## Mocked Data

Cattle data is looked up per CPH from `ANIMALS_BY_CPH` in `helpers/farm-generator.js`. Each animal record contains:

| Field                | Type    | Notes                                                                                          |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `officialId`         | String  | Full ear tag (e.g. `UK341234400156`)                                                           |
| `vaccinationStatus`  | String  | `"Vaccinated"` or `"Not vaccinated"` — determines SICCT/DIVA assignment                        |
| `age` / `ageDisplay` | String  | e.g. `"5Y"`                                                                                    |
| `dob`                | String  | DD/MM/YYYY                                                                                     |
| `sex`                | String  | `M` or `F`                                                                                     |
| `breed`              | String  | Breed code                                                                                     |
| `isDuplicate`        | Boolean | Set by `enrichWithFlags` — true if another animal on the farm shares the last 4 ear tag digits |
| `isVaccinated`       | Boolean | Derived from `vaccinationStatus`                                                               |

The search covers 25 Yorkshire farms defined in `TL_HERD_DATA` in `data/test-list-farms.js`. Farms can be found by CPH, farm name, postcode, or ear tag.
