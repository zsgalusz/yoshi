describe('React application', () => {
  it('should display title', async () => {
    await (window as any).page.goto('http://localhost:3100/editorExampleWidget');
    await (window as any).page.waitForSelector('h2');

    expect(await (window as any).page.$eval('h2', e => e.innerText)).toEqual('Hello World!');
  });
});

//todo check (window as any)
