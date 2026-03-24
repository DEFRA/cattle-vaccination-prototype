const { test, expect } = require('@playwright/test')

test.describe('Expression of Interest journey', () => {
  test('completes the full journey for an eligible herd in England', async ({ page }) => {
    // Start page
    await page.goto('/expression-of-interest/start')
    await expect(page).toHaveTitle(/Apply for cattle TB vaccination/i)
    await page.getByRole('button', { name: 'Start now' }).click()

    // Eligibility - herd is in England
    await expect(page).toHaveURL(/eligibility/)
    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Farm details
    await expect(page).toHaveURL(/farm-details/)
    await page.getByLabel('Farm name').fill('Test Farm')
    await page.getByLabel('County Parish Holding (CPH) number').fill('06/036/0006')
    await page.getByLabel('Address line 1').fill('1 Farm Lane')
    await page.getByLabel('Town or city').fill('Farmington')
    await page.getByLabel('Postcode').fill('GL1 2AB')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Herd details
    await expect(page).toHaveURL(/herd-details/)
    await page.getByLabel('How many cattle are in your herd?').fill('120')
    await page.getByLabel('Dairy').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Contact details
    await expect(page).toHaveURL(/contact-details/)
    await page.getByLabel('Full name').fill('Jane Smith')
    await page.getByLabel('Email address').fill('jane@example.com')
    await page.getByLabel('Phone number').fill('01234 567890')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Check answers
    await expect(page).toHaveURL(/check-answers/)
    await expect(page.getByText('Test Farm')).toBeVisible()
    await expect(page.getByText('06/036/0006')).toBeVisible()
    await expect(page.getByText('Dairy')).toBeVisible()
    await expect(page.getByText('jane@example.com')).toBeVisible()
    await page.getByRole('button', { name: /submit/i }).click()

    // Confirmation
    await expect(page).toHaveURL(/confirmation/)
    await expect(page.getByText('Expression of interest submitted')).toBeVisible()
    await expect(page.getByText(/EOI-/)).toBeVisible()
  })

  test('redirects to ineligible page for a herd outside England', async ({ page }) => {
    await page.goto('/expression-of-interest/eligibility')
    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/ineligible/)
    await expect(page.getByText(/only available for herds located in England/i)).toBeVisible()
  })
})
