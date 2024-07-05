const fs = require('node:fs');
const vegaLite = require('vega-lite');
const vega = require('vega');
const { getGraphPath } = require('../utils/filesystem');

const vegaSpecV5URL = "file:///../resources/vega-spec-v5.json";

function createSpec(url) {
    return {
        "$schema": vegaSpecV5URL,
        "data": {
            url,
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
            "strokeWidth": 1
        },
        "width": 800,
        "height": 400,
        "encoding": {
            "x": {
                "field": "dayOfMonth",
                "type": "nominal",
                "title": "Day of the Month",
                "sort": "ascending",
                "axis": {
                    "labelAngle": 0,
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
                "scale": {"range": ["#ffcccc", "#ccffcc"]},
                "legend": {"title": "Power Status"}
            }
        }
    }
}

function createView(dataUrl) {
    const preSpec = createSpec(dataUrl);
    const spec = vegaLite.compile(preSpec).spec;
    return new vega.View(vega.parse(spec), {renderer: 'none'});
}

async function plot(dataUrl, type) {
    const image = await createView(dataUrl).toSVG();
    const path = getGraphPath(type);
    fs.writeFileSync(path, image);

    return path;
}

module.exports = {
    plot
}
