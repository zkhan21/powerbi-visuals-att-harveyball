/*
 *  Power BI Visualizations
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

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

export class TableSettings {
  public allowScrollX: boolean = false;
  public allowScrollY: boolean = true;
}

export class HarveyBallSettings {
  public size: number = 30;
  public emptyColor: string = "#E5E5E5";
  public fullColor: string = "#0057b8";
  public bgColor: string = null;
  public hbRangeAuto: boolean = true;
  public hbNormalizePerc: boolean = true;
  public hbNormalizeNumeric: boolean = true;
  public hbRangeGlobal: boolean = false;
  public lowValue: number = 0;
  public highValue: number = 1;
  public headAlignment: string = "center";
  public hbAlignment: string = "center";
}

export class RowHeaderSettings {
  public show: boolean = true;
  public fontFamily: string = "";
  public fontSize: number = 16;
  public fontColor: string = "black";
  public fontBold: boolean = false;
  public bgColor: string = "";
  public alignment: string = "center";
}

export class ColumnHeaderSettings {
  public show: boolean = true;
  public fontFamily: string = "";
  public fontSize: number = 16;
  public fontColor: string = "white";
  public fontBold: boolean = true;
  public bgColor: string = "#009FDB";
  public alignment: string = "center";
}

export class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  public table: TableSettings = new TableSettings();
  public harveyBall: HarveyBallSettings = new HarveyBallSettings();
  public rowHeaders: RowHeaderSettings = new RowHeaderSettings();
  public columnHeaders: ColumnHeaderSettings = new ColumnHeaderSettings();
}

