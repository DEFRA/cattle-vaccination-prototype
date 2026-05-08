const { test, expect } = require('@playwright/test')

async function completeEarlySteps(page) {
  await page.goto('/test-list/search')
  await page.getByLabel('Enter a CPH, farm name, postcode or ear tag').fill('Hill Farm')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/search-results/)
  await page.getByLabel('12/345/6789').check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page).toHaveURL(/confirm-herd/)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page).toHaveURL(/select-visit-task/)
  await page.getByLabel('Prepare a list of cattle for skin tests').check()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page).toHaveURL(/prepare-skin-test-type/)
}

test.describe('Prepare a test list', () => {
  test.describe('validation', () => {
    test('shows error when search is submitted empty', async ({ page }) => {
      await page.goto('/test-list/search')
      await page.getByRole('button', { name: 'Search' }).click()

      await expect(page).toHaveURL(/search/)
      await expect(page.locator('.govuk-error-summary')).toContainText(
        'Enter a CPH, farm name, postcode or ear tag'
      )
    })

    test('shows error when no farm is selected on search results', async ({ page }) => {
      await page.goto('/test-list/search')
      await page.getByLabel('Enter a CPH, farm name, postcode or ear tag').fill('Hill Farm')
      await page.getByRole('button', { name: 'Search' }).click()

      await expect(page).toHaveURL(/search-results/)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/search-results/)
      await expect(page.locator('.govuk-error-summary')).toContainText('Select a farm')
    })

    test('shows error when no visit task is selected', async ({ page }) => {
      await page.goto('/test-list/search')
      await page.getByLabel('Enter a CPH, farm name, postcode or ear tag').fill('Hill Farm')
      await page.getByRole('button', { name: 'Search' }).click()
      await page.getByLabel('12/345/6789').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page).toHaveURL(/confirm-herd/)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/select-visit-task/)
      await page.getByRole('button', { name: 'Continue' }).click()

      // form POSTs to /select-journey, which re-renders select-visit-task on error
      await expect(page).toHaveURL(/select-journey/)
      await expect(page.locator('.govuk-error-summary')).toContainText(
        'Select what you will do on this visit'
      )
    })

    test('shows error when no test type is selected', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-type/)
      await expect(page.locator('.govuk-error-summary')).toContainText(
        'Select which skin test you are preparing a list for'
      )
    })

    test('shows error when no warning choice is made', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      // this page uses an inline field error rather than an error summary
      await expect(page.locator('.govuk-error-message')).toContainText(
        'Select what you would like to do'
      )
    })

    test('shows error when no assign mode is selected', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await expect(page.locator('.govuk-error-summary')).toContainText(
        'Select how you want to assign cattle to each test'
      )
    })

    test('assign order defaults to SICCT first if no explicit selection made', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Choose which cattle go on each list manually').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-order/)
      // SICCT is pre-selected by default — clicking Continue without choosing should proceed
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-cattle/)
      await expect(page.locator('.govuk-caption-l')).toContainText('SICCT')
    })
  })

  test.describe('SICCT path', () => {
    test('shows vaccination mismatch warning when SICCT is selected', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await expect(page.getByText('Check your skin test choice')).toBeVisible()
      await expect(
        page.getByText("You've chosen SICCT but this farm has vaccinated cattle")
      ).toBeVisible()
    })

    test('SICCT warning → switch to Both → auto assign → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await page.getByLabel('Switch to Both').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('SICCT warning → continue with SICCT → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await page.getByLabel('Continue with SICCT only').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })
  })

  test.describe('DIVA path', () => {
    test('shows vaccination mismatch warning when DIVA is selected', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('Yes, the herd is all BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await expect(page.getByText('Check your skin test choice')).toBeVisible()
      await expect(
        page.getByText("You've chosen DIVA but this farm has unvaccinated cattle")
      ).toBeVisible()
    })

    test('DIVA warning → switch to Both → auto assign → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('Yes, the herd is all BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await page.getByLabel('Switch to Both').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('DIVA warning → continue with DIVA → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('Yes, the herd is all BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-warning/)
      await page.getByLabel('Continue with DIVA only').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })
  })

  test.describe('Both path', () => {
    test('Both → auto assign → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('Both → manual assign → SICCT first → assign cattle → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByLabel('Choose which cattle go on each list manually').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-order/)
      await page.getByLabel('Choose SICCT cattle first').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-cattle/)
      await expect(page.locator('.govuk-caption-l')).toContainText('step 1 of 2')
      await page.locator('input[type="checkbox"][name="tl_assignedCattle"]').first().check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-cattle/)
      await expect(page.locator('.govuk-caption-l')).toContainText('step 2 of 2')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('Both → manual assign → DIVA first → assign cattle → reaches skin test list', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign/)
      await page.getByLabel('Choose which cattle go on each list manually').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-order/)
      await page.getByLabel('Choose DIVA cattle first').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-cattle/)
      await expect(page.locator('.govuk-caption-l')).toContainText('step 1 of 2')
      await page.locator('input[type="checkbox"][name="tl_assignedCattle"]').first().check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/prepare-skin-test-assign-cattle/)
      await expect(page.locator('.govuk-caption-l')).toContainText('step 2 of 2')
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })
  })

  test.describe('skin test list confirmed', () => {
    test('SICCT journey reaches confirmed page', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Continue with SICCT only').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await page.getByRole('link', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list-confirmed/)
      await expect(page.getByText('You can now print your list')).toBeVisible()
    })

    test('Both journey confirms SICCT then DIVA before reaching confirmed page', async ({ page }) => {
      await completeEarlySteps(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await page.getByRole('link', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list-confirmed/)
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await page.getByRole('link', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list-confirmed/)
      await expect(page.getByText('You can now print your list')).toBeVisible()
    })
  })
})
