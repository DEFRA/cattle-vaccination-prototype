# Invitation to Vaccinate Flow

## Purpose

For herd owners who have been pre-selected and received a formal invitation to participate in the cattle TB vaccination programme.

---

## User Flows for Spike

### Step 1: Start Page

**User sees:**
- Heading: "You have been invited to vaccinate your herd against TB"
- Description: "Your herd has been selected to take part in the cattle TB vaccination programme"
- What the service allows users to do:
  - Confirm farm and herd details
  - Provide preferred vaccination dates
  - Complete registration
- Prerequisites the user needs:
  - Invitation reference number (from their invitation letter/email)
  - CPH number
- Form field:
  - Invitation reference number (text, required, format: ABC-XXX)
- "Start now" button

**User action:** Enters invitation reference number and clicks "Start now"

**Next step:** Confirm Details

---

### Step 2: Confirm Farm Details

**User sees:**
- Pre-populated farm details from government records:
  - Farm name (e.g., "Example Farm")
  - CPH number (e.g., "06/036/0006")
  - Full address (line 1, town, county, postcode)
- Question: "Are these details correct?"
- Radio buttons: "Yes, these are correct" / "No, I need to update them"
- Continue button

**User action:** Confirms whether pre-populated details are correct

**Routing logic:**
- If "Yes" → Herd Details
- If "No" → (edit form — not yet implemented)

**Next step:** Herd Details

---

### Step 3: Herd Details

**User sees:**
- Form with fields pre-populated from invitation records:
  - Herd size (number input, pre-populated, required)
  - Herd type (radio buttons: Beef / Dairy / Mixed, pre-populated, required)
- Hint text indicating user should update if numbers have changed
- Continue button

**User action:** Confirms or updates herd details and continues

**Next step:** Preferred Dates

---

### Step 4: Preferred Vaccination Dates

**User sees:**
- Hint text: "Tell us when it would suit you for a vet to visit your farm to carry out vaccinations"
- Form with fields:
  - Preferred months (checkboxes, multiple selection allowed): April, May, June, July, August, September
  - Additional information (textarea, optional, e.g., "No access on bank holidays")
- Continue button

**User action:** Selects preferred months and optionally adds notes, then continues

**Next step:** Check Answers

---

### Step 5: Check Your Answers

**User sees:**
- Summary list organised into sections:
  - **Farm details:** Farm name, CPH number, address (from pre-populated records) — with "Change" link
  - **Herd details:** Herd size, herd type — with "Change" link
  - **Preferred dates:** Selected months, additional information — with "Change" link
- "Confirm and submit" button

**User action:** Reviews answers, optionally edits sections, then submits

**Next step:** Confirmation

---

### Step 6: Confirmation

**User sees:**
- Green confirmation panel with heading "Registration complete"
- Invitation reference number (from session, format: `ABC-XXX`)
- What happens next:
  - Vaccination visit will be arranged based on preferred dates
  - Email confirmation sent with appointment details
  - Information about what to expect on visit day
  - Instructions to contact with reference number if changes are needed
- Link to return to the prototype home page

**Journey ends here.**

---

## Mocked Data

For invitation reference ABC-111:

| Field          | Example Value |
| -------------- | ------------- |
| Farm name      | 1st Farm      |
| CPH number     | 11/111/1111   |
| Address line 1 | 1 Farm Lane   |
| Town           | Farmington    |
| County         | Herefordshire |
| Postcode       | HR1 1AB       |
| Herd size      | 50            |
| Herd type      | Beef          |

For all other invitation references:

| Field          | Example Value  |
| -------------- | -------------- |
| Farm name      | Random Farm    |
| CPH number     | 06/036/0006    |
| Address line 1 | 99 Farm Avenue |
| Town           | Leeds          |
| County         | West Yorkshire |
| Postcode       | LS21 2AB       |
| Herd size      | 100            |
| Herd type      | Dairy          |
