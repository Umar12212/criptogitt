import { Telegraf } from 'telegraf';
import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';

const { Database, verbose } = sqlite3;

const BOT_TOKEN = '6887837300:AAGp7-wXrUyTCTNxWfUn6Q3YLi_cp-cZOIk';  // Используйте ваш собственный токен
const ADMIN_IDS = ['5613908842', '2104625001', '1761081461', '5225018306']; // Используйте id админов
const GROUP_CHAT_ID = '-1002114861621'; // Используйте чат id вашей группы
const COMMISSION = 2; // Комиссия в долларах

const bot = new Telegraf(BOT_TOKEN);
const verboseSqlite = verbose();

function createTables(db) {
    const query = `
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_variations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        variation TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        variation TEXT NOT NULL,
        photo_id TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );`;

    db.exec(query, (err) => {
        if (err) {
            console.error('Error creating tables: ', err.message);
        } else {
            console.log('Tables created or already exist.');

            // Добавляем категории, если они еще не добавлены
            const categories = ['1/4', '1/2', '1 штука', '3 штуки', '5 штук'];
            categories.forEach(category => {
                db.run(`INSERT INTO categories (name) VALUES (?)`, [category], (err) => {
                    if (err && err.message.includes('UNIQUE constraint failed')) {
                        // Категория уже существует
                    } else if (err) {
                        console.error('Error inserting category: ', err.message);
                    }
                });
            });

            // Проверка существования продукта "Субутекс"
            db.get(`SELECT id FROM products WHERE name = 'Субутекс'`, (err, row) => {
                if (err) {
                    console.error('Error checking product existence: ', err.message);
                    return;
                }
                if (!row) {
                    // Добавляем продукт "Субутекс" и его вариации, если его еще нет
                    db.run(`INSERT INTO products (name) VALUES ('Субутекс')`, function (err) {
                        if (err) {
                            console.error('Error inserting product: ', err.message);
                            return;
                        }
                        const productId = this.lastID;
                        const variations = [
                            { variation: '1/4', price: 40 },
                            { variation: '1/2', price: 70 },
                            { variation: '1 штука', price: 110 },
                            { variation: '3 штуки', price: 300 },
                            { variation: '5 штук', price: 450 }
                        ];
                        const placeholders = variations.map(() => '(?, ?, ?)').join(', ');
                        const values = variations.flatMap(v => [productId, v.variation, v.price]);
                        db.run(`INSERT INTO product_variations (product_id, variation, price) VALUES ${placeholders}`, values, (err) => {
                            if (err) {
                                console.error('Error inserting product variations: ', err.message);
                            }
                        });
                    });
                }
            });
        }
    });
}



const db = new Database('./shop.db', verboseSqlite.OPEN_READWRITE | verboseSqlite.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Connection error: ', err.message);
    } else {
        console.log('Connected to the shop database.');
        createTables(db);
    }
});

const languages = {
    en: {
        welcome: "Welcome to the best and most reliable shop!",
        welcomeAdmin: "Welcome Admin! Here is your panel.",
        addProduct: "Add Product",
        listProducts: "List Products",
        sendProductName: "Please send the name of the product.",
        sendProductVariations: "Please send the variations (e.g., 1/4, 1/2, 2 pieces) separated by commas.",
        sendProductPrices: "Please send the prices for each variation (e.g., 40, 70, 100) separated by commas.",
        productAdded: "Product added successfully!",
        errorAddingProduct: "Error adding product to database.",
        cryptoFail: "Failed to retrieve crypto rates. Please try again later.",
        dbError: "Error retrieving data from the database.",
        noProducts: "No products available.",
        purchaseRejected: "Your purchase has been rejected.",
        purchaseApproved: "Your purchase of %s has been approved. Thank you for your business!",
        confirmPayment: "Thank you for your payment. The transaction is being verified.",
        errorProductNotFound: "Product not found.",
        buyWithBTC: "Buy with BTC",
        buyWithLTC: "Buy with LTC",
        buyWithUSDT: "Buy with USDT",
        openShop: "Open shop",
        availableProducts: "Available products",
        support: "If you have any issues, please contact support.",
        supportButton: "Support",
        backToMenu: "Back to menu",
        adminPanel: "Admin panel",
        addPhoto: "Add Photo",
        chooseProductForPhoto: "Choose the product to which photos will be added!",
        sendPhoto: "Category - %s\nSend the photos to be added in this chat.",
        selectProduct: "Choose the product you want to purchase.",
        selectQuantity: "Choose the desired quantity.",
        paymentDetails: "Product - %s\nQuantity - %s\nPrice - $%s\n\nTo pay, choose one of the three cryptocurrencies!\nYou have 10 minutes to complete the payment, after which the request will be automatically canceled.",
        paymentRequest: "Payment request.\nProduct - %s\nQuantity - %s\nPrice - $%s\n\nAmount to be paid: `%s %s`\n\nWallet address: `%s`\n\n⚡️You must transfer the exact amount to the specified wallet address, otherwise the request will be rejected. The request will be automatically confirmed after the funds are received!",
        paymentTimeout: "⚠️The payment waiting time has expired. If you continue to create payment requests without paying, you will be permanently banned!",
        attentionOutOfPhotos: "Attention, photos ran out for the product - %s\nAdd photos.",
        photoAddedSuccessfully: "Photos successfully added 👌🏿\nCount - %d\nCategory - %s",
        selectProductToAddPhotos: "Choose the product to which photos will be added!"
    },
    ru: {
        welcome: "Добро пожаловать в лучший и надёжный магазин!",
        welcomeAdmin: "Добро пожаловать, Админ! Вот ваша панель.",
        addProduct: "Добавить продукт",
        listProducts: "Список продуктов",
        sendProductName: "Пожалуйста, отправьте название продукта.",
        sendProductVariations: "Пожалуйста, отправьте вариации (например, 1/4, 1/2, 1 штука) через запятую.",
        sendProductPrices: "Пожалуйста, отправьте цены для каждой вариации (например, 40, 70, 110) через запятую.",
        productAdded: "Продукт успешно добавлен!",
        errorAddingProduct: "Ошибка при добавлении продукта в базу данных.",
        cryptoFail: "Не удалось получить курсы криптовалют. Пожалуйста, попробуйте позже.",
        dbError: "Ошибка при получении данных из базы данных.",
        noProducts: "Продукты отсутствуют.",
        purchaseRejected: "Ваша покупка отклонена.",
        purchaseApproved: "Ваша покупка подтверждена. Спасибо за вашу покупку!",
        confirmPayment: "Спасибо за вашу оплату. Транзакция проверяется.",
        errorProductNotFound: "Продукт не найден.",
        buyWithBTC: "Купить за BTC",
        buyWithLTC: "Купить за LTC",
        buyWithUSDT: "Купить за USDT",
        openShop: "Открыть магазин",
        availableProducts: "Доступные товары",
        support: "Если у вас возникли проблемы, свяжитесь с поддержкой.",
        supportButton: "Поддержка",
        backToMenu: "Назад в меню",
        adminPanel: "Админ панель",
        addPhoto: "Добавить фото",
        chooseProductForPhoto: "Выберите товар, к которому будут добавлены фото!",
        sendPhoto: "Категория товара - %s\nОтправьте в этот чат фото, которые будут добавлены.",
        selectProduct: "Выберите товар, который хотите приобрести.",
        selectQuantity: "Выберите нужное количество.",
        paymentDetails: "Название товара - %s\nКоличество - %s\nЦена - $%s\n\nДля оплаты выберите одну из трёх криптовалют!\nУ вас будет 10 минут для оплаты заказа, после чего заявка будет автоматически отменена.",
        paymentRequest: "Заявка на оплату.\nНазвание товара - %s\nКоличество - %s\nЦена - $%s\n\nСумма к оплате: `%s %s`\n\nАдрес кошелька: `%s`\n\n⚡️Необходимо перевести точную сумму на указанный адрес кошелька, в противном случае заявка будет отклонена. Заявка будет подтверждена автоматически после поступления средств!",
        paymentTimeout: "❗️Время ожидания оплаты истекло. В случае, если вы будете создавать заявки на оплату, не оплачивая их, мы заблокируем вас навсегда!",
        attentionOutOfPhotos: "Внимание, закончились фото для товара - %s\nДобавьте фото.",
        photoAddedSuccessfully: "Фото успешно добавлены 👌🏿\nКоличество - %d\nКатегория товара - %s",
        selectProductToAddPhotos: "Выберите товар, к которому будут добавлены фото!"
    }
};

let userLangs = {};
let adminState = {};
let paymentTimeouts = {};

// Выбор языка при старте
bot.start((ctx) => {
    ctx.reply('Choose your language / Выберите ваш язык:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'English', callback_data: 'lang_en' }],
                [{ text: 'Русский', callback_data: 'lang_ru' }]
            ]
        }
    });
});

// Обработчик выбора языка
bot.action(/lang_(en|ru)/, async (ctx) => {
    const lang = ctx.match[1];
    userLangs[ctx.from.id] = lang;
    const msgs = languages[lang];

    const isAdmin = ADMIN_IDS.includes(ctx.from.id.toString());
    if (isAdmin) {
        await ctx.editMessageText(msgs.welcomeAdmin, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: msgs.openShop, callback_data: 'open_shop' }],
                    [{ text: msgs.adminPanel, callback_data: 'admin_panel' }]
                ]
            }
        });
    } else {
        await ctx.editMessageText(msgs.welcome, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: msgs.openShop, callback_data: 'open_shop' }]
                ]
            }
        });
    }
});

// Открытие магазина
bot.action('open_shop', async (ctx) => {
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.all("SELECT id, name FROM products", [], async (err, products) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }
        if (products.length === 0) {
            await ctx.reply(msgs.noProducts);
            return;
        }

        const buttons = products.map(product => [{ text: product.name, callback_data: 'select_product_' + product.id }]);
        await ctx.editMessageText(msgs.selectProduct, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });

    });
});



// Обработчик для выбора продукта и отображения вариаций
bot.action(/^select_product_(\d+)$/, async (ctx) => {
    const productId = ctx.match[1];
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.all("SELECT v.*, (SELECT COUNT(*) FROM product_photos WHERE product_id = v.product_id AND variation = v.variation) as photo_count FROM product_variations v WHERE v.product_id = ?", [productId], (err, variations) => {
        if (err) {
            console.error('DB Error: ', err.message);
            ctx.reply(msgs.dbError);
            return;
        }

        if (variations.length === 0) {
            ctx.reply(msgs.noProducts);
            return;
        }

        const buttons = [
            [{ text: `1/4 - ${variations.find(v => v.variation === '1/4').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1/4').id}_1/4` },
             { text: `1/2 - ${variations.find(v => v.variation === '1/2').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1/2').id}_1/2` }],
            [{ text: `1 штука - ${variations.find(v => v.variation === '1 штука').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1 штука').id}_1` }],
            [{ text: `3 штуки - ${variations.find(v => v.variation === '3 штуки').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '3 штуки').id}_3` }],
            [{ text: `5 штук - ${variations.find(v => v.variation === '5 штук').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '5 штук').id}_5` }]
        ];

        ctx.reply(msgs.selectQuantity, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    });
});

// Обработчик для выбора количества и отображения деталей оплаты
bot.action(/select_quantity_(\d+)_(.+)/, async (ctx) => {
    const [_, variationId, variation] = ctx.match;
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.get("SELECT v.*, p.name FROM product_variations v JOIN products p ON v.product_id = p.id WHERE v.id = ?", [variationId], async (err, variation) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }

        if (!variation) {
            await ctx.reply(msgs.errorProductNotFound);
            return;
        }

        const totalPrice = variation.price; // Не включаем комиссию в отображаемую пользователю цену
        const paymentDetails = msgs.paymentDetails.replace('%s', variation.name).replace('%s', variation.variation).replace('%s', totalPrice);

        await ctx.editMessageText(paymentDetails, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'BTC', callback_data: `buy_${variation.id}_btc` }, { text: 'LTC', callback_data: `buy_${variation.id}_ltc` }],
                    [{ text: 'USDT', callback_data: `buy_${variation.id}_usdt` }],
                    [{ text: msgs.backToMenu, callback_data: `back_to_shop_${variation.product_id}` }]
                ]
            }
        });
    });
});

bot.action(/back_to_shop_(\d+)/, async (ctx) => {
    const productId = ctx.match[1];
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.all("SELECT v.*, (SELECT COUNT(*) FROM product_photos WHERE product_id = v.product_id AND variation = v.variation) as photo_count FROM product_variations v WHERE v.product_id = ?", [productId], async (err, variations) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }

        if (variations.length === 0) {
            await ctx.reply(msgs.noProducts);
            return;
        }

        const buttons = [
            [{ text: `1/4 - ${variations.find(v => v.variation === '1/4').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1/4').id}_1/4` },
             { text: `1/2 - ${variations.find(v => v.variation === '1/2').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1/2').id}_1/2` }],
            [{ text: `1 штука - ${variations.find(v => v.variation === '1 штука').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '1 штука').id}_1` }],
            [{ text: `3 штуки - ${variations.find(v => v.variation === '3 штуки').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '3 штуки').id}_3` }],
            [{ text: `5 штук - ${variations.find(v => v.variation === '5 штук').price}$`, callback_data: `select_quantity_${variations.find(v => v.variation === '5 штук').id}_5` }]
        ];

        await ctx.editMessageText(msgs.selectQuantity, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    });
});


// Обработчик для покупки товара и удаления фотографии
bot.action(/buy_(\d+)_(btc|ltc|usdt)/, async (ctx) => {
    const [_, variationId, currency] = ctx.match;
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    const rates = await getCryptoRates();

    db.get("SELECT v.*, p.name FROM product_variations v JOIN products p ON v.product_id = p.id WHERE v.id = ?", [variationId], async (err, variation) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }
        if (!variation) {
            await ctx.reply(msgs.errorProductNotFound);
            return;
        }

        const totalPrice = variation.price + COMMISSION; // Включаем комиссию в общую цену
        let priceInCrypto;
        let paymentAddress;

        if (rates) {
            switch (currency) {
                case 'btc':
                    priceInCrypto = (totalPrice / rates.bitcoin.usd).toFixed(8);
                    paymentAddress = 'bc1q8zanhdyqp4xy3lk2y87v9y8a7na09v68wl02gs';
                    break;
                case 'ltc':
                    priceInCrypto = (totalPrice / rates.litecoin.usd).toFixed(8);
                    paymentAddress = 'ltc1qnuvrd0u93j4w932sthf3etgc9dyu5t94heaxjj';
                    break;
                case 'usdt':
                    priceInCrypto = (totalPrice / rates.tether.usd).toFixed(8);
                    paymentAddress = 'THmpBZeW6n8LFpvWX37VGeZCy5hoQVgDgJ';
                    break;
            }
        }

        const paymentMessage = msgs.paymentRequest
    .replace('%s', variation.name)
    .replace('%s', variation.variation)
    .replace('%s', variation.price) // Отображаем пользователю цену без комиссии
    .replace('%s', priceInCrypto) // Моноширный текст для суммы
    .replace('%s', currency.toUpperCase())
    .replace('%s', paymentAddress); // Моноширный текст для адреса кошелька

await ctx.editMessageText(paymentMessage, {
    reply_markup: {
        inline_keyboard: [
            [{ text: `Я оплатил - ${variation.variation}`, callback_data: `paid_${variation.id}_${ctx.from.id}_${currency}` }],
            [{ text: msgs.backToMenu, callback_data: `select_quantity_${variation.id}_${variation.variation}` }]
        ]
    }
});

    });
});


bot.action(/paid_(\d+)_(\d+)_(btc|ltc|usdt)_(.+)/, async (ctx) => {
    const [_, variationId, userId, currency, paymentAddress] = ctx.match;
    const lang = userLangs[userId] || 'en';
    const msgs = languages[lang];

    const product = await getProduct(variationId);
    if (!product) {
        await ctx.reply(msgs.errorProductNotFound);
        return;
    }

    const rates = await getCryptoRates();

    if (!rates) {
        await ctx.reply(msgs.cryptoFail);
        return;
    }

    let priceInCrypto;
    switch (currency) {
        case 'btc':
            priceInCrypto = (product.price + COMMISSION) / rates.bitcoin.usd;
            break;
        case 'ltc':
            priceInCrypto = (product.price + COMMISSION) / rates.litecoin.usd;
            break;
        case 'usdt':
            priceInCrypto = (product.price + COMMISSION) / rates.tether.usd;
            break;
    }

    // Очищаем таймер при нажатии на "Я оплатил"
    if (paymentTimeouts[userId]) {
        clearTimeout(paymentTimeouts[userId]);
        delete paymentTimeouts[userId];
    }

    // Уведомление администраторов в группе
    const adminMessage = `Заявка на оплату.\nНазвание товара - ${product.name}\nКоличество - ${product.variation}\nЦена - ${product.price}$\nИмя - ${ctx.from.first_name}\n\nСумма к оплате: \`${priceInCrypto.toFixed(8)} ${currency.toUpperCase()}\`\n\nАдрес кошелька: \`${paymentAddress}\`\n\n⚡️Необходимо перевести точную сумму на указанный адрес кошелька в противном случае заявка будет отклонена, заявка будет подтверждена автоматически после поступления средств!`;

    await bot.telegram.sendMessage(GROUP_CHAT_ID, adminMessage, {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Approve', callback_data: `approve_${variationId}_${userId}` }],
                [{ text: 'Reject', callback_data: `reject_${variationId}_${userId}` }]
            ]
        }
    });

    await ctx.reply(msgs.confirmPayment);
});



// Обработчик для подтверждения оплаты
bot.action(/approve_(\d+)_(\d+)/, async (ctx) => {
    const [_, variationId, userId] = ctx.match;
    const userLang = userLangs[userId] || 'en';
    const msgs = languages[userLang];

    const product = await getProduct(variationId);
    if (!product) {
        await ctx.reply('Error: Product not found.');
        return;
    }

    // Уменьшение количества фотографий на складе
    db.get("SELECT id, photo_id FROM product_photos WHERE product_id = ? AND variation = ? LIMIT 1", [product.product_id, product.variation], async (err, photo) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }
        if (photo) {
            db.run("DELETE FROM product_photos WHERE id = ?", [photo.id], async (err) => {
                if (err) {
                    console.error('DB Error: ', err.message);
                    await ctx.reply(msgs.dbError);
                    return;
                }

                await bot.telegram.sendPhoto(userId, photo.photo_id, { caption: 'Ваша оплата прошла успешно!\nСпасибо за заказ!' });
                await ctx.reply('Purchase approved.');
            });
        } else {
            await ctx.reply(msgs.errorProductNotFound);
        }
    });
});


// Обработка отклонения покупки администратором
bot.action(/reject_(\d+)_(\d+)/, async (ctx) => {
    const [_, variationId, userId] = ctx.match;
    const lang = userLangs[userId] || 'en';
    const msgs = languages[lang];

    await bot.telegram.sendMessage(userId, msgs.purchaseRejected);
    await ctx.reply('Purchase rejected.');
});



// Обработчик для открытия магазина в админской панели и выбора товара для добавления фотографий
bot.action('open_shop', async (ctx) => {
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    if (ctx.from.id.toString() === ADMIN_ID) {
        db.all("SELECT id, name FROM products", [], (err, products) => {
            if (err) {
                console.error('DB Error: ', err.message);
                ctx.reply(msgs.dbError);
                return;
            }
            if (products.length === 0) {
                ctx.reply(msgs.noProducts);
                return;
            }

            const buttons = products.map(product => [{ text: product.name, callback_data: 'select_product_for_photo_' + product.id }]);
            ctx.reply(msgs.chooseProductForPhoto, {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });
    } else {
        // Код для обычных пользователей
        db.all("SELECT id, name FROM products", [], (err, products) => {
            if (err) {
                console.error('DB Error: ', err.message);
                ctx.reply(msgs.dbError);
                return;
            }
            if (products.length === 0) {
                ctx.reply(msgs.noProducts);
                return;
            }

            const buttons = products.map(product => [{ text: product.name, callback_data: 'select_product_' + product.id }]);
            ctx.reply(msgs.availableProducts, {
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });
    }
});

// Обработчик для выбора продукта и отображения его вариаций для добавления фотографий
bot.action(/^select_product_for_photo_(\d+)$/, async (ctx) => {
    const productId = ctx.match[1];
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.all("SELECT v.*, (SELECT COUNT(*) FROM product_photos WHERE product_id = v.product_id AND variation = v.variation) as photo_count FROM product_variations v WHERE v.product_id = ?", [productId], (err, variations) => {
        if (err) {
            console.error('DB Error: ', err.message);
            ctx.reply(msgs.dbError);
            return;
        }

        if (variations.length === 0) {
            ctx.reply(msgs.noProducts);
            return;
        }

        const buttons = [
            [
                { text: `1/4 - ${variations.find(v => v.variation === '1/4').photo_count} фото`, callback_data: `add_photo_${variations.find(v => v.variation === '1/4').id}` },
                { text: `1/2 - ${variations.find(v => v.variation === '1/2').photo_count} фото`, callback_data: `add_photo_${variations.find(v => v.variation === '1/2').id}` }
            ],
            [
                { text: `1 штука - ${variations.find(v => v.variation === '1 штука').photo_count} фото`, callback_data: `add_photo_${variations.find(v => v.variation === '1 штука').id}` }
            ],
            [
                { text: `3 штуки - ${variations.find(v => v.variation === '3 штуки').photo_count} фото`, callback_data: `add_photo_${variations.find(v => v.variation === '3 штуки').id}` }
            ],
            [
                { text: `5 штук - ${variations.find(v => v.variation === '5 штук').photo_count} фото`, callback_data: `add_photo_${variations.find(v => v.variation === '5 штук').id}` }
            ]
        ];

        ctx.reply(msgs.chooseProductForPhoto, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    });
});


// Обработчик для добавления фотографий к выбранной категории
bot.action(/^add_photo_(\d+)$/, async (ctx) => {
    const variationId = ctx.match[1];
    const lang = userLangs[ctx.from.id] || 'en';
    const msgs = languages[lang];

    db.get("SELECT p.name, v.variation, v.product_id FROM product_variations v JOIN products p ON v.product_id = p.id WHERE v.id = ?", [variationId], (err, result) => {
        if (err) {
            console.error('DB Error: ', err.message);
            ctx.reply(msgs.dbError);
            return;
        }
        if (!result) {
            console.log(`Product not found for variation ID ${variationId}`);
            ctx.reply(msgs.errorProductNotFound);
            return;
        }

        adminState[ctx.from.id] = { step: 'awaiting_photo', productId: result.product_id, variation: result.variation };
        ctx.reply(msgs.sendPhoto.replace('%s', result.variation));
    });
});

bot.on('message', (ctx) => {
    if (ctx.message.photo) {
        const state = adminState[ctx.from.id];
        if (state && state.step === 'awaiting_photo') {
            console.log(`Receiving photo for category: ${state.category}`);
            const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            const category = state.category;

            // Добавляем фото в базу данных
            db.get('SELECT id FROM products WHERE name = "Субутекс"', (err, product) => {
                if (err || !product) {
                    console.error('DB Error: ', err ? err.message : 'No products found');
                    ctx.reply('Error adding photo to database.');
                    return;
                }

                if (product.id) {
                    db.run('INSERT INTO product_photos (product_id, variation, photo_id) VALUES (?, ?, ?)', [product.id, category, photoId], (err) => {
                        if (err) {
                            console.error('DB Error: ', err.message);
                            ctx.reply('Error adding photo to database.');
                            return;
                        }

                        // Получаем обновленное количество фотографий в категории
                        db.get("SELECT COUNT(*) as photo_count FROM product_photos WHERE product_id = ? AND variation = ?", [product.id, category], (err, row) => {
                            if (err) {
                                console.error('DB Error: ', err.message);
                                ctx.reply('Error retrieving photo count from database.');
                                return;
                            }

                            console.log(`Photo added to category: ${category}`);
                            ctx.reply(`Фото успешно добавлены 👌🏿\nКоличество - ${row.photo_count}\nКатегория товара - ${category}`);
                        });
                    });
                } else {
                    console.log('Product ID is not set');
                    ctx.reply('Error adding photo to database. Product ID is not set.');
                }
            });
        }
    }
});

// Админ панель
bot.action('admin_panel', async (ctx) => {
    const lang = userLangs[ctx.from.id] || 'ru';
    const msgs = languages[lang];

    db.all(`
        SELECT c.name, COUNT(p.id) as photo_count
        FROM categories c
        LEFT JOIN product_photos p ON c.name = p.variation
        GROUP BY c.name
    `, [], async (err, rows) => {
        if (err) {
            console.error('DB Error: ', err.message);
            await ctx.reply(msgs.dbError);
            return;
        }

        let responseText = `${msgs.adminPanel}\n\n`;
        rows.forEach(row => {
            responseText += `${row.name} - ${row.photo_count} фото\n`;
        });

        const today = new Date();
        const date = today.toLocaleDateString('ru-RU');
        responseText += `\nДата ${date}`;

        await ctx.reply(responseText, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: msgs.addPhoto, callback_data: 'add_photo_menu' }]
                ]
            }
        });
    });
});


// Меню добавления фотографий
bot.action('add_photo_menu', async (ctx) => {
    const lang = userLangs[ctx.from.id] || 'ru';
    const msgs = languages[lang];

    db.all("SELECT name FROM categories", [], (err, categories) => {
        if (err) {
            console.error('DB Error: ', err.message);
            ctx.reply(msgs.dbError);
            return;
        }

        const buttons = categories.map(category => {
            return [{
                text: category.name,
                callback_data: `add_photo_${category.name.replace(' ', '_')}`
            }];
        });

        ctx.reply(msgs.chooseProductForPhoto, {
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    });
});

// Обработчик для добавления фотографий к выбранной категории
bot.action(/^add_photo_(.+)$/, async (ctx) => {
    const category = ctx.match[1].replace('_', ' ');
    const lang = userLangs[ctx.from.id] || 'ru';
    const msgs = languages[lang];

    adminState[ctx.from.id] = { step: 'awaiting_photo', category: category };
    ctx.reply(`Категория товара - ${category}\nОтправьте в этот чат фото, которые будут добавлены.`);
});

// Обработчик для получения фотографий от админа и сохранения их в базу данных
bot.on('message', (ctx) => {
    if (ctx.message.photo) {
        const state = adminState[ctx.from.id];
        if (state && state.step === 'awaiting_photo') {
            console.log(`Receiving photo for category: ${state.category}`);
            const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            const category = state.category;

            // Добавляем фото в базу данных
            db.get('SELECT id FROM products WHERE name = "Субутекс"', (err, product) => {
                if (err || !product) {
                    console.error('DB Error: ', err ? err.message : 'No products found');
                    ctx.reply('Error adding photo to database.');
                    return;
                }
                db.run('INSERT INTO product_photos (product_id, variation, photo_id) VALUES (?, ?, ?)', [product.id, category, photoId], (err) => {
                    if (err) {
                        console.error('DB Error: ', err.message);
                        ctx.reply('Error adding photo to database.');
                        return;
                    }

                    // Получаем обновленное количество фотографий в категории
                    db.get("SELECT COUNT(*) as photo_count FROM product_photos WHERE product_id = ? AND variation = ?", [product.id, category], (err, row) => {
                        if (err) {
                            console.error('DB Error: ', err.message);
                            ctx.reply('Error retrieving photo count from database.');
                            return;
                        }

                        console.log(`Photo added to category: ${category}`);
                        ctx.reply(`Фото успешно добавлены 👌🏿\nКоличество - ${row.photo_count}\nКатегория товара - ${category}`);
                    });
                });
            });
        }
    }
});

// Запуск бота
bot.launch();

async function getCryptoRates() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,litecoin,tether&vs_currencies=usd');
        const rates = await response.json();
        return rates;
    } catch (error) {
        console.error('Failed to fetch crypto rates:', error);
        return null;
    }
}

async function getProduct(variationId) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT v.*, p.name
            FROM product_variations v
            JOIN products p ON v.product_id = p.id
            WHERE v.id = ?
        `, [variationId], (err, row) => {
            if (err) {
                console.error('DB Error fetching product: ', err.message);
                reject(err);
            } else if (row) {
                resolve(row);
            } else {
                console.log(`Product not found for variation ID ${variationId}`);
                resolve(null); // В случае, если продукт не найден, возвращаем null
            }
        });
    });
}