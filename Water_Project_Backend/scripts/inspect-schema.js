const db = require('../config/db');

async function main() {
    const [subscription] = await db.query('DESCRIBE subscription');
    const [rate] = await db.query('DESCRIBE subscription_rate');
    const [payment] = await db.query('DESCRIBE subscription_payment');
    const [household] = await db.query('DESCRIBE household');
    
    console.log('SUBSCRIPTION TABLE:\n', subscription.map(c => `  ${c.Field} ${c.Type} ${c.Null} ${c.Default ?? ''}`).join('\n'));
    console.log('\nSUBSCRIPTION_RATE TABLE:\n', rate.map(c => `  ${c.Field} ${c.Type} ${c.Null} ${c.Default ?? ''}`).join('\n'));
    console.log('\nSUBSCRIPTION_PAYMENT TABLE:\n', payment.map(c => `  ${c.Field} ${c.Type} ${c.Null} ${c.Default ?? ''}`).join('\n'));
    console.log('\nHOUSEHOLD TABLE:\n', household.map(c => `  ${c.Field} ${c.Type} ${c.Null} ${c.Default ?? ''}`).join('\n'));
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
