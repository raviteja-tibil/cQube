import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppServiceComponent } from '../app.service';
import { Router } from '@angular/router';
import { ExportToCsv } from 'export-to-csv';
declare const $;

@Component({
  selector: 'app-diksha-table',
  templateUrl: './diksha-table.component.html',
  styleUrls: ['./diksha-table.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DikshaTableComponent implements OnInit {
  public result: any = [];
  public districtId: any = '';
  public timePeriod: any = '';
  public collectionType = 'all';
  public allCollections = [];
  public timeDetails: any = [];
  public districtsDetails: any = '';
  dataTable: any;
  dtOptions: any;
  tableData: any = [];
  public hierName: any;
  public dist: boolean = false;
  public all: boolean = false;
  fileName;
  reportData: any = [];
  header = '';

  constructor(
    public http: HttpClient,
    public service: AppServiceComponent,
    public router: Router,
    private changeDetection: ChangeDetectorRef,
  ) {
    this.allCollections = [{ id: "all", name: "Overall" }, { id: "course", name: "Course" }, { id: "textbook", name: "Textbook" }]
    service.logoutOnTokenExpire();
  }

  ngOnInit(): void {
    document.getElementById('backBtn').style.display = "none";
    document.getElementById('homeBtn').style.display = "Block";
    this.collectionWise();
  }

  loaderAndErr() {
    if (this.result.length !== 0) {
      document.getElementById('spinner').style.display = 'none';
    } else {
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('errMsg').style.color = 'red';
      document.getElementById('errMsg').style.display = 'block';
      document.getElementById('errMsg').innerHTML = 'No data found';
    }
  }

  errMsg() {
    document.getElementById('errMsg').style.display = 'none';
    document.getElementById('spinner').style.display = 'block';
    document.getElementById('spinner').style.marginTop = '3%';
  }

  default() {
    this.collectionType = "all";
    this.collectionWise();
  }

  collectionWise() {
    document.getElementById('home').style.display = "none";
    this.errMsg();
    this.districtId = '';
    this.timePeriod = '';
    this.all = true
    this.dist = false;
    this.timeDetails = [];
    this.service.dikshaMetaData().subscribe(result => {
      this.districtsDetails = result['districtDetails']
      result['timeRange'].forEach((element) => {
        var obj = { timeRange: element, name: this.changeingStringCases(element.replace(/_/g, ' ')) }
        this.timeDetails.push(obj);
      });
    })
    if (this.result.length! > 0) {
      $('#table').DataTable().destroy();
      $('#table').empty();
    }
    this.result = [];
    this.reportData = [];
    this.header = this.changeingStringCases(this.collectionType) + " linked";
    if (this.collectionType == "all") {
      this.header = "Overall";
    }
    this.header = this.header;
    this.service.dikshaAllTableData({ collectionType: this.collectionType }).subscribe(res => {
      this.fileName = `Diksha_All_Data_${this.timePeriod}`;
      this.result = res;
      this.tableCreation(this.result);

      this.result.forEach(element => {
        var obj1 = {};
        var obj2 = {};
        Object.keys(element).forEach(key => {
          if (key !== "district_id") {
            obj1[key] = element[key];
          }
        });
        Object.keys(obj1).forEach(key => {
          if (key !== "district_name") {
            obj2[key] = obj1[key];
          }
        });
        this.reportData.push(obj2);
      });

      // this.reportData = this.result;
      document.getElementById('spinner').style.display = 'none';
    }, err => {
      this.loaderAndErr();
    })
  }

  districtWise(districtId) {
    this.errMsg();
    document.getElementById('home').style.display = "Block";
    this.districtId = districtId
    if (this.timePeriod != '' && districtId != '') {
      this.all = false
      this.dist = true
      let d = this.districtsDetails.filter(item => {
        if (item.district_id == districtId)
          return item.district_name
      })
      this.hierName = d[0].district_name
      this.timeRange(this.timePeriod)
    } else {
      if (districtId == '') {
        this.all = true
        this.dist = false
      } else {
        this.all = false
        this.dist = true
        let d = this.districtsDetails.filter(item => {
          if (item.district_id == districtId)
            return item.district_name
        })
        this.hierName = d[0].district_name
      }

      if (this.result.length! > 0) {
        $('#table').DataTable().destroy();
        $('#table').empty();
      }
      this.result = [];
      this.reportData = [];
      this.service.dikshaDistrictTableData({ districtId: districtId, collectionType: this.collectionType }).subscribe(res => {
        this.fileName = `Diksha_Dist_Data_${this.timePeriod}`;
        this.result = res;
        this.tableCreation(this.result);

        this.reportData = this.result;

        document.getElementById('spinner').style.display = 'none';
      }, err => {
        this.loaderAndErr();
      })
    }

  }

  timeRange(timePeriod) {
    this.errMsg();
    document.getElementById('home').style.display = "Block";
    if (this.districtId == '') {
      this.districtId = undefined
    }
    this.timePeriod = timePeriod
    if (this.result.length! > 0) {
      $('#table').DataTable().destroy();
      $('#table').empty();
    }
    this.result = [];
    this.reportData = [];
    this.service.dikshaTimeRangeTableData({ districtId: this.districtId, timePeriod: timePeriod, collectionType: this.collectionType }).subscribe(res => {
      this.result = res;
      this.tableCreation(this.result);
      if (this.hierName) {
        this.reportData = this.result;
        this.fileName = `Diksha_${this.hierName}_Dist_Data_${this.timePeriod}`;
      } else {
        this.result.forEach(element => {
          var obj1 = {};
          var obj2 = {};
          Object.keys(element).forEach(key => {
            if (key !== "district_id") {
              obj1[key] = element[key];
            }
          });
          Object.keys(obj1).forEach(key => {
            if (key !== "district_name") {
              obj2[key] = obj1[key];
            }
          });
          this.reportData.push(obj2);
        });
        this.fileName = `Diksha_${this.collectionType}_Dist_Data_${this.timePeriod}`;
      }

      document.getElementById('spinner').style.display = 'none';
    }, err => {
      this.loaderAndErr();
    })
  }

  downloadRoport() {
    if (this.reportData.length <= 0) {
      alert("No data fount to download");
    } else {
      const options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        showTitle: false,
        title: 'My Awesome CSV',
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
        filename: this.fileName
      };
      const csvExporter = new ExportToCsv(options);
      csvExporter.generateCsv(this.reportData);
    }
  }
  changeingStringCases(str) {
    return str.replace(
      /\w\S*/g,
      function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  tableCreation(dataSet) {
    var my_columns = [];
    $.each(dataSet[0], function (key, value) {
      var my_item = {};
      my_item['data'] = key;
      my_item['value'] = value;
      // if (value != 'All' && value != '') {
      my_columns.push(my_item);
      // }
    });


    $(document).ready(function () {
      var headers = '<thead><tr>'
      var body = '<tbody>';

      my_columns.forEach((column, i) => {
        var col = (column.data.replace(/_/g, ' ')).replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        headers += `<th style="font-size: 14px"> ${col}</th>`;
      });

      let newArr = [];
      $.each(dataSet, function (a, b) {
        let temp = [];
        $.each(b, function (key, value) {
          var new_item = {};
          new_item['data'] = key;
          new_item['value'] = value;
          // if (value != 'All' && value != '') {
          temp.push(new_item);
          // }
        });
        newArr.push(temp)
      });

      newArr.forEach((columns) => {
        body += '<tr>';
        columns.forEach((column) => {
          body += `<td>${column.value}</td>`
        });
        body += '</tr>';
      });

      headers += `</tr></thead>`;
      body += '</tr></tbody>';
      $(`#table`).empty();
      $(`#table`).append(headers);
      $(`#table`).append(body);
      $(`#table`).DataTable({
        "order": [[my_columns.length - 5, "desc"]],
        destroy: true, bLengthChange: false, bInfo: false,
        bPaginate: false, scrollY: "64vh", scrollX: true,
        scrollCollapse: true, paging: false, searching: true,
        fixedColumns: {
          leftColumns: 1
        }
      });
    });
  }
}