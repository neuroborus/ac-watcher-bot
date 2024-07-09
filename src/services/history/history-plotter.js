const fs = require('node:fs').promises;
const vegaLite = require('vega-lite');
const vega = require('vega');
const sharp = require('sharp');
sharp.cache({ items: 0, memory: 0, files: 0 });

const {SAMPLE} = require('../../configs/history.config');
const {getGraphPath} = require('../../utils/filesystem');
const vegaSpecV5URL = 'file:///../resources/vega-spec-v5.json';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
function createSpec(url, type) {
    return {
        "$schema": vegaSpecV5URL,
        "data": {
            url,
        },
        "title": {
            "text": `Power Status (${type.toUpperCase()})`,
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
                "title": `Day of the ${capitalize(type)}`,
                "sort": "ascending",
                "axis": {
                    "labelAngle": type === SAMPLE.WEEK ? 0 : 45,
                    "format": "d",
                    "labelExpr": "datum.value"
                }
            },
            "y": {
                "field": "startTimeOfDay",
                "type": "quantitative",
                "title": "Start Time of Day"
            },
            "y2": {
                "field": "endTimeOfDay",
                "type": "quantitative",
                "title": "End Time of Day"
            },
            "color": {
                "field": "powerStatus",
                "type": "nominal",
                "scale": {"range": ["#b22222", "#228b22"]},
                "legend": {"title": "Power Status"}
            }
        }
    }
}

function createView(dataUrl, type) {
    const preSpec = createSpec(dataUrl, type);
    const spec = vegaLite.compile(preSpec).spec;
    return new vega.View(vega.parse(spec), {renderer: 'none'});
}

async function plot(dataUrl, type) {
    const image = await createView(dataUrl, type).toSVG();
    const pathSvg = getGraphPath(type, 'svg');
    await fs.writeFile(pathSvg, image);

    const sh = await sharp(pathSvg, { density: 300 });
    const pngBuffer = await sh.png().toBuffer();

    const pathPng = getGraphPath(type, 'png');
    await fs.writeFile(pathPng, pngBuffer);


    return pathPng;
}

module.exports = {
    plot
}
