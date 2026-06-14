const plotter = require('./history-plotter');

async function main() {
    const [dataPath, type] = process.argv.slice(2);
    if (!dataPath || !type) {
        console.error('Usage: plot-graph-child.js <dataPath> <type>');
        process.exit(1);
    }

    const graphPath = await plotter.plot(dataPath, type);
    process.stdout.write(graphPath);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
