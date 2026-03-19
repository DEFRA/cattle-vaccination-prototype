const { test, expect } = require('@playwright/test')

test.describe('Invitation to vaccinate journey', () => {
  test('completes the full journey from invitation to confirmation', async ({
    page,
  }) => {
    // Start page - enter invitation reference
    await page.goto('/invitation/start')
    await expect(page).toHaveTitle(/invited to vaccinate/i)
    await page.getByLabel(/invitation reference/i).fill('INV-2026-12345')
    await page.getByRole('button', { name: 'Start now' }).click()

    // Confirm farm details
    await expect(page).toHaveURL(/confirm-details/)
    await expect(page.getByText('Example Farm')).toBeVisible()
    await expect(page.getByText('12/345/6789')).toBeVisible()
    await page.getByLabel('Yes, these are correct').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Herd details
    await expect(page).toHaveURL(/herd-details/)
    await page.getByLabel('How many cattle are in your herd?').fill('85')
    await page.getByLabel('Mixed').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Preferred dates
    await expect(page).toHaveURL(/preferred-dates/)
    await page.getByLabel('May').check()
    await page.getByLabel('June').check()
    await page
      .getByLabel(/Is there anything we should know/i)
      .fill('No access on bank holidays')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Check answers
    await expect(page).toHaveURL(/check-answers/)
    await expect(page.getByText('Example Farm')).toBeVisible()
    await expect(page.getByText('Mixed')).toBeVisible()
    await expect(page.getByText(/May/)).toBeVisible()
    await expect(page.getByText(/June/)).toBeVisible()
    await page.getByRole('button', { name: /confirm and submit/i }).click()

    // Confirmation
    await expect(page).toHaveURL(/confirmation/)
    await expect(page.getByText('Registration complete')).toBeVisible()
    await expect(page.getByText(/INV-/)).toBeVisible()
  })
})
