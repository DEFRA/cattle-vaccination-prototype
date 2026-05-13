const { test, expect } = require('@playwright/test')

// ============================================================
// Shared helpers
// ============================================================

async function searchAndConfirmHerd(page) {
  await page.goto('/test-list/search')
  await page.getByLabel('Enter a CPH, farm name, postcode or ear tag').fill('Hill Farm')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByLabel('12/345/6789').check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function startPrepare(page) {
  await searchAndConfirmHerd(page)
  await page.getByLabel('Prepare a list of cattle for skin tests').check()
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function startReport(page) {
  await searchAndConfirmHerd(page)
  await page.getByLabel('Report skin test results').check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('I did').check()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Day 1
  await page.getByLabel('Day', { exact: true }).fill('01')
  await page.getByLabel('Month', { exact: true }).fill('03')
  await page.getByLabel('Year', { exact: true }).fill('2025')
  await page.getByRole('button', { name: 'Continue' }).click()
  // Day 2
  await page.getByLabel('Day', { exact: true }).fill('04')
  await page.getByLabel('Month', { exact: true }).fill('03')
  await page.getByLabel('Year', { exact: true }).fill('2025')
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function selectTestTypes(page, testTypes) {
  if (testTypes.includes('sicct')) {
    await page.getByLabel('SICCT test').check()
    await page.locator('#tl_reportSicctBatchNumbers_0').fill('BATCH-SICCT')
  }
  if (testTypes.includes('diva')) {
    await page.getByLabel('DIVA test').check()
    await page.locator('#tl_reportDivaBatchNumbers_0').fill('BATCH-DIVA')
  }
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function enterSicctMeasurements(page) {
  await page.locator('#tl_bovineDay1').fill('10')
  await page.locator('#tl_bovineDay2').fill('14')
  await page.locator('#tl_avianDay1').fill('8')
  await page.locator('#tl_avianDay2').fill('9')
  await page.getByRole('button', { name: 'Save and continue' }).click()
}

async function enterDivaMeasurements(page) {
  await page.locator('#tl_bovineDay1').fill('10')
  await page.locator('#tl_bovineDay2').fill('14')
  await page.getByRole('button', { name: 'Save and continue' }).click()
}

// ============================================================
// Prepare a test list
// ============================================================

test.describe('Prepare a test list', () => {
  test.describe('SICCT path', () => {
    test('SICCT warning → switch to Both → auto assign → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Switch to Both').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('SICCT warning → continue with SICCT → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Continue with SICCT only').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('SICCT → skin test list → confirmed', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('None of the herd has been BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Continue with SICCT only').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('link', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list-confirmed/)
      await expect(page.getByText('You can now print your list')).toBeVisible()
    })
  })

  test.describe('DIVA path', () => {
    test('DIVA warning → switch to Both → auto assign → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('Yes, the herd is all BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Switch to Both').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('DIVA warning → continue with DIVA → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('Yes, the herd is all BCG vaccinated').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Continue with DIVA only').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })
  })

  test.describe('Both path', () => {
    test('Both → auto assign → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('Both → manual assign SICCT first → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Choose which cattle go on each list manually').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Choose SICCT cattle first').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.locator('input[type="checkbox"][name="tl_assignedCattle"]').first().check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('Both → manual assign DIVA first → skin test list', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Choose which cattle go on each list manually').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Choose DIVA cattle first').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.locator('input[type="checkbox"][name="tl_assignedCattle"]').first().check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list/)
      await expect(page).toHaveTitle(/List of cattle for skin tests/)
    })

    test('Both → auto assign → confirms SICCT then DIVA → confirmed page', async ({ page }) => {
      await startPrepare(page)
      await page.getByLabel('The herd has a mix of vaccinated and unvaccinated cattle').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByLabel('Assign automatically based on vaccination status').check()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('link', { name: 'Continue' }).click()
      await page.getByRole('button', { name: 'Continue' }).click()
      await page.getByRole('link', { name: 'Continue' }).click()

      await expect(page).toHaveURL(/skin-test-list-confirmed/)
      await expect(page.getByText('You can now print your list')).toBeVisible()
    })
  })
})

// ============================================================
// Report skin test results
// ============================================================

test.describe('Report skin test results', () => {
  test('SICCT: multi-day Day 1 flag shows on check-answers', async ({ page }) => {
    await searchAndConfirmHerd(page)
    await page.getByLabel('Report skin test results').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('I did').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Day', { exact: true }).fill('01')
    await page.getByLabel('Month', { exact: true }).fill('03')
    await page.getByLabel('Year', { exact: true }).fill('2025')
    await page.getByLabel('Select if Day 1 took more than a single day to complete').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Day', { exact: true }).fill('04')
    await page.getByLabel('Month', { exact: true }).fill('03')
    await page.getByLabel('Year', { exact: true }).fill('2025')
    await page.getByRole('button', { name: 'Continue' }).click()
    await selectTestTypes(page, ['sicct'])
    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
    await expect(page.getByText('Took more than one day')).toBeVisible()
  })

  test('SICCT: no reactions, all cattle tested → check-answers', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct'])

    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
  })

  test('SICCT: some cattle react, all others tested → check-answers with measurements', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct'])

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#report-reactor-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await enterSicctMeasurements(page)

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
    await expect(page.getByRole('heading', { name: 'SICCT reactor measurements' })).toBeVisible()
  })

  test('SICCT: no reactions, some cattle untested → check-answers with untested reasons', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct'])

    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#report-untested-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('Cattle too young').check()
    await page.getByRole('button', { name: 'Save and continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
  })

  test('DIVA: no reactions, all cattle tested → check-answers', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['diva'])

    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
  })

  test('DIVA: some cattle react → check-answers with DIVA measurements', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['diva'])

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.locator('#report-reactor-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await enterDivaMeasurements(page)

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
    await expect(page.getByRole('heading', { name: 'DIVA reactor measurements' })).toBeVisible()
  })

  test('Both SICCT+DIVA: no reactions → check-answers', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct', 'diva'])

    await page.getByLabel('SICCT test results first').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // SICCT: no reaction
    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // DIVA: no reaction
    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
  })

  test('Both SICCT+DIVA: SICCT reactors, no DIVA reactors → check-answers', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct', 'diva'])

    await page.getByLabel('SICCT test results first').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // SICCT: has reactors
    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#report-reactor-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await enterSicctMeasurements(page)

    // DIVA: no reaction
    await page.getByLabel('No').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
    await expect(page.getByRole('heading', { name: 'SICCT reactor measurements' })).toBeVisible()
  })

  test('Both SICCT+DIVA: reactors on both tests → check-answers', async ({ page }) => {
    await startReport(page)
    await selectTestTypes(page, ['sicct', 'diva'])

    await page.getByLabel('SICCT test results first').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    // SICCT reactors
    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#report-reactor-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await enterSicctMeasurements(page)

    // DIVA reactors
    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.locator('#report-reactor-0').check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await enterDivaMeasurements(page)

    await page.getByLabel('Yes').check()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/report-check-answers/)
    await expect(page.getByRole('heading', { name: 'SICCT reactor measurements' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DIVA reactor measurements' })).toBeVisible()
  })
})
