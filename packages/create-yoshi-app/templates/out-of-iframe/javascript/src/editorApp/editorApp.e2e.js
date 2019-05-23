describe('Editor App', () => {
  it('should display the title text', async () => {
    await page.goto('https://localhost:3100/editorApp');

    expect(await page.$eval('h2', e => e.innerText)).toEqual('Hello World!');
  });
});
