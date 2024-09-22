const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;
const fs = require("fs");

let sumTotalValues = 0;
const articles = [];

const wallet = [
    {
        id: 1,
        symbol: "BABYDOGE",
        link: "https://coinmarketcap.com/currencies/1m-baby-doge-coin/",
        amount: 279000,
    },
];

const headless = true;
const mailToSend = "seovileo@gmail.com";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkPrice(wallet) {
    const browser = await puppeteer.launch({
        headless: headless,
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Opcje poprawiające stabilność
    });

    try {
        for (const token of wallet) {
            const page = await browser.newPage();
            try {
                await page.goto(token.link, {
                    waitUntil: "networkidle2",
                    timeout: 60000,
                });
                await sleep(3000);
                let html = await page.evaluate(() => document.body.innerHTML);
                const $ = cheerio.load(html);

                $("#section-coin-overview", html).each(function () {
                    const title = $(this).find("h1 > span").text();
                    const plnText = $(this).find("div > span").text();

                    // Wyrażenie regularne do wyodrębnienia liczby po znaku dolara
                    const plnMatch = plnText.match(/\$([0-9.]+)/);

                    // Jeśli znaleziono dopasowanie, wyciągnij liczbę jako float
                    const pln = plnMatch ? parseFloat(plnMatch[1]) : 0;

                    console.log(plnText);
                    console.log("Cena w PLN: ", pln);
                    const totalValue = pln * token.amount;

                    const articleExists = articles.some(
                        (article) =>
                            article.title === title && article.pln === pln
                    );

                    if (!articleExists) {
                        articles.push({ title, pln, totalValue });
                        sumTotalValues += totalValue;
                    }
                });
            } catch (error) {
                console.log(error);
            } finally {
                await page.close();
            }
        }
    } catch (error) {
        console.error("Error in checkPrice:", error);
    } finally {
        await browser.close(); // Zapewnij zamknięcie przeglądarki
    }

    return sumTotalValues;
}

async function sendMail(sumTotalValues, articles) {
    let transporter = nodemailer.createTransport({
        service: `gmail`,
        auth: {
            user: "infokwbot@gmail.com",
            pass: "cqkwmnwiugujvkou",
        },
    });

    try {
        let info = await transporter.sendMail({
            from: '"KW" <infokwbot@gmail.com>',
            to: `${mailToSend}`,
            subject: `Wallet $${sumTotalValues.toFixed(2)}`,
            html: htmlMailTemplate(articles),
        });

        console.log(`Message Sent`, info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

function htmlMailTemplate(articles) {
    return articles
        .map(
            (article) => `<table>
    <tr>
        <td>${article.title}</td> 
        <td>${article.pln}</td>  
    </tr>
</table>`
        )
        .join("");
}

async function saveSumTotalValues(sumTotalValues) {
    try {
        await fs.promises.writeFile(
            "data.json",
            JSON.stringify({ sumTotalValues })
        );
        console.log("Saved new data");
    } catch (error) {
        console.error("Error saving SumTotalValues:", error);
    }
}

async function loadSumTotalValues() {
    try {
        const data = await fs.promises.readFile("data.json");
        const { sumTotalValues: savedSumTotalValues } = JSON.parse(data);
        return savedSumTotalValues;
    } catch (error) {
        console.error("Error loading SumTotalValues:", error);
        return 0;
    }
}

async function compareAndSendMail(sumTotalValues) {
    const savedSumTotalValues = await loadSumTotalValues();
    htmlMailTemplate(articles);

    const differencePercentage =
        Math.abs((sumTotalValues - savedSumTotalValues) / savedSumTotalValues) *
        100;

    if (differencePercentage >= 2) {
        // Zmiana na jeden warunek >= 2%
        await sendMail(sumTotalValues, articles);
        await saveSumTotalValues(sumTotalValues);
    }
}

async function startSection() {
    try {
        const sumTotalValues = await checkPrice(wallet);
        await compareAndSendMail(sumTotalValues);
    } catch (error) {
        console.error(error);
    }
}

async function startCronJob() {
    await startSection();
    const scraping = new CronJob(
        "*/1 * * * *",
        async function () {
            await startSection();
        },
        null,
        true,
        "Europe/Warsaw"
    );

    scraping.start();
}

startCronJob();
