import { Command } from 'commander';
import fs from 'fs/promises';

const program = new Command();

program
    .name('order-cli')
    .description('CLI-програма для управління замовленнями')
    .version('1.0.0');

program.option('-f, --file <шлях>', 'Шлях до JSON-файлу', 'data.json');

async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Помилка: Неможливо прочитати файл.', error.message);
        process.exit(1);
    }
}

//загальна можливість: Перелік
program
    .command('list')
    .description('Показати список замовлень')
    .option('-l, --limit <число>', 'Обмежити кількість')
    .action(async (options) => {
        const data = await readData(program.opts().file);
        let result = data.map(o => ({ ID: o.orderId, Клієнт: o.customerName, Статус: o.status }));
        if (options.limit) result = result.slice(0, parseInt(options.limit, 10));
        console.table(result);
    });

//загальна можливість: Один елемент
program
    .command('get <id>')
    .description('Показати повне замовлення за ID')
    .action(async (id) => {
        const data = await readData(program.opts().file);
        const order = data.find(o => o.orderId === parseInt(id, 10));
        if (!order) { console.error('Помилка: Замовлення не знайдено.'); process.exit(1); }
        console.dir(order, { depth: null, colors: true });
    });

//загальна можливість: Окреме поле
program
    .command('field <id> <path>')
    .description('Показати значення поля (наприклад: deliveryAddress.city)')
    .action(async (id, path) => {
        const data = await readData(program.opts().file);
        const order = data.find(o => o.orderId === parseInt(id, 10));
        if (!order) { console.error('Помилка: Замовлення не знайдено.'); process.exit(1); }

        const value = path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : null, order);
        console.log(value === null ? 'Поле відсутнє або null' : `Значення: ${value}`);
    });

//позиції замовлення
program
    .command('items <id>')
    .description('Позиції замовлення із сумою та сортуванням')
    .option('-s, --sort <тип>', 'Сортування: asc або desc')
    .action(async (id, options) => {
        const data = await readData(program.opts().file);
        const order = data.find(o => o.orderId === parseInt(id, 10));
        if (!order) { console.error('Помилка: Не знайдено.'); process.exit(1); }

        let itemsInfo = order.items.map(item => ({
            Назва: item.productName,
            Сума: item.quantity * item.price
        }));

        if (options.sort === 'asc') itemsInfo.sort((a, b) => a.Сума - b.Сума);
        if (options.sort === 'desc') itemsInfo.sort((a, b) => b.Сума - a.Сума);
        console.table(itemsInfo);
    });

//загальна сума
program
    .command('total <id>')
    .description('Загальна сума замовлення')
    .option('-v, --verbose', 'Деталі розрахунку (прапорець)')
    .action(async (id, options) => {
        const data = await readData(program.opts().file);
        const order = data.find(o => o.orderId === parseInt(id, 10));
        if (!order) { console.error('Помилка: Не знайдено.'); process.exit(1); }

        const total = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        if (options.verbose) console.log(`Клієнт: ${order.customerName}`);
        console.log(`Сума: ${total}`);
    });

//зведення про доставку й оплату
program
    .command('summary <id>')
    .description('Зведення про доставку й оплату')
    .action(async (id) => {
        const data = await readData(program.opts().file);
        const order = data.find(o => o.orderId === parseInt(id, 10));
        if (!order) { console.error('Помилка: Не знайдено.'); process.exit(1); }

        console.log(`Оплачено: ${order.isPaid ? 'Так' : 'Ні'}`);
        console.log(`Доставка: ${order.deliveryAddress ? order.deliveryAddress.city : 'Відсутня'}`);
    });

program.parse();