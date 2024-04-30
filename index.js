const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;
const fs = require("fs");

const wallet = [
    {
        symbol: "BTC",
        link: "https://coinmarketcap.com/currencies/bitcoin/",
        amount: 0.008,
        lowPrice: 52,
    },
    {
        symbol: "BABYPEPE",
        link: "https://coinmarketcap.com/currencies/baby-pepe-io/",
        amount: 0,
        lowPrice: 0.000002534,
    },
    {
        symbol: "SAKAI",
        link: "https://coinmarketcap.com/currencies/sakai-vault/",
        amount: 0,
        lowPrice: 3.2,
    },
];

const headless = true;
const mailToSend = "konradwiel@interia.pl";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkPrice(wallet) {
    const browser = await puppeteer.launch({ headless: headless });

    let sumTotalValues = 0;
    const articles = [];

    for (const token of wallet) {
        const page = await browser.newPage();
        try {
            await page.goto(token.link, {
                waitUntil: "networkidle2",
                timeout: 60000,
            });
            sleep(3000);
            let html = await page.evaluate(() => document.body.innerHTML);
            const $ = cheerio.load(html);

            $("#section-coin-overview", html).each(function () {
                const title = $(this).find("h1 > div > span").text();
                const plnText = $(this).find(".base-text").text();
                const pln = parseFloat(plnText.replace(/[^\d.]/g, ""));

                // Pomnóż cenę przez ilość w portfelu
                const totalValue = pln * token.amount;

                const articleExists = articles.some(
                    (article) => article.title === title && article.pln === pln
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

    await browser.close();
    console.log(articles);
    return { sumTotalValues, articles };
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
            subject: `Wallet $${sumTotalValues.toFixed(2)} | PLN ${
                sumTotalValues.toFixed(2) * 4
            }`,
            html: generateHTML(articles),
        });

        console.log(`Message Sent to KW`, info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

function generateHTML(articles) {
    return articles
        .map(
            (article) => `
        <table>
            <tr>
                <td>${article.title}</td>
                <td>${article.pln}</td>
            </tr>
        </table>
    `
        )
        .join("");
}
async function saveSumTotalValues(sumTotalValues) {
    try {
        await fs.promises.writeFile(
            "sumTotalValues.json",
            JSON.stringify({ sumTotalValues })
        );
        console.log("SumTotalValues saved to file.");
    } catch (error) {
        console.error("Error saving SumTotalValues:", error);
    }
}
async function loadSumTotalValues() {
    try {
        const data = await fs.promises.readFile("sumTotalValues.json");
        const { sumTotalValues: savedSumTotalValues } = JSON.parse(data);
        return savedSumTotalValues;
    } catch (error) {
        console.error("Error loading SumTotalValues:", error);
        return 0;
    }
}

async function compareAndSendMail(sumTotalValues, articles, wallet) {
    const savedSumTotalValues = await loadSumTotalValues();

    // Oblicz różnicę procentową
    const differencePercentage =
        Math.abs((sumTotalValues - savedSumTotalValues) / savedSumTotalValues) *
        100;

    // Sprawdź, czy któraś moneta osiągnęła swoją wartość lowPrice
    const coinBelowLowPrice = wallet.some(
        (token) =>
            articles.find((article) => article.title === token.symbol)?.pln <
            token.lowPrice
    );

    // Jeśli różnica jest większa niż 0.5% lub któraś z wartości lowPrice została osiągnięta, wyślij maila
    if (differencePercentage > 0.5 || coinBelowLowPrice) {
        await sendMail(sumTotalValues, articles);
        await saveSumTotalValues(sumTotalValues);
    }
}

async function startSection() {
    try {
        const { sumTotalValues, articles } = await checkPrice(wallet);
        console.log(sumTotalValues);
        await compareAndSendMail(sumTotalValues, articles, wallet);
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
