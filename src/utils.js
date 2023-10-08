function parseData(d) {
    d.date = new Date(d[6]);
    d.open = +d[1];
    d.high = +d[2];
    d.low = +d[3];
    d.close = +d[4];
    d.volume = +d[5];

    return d;
}

export function getData(timeframe = "1d", symbol = "BTCUSDT") {
    const promise = fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=1000`)
        .then(response => response.json())
        .then(data => data.map(parseData));
    return promise;
}

