const fs = require('node:fs/promises');
const vegaLite = require('vega-lite');
const vega = require('vega');
const sharp = require('sharp');
sharp.cache({items: 0, memory: 0, files: 0});

const history = require('../../configs/history.config');
const filesystem = require('../../tools/filesystem');
const vegaSpecV5URL = 'file:///../resources/vega-spec-v5.json';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

function createSpec(url, type) {
    return {
        "$schema": vegaSpecV5URL,
        "data": {
            url,
        },
        "title": {
            "text": `Power Outages History (last ${type.toUpperCase()})`,
            "fontSize": 20,
            "fontWeight": "bold",
            "anchor": "start"
        },
        "transform": [
            {
                "calculate": "hours(datum.start) + minutes(datum.start) / 60",
                "as": "startTimeOfDay"
            },
            {
                "calculate": "hours(datum.end) + minutes(datum.end) / 60",
                "as": "endTimeOfDay"
            },
            {
                "calculate": "substring(datum.start, 0, 10)",
                "as": "dayOfMonth"
            },
            {
                "calculate": "datum.status == 'OFF' ? 'Off' : 'On'",
                "as": "powerStatus"
            }
        ],
        "mark": {
            "type": "bar",
            "stroke": "white",
            "strokeWidth": 1,
            "opacity": 0.5
        },
        "width": 800,
        "height": 400,
        "encoding": {
            "x": {
                "field": "dayOfMonth",
                "type": "nominal",
                "title": `Day Of The ${capitalize(type)}`,
                "sort": "ascending",
                "axis": {
                    "labelAngle": type === history.SAMPLE.WEEK ? 0 : 45,
                    "format": "d",
                    "labelExpr": "datum.value"
                }
            },
            "y": {
                "field": "startTimeOfDay",
                "type": "quantitative",
                "title": "Hour Of The Day"
            },
            "y2": {
                "field": "endTimeOfDay",
                "type": "quantitative",
                "title": `Timezone: ${history.TIMEZONE}`
            },
            "color": {
                "field": "powerStatus",
                "type": "nominal",
                "scale": {"range": ["#b22222", "#228b22"]},
                "legend": {"title": `Power Status`}
            }
        }
    }
}

function createView(dataUrl, type) {
    const preSpec = createSpec(dataUrl, type);
    const spec = vegaLite.compile(preSpec).spec;
    return new vega.View(vega.parse(spec), {renderer: 'none'});
}

// Returns PNG graph path
async function plot(dataPath, type) {
    const image = await createView(filesystem.pathToUrl(dataPath), type).toSVG();
    const pathSvg = filesystem.getGraphPath(type, 'svg');
    await fs.writeFile(pathSvg, image);

    const sh = await sharp(pathSvg, {density: history.PLOTTER_DENSITY});
    const pngBuffer = await sh.png().toBuffer();

    const pathPng = filesystem.getGraphPath(type, 'png');
    await fs.writeFile(pathPng, pngBuffer);
    await fs.rm(pathSvg);

    return pathPng;
}

module.exports = {
    plot
}
