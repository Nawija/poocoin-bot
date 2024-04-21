const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;
const fs = require("fs");

const wallet = [
    {
        symbol: "sakai",
        link: "https://poocoin.app/tokens/0x43b35e89d15b91162dea1c51133c4c93bdd1c4af",
        amount: 61.16,
    },
    {
        symbol: "baby",
        link: "https://poocoin.app/tokens/0x88da9901b3a02fe24e498e1ed683d2310383e295",
        amount: 18391142219542.5128,
    },
    {
        symbol: "bnb",
        link: "https://poocoin.app/tokens/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        amount: 0.04,
    },
    {
        symbol: "shoki",
        link: "https://poocoin.app/tokens/0x2ddb89a10bf2020d8cae7c5d239b6f38be9d91d9",
        amount: 75682967.3795,
    },
];

const headless = false;
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
            sleep(3000)
            let html = await page.evaluate(() => document.body.innerHTML);
            const $ = cheerio.load(html);

            $("div.d-flex.align-items-start.flex-wrap", html).each(function () {
                const title = $(this).find("h1").text();
                const plnText = $(this).find("span").text();
                const pln = parseFloat(plnText.replace("$", "").trim());

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
    return { sumTotalValues, articles };
}

async function sendMail(sumTotalValues) {
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
            subject: `$ ${sumTotalValues.toFixed(2)}`,
        });

        console.log(`Message Sent to KW`, info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

// Funkcja do zapisywania sumy wartości do pliku JSON
async function saveSumTotalValues(sumTotalValues) {
    try {
        await fs.promises.writeFile("sumTotalValues.json", JSON.stringify({ sumTotalValues }));
        console.log("SumTotalValues saved to file.");
    } catch (error) {
        console.error("Error saving SumTotalValues:", error);
    }
}

// Funkcja do odczytywania sumy wartości z pliku JSON
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

// Funkcja do porównywania sumy wartości i wysyłania maila
async function compareAndSendMail(sumTotalValues) {
    // Odczytaj zapisaną sumę wartości
    const savedSumTotalValues = await loadSumTotalValues();

    // Oblicz różnicę procentową
    const differencePercentage = Math.abs((sumTotalValues - savedSumTotalValues) / savedSumTotalValues) * 100;

    // Jeśli różnica jest większa niż 1%, wyślij maila
    if (differencePercentage > 1) {
        await sendMail(sumTotalValues);
        // Zapisz nową sumę wartości
        await saveSumTotalValues(sumTotalValues);
    }
}

async function startSection() {
    try {
        const { sumTotalValues } = await checkPrice(wallet);
        console.log(sumTotalValues);
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
