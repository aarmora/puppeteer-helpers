import { ElementHandle, Browser } from 'puppeteer';

export async function getProperty(handle: ElementHandle, property: string) {
    if (handle) {
        return await (await handle.getProperty(property)).jsonValue();
    }
    else {
        return null;
    }
}

export async function setUpNewPage(browser: Browser) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image')
            request.abort();
        else
            request.continue();
    });
    return Promise.resolve(page);
}