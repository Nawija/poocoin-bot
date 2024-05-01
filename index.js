const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;
const fs = require("fs");

const wallet = [
    {
        symbol: "BTC",
        link: "https://coinmarketcap.com/currencies/bitcoin/",
        poLink: "https://poocoin.app/tokens/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
        amount: 0.008,
        lowPrice: 49270.67,
    },
    {
        symbol: "BABYPEPE",
        link: "https://coinmarketcap.com/currencies/baby-pepe-io/",
        poLink: "https://poocoin.app/tokens/0x9d6db6382444b70a51307a4291188f60d4eef205",
        amount: 0,
        lowPrice: 0.000001535,
    },
    {
        symbol: "SAKAI",
        link: "https://coinmarketcap.com/currencies/sakai-vault/",
        poLink: "https://poocoin.app/tokens/0x43b35e89d15b91162dea1c51133c4c93bdd1c4af",
        amount: 0,
        lowPrice: 2.0,
    },
    {
        symbol: "BABYBONK",
        link: "https://coinmarketcap.com/currencies/baby-bonk-coin/",
        poLink: "https://poocoin.app/tokens/0xbb2826ab03b6321e170f0558804f2b6488c98775",
        amount: 0,
        lowPrice: 0.204,
    },
    {
        symbol: "SQUIDGROW",
        link: "https://coinmarketcap.com/currencies/squid-grow/",
        poLink: "https://poocoin.app/tokens/0xd8fa690304d2b2824d918c0c7376e2823704557a",
        amount: 0,
        lowPrice: 0.135,
    },
    {
        symbol: "BABYGROK",
        link: "https://coinmarketcap.com/currencies/baby-grok-bsc/",
        poLink: "https://poocoin.app/tokens/0x88da9901b3a02fe24e498e1ed683d2310383e295",
        amount: 0,
        lowPrice: 0.1,
    },
    {
        symbol: "BabyDoge",
        link: "https://coinmarketcap.com/currencies/baby-doge-coin/",
        poLink: "https://poocoin.app/tokens/0xc748673057861a797275cd8a068abb95a902e8de",
        amount: 0,
        lowPrice: 0.13,
    },
    {
        symbol: "BABYRWA",
        link: "https://coinmarketcap.com/currencies/babyrwa/",
        poLink: "https://poocoin.app/tokens/0x4a8049c015ae1c6665fc9e49f053458ae3a102d0",
        amount: 0,
        lowPrice: 0.18,
    },
    {
        symbol: "BIBI",
        link: "https://coinmarketcap.com/currencies/bibi/",
        poLink: "https://poocoin.app/tokens/0xfe8bf5b8f5e4eb5f9bc2be16303f7dab8cf56aa8",
        amount: 0,
        lowPrice: 0.103,
    },
    {
        symbol: "FLOKITA",
        link: "https://coinmarketcap.com/currencies/flokita/",
        poLink: "https://poocoin.app/tokens/0xdc8c8221b8e27dfda87a6d56dc5899a65087b6f4",
        amount: 0,
        lowPrice: 0.00001279,
    },
    {
        symbol: "FLOKI",
        link: "https://coinmarketcap.com/currencies/floki-inu/",
        poLink: "https://poocoin.app/tokens/0xfb5b838b6cfeedc2873ab27866079ac55363d37e",
        amount: 0,
        lowPrice: 0.000132,
    },
];

const mailToSend = "konradwiel@interia.pl";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkPrice(wallet) {
    const browser = await puppeteer.launch({ headless: true });

    let sumTotalValues = 0;
    const articles = [];

    for (const token of wallet) {
        const page = await browser.newPage();
        try {
            await page.goto(token.link, {
                waitUntil: "networkidle2",
                timeout: 60000,
            });
            await sleep(500);
            let html = await page.evaluate(() => document.body.innerHTML);
            const $ = cheerio.load(html);

            $("#section-coin-overview", html).each(function () {
                let title = $(this).find("h1 > div > span").text();
                let imgSrc = $(this).find("img").attr("src");
                let plnText = $(this).find(".base-text").text();
                let dataChangeColor = $(this)
                    .find("p.sc-4984dd93-0")
                    .attr("color");
                let dataChange = $(this).find("p.sc-4984dd93-0").text();
                console.log(plnText);
                let pln = parseFloat(plnText.replace(/[^\d.]/g, ""));
                if (plnText.includes("...")) {
                    plnText = plnText.replace(/\.{3}/g, "");
                    let lastFourDigits = plnText.slice(-4);
                    if (lastFourDigits.slice(-4, -3) === "0") {
                        lastFourDigits =
                            lastFourDigits.slice(0, -4) +
                            lastFourDigits.slice(-3);
                    }
                    lastFourDigits = "0." + lastFourDigits;
                    pln = parseFloat(lastFourDigits);
                }
                console.log(pln);
                const link = token.link;
                const poLink = token.poLink;
                const lowPrice = token.lowPrice;
                const totalValue = pln * token.amount;

                const articleExists = articles.some(
                    (article) => article.title === title && article.pln === pln
                );

                if (!articleExists) {
                    articles.push({
                        imgSrc,
                        title,
                        pln,
                        lowPrice,
                        link,
                        poLink,
                        totalValue,
                        dataChangeColor,
                        dataChange,
                    });
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

async function sendMail(sumTotalValues, articles, tokenTitle = null) {
    let subject;
    if (tokenTitle) {
        subject = `Buy ${tokenTitle}`;
    } else {
        subject = `Wallet $${sumTotalValues.toFixed(2)} | PLN ${
            sumTotalValues.toFixed(2) * 4
        }`;
    }
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
            subject: subject,
            html: generateHTML(articles, sumTotalValues, tokenTitle),
        });

        console.log(`Message Sent to KW`, info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
function generateHTML(articles, sumTotalValues, tokenTitle) {
    return `
        <p style="text-align: start; font-size: 25px; font-weight: 700;">Wallet $${sumTotalValues.toFixed(
            2
        )} | PLN ${sumTotalValues.toFixed(2) * 4}</p>
        <table>
        ${articles
            .map(
                (article) => `
                
                <tr style="width: 450px; display: flex; justify-content: space-between; align-items: center; font-size: 20px; margin-bottom: 6px; background-color: ${
                    article.title === tokenTitle ? " lightgreen" : "whitesmoke"
                };">
        <td style="padding: 6px; display: flex; align-items: center;">
            <img style="width: 25px; height: 25px; border-radius: 50%;" src="${
                article.imgSrc
            }" />
            <div style="color: #2c3649; padding: 6px; font-weight: 600">${
                article.title
            }</div>
                <p style="color: ${
                    article.dataChangeColor
                }; font-size:14px; font-weight: 600">${article.dataChange}</p>
        </td>
        <td style="padding: 6px; display: flex; align-items: center; font-size: 17px;">
            <div style="margin-right: 9px; font-size: 14px; font-weight: 600;">

                    <p>${article.pln}</p>


                <p style="color:red; margin: -12px 0;">${article.lowPrice}
                <p>
            </div>
            <div><a href="${article.link}"
                    style="padding: 7px; border-radius: 12px; margin-right: 5px; background-color:#3861FB; color: white; text-decoration: none;">CoinM</a>
            </div>
            <div><a href="${article.poLink}"
                    style="padding: 7px; border-radius: 12px; background-color: green; color: white; text-decoration: none;">Buy</a>
            </div>
        </td>
    </tr>
                `
            )
            .join("")}
            </table>
    `;
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

    // const formattedWallet = wallet.map((token) => ({
    //     ...token,
    //     amount: token.amount.toFixed(3), // Zaokrąglamy do 3 miejsc dziesiętnych
    //     lowPrice: token.lowPrice.toFixed(3), // Zaokrąglamy do 3 miejsc dziesiętnych
    // }));
    // console.log(formattedWallet);
    const coinBelowLowPrice = wallet.some(
        (token) =>
            articles.find((article) => article.title === token.symbol)?.pln <
            token.lowPrice
    );

    if (differencePercentage > 0.5 || coinBelowLowPrice) {
        let tokenTitle = null;
        // Sprawdzamy, czy jakakolwiek moneta osiągnęła swoją wartość lowPrice
        if (coinBelowLowPrice) {
            // Jeśli tak, znajdujemy tytuł tej monety
            const tokenBelowLowPrice = wallet.find((token) =>
                articles.find(
                    (article) =>
                        article.title === token.symbol &&
                        article.pln < token.lowPrice
                )
            );
            if (tokenBelowLowPrice) {
                tokenTitle = tokenBelowLowPrice.symbol;
            }
        }
        await sendMail(sumTotalValues, articles, tokenTitle);
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
        "*/7 * * * *",
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
