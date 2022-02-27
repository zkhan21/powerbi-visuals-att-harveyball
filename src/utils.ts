/*
Functions and methods used by harveyBall.ts 
*/
import * as d3 from "d3";
import { VisualSettings } from './settings';
import powerbi from "powerbi-visuals-api";
import PrimitiveValue = powerbi.PrimitiveValue;

import {
    HarveyBallViewModel,
    HarveyBallRow
} from './interfaces'

// changes the value of an already loaded css class
export function modifyCSSClass(className: string, classValue: string) {
    var cssMainContainer = d3.select('#css-modifier-container')
    if(cssMainContainer.empty()){
        d3.select('body').append('div').attr('id', 'css-modifier-container')
        var cssMainContainer = d3.select('#css-modifier-container').style('display','none')
    }

    var classContainer = cssMainContainer.select('div[data-class="' + className + '"]');
    if (classContainer.empty()) {
        cssMainContainer.append('div').attr('data-class', className)
        var classContainer = cssMainContainer.select('div[data-class="' + className + '"]');
    }

    classContainer.html('<style> ' + className + ' {' + classValue + '}</style>')
}

// returns the numeric class type for which harvey ball svg to use from 0 (empty) to 4 (full)
export function getHBNum(val, minLocal, maxLocal) {
    let hbRefRange = maxLocal - minLocal
    if (typeof val != 'number') {
        return 5;
    }
    let hbRefScope = [
        { "i": 0, "z": hbRefRange * 0.2 },
        { "i": 1, "z": hbRefRange * 0.4 },
        { "i": 2, "z": hbRefRange * 0.6 },
        { "i": 3, "z": hbRefRange * 0.8 }
    ]
    for (const x of hbRefScope) {
        if (val < (x.z + minLocal)) { 
            return x.i; }
    }
    return 4;
}

// returns the html contents that should fill this specific <td> element based on the value, min and max provided
export function tdContents(val, minLocal, maxLocal) {
    let htmlContent = '<svg class="hb' + getHBNum(val, minLocal, maxLocal) + '"><circle /><path /></svg>'
    return htmlContent
}


// returns row html with td contents for the element and rowData provided
export function addRow(el: HTMLTableRowElement, rowData: HarveyBallRow, indx: number, settings: VisualSettings, model: HarveyBallViewModel) {
    d3.select(el).selectAll("td")
        .data(rowData.values)
        .enter()
        .append('td')
        .style("text-align", (d, i) => model.tableHeaders[i].isMeasure ? settings.harveyBall.hbAlignment : settings.rowHeaders.alignment)
        .style("font-weight", settings.rowHeaders.fontBold ? "bold" : "normal")
        .style("color", settings.rowHeaders.fontColor)
        .style("background-color", (d, i) => model.tableHeaders[i].isMeasure ? settings.harveyBall.bgColor : settings.rowHeaders.bgColor)
        .style("font-size", settings.rowHeaders.fontSize + "px")
        .style("font-family", settings.rowHeaders.fontFamily)
        .attr("class", (d, i) => model.tableHeaders[i].isMeasure ? "harveyBall" : "")
        .html(function (e, d, i) {
            if (model.tableHeaders[d].isMeasure) {
                var minVal: PrimitiveValue = settings.harveyBall.lowValue
                var maxVal: PrimitiveValue = settings.harveyBall.highValue
                if (settings.harveyBall.hbRangeAuto) {
                    minVal = model.tableHeaders[d].localMin
                    maxVal = model.tableHeaders[d].localMax
                } else if (settings.harveyBall.hbRangeGlobal) {
                    minVal = model.globalMin
                    maxVal = model.globalMax
                }

                if (settings.harveyBall.hbRangeAuto &&
                    settings.harveyBall.hbNormalizePerc &&
                    maxVal <= 1) {
                    minVal = 0
                    maxVal = 1
                }
                if (settings.harveyBall.hbRangeAuto &&
                    settings.harveyBall.hbNormalizeNumeric &&
                    maxVal > 1) {
                    minVal = 0
                }
                return tdContents(e, minVal, maxVal)
            }
            return <string>e;
        });
}