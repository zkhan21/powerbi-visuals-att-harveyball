/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "./../style/visual.less";
import "./../node_modules/powerbi-visuals-utils-interactivityutils/lib/index.css";
import powerbi from "powerbi-visuals-api";

import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import { interactivityBaseService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { BaseBehaviorOptions } from "powerbi-visuals-utils-interactivityutils/lib/baseBehavior";
import { 
    modifyCSSClass,
    addRow
 } from './utils'
import {
    HarveyBallViewModel,
    HarveyBallDatapoint,
    visualTransform,
    Behavior
} from './interfaces'
import { VisualSettings} from './settings';

import * as d3 from "d3";

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

//IVISUAL CLASS

export class Visual implements IVisual {
    private host: IVisualHost;
    private target: HTMLElement;
    private settings: VisualSettings;
    private tableRoot: Selection<HTMLTableElement>;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private events: IVisualEventService;
    private interactivity: interactivityBaseService.IInteractivityService<HarveyBallDatapoint>
    private behavior: Behavior<HarveyBallDatapoint>;
    

    constructor(options: VisualConstructorOptions) {
        this.host = options.host
        this.target = options.element;
        this.events = options.host.eventService;
        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.host.tooltipService, this.target
        );
        this.tableRoot = d3.select(this.target)
            .append('table')
                .style("height", this.target.clientHeight + "px")
                .style("width", this.target.clientWidth + "px")
                .attr('id', 'harveyBallTableRoot');
        this.interactivity = interactivitySelectionService.createInteractivitySelectionService(this.host)
        this.behavior = new Behavior()
    }

    public update(options: VisualUpdateOptions) {
        // fire the events rendering started event message
        this.events.renderingStarted(options);

        // reset table dom elements
        this.tableRoot.selectAll("*").remove()
        this.tableRoot
            .style("height", this.target.clientHeight + "px")
            .style("width", this.target.clientWidth + "px");

        // load visual formatting settings from format pane or default settings.ts file
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);

        let viewModel: HarveyBallViewModel = visualTransform(options, this.host, this.settings);

        // add <thead> to table
        this.tableRoot.append("thead") 

        // modify if parent is allowed to scroll
        this.settings.table.allowScrollX ? this.target.classList.add('hScroll') : this.target.classList.remove('hScroll')
        this.settings.table.allowScrollY ? this.target.classList.add('vScroll') : this.target.classList.remove('vScroll')


        // update global css classes based on certain settings values
        modifyCSSClass('.harveyBall svg', 'height: <hbSize>px !important; width: <hbSize>px !important;'.replace(
            /<hbSize>/g, this.settings.harveyBall.size.toString()
        ))
        let hbHalf = this.settings.harveyBall.size / 2
        modifyCSSClass('.hb0 circle, .hb1 circle, .hb2 circle, .hb3 circle, .hb4 circle', 'cx: <hbHalf>; cy: <hbHalf>; r: <hbHalf>'.replace(
            /<hbHalf>/g, hbHalf.toString()
        ))
        modifyCSSClass('.hb1 path', 'd: path("M X X v -X a X X 1 0 1 X X z")'.replace(
            /X/g, hbHalf.toString()
        ))
        modifyCSSClass('.hb2 path', 'd: path("M X X v -X a X X 1 0 1 X X a X X 0 0 1 -X X z")'.replace(
            /X/g, hbHalf.toString()
        ))
        modifyCSSClass('.hb3 path', 'd: path("M X X h -X a X X 0 1 0 X -X z")'.replace(
            /X/g, hbHalf.toString()
        ))
        modifyCSSClass('.hb0 circle, .hb1 circle, .hb2 circle, .hb3 circle', 'fill: <fill>'.replace(
            /<fill>/g, this.settings.harveyBall.emptyColor
        ))
        modifyCSSClass('.hb4 circle, .hb1 path, .hb2 path, .hb3 path', 'fill: <fill>'.replace(
            /<fill>/g, this.settings.harveyBall.fullColor
        ))


        // select <thead> and append <th> for each column
        let thead = d3.select('thead')
            .selectAll("th")
            .data(viewModel.tableHeaders)
            .enter().append("th")
            .style("display", this.settings.columnHeaders.show ? "revert" : "none")
            .style("text-align", (d) => d.isMeasure ? this.settings.harveyBall.headAlignment : this.settings.columnHeaders.alignment)
            .style("font-weight", this.settings.columnHeaders.fontBold ? "bold" : "normal")
            .style("color", this.settings.columnHeaders.fontColor)
            .style("background-color", this.settings.columnHeaders.bgColor)
            .style("font-size", this.settings.columnHeaders.fontSize + "px")
            .style("font-family", this.settings.columnHeaders.fontFamily)
            .text(function (d) { return d.name; });

        // add <tbody> to table
        this.tableRoot.append("tbody")

        // select <tbody> and add rows for each row of data
        let tempSettings = this.settings
        d3.select('tbody')
            .selectAll("tr")
            .data(viewModel.tableRows)
            .enter().append("tr").each(function (this, d, i) { addRow(this, d, i, tempSettings, viewModel); })



        // tooltip support
        this.tooltipServiceWrapper.addTooltip(
            this.tableRoot.selectAll('td').data(viewModel.data),
            (datapoint: HarveyBallDatapoint) => getTooltipData(
                datapoint),
            (datapoint: HarveyBallDatapoint) => datapoint.selectionId, true);

        function getTooltipData(value: any): VisualTooltipDataItem[] {
            let valFormatter = valueFormatter.create({"format": value.format})
            return [{
                displayName: value.column,
                value: <string>valFormatter.format(value.value)
            }];
        }

        // bind the behavior options of the HarveyBallDataPoint interface to the interactivity service
        this.interactivity.bind(<BaseBehaviorOptions<HarveyBallDatapoint>>{
            behavior: this.behavior,
            dataPoints: viewModel.data,
            clearCatcherSelection: d3.select(this.target),
            elementsSelection: d3.selectAll('td')
        });


        // fire the events rendering finished event message
        this.events.renderingFinished(options);
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let tempEnums: VisualObjectInstanceEnumeration = VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        
        if(tempEnums['instances'][0].objectName == 'harveyBall') {
            // remove the options for high and low values if autoscale is on
            let props = tempEnums['instances'][0].properties
            if(props.hbRangeAuto) {
                delete tempEnums['instances'][0].properties.hbRangeGlobal
            }else{
                delete tempEnums['instances'][0].properties.hbNormalizePerc
                delete tempEnums['instances'][0].properties.hbNormalizeNumeric
            }
            if (props.hbRangeAuto || props.hbRangeGlobal) {
                delete tempEnums['instances'][0].properties.lowValue
                delete tempEnums['instances'][0].properties.highValue
            }
        }
        return tempEnums;
    }
}