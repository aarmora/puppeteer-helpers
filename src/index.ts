import { ElementHandle, Browser, Overrides, Page } from 'puppeteer';

/**
 * This will get the property of the element if you pass in a handle and the property desired. 
 * 
 * @param handle 
 * @param property 
 */
export async function getPropertyByHandle(handle: ElementHandle | null, property: string = '') {
    if (handle) {
        return await (await handle.getProperty(property)).jsonValue();
    }
    else {
        return null;
    }
}

/**
 * This will get the property with just the selector and the page or handle.
 * @param page 
 * @param selector 
 * @param property 
 */
export async function getPropertyBySelector(handleOrPage: Page | ElementHandle | null, selector: string, property: string = '') {
    if (handleOrPage) {
        const handle = await handleOrPage.$(selector);
        if (handle) {
            return await (await handle.getProperty(property)).jsonValue();
        }
        else {
            return null;
        }
    }
    else {
        return null;
    }
}

/**
 * This will return an array of phone numbers
 * @param page
 */
export async function getPhoneNumber(page: Page, phoneNumbers: string[] = []): Promise<string[]> {
    const body = await getPropertyByHandle(await page.$('body'), 'innerHTML');
    const potentialPhoneNumbers = body.match(/(<a href.*?>.*?([(]?(\d{3})[)]?[(\s)?.-](\d{3})[\s.-](\d{4})).*?<\/a>)|([(]?(\d{3})[)]?[(\s)?.-](\d{3})[\s.-](\d{4}))/g);
    if (potentialPhoneNumbers) {
        potentialPhoneNumbers.concat(phoneNumbers);
    }

    return Promise.resolve(phoneNumbers);
}

/**
 * This will look for any contact pages, open them and scrape any phone numbers.
 * @param page 
 * @param browser 
 * @param phoneNumbers 
 */
export async function getPhoneNumbersFromContactPage(page: Page, browser: Browser, phoneNumbers: string[] = []): Promise<string[]> {
    // Get all the links and go to the contact pages to look for addresses
    const links = await page.$$('a');
    for (let link of links) {
        if ((await getPropertyByHandle(link, 'innerHTML')).toLowerCase().includes('contact')) {
            let contactUrl;
            try {
                contactUrl = await getPropertyByHandle(link, 'href');
                const contactPage = await setUpNewPage(browser);
                if (!contactUrl.includes('mailto:')) {
                    await contactPage.goto(contactUrl, {
                        waitUntil: 'networkidle0',
                        timeout: 3500
                    });
                    phoneNumbers = await getPhoneNumber(contactPage, phoneNumbers);
                }
                await contactPage.close();
            }
            catch (err) {
                console.log('Err while going to contact page', err, contactUrl);
            }
        }
    }

    return Promise.resolve(phoneNumbers);
}

export async function setUpNewPage(browser: Browser, post = false, formData?: any) {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image') {
            request.abort();
        }
        else {
            if (post) {
                const data: Overrides = {
                    method: 'POST',
                    postData: formData
                };
                request.continue(data);
            }
            else {
                request.continue();
            }
        }
    });
    return Promise.resolve(page);
}