const { test, expect } = require('@playwright/test')

test.describe('Invitation to vaccinate journey', () => {
  test('completes the full journey using reference ABC-111 (1st Farm)', async ({ page }) => {
    // Start page - enter invitation reference
    await page.goto('/invitation/start')
    await expect(page).toHaveTitle(/invited to vaccinate/i)
    await page.getByLabel(/invitation reference/i).fill('ABC-111')
    await page.getByRole('button', { name: 'Start now' }).click()

    // Confirm farm details - should show 1st Farm data
    await expect(page).toHaveURL(/confirm-details/)
    await expect(page.getByText('1st Farm')).toBeVisible()
    await expect(page.getByText('11/111/1111')).toBeVisible()
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
    await page.getByLabel(/Is there anything we should know/i).fill('No access on bank holidays')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Check answers
    await expect(page).toHaveURL(/check-answers/)
    await expect(page.getByText('1st Farm')).toBeVisible()
    await expect(page.getByText('Mixed')).toBeVisible()
    await expect(page.getByText(/May/)).toBeVisible()
    await expect(page.getByText(/June/)).toBeVisible()
    await page.getByRole('button', { name: /confirm and submit/i }).click()

    // Confirmation
    await expect(page).toHaveURL(/confirmation/)
    await expect(page.getByText('Registration complete')).toBeVisible()
    await expect(page.getByText('ABC-111')).toBeVisible()
  })

  test('completes the full journey using an unknown reference (Random Farm)', async ({ page }) => {
    // Start page - enter any other reference
    await page.goto('/invitation/start')
    await page.getByLabel(/invitation reference/i).fill('ABC-999')
    await page.getByRole('button', { name: 'Start now' }).click()

    // Confirm farm details - should show default data
    await expect(page).toHaveURL(/confirm-details/)
    await expect(page.getByText('Random Farm')).toBeVisible()
    await expect(page.getByText('06/036/0006')).toBeVisible()
    await page.getByLabel('Yes, these are correct').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Herd details - pre-populated with 100, Dairy
    await expect(page).toHaveURL(/herd-details/)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Preferred dates
    await expect(page).toHaveURL(/preferred-dates/)
    await page.getByLabel('July').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Check answers
    await expect(page).toHaveURL(/check-answers/)
    await expect(page.getByText('Random Farm')).toBeVisible()
    await expect(page.getByText('Dairy')).toBeVisible()
    await page.getByRole('button', { name: /confirm and submit/i }).click()

    // Confirmation
    await expect(page).toHaveURL(/confirmation/)
    await expect(page.getByText('Registration complete')).toBeVisible()
    await expect(page.getByText('ABC-999')).toBeVisible()
  })
})
