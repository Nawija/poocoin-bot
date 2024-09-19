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
        symbol: "1MBABYDOGE",
        link: "https://coinmarketcap.com/currencies/1m-baby-doge-coin/",
        amount: 279863491200.894699897,
    },
];

const headless = false;
const mailToSend = "seovileo@gmail.com";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkPrice(wallet) {
    const browser = await puppeteer.launch({ headless: headless });

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
                const title = $(this).find("h1 > span").text();
                const plnText = $(this).find("div > span").text();
                const pln = parseInt(plnText.replace(/[^\d.]/g, ""), 10);
                console.log(plnText);
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
        <td>{title}</td>
        <td>{pln}}</td>
    </tr>
</table>`
        )
        .join("");
}

// Funkcja do zapisywania sumy wartości do pliku JSON
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

// Funkcja do odczytywania sumy wartości z pliku JSON
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

// Funkcja do porównywania sumy wartości i wysyłania maila
async function compareAndSendMail(sumTotalValues) {
    // Odczytaj zapisaną sumę wartości
    const savedSumTotalValues = await loadSumTotalValues();
    const HTML = htmlMailTemplate(articles);

    // Oblicz różnicę procentową
    const differencePercentage =
        Math.abs((sumTotalValues - savedSumTotalValues) / savedSumTotalValues) *
        100;

    // Jeśli różnica jest większa niż 1%, wyślij maila
    if (differencePercentage > 1) {
        await sendMail(sumTotalValues, articles);
        // Zapisz nową sumę wartości
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
