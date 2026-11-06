/** Interact with the library's Select rather than a native HTMLSelectElement. */
export async function chooseOption(page, trigger, label) {
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
