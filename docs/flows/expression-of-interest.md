# Expression of Interest Flow

## Purpose

For herd owners who discover the service independently and want to register their interest in the cattle TB vaccination programme.

---

## User Flows for Spike

### Step 1: Start Page

**User sees:**
- Service description: "Use this service to express an interest in the cattle TB vaccination programme"
- What the service allows users to do:
  - Check if their herd is eligible for TB vaccination
  - Register their interest
  - Provide details about their farm and herd
- Prerequisites the user needs:
  - County Parish Holding (CPH) number
  - Number of cattle in herd
  - Contact details
- "Start now" button

**User action:** Clicks "Start now"

**Next step:** Eligibility

---

### Step 2: Eligibility Check

**User sees:**
- Question: "Is your herd located in England?"
- Radio buttons: "Yes" / "No"
- Continue button

**User action:** Selects yes or no and continues

**Routing logic:**
- If "Yes" → Farm Details
- If "No" → Ineligible (end of journey)

---

### Step 2a: Ineligible Outcome (terminal)

**User sees:**
- Message: "The cattle TB vaccination programme is currently only available for herds located in England"
- Link to external gov.uk guidance on TB vaccination

**Journey ends here.**

---

### Step 3: Farm Details

**User sees:**
- Form with fields:
  - Farm name (text, required)
  - County Parish Holding (CPH) number (text, required, format: 12/345/6789)
  - Address line 1 (text, required)
  - Address line 2 (text, optional)
  - Town or city (text, required)
  - Postcode (text, required)
- Continue button

**User action:** Fills in farm details and continues

**Next step:** Herd Details

---

### Step 4: Herd Details

**User sees:**
- Form with fields:
  - Herd size (number input, minimum 1, required)
  - Herd type (radio buttons: Beef / Dairy / Mixed, required)
- Continue button

**User action:** Fills in herd details and continues

**Next step:** Contact Details

---

### Step 5: Contact Details

**User sees:**
- Form with fields:
  - Full name (text, required)
  - Email address (text, required, hint: "We'll use this to send you updates about your application")
  - Phone number (text, optional)
- Continue button

**User action:** Fills in contact details and continues

**Next step:** Check Answers

---

### Step 6: Check Your Answers

**User sees:**
- Summary list organised into sections:
  - **Farm details:** Farm name, CPH number, full address — with "Change" link
  - **Herd details:** Herd size, herd type — with "Change" link
  - **Contact details:** Full name, email address, phone number — with "Change" link
- "Submit expression of interest" button

**User action:** Reviews answers, optionally edits sections, then submits

**Next step:** Confirmation

---

### Step 7: Confirmation

**User sees:**
- Green confirmation panel with heading "Expression of interest submitted"
- Generated reference number (format: `EOI-2026-XXXXX`)
- What happens next:
  - Application will be reviewed
  - User will be contacted to confirm eligibility
  - Vaccination visits arranged if approved
  - Response within 10 working days
- Link to return to the prototype home page

**Journey ends here.**

---

## Data Collected

| Field | Type | Required |
|-------|------|----------|
| Herd in England | Boolean (yes/no) | Yes |
| Farm name | Text | Yes |
| CPH number | Text (format: 12/345/6789) | Yes |
| Address line 1 | Text | Yes |
| Address line 2 | Text | No |
| Town or city | Text | Yes |
| Postcode | Text | Yes |
| Herd size | Number (min 1) | Yes |
| Herd type | Enum (Beef/Dairy/Mixed) | Yes |
| Full name | Text | Yes |
| Email address | Email | Yes |
| Phone number | Text | No |
