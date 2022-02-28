/*
Interfaces leveraged by harveyBall.ts
*/
import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.visuals.ISelectionId;
import PrimitiveValue = powerbi.PrimitiveValue;
import { VisualSettings } from './settings';
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";

import { ISelectionHandler, IInteractiveBehavior } from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";
import { BaseBehaviorOptions } from "powerbi-visuals-utils-interactivityutils/lib/baseBehavior";
import {
    BaseDataPoint
} from "powerbi-visuals-utils-interactivityutils/lib/interactivityBaseService";

// MODELS
export interface HarveyBallViewModel {
    tableHeaders: HarveyBallColumn[];
    tableRows: HarveyBallRow[];
    data: HarveyBallDatapoint[]
    globalMin: PrimitiveValue;
    globalMax: PrimitiveValue;
    columnOrder: number[];
    settings: VisualSettings;
}

export interface HarveyBallColumn {
    name: string;
    isMeasure: boolean;
    localMin: PrimitiveValue;
    localMax: PrimitiveValue;
    format: string;
}

export interface HarveyBallRow {
    values: any[];
    selectionIds: ISelectionId[];
}

export interface HarveyBallDatapoint extends interactivitySelectionService.SelectableDataPoint {
    value: any;
    selectionId: ISelectionId;
    column: string;
    format: string;
}

export interface colOrderArray {
    index: number[];
    valueIndex: number[];
    columnIndex: number[];
}

export class Behavior<SelectableDataPointType extends BaseDataPoint> implements IInteractiveBehavior {

    /** d3 selection object of main elements in the chart */
    protected options: BaseBehaviorOptions<SelectableDataPointType>;
    protected selectionHandler: ISelectionHandler;

    protected bindClick() {
        const {
            elementsSelection
        } = this.options;

        elementsSelection.on("click", (datum) => {
            const mouseEvent: MouseEvent = window.event as MouseEvent;
            mouseEvent && this.selectionHandler.handleSelection(datum, mouseEvent.ctrlKey);
        });
    }
    

    protected bindClearCatcher() {
        // ...
    }

    protected bindContextMenu() {
        const {
            elementsSelection
        } = this.options;

        elementsSelection.on("contextmenu", (datum) => {
            const event: MouseEvent = window.event as MouseEvent;
            if (event) {
                this.selectionHandler.handleContextMenu(
                    datum,
                    {
                        x: event.clientX,
                        y: event.clientY
                    });
                event.preventDefault();
            }
        });
    }

    public bindEvents(
        options: BaseBehaviorOptions<SelectableDataPointType>,
        selectionHandler: ISelectionHandler): void {

        this.options = options;
        this.selectionHandler = selectionHandler;

        this.bindClick();
        this.bindClearCatcher();
        this.bindContextMenu();
    }

    public renderSelection(hasSelection: boolean): void {
        this.options.elementsSelection.style("opacity", (category: any) => {
            if (hasSelection && !category.selected) {
                return 0.3;
            } else {
                return 1;
            }
        });
    }
}


// INTERFACE DEFINITION
export function visualTransform(options: VisualUpdateOptions, host: IVisualHost, vSettings: VisualSettings): HarveyBallViewModel {

    // get references to the dataview for this update
    let dataViews = options.dataViews;

    let viewModel: HarveyBallViewModel = {
        tableHeaders: [],
        tableRows: [],
        data: [],
        globalMin: null,
        globalMax: null,
        columnOrder: [],
        settings: vSettings
    }

    // when the dataView is empty -- in all applicable attributes -- return the blank viewModel: HarveyBallViewModel
    if (!dataViews
        || !dataViews[0]
        || !dataViews[0].table
        || !dataViews[0].table.columns
        || !dataViews[0].table.rows
    ) {
        return viewModel;
    }
    
    // setup local variables if table view exists
    var dataRows = dataViews[0].table.rows
    var dataColumns = dataViews[0].table.columns

    //get order of columns with groupings first
    let colIndexes: colOrderArray = {
        index: [],
        valueIndex: [],
        columnIndex: []
    }
    let colCount = dataColumns.length
    let measureCount = 0
    for (const col of dataColumns) {
        colIndexes.index.push(col.index)
        if (!col.isMeasure) {
            colIndexes.columnIndex.push(col['rolesIndex']['dataRows'][0])
            colIndexes.valueIndex.push(null)
        } else {
            measureCount++
            colIndexes.columnIndex.push(null)
            colIndexes.valueIndex.push(col['rolesIndex']['dataValue'][0])
        }
    }

    if (viewModel.settings.rowHeaders.show) {
        for (var i = 0; i < colCount - measureCount; i++) {
            let rootIndex = colIndexes.columnIndex.findIndex(x => x == i)
            viewModel.columnOrder.push(rootIndex)
        }
    }
    for (var i = 0; i < measureCount; i++) {
        let rootIndex = colIndexes.valueIndex.findIndex(x => x == i)
        viewModel.columnOrder.push(rootIndex)
    }

    // get column headers

    for (const i of viewModel.columnOrder) {
        let temp: HarveyBallColumn = {
            name: dataColumns[i].displayName,
            isMeasure: dataColumns[i].isMeasure,
            localMin: dataColumns[i].hasOwnProperty('aggregates') ? dataColumns[i].aggregates.minLocal : null,
            localMax: dataColumns[i].hasOwnProperty('aggregates') ? dataColumns[i].aggregates.maxLocal : null,
            format: dataColumns[i].hasOwnProperty('format') ? dataViews[0].metadata.columns[i].format : null,
        }
        viewModel.tableHeaders.push(temp)
        if (!viewModel.globalMin || viewModel.globalMin > temp.localMin) { viewModel.globalMin = temp.localMin }
        if (!viewModel.globalMax || viewModel.globalMax < temp.localMax) { viewModel.globalMax = temp.localMax }
    }

    // get table rows and apply order
    for (const [rowIndex, r] of dataRows.entries()) {
        let temp: HarveyBallRow = {
            values: [],
            selectionIds: []
        }
        for (const [colIndex, i] of viewModel.columnOrder.entries()) {
            let tempDatapoint: HarveyBallDatapoint = {
                value: null,
                selectionId: null,
                column: null,
                format: null,
                identity: null,
                selected: false
            }
            temp.values.push(r[i])
            tempDatapoint.value = r[i]
            const selectionId: ISelectionId = host.createSelectionIdBuilder()
                .withTable(dataViews[0].table, <number>rowIndex)
                .createSelectionId();
            temp.selectionIds.push(selectionId)
            tempDatapoint.selectionId = selectionId
            tempDatapoint.identity = selectionId
            tempDatapoint.column = viewModel.tableHeaders[colIndex].name
            tempDatapoint.format = viewModel.tableHeaders[colIndex].format
            viewModel.data.push(tempDatapoint)
        }
        viewModel.tableRows.push(temp)
    }

    return viewModel;
    
}