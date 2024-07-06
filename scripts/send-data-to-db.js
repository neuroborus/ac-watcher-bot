const dotenv = require('dotenv');
dotenv.config();

const {connectMongo, History} = require('../src/mongo');



const toSend /* = [
    {   // July 2
        createdAt: '2024-07-02T13:09:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-02T18:17:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-02T18:27:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-02T20:34:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-02T21:58:01.096+00:00',
        isAvailable: true
    },
    {   // July 3
        createdAt: '2024-07-03T02:11:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-03T06:08:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-03T09:03:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-03T12:23:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-03T16:15:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-03T18:13:01.096+00:00',
        isAvailable: true
    },
    {   // July 4
        createdAt: '2024-07-04T03:01:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-04T03:02:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-04T09:09:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-04T09:13:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-04T13:18:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-04T15:52:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-04T20:16:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-04T23:04:01.096+00:00',
        isAvailable: true
    },
    {   // July 5
        createdAt: '2024-07-05T02:01:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-05T06:21:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-05T09:20:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-05T12:50:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-05T16:14:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-05T20:14:01.096+00:00',
        isAvailable: true
    },
    {   // July 6
        createdAt: '2024-07-06T03:01:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-06T03:02:01.096+00:00',
        isAvailable: true
    },
    {
        createdAt: '2024-07-06T06:09:01.096+00:00',
        isAvailable: false
    },
    {
        createdAt: '2024-07-06T09:07:01.096+00:00',
        isAvailable: true
    },
]
*/


function toTimezone(history, hourDiff) {
    history.createdAt = new Date(new Date(history.createdAt).getTime() + (1000 * 60 * 60 * hourDiff));
    return history;
}


async function start() {
    await connectMongo()

    let counter = 0;
    for (el of toSend) {
        await History.create(toTimezone(el, -3));
        console.log('Success for ' + el.createdAt);
        ++counter;
    }

    console.log(`Done for [${counter}/${toSend.length}]`);
}

start();

