import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppServiceComponent } from '../app.service';
import { Router } from '@angular/router';
import { ExportToCsv } from 'export-to-csv';
import * as data from '../../assets/india.json';
import * as L from 'leaflet';
import * as R from 'leaflet-responsive-popup';
var globalMap;

@Component({
  selector: 'app-udise-report',
  templateUrl: './udise-report.component.html',
  styleUrls: ['./udise-report.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class UdiseReportComponent implements OnInit {
  public title: string = '';
  public titleName: string = '';
  public colors: any;
  public setColor: any;

  // to assign the count of below values to show in the UI footer
  public studentCount: any;
  public schoolCount: any;
  public dateRange: any = '';

  // to hide and show the hierarchy details
  public skul: boolean = false;
  public dist: boolean = false;
  public blok: boolean = false;
  public clust: boolean = false;

  // to hide the blocks and cluster dropdowns
  public blockHidden: boolean = true;
  public clusterHidden: boolean = true;

  // to set the hierarchy names
  public districtHierarchy: any = '';
  public blockHierarchy: any = '';
  public clusterHierarchy: any = '';

  // leaflet layer dependencies
  public layerMarkers = new L.layerGroup();
  public markersList = new L.FeatureGroup();

  // assigning the data to each of these to show in dropdowns and maps
  // for dropdowns
  public data: any;
  public markers: any = [];
  // for maps
  public districtMarkers: any = [];
  public blockMarkers: any = [];
  public clusterMarkers: any = [];
  public schoolMarkers: any = [];

  // to show and hide the dropdowns based on the selection of buttons
  public stateLevel: any = 0; // 0 for buttons and 1 for dropdowns

  // to download the excel report
  public fileName: any;
  public reportData: any = [];

  // variables
  public districtId: any;
  public blockId: any;
  public clusterId: any;

  public myData;
  public infraFilter: any = [];

  public myDistData: any;
  public myBlockData: any = [];
  public myClusterData: any = [];
  public mySchoolData: any = [];

  constructor(
    public http: HttpClient,
    public service: AppServiceComponent,
    public router: Router,
    private changeDetection: ChangeDetectorRef,
  ) {
    service.logoutOnTokenExpire();
  }

  ngOnInit() {
    this.initMap();
    this.districtWise();
    document.getElementById('backBtn').style.display = "none";
    document.getElementById('homeBtn').style.display = "Block";
  }

  //Initialisation of Map  
  initMap() {
    const lat = 22.3660414123535;
    const lng = 71.48396301269531;
    globalMap = L.map('infraMap', { zoomControl: false }).setView([lat, lng], 7);
    applyCountryBorder(globalMap);

    function applyCountryBorder(map) {
      L.geoJSON(data['features'][0], {
        color: "#a9a9a9",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.0
      }).addTo(map);
    }
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}?access_token={token}',
      {
        token: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
        id: 'mapbox.streets',
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        minZoom: 4,
        maxZoom: 18,
      }
    ).addTo(globalMap);
  }

  // to load and hide the spinner 
  loaderAndErr() {
    if (this.data.length !== 0) {
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

  // to load all the districts for state data on the map
  districtWise() {
    try {
      // to clear the existing data on the map layer
      globalMap.removeLayer(this.markersList);
      this.layerMarkers.clearLayers();
      this.districtId = undefined;
      this.errMsg();
      this.infraFilter = [];
      this.level = 'district';
      var fileName = "District_wise_report";

      // these are for showing the hierarchy names based on selection
      this.skul = true;
      this.dist = false;
      this.blok = false;
      this.clust = false;

      // to show and hide the dropdowns
      this.blockHidden = true;
      this.clusterHidden = true;
      // api call to get all the districts data
      if (this.myDistData != undefined) {
        this.data = this.myDistData['data'];
        for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
          let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
          if (val.includes("Index")) {
            val = val.replace('Index', '')
          }
          val = val.replace('Percent', '(%)')
          this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
        }

        this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

        var infraKey = this.infraFilter.filter(function (obj) {
          return obj.key == 'Infrastructure_Score';
        });

        this.infraFilter = this.infraFilter.filter(function (obj) {
          return obj.key !== 'Infrastructure_Score';
        });

        this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
        this.infraFilter.splice(0, 0, infraKey[0]);


        // to show only in dropdowns
        this.districtMarkers = this.myDistData['data'];
        // options to set for markers in the map
        let options = {
          radius: 6,
          fillOpacity: 1,
          strokeWeight: 0.05,
          mapZoom: 7,
          centerLat: 22.3660414123535,
          centerLng: 71.48396301269531,
          level: 'district'
        }
        this.genericFun(this.myDistData, options, fileName);
        // sort the districtname alphabetically
        this.districtMarkers.sort((a, b) => (a.details.District_Name > b.details.District_Name) ? 1 : ((b.details.District_Name > a.details.District_Name) ? -1 : 0));

      } else {

        if (this.myData) {
          this.myData.unsubscribe();
        }
        this.myData = this.service.udise_dist_wise().subscribe(res => {
          this.myDistData = res;
          this.data = res['data'];
          for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
            let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
            if (val.includes("Index")) {
              val = val.replace('Index', '')
            }
            val = val.replace('Percent', '(%)')
            this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
          }

          this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

          var infraKey = this.infraFilter.filter(function (obj) {
            return obj.key == 'Infrastructure_Score';
          });

          this.infraFilter = this.infraFilter.filter(function (obj) {
            return obj.key !== 'Infrastructure_Score';
          });

          this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
          this.infraFilter.splice(0, 0, infraKey[0]);

          // to show only in dropdowns
          this.districtMarkers = this.data;

          // options to set for markers in the map
          let options = {
            radius: 6,
            fillOpacity: 1,
            strokeWeight: 0.01,
            mapZoom: 7,
            centerLat: 22.3660414123535,
            centerLng: 71.48396301269531,
            level: 'district'
          }

          this.data.sort((a, b) => (`${a[this.infraData]}` > `${b[this.infraData]}`) ? 1 : ((`${b[this.infraData]}` > `${a[this.infraData]}`) ? -1 : 0));
          this.genericFun(this.myDistData, options, fileName);

          // sort the districtname alphabetically
          this.districtMarkers.sort((a, b) => (a.details.District_Name > b.details.District_Name) ? 1 : ((b.details.District_Name > a.details.District_Name) ? -1 : 0));

        }, err => {
          this.data = [];
          this.loaderAndErr();
        });
      }

      // adding the markers to the map layers
      globalMap.addLayer(this.layerMarkers);
      document.getElementById('home').style.display = 'none';

    } catch (e) {
      console.log(e);
    }
  }

  // to load all the blocks for state data on the map
  blockWise() {
    try {
      // to clear the existing data on the map layer
      globalMap.removeLayer(this.markersList);
      this.layerMarkers.clearLayers();
      this.errMsg();
      this.reportData = [];
      this.infraFilter = [];
      this.districtId = undefined;
      this.blockId = undefined;
      this.level = 'block_wise';
      this.fileName = "Block_wise_report";

      // these are for showing the hierarchy names based on selection
      this.skul = true;
      this.dist = false;
      this.blok = false;
      this.clust = false;

      // to show and hide the dropdowns
      this.blockHidden = true;
      this.clusterHidden = true;

      // api call to get the all clusters data
      if (this.myData) {
        this.myData.unsubscribe();
      }
      this.myData = this.service.udise_block_wise().subscribe(res => {
        this.myBlockData = res['data'];
        //=================================
        this.data = res['data'];
        for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
          let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
          if (val.includes("Index")) {
            val = val.replace('Index', '')
          }
          val = val.replace('Percent', '(%)')
          this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
        }

        this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

        var infraKey = this.infraFilter.filter(function (obj) {
          return obj.key == 'Infrastructure_Score';
        });

        this.infraFilter = this.infraFilter.filter(function (obj) {
          return obj.key !== 'Infrastructure_Score';
        });

        this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
        this.infraFilter.splice(0, 0, infraKey[0]);
        //=================================
        let options = {
          mapZoom: 7,
          centerLat: 22.3660414123535,
          centerLng: 71.48396301269531,
          level: "block"
        }

        if (this.data.length > 0) {
          let result = this.data
          this.blockMarkers = [];

          this.blockMarkers = result;

          this.schoolCount = 0;
          if (this.blockMarkers.length !== 0) {
            for (let i = 0; i < this.blockMarkers.length; i++) {
              this.colorGredient(this.blockMarkers[i], this.infraData);
              var markerIcon = L.circleMarker([this.blockMarkers[i].details.latitude, this.blockMarkers[i].details.longitude], {
                radius: 4,
                color: "gray",
                fillColor: this.setColor,
                fillOpacity: 1,
                strokeWeight: 0.01,
                weight: 1.5
              }).addTo(globalMap);

              var infraName = this.infraData;
              let colorText = `style='color:blue !important;'`;
              var details = {};
              var orgObject = {};
              var data1 = {};
              var data2 = {};
              Object.keys(this.blockMarkers[i].details).forEach(key => {
                if (key !== "latitude") {
                  details[key] = this.blockMarkers[i].details[key];
                }
              });
              Object.keys(details).forEach(key => {
                if (key !== "longitude") {
                  orgObject[key] = details[key];
                }
              });
              Object.keys(orgObject).forEach(key => {
                if (key !== "district_id") {
                  data1[key] = orgObject[key];
                }
              });
              Object.keys(data1).forEach(key => {
                if (key !== "block_id") {
                  data2[key] = data1[key];
                }
              });
              var yourData = this.getInfoFrom(this.blockMarkers[i].indices, infraName, colorText, options.level).join(" <br>");
              var yourData1 = this.getInfoFrom(data2, infraName, colorText, options.level).join(" <br>");
              var yourData2 = this.getInfoFrom(this.blockMarkers[i].rank, infraName, colorText, options.level).join(" <br>");

              const popup = R.responsivePopup({ hasTip: false, autoPan: false, offset: [15, 20] }).setContent(
                "<b><u>Details</u></b>" +
                "<br>" + yourData1 +
                "<br><br><b><u>Rank</u></b>" +
                "<br>" + yourData2 +
                "<br><br><b><u>All Indices (%)</u></b>" +
                "<br>" + yourData);
              markerIcon.addTo(globalMap).bindPopup(popup);

              markerIcon.on('mouseover', function (e) {
                this.openPopup();
              });
              markerIcon.on('mouseout', function (e) {
                this.closePopup();
              });
              markerIcon.on('click', this.onClick_Marker, this);

              this.layerMarkers.addLayer(markerIcon);
              markerIcon.myJsonData = this.blockMarkers[i];

              //download report
              if (this.infraData !== 'Infrastructure_Score') {
                let obj = {
                  district_id: this.blockMarkers[i].details.district_id,
                  district_name: this.blockMarkers[i].details.District_Name,
                  block_id: this.blockMarkers[i].details.block_id,
                  block_name: this.blockMarkers[i].details.Block_Name,
                  [this.infraData]: this.blockMarkers[i].indices[`${this.infraData}`] + "%"
                }
                this.reportData.push(obj);
              } else {
                let myobj = { ...orgObject, ...this.blockMarkers[i].indices }
                this.reportData.push(myobj);
              }
            }

            globalMap.setView(new L.LatLng(options.centerLat, options.centerLng), 7.3);


            //schoolCount
            this.schoolCount = res['footer'];
            this.schoolCount = (this.schoolCount).toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");

            this.loaderAndErr();
            this.changeDetection.markForCheck();
          }
        }
      }, err => {
        this.data = [];
        this.loaderAndErr();
      });
      globalMap.addLayer(this.layerMarkers);
      document.getElementById('home').style.display = 'block';
    } catch (e) {
      console.log(e);
    }
  }

  // to load all the clusters for state data on the map
  clusterWise() {
    try {
      // to clear the existing data on the map layer
      globalMap.removeLayer(this.markersList);
      this.layerMarkers.clearLayers();
      this.errMsg();
      this.reportData = [];
      this.infraFilter = [];
      this.districtId = undefined;
      this.blockId = undefined;
      this.clusterId = undefined;
      this.level = "cluster_wise";
      this.fileName = "Cluster_wise_report";

      // these are for showing the hierarchy names based on selection
      this.skul = true;
      this.dist = false;
      this.blok = false;
      this.clust = false;

      // to show and hide the dropdowns
      this.blockHidden = true;
      this.clusterHidden = true;

      // api call to get the all clusters data
      if (this.myData) {
        this.myData.unsubscribe();
      }
      this.myData = this.service.udise_cluster_wise().subscribe(res => {
        this.data = res['data']
        //=================================
        for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
          let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
          if (val.includes("Index")) {
            val = val.replace('Index', '')
          }
          val = val.replace('Percent', '(%)')
          this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
        }

        this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

        var infraKey = this.infraFilter.filter(function (obj) {
          return obj.key == 'Infrastructure_Score';
        });

        this.infraFilter = this.infraFilter.filter(function (obj) {
          return obj.key !== 'Infrastructure_Score';
        });

        this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
        this.infraFilter.splice(0, 0, infraKey[0]);
        //=================================
        let options = {
          mapZoom: 7,
          centerLat: 22.3660414123535,
          centerLng: 71.48396301269531,
          level: "cluster"
        }

        if (this.data.length > 0) {
          let result = this.data
          this.clusterMarkers = [];
          this.clusterMarkers = result;
          this.schoolCount = 0;
          if (this.clusterMarkers.length !== 0) {
            for (let i = 0; i < this.clusterMarkers.length; i++) {
              this.colorGredient(this.clusterMarkers[i], this.infraData);
              var markerIcon = L.circleMarker([this.clusterMarkers[i].details.latitude, this.clusterMarkers[i].details.longitude], {
                radius: 2,
                color: "gray",
                fillColor: this.setColor,
                fillOpacity: 1,
                strokeWeight: 0.01,
                weight: 0.5
              }).addTo(globalMap);

              var infraName = this.infraData;
              let colorText = `style='color:blue !important;'`;
              var details = {};
              var orgObject = {};
              var data1 = {};
              var data2 = {};
              var data3 = {};
              Object.keys(this.clusterMarkers[i].details).forEach(key => {
                if (key !== "latitude") {
                  details[key] = this.clusterMarkers[i].details[key];
                }
              });
              Object.keys(details).forEach(key => {
                if (key !== "longitude") {
                  orgObject[key] = details[key];
                }
              });
              Object.keys(orgObject).forEach(key => {
                if (key !== "district_id") {
                  data1[key] = orgObject[key];
                }
              });
              Object.keys(data1).forEach(key => {
                if (key !== "block_id") {
                  data2[key] = data1[key];
                }
              });
              Object.keys(data2).forEach(key => {
                if (key !== "cluster_id") {
                  data3[key] = data2[key];
                }
              });
              var yourData = this.getInfoFrom(this.clusterMarkers[i].indices, infraName, colorText, options.level).join(" <br>");
              var yourData1 = this.getInfoFrom(data3, infraName, colorText, options.level).join(" <br>");
              var yourData2 = this.getInfoFrom(this.clusterMarkers[i].rank, infraName, colorText, options.level).join(" <br>");

              const popup = R.responsivePopup({ hasTip: false, autoPan: false, offset: [15, 20] }).setContent(
                "<b><u>Details</u></b>" +
                "<br>" + yourData1 +
                "<br><br><b><u>Rank</u></b>" +
                "<br>" + yourData2 +
                "<br><br><b><u>All Indices (%)</u></b>" +
                "<br>" + yourData);
              markerIcon.addTo(globalMap).bindPopup(popup);

              markerIcon.on('mouseover', function (e) {
                this.openPopup();
              });
              markerIcon.on('mouseout', function (e) {
                this.closePopup();
              });
              markerIcon.on('click', this.onClick_Marker, this);

              this.layerMarkers.addLayer(markerIcon);
              markerIcon.myJsonData = this.clusterMarkers[i];

              //download report
              if (this.infraData !== 'Infrastructure_Score') {
                let obj = {
                  district_id: this.clusterMarkers[i].details.district_id,
                  district_name: this.clusterMarkers[i].details.District_Name,
                  block_id: this.clusterMarkers[i].details.block_id,
                  block_name: this.clusterMarkers[i].details.Block_Name,
                  cluster_id: this.clusterMarkers[i].details.cluster_id,
                  cluster_name: this.clusterMarkers[i].details.Cluster_Name,
                  [this.infraData]: this.clusterMarkers[i].indices[`${this.infraData}`] + "%"
                }
                this.reportData.push(obj);
              } else {
                let myobj = { ...orgObject, ...this.clusterMarkers[i].indices }
                this.reportData.push(myobj);
              }
            }

            //schoolCount
            this.schoolCount = res['footer'];
            this.schoolCount = (this.schoolCount).toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");

            globalMap.setView(new L.LatLng(options.centerLat, options.centerLng), 7.3);

            this.loaderAndErr();
            this.changeDetection.markForCheck();
          }
        }
      }, err => {
        this.data = [];
        this.loaderAndErr();
      });
      globalMap.addLayer(this.layerMarkers);
      document.getElementById('home').style.display = 'block';
    } catch (e) {
      console.log(e);
    }
  }

  // to load all the schools for state data on the map
  schoolWise() {
    try {
      // to clear the existing data on the map layer
      globalMap.removeLayer(this.markersList);
      this.layerMarkers.clearLayers();
      this.errMsg();
      this.reportData = [];
      this.infraFilter = [];
      this.districtId = undefined;
      this.blockId = undefined;
      this.clusterId = undefined;
      this.level = 'school_wise';
      this.fileName = "School_wise_report";

      // these are for showing the hierarchy names based on selection
      this.skul = true;
      this.dist = false;
      this.blok = false;
      this.clust = false;

      // to show and hide the dropdowns
      this.blockHidden = true;
      this.clusterHidden = true;

      // api call to get the all schools data
      if (this.myData) {
        this.myData.unsubscribe();
      }
      this.myData = this.service.udise_school_wise().subscribe(res => {
        this.data = res['data']
        //=================================
        for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
          let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
          if (val.includes("Index")) {
            val = val.replace('Index', '')
          }
          val = val.replace('Percent', '(%)')
          this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
        }

        this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

        var infraKey = this.infraFilter.filter(function (obj) {
          return obj.key == 'Infrastructure_Score';
        });

        this.infraFilter = this.infraFilter.filter(function (obj) {
          return obj.key !== 'Infrastructure_Score';
        });

        this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
        this.infraFilter.splice(0, 0, infraKey[0]);
        //=================================
        let options = {
          mapZoom: 7,
          centerLat: 22.3660414123535,
          centerLng: 71.48396301269531,
          level: "school"
        }
        this.schoolMarkers = [];
        if (this.data.length > 0) {
          let result = this.data
          this.schoolCount = 0;
          this.schoolMarkers = result;
          if (this.schoolMarkers.length !== 0) {
            for (let i = 0; i < this.schoolMarkers.length; i++) {
              this.colorGredient(this.schoolMarkers[i], this.infraData);
              var markerIcon = L.circleMarker([this.schoolMarkers[i].details.latitude, this.schoolMarkers[i].details.longitude], {
                // renderer: myRenderer,
                radius: 1,
                color: "gray",
                fillColor: this.setColor,
                fillOpacity: 1,
                weight: 0.3,
                strokeWeight: 0
              }).addTo(globalMap);

              var infraName = this.infraData;
              let colorText = `style='color:blue !important;'`;
              var details = {};
              var orgObject = {};
              var schoolData1 = {};
              var schoolData2 = {};
              var schoolData3 = {};
              Object.keys(this.schoolMarkers[i].details).forEach(key => {
                if (key !== "latitude") {
                  details[key] = this.schoolMarkers[i].details[key];
                }
              });
              Object.keys(details).forEach(key => {
                if (key !== "longitude") {
                  orgObject[key] = details[key];
                }
              });
              var detailSchool = {};
              var yourData1;
              Object.keys(orgObject).forEach(key => {
                if (key !== "total_schools_data_received") {
                  detailSchool[key] = orgObject[key];
                }
              });
              Object.keys(detailSchool).forEach(key => {
                if (key !== "district_id") {
                  schoolData1[key] = detailSchool[key];
                }
              });
              Object.keys(schoolData1).forEach(key => {
                if (key !== "block_id") {
                  schoolData2[key] = schoolData1[key];
                }
              });
              Object.keys(schoolData2).forEach(key => {
                if (key !== "cluster_id") {
                  schoolData3[key] = schoolData2[key];
                }
              });
              yourData1 = this.getInfoFrom(schoolData3, infraName, colorText, options.level).join(" <br>");

              var yourData = this.getInfoFrom(this.schoolMarkers[i].indices, infraName, colorText, options.level).join(" <br>");
              var yourData2 = this.getInfoFrom(this.schoolMarkers[i].rank, infraName, colorText, options.level).join(" <br>");

              const popup = R.responsivePopup({ hasTip: false, autoPan: false, offset: [15, 20] }).setContent(
                "<b><u>Details</u></b>" +
                "<br>" + yourData1 +
                "<br><br><b><u>Rank</u></b>" +
                "<br>" + yourData2 +
                "<br><br><b><u>All Indices (%)</u></b>" +
                "<br>" + yourData);
              markerIcon.addTo(globalMap).bindPopup(popup);

              markerIcon.on('mouseover', function (e) {
                this.openPopup();
              });
              markerIcon.on('mouseout', function (e) {
                this.closePopup();
              });

              this.layerMarkers.addLayer(markerIcon);
              markerIcon.myJsonData = this.schoolMarkers[i];

              //download report
              if (this.infraData !== 'Infrastructure_Score') {
                let obj = {
                  district_id: this.schoolMarkers[i].details.district_id,
                  district_name: this.schoolMarkers[i].details.District_Name,
                  block_id: this.schoolMarkers[i].details.block_id,
                  block_name: this.schoolMarkers[i].details.Block_Name,
                  cluster_id: this.schoolMarkers[i].details.cluster_id,
                  cluster_name: this.schoolMarkers[i].details.Cluster_Name,
                  school_id: this.schoolMarkers[i].details.school_id,
                  school_name: this.schoolMarkers[i].details.School_Name,
                  [this.infraData]: this.schoolMarkers[i].indices[`${this.infraData}`] + "%"
                }
                this.reportData.push(obj);
              } else {
                let myobj = { ...detailSchool, ...this.schoolMarkers[i].indices }
                this.reportData.push(myobj);
              }
            }

            globalMap.setView(new L.LatLng(options.centerLat, options.centerLng), 7.3);

            //schoolCount
            this.schoolCount = res['footer'];
            this.schoolCount = (this.schoolCount).toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");

            this.loaderAndErr();
            this.changeDetection.markForCheck();
          }
        }
      }, err => {
        this.data = [];
        this.loaderAndErr();
      });

      globalMap.addLayer(this.layerMarkers);
      document.getElementById('home').style.display = 'block';
    } catch (e) {
      console.log(e);
    }
  }

  // to load all the blocks for selected district for state data on the map
  onDistrictSelect(districtId) {
    // to clear the existing data on the map layer  
    globalMap.removeLayer(this.markersList);
    this.layerMarkers.clearLayers();
    this.errMsg();
    this.blockId = undefined;
    this.reportData = [];
    this.infraFilter = [];

    this.level = 'block';
    var fileName = "Block_per_dist_report";

    // api call to get the blockwise data for selected district
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.udise_blocks_per_dist(districtId).subscribe(res => {
      this.data = res['data'];
      for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
        let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
        if (val.includes("Index")) {
          val = val.replace('Index', '')
        }
        val = val.replace('Percent', '(%)')
        this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
      }

      this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

      var infraKey = this.infraFilter.filter(function (obj) {
        return obj.key == 'Infrastructure_Score';
      });

      this.infraFilter = this.infraFilter.filter(function (obj) {
        return obj.key !== 'Infrastructure_Score';
      });

      this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
      this.infraFilter.splice(0, 0, infraKey[0]);
      //=================================

      this.blockMarkers = this.data;
      // set hierarchy values
      this.districtHierarchy = {
        distId: this.data[0].details.district_id,
        districtName: this.data[0].details.District_Name
      }

      this.districtId = districtId;

      // to show and hide the dropdowns
      this.blockHidden = false;
      this.clusterHidden = true;

      // these are for showing the hierarchy names based on selection
      this.skul = false;
      this.dist = true;
      this.blok = false;
      this.clust = false;

      // options to set for markers in the map
      let options = {
        radius: 4.5,
        fillOpacity: 1,
        strokeWeight: 0.01,
        mapZoom: 8.3,
        centerLat: this.data[0].details.latitude,
        centerLng: this.data[0].details.longitude,
        level: 'block'
      }

      this.genericFun(res, options, fileName);
      // sort the blockname alphabetically
      this.blockMarkers.sort((a, b) => (a.details.Block_Name > b.details.Block_Name) ? 1 : ((b.details.Block_Name > a.details.Block_Name) ? -1 : 0));
    }, err => {
      this.data = [];
      this.loaderAndErr();
    });
    globalMap.addLayer(this.layerMarkers);
    document.getElementById('home').style.display = 'block';
  }

  // to load all the clusters for selected block for state data on the map
  onBlockSelect(blockId) {
    // to clear the existing data on the map layer
    globalMap.removeLayer(this.markersList);
    this.layerMarkers.clearLayers();
    this.errMsg();
    this.clusterId = undefined;
    this.reportData = [];
    this.infraFilter = [];

    this.level = 'cluster';
    var fileName = "Cluster_per_block_report";

    // api call to get the clusterwise data for selected district, block
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.udise_cluster_per_block(this.districtHierarchy.distId, blockId).subscribe(res => {
      this.data = res['data'];
      //=================================
      for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
        let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
        if (val.includes("Index")) {
          val = val.replace('Index', '')
        }
        val = val.replace('Percent', '(%)')
        this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
      }

      this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

      var infraKey = this.infraFilter.filter(function (obj) {
        return obj.key == 'Infrastructure_Score';
      });

      this.infraFilter = this.infraFilter.filter(function (obj) {
        return obj.key !== 'Infrastructure_Score';
      });

      this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
      this.infraFilter.splice(0, 0, infraKey[0]);
      //=================================

      this.clusterMarkers = this.data;
      var myBlocks = [];
      this.blockMarkers.forEach(element => {
        if (element.details.district_id === this.districtHierarchy.distId) {
          myBlocks.push(element);
        }
      });
      this.blockMarkers = myBlocks;

      // set hierarchy values
      this.blockHierarchy = {
        distId: this.data[0].details.district_id,
        districtName: this.data[0].details.District_Name,
        blockId: this.data[0].details.block_id,
        blockName: this.data[0].details.Block_Name
      }

      // to show and hide the dropdowns
      this.blockHidden = false;
      this.clusterHidden = false;

      this.districtId = this.data[0].details.district_id;
      this.blockId = blockId;

      // these are for showing the hierarchy names based on selection
      this.skul = false;
      this.dist = false;
      this.blok = true;
      this.clust = false;

      // options to set for markers in the map
      let options = {
        radius: 4.5,
        fillOpacity: 1,
        strokeWeight: 0.01,
        mapZoom: 10,
        centerLat: this.data[0].details.latitude,
        centerLng: this.data[0].details.longitude,
        level: 'cluster'
      }

      this.genericFun(res, options, fileName);
      // sort the clusterName alphabetically
      this.clusterMarkers.sort((a, b) => (a.details.Cluster_Name > b.details.Cluster_Name) ? 1 : ((b.details.Cluster_Name > a.details.Cluster_Name) ? -1 : 0));
    }, err => {
      this.data = [];
      this.loaderAndErr();
    });
    globalMap.addLayer(this.layerMarkers);
    document.getElementById('home').style.display = 'block';
  }

  // to load all the schools for selected cluster for state data on the map
  onClusterSelect(clusterId) {
    // to clear the existing data on the map layer
    globalMap.removeLayer(this.markersList);
    this.layerMarkers.clearLayers();
    this.errMsg();
    this.reportData = [];
    this.infraFilter = [];
    this.level = 'school';
    var fileName = "School_per_block_report";
    // api call to get the schoolwise data for selected district, block, cluster
    if (this.myData) {
      this.myData.unsubscribe();
    }
    this.myData = this.service.udise_block_wise().subscribe((result: any) => {
      this.myData = this.service.udise_school_per_cluster(this.blockHierarchy.distId, this.blockHierarchy.blockId, clusterId).subscribe(res => {
        this.data = res['data'];
        //=================================
        for (var i = 0; i < Object.keys(this.data[0].indices).length; i++) {
          let val = Object.keys(this.data[0].indices)[i].replace(/_/g, ' ');
          if (val.includes("Index")) {
            val = val.replace('Index', '')
          }
          val = val.replace('Percent', '(%)')
          this.infraFilter.push({ key: Object.keys(this.data[0].indices)[i], value: val });
        }

        this.infraFilter.unshift({ key: "Infrastructure_Score", value: "Infrastructure Score" });

        var infraKey = this.infraFilter.filter(function (obj) {
          return obj.key == 'Infrastructure_Score';
        });

        this.infraFilter = this.infraFilter.filter(function (obj) {
          return obj.key !== 'Infrastructure_Score';
        });

        this.infraFilter.sort((a, b) => (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0));
        this.infraFilter.splice(0, 0, infraKey[0]);
        //=================================

        this.schoolMarkers = this.data;
        var markers = result['data'];
        var myBlocks = [];
        markers.forEach(element => {
          if (element.details.district_id === this.blockHierarchy.distId) {
            myBlocks.push(element);
          }
        });
        this.blockMarkers = myBlocks;

        var myCluster = [];
        this.clusterMarkers.forEach(element => {
          if (element.details.block_id === this.blockHierarchy.blockId) {
            myCluster.push(element);
          }
        });
        this.clusterMarkers = myCluster;

        // set hierarchy values
        this.clusterHierarchy = {
          distId: this.data[0].details.district_id,
          districtName: this.data[0].details.District_Name,
          blockId: this.data[0].details.block_id,
          blockName: this.data[0].details.Block_Name,
          clusterId: this.data[0].details.cluster_id,
          clusterName: this.data[0].details.Cluster_Name,
        }

        this.blockHidden = false;
        this.clusterHidden = false;

        this.districtHierarchy = {
          distId: this.data[0].details.district_id
        }

        this.districtId = this.data[0].details.district_id;
        this.blockId = this.data[0].details.block_id;
        this.clusterId = clusterId;

        // these are for showing the hierarchy names based on selection
        this.skul = false;
        this.dist = false;
        this.blok = false;
        this.clust = true;

        // options to set for markers in the map
        let options = {
          radius: 4.5,
          fillOpacity: 1,
          strokeWeight: 0.01,
          mapZoom: 12,
          centerLat: this.data[0].details.latitude,
          centerLng: this.data[0].details.longitude,
          level: 'school'
        }

        this.genericFun(res, options, fileName);
      }, err => {
        this.data = [];
        this.loaderAndErr();
      });
    }, err => {
      this.data = [];
      this.loaderAndErr();
    });
    globalMap.addLayer(this.layerMarkers);
    document.getElementById('home').style.display = 'block';
  }

  // common function for all the data to show in the map
  genericFun(data, options, fileName) {
    this.reportData = [];
    this.schoolCount = 0;
    var myData = data['data'];
    if (myData.length > 0) {
      this.markers = myData;
      // attach values to markers
      for (var i = 0; i < this.markers.length; i++) {
        this.colorGredient(this.markers[i], this.infraData);
        var markerIcon: any;
        if (options.weight) {
          markerIcon = L.circleMarker([this.markers[i].details.latitude, this.markers[i].details.longitude], {
            radius: options.radius,
            color: "gray",
            fillColor: this.setColor,
            fillOpacity: options.fillOpacity,
            strokeWeight: options.strokeWeight,
            weight: options.weight
          })
        } else {
          markerIcon = L.circleMarker([this.markers[i].details.latitude, this.markers[i].details.longitude], {
            radius: options.radius,
            color: "gray",
            fillColor: this.setColor,
            fillOpacity: options.fillOpacity,
            strokeWeight: options.strokeWeight,
            weight: 1.5
          })
        }

        globalMap.setZoom(options.mapZoom);

        // data to show on the tooltip for the desired levels
        if (options.level) {
          var infraName = this.infraData;

          //Generate dynamic tool-tip
          let colorText = `style='color:blue !important;'`;
          var details = {};
          var orgObject = {};
          var data1 = {};
          var data2 = {};
          var data3 = {};
          Object.keys(this.markers[i].details).forEach(key => {
            if (key !== "latitude") {
              details[key] = this.markers[i].details[key];
            }
          });
          Object.keys(details).forEach(key => {
            if (key !== "longitude") {
              orgObject[key] = details[key];
            }
          });

          var schoolData = {};
          var schoolData1 = {};
          var schoolData2 = {};
          var schoolData3 = {};
          var yourData1;
          if (options.level == "school") {
            Object.keys(orgObject).forEach(key => {
              if (key !== "total_schools_data_received") {
                schoolData[key] = details[key];
              }
            });
            Object.keys(schoolData).forEach(key => {
              if (key !== "district_id") {
                schoolData1[key] = schoolData[key];
              }
            });
            Object.keys(schoolData1).forEach(key => {
              if (key !== "block_id") {
                schoolData2[key] = schoolData1[key];
              }
            });
            Object.keys(schoolData2).forEach(key => {
              if (key !== "cluster_id") {
                schoolData3[key] = schoolData2[key];
              }
            });
            yourData1 = this.getInfoFrom(schoolData3, infraName, colorText, options.level).join(" <br>");
          } else if (options.level == 'district') {
            Object.keys(orgObject).forEach(key => {
              if (key !== "district_id") {
                data1[key] = orgObject[key];
              }
            });
            yourData1 = this.getInfoFrom(data1, infraName, colorText, options.level).join(" <br>");
          } else if (options.level == 'block') {
            Object.keys(orgObject).forEach(key => {
              if (key !== "district_id") {
                data1[key] = orgObject[key];
              }
            });
            Object.keys(data1).forEach(key => {
              if (key !== "block_id") {
                data2[key] = data1[key];
              }
            });
            yourData1 = this.getInfoFrom(data2, infraName, colorText, options.level).join(" <br>");
          } else if (options.level == 'cluster') {
            Object.keys(orgObject).forEach(key => {
              if (key !== "district_id") {
                data1[key] = orgObject[key];
              }
            });
            Object.keys(data1).forEach(key => {
              if (key !== "block_id") {
                data2[key] = data1[key];
              }
            });
            Object.keys(data2).forEach(key => {
              if (key !== "cluster_id") {
                data3[key] = data2[key];
              }
            });
            yourData1 = this.getInfoFrom(data3, infraName, colorText, options.level).join(" <br>");
          }
          var yourData = this.getInfoFrom(this.markers[i].indices, infraName, colorText, options.level).join(" <br>");
          var yourData2 = this.getInfoFrom(this.markers[i].rank, infraName, colorText, options.level).join(" <br>");


          const popup = R.responsivePopup({ hasTip: false, autoPan: false, offset: [15, 20] }).setContent(
            "<b><u>Details</u></b>" +
            "<br>" + yourData1 +
            "<br><br><b><u>Rank</u></b>" +
            "<br>" + yourData2 +
            "<br><br><b><u>All Indices (%)</u></b>" +
            "<br>" + yourData);
          markerIcon.addTo(globalMap).bindPopup(popup);

          this.fileName = fileName;
          if (options.level == "district") {
            if (this.infraData !== 'Infrastructure_Score') {
              let obj = {
                district_id: this.markers[i].details.district_id,
                district_name: this.markers[i].details.District_Name,
                [this.infraData]: this.markers[i].indices[`${this.infraData}`] + "%"
              }
              this.reportData.push(obj);
            } else {
              let myobj = { ...orgObject, ...this.markers[i].indices }
              this.reportData.push(myobj);
            }
          } else if (options.level == "block") {
            if (this.infraData !== 'Infrastructure_Score') {
              let obj = {
                district_id: this.markers[i].details.district_id,
                district_name: this.markers[i].details.District_Name,
                block_id: this.markers[i].details.block_id,
                block_name: this.markers[i].details.Block_Name,
                [this.infraData]: this.markers[i].indices[`${this.infraData}`] + "%"
              }
              this.reportData.push(obj);
            } else {
              let myobj = { ...orgObject, ...this.markers[i].indices }
              this.reportData.push(myobj);
            }
          }
          else if (options.level == "cluster") {
            if (this.infraData !== 'Infrastructure_Score') {
              let obj = {
                district_id: this.markers[i].details.district_id,
                district_name: this.markers[i].details.District_Name,
                block_id: this.markers[i].details.block_id,
                block_name: this.markers[i].details.Block_Name,
                cluster_id: this.markers[i].details.cluster_id,
                cluster_name: this.markers[i].details.Cluster_Name,
                [this.infraData]: this.markers[i].indices[`${this.infraData}`] + "%"
              }
              this.reportData.push(obj);
            } else {
              let myobj = { ...orgObject, ...this.markers[i].indices }
              this.reportData.push(myobj);
            }
          } else if (options.level == "school") {
            if (this.infraData !== 'Infrastructure_Score') {
              let obj = {
                district_id: this.markers[i].details.district_id,
                district_name: this.markers[i].details.District_Name,
                block_id: this.markers[i].details.block_id,
                block_name: this.markers[i].details.Block_Name,
                cluster_id: this.markers[i].details.cluster_id,
                cluster_name: this.markers[i].details.Cluster_Name,
                school_id: this.markers[i].details.school_id,
                school_name: this.markers[i].details.School_Name,
                [this.infraData]: this.markers[i].indices[`${this.infraData}`] + "%"
              }
              this.reportData.push(obj);
            } else {
              let myobj = { ...schoolData, ...this.markers[i].indices }
              this.reportData.push(myobj);
            }
          }

        }
        this.popups(markerIcon, this.markers[i], options);
      }

      this.loaderAndErr();
      this.changeDetection.markForCheck();
    }
    //schoolCount
    this.schoolCount = data['footer'];
    this.schoolCount = (this.schoolCount).toString().replace(/(\d)(?=(\d\d)+\d$)/g, "$1,");

    globalMap.setView(new L.LatLng(options.centerLat, options.centerLng), options.mapZoom);
  }

  public infraData = 'Infrastructure_Score';
  public level = '';
  oninfraSelect(data) {
    this.infraData = data;
    if (this.level == 'district') {
      this.districtWise();
    }
    if (this.level == 'block_wise') {
      this.blockWise();
    }
    if (this.level == 'cluster_wise') {
      this.clusterWise();
    }
    if (this.level == 'school_wise') {
      this.schoolWise();
    }

    if (this.level == 'block') {
      this.onDistrictSelect(this.districtId);
    }
    if (this.level == 'cluster') {
      this.onBlockSelect(this.blockId);
    }
    if (this.level == 'school') {
      this.onClusterSelect(this.clusterId);
    }
  }

  colorGredient(data, infraData) {
    var dataSet = {};
    if (infraData == 'Infrastructure_Score') {
      dataSet = data.details;
    } else {
      dataSet = data.indices;
    }

    if (dataSet[infraData] <= 10) {
      this.setColor = '#a50026';
    }
    if (dataSet[infraData] >= 11 && dataSet[infraData] <= 20) {
      this.setColor = '#d73027';
    }
    if (dataSet[infraData] >= 21 && dataSet[infraData] <= 30) {
      this.setColor = '#f46d43';
    }
    if (dataSet[infraData] >= 31 && dataSet[infraData] <= 40) {
      this.setColor = '#fdae61';
    }
    if (dataSet[infraData] >= 41 && dataSet[infraData] <= 50) {
      this.setColor = '#ffff00';
    }
    if (dataSet[infraData] >= 51 && dataSet[infraData] <= 60) {
      this.setColor = '#bbff33';
    }
    if (dataSet[infraData] >= 61 && dataSet[infraData] <= 70) {
      this.setColor = '#4dff4d';
    }
    if (dataSet[infraData] >= 71 && dataSet[infraData] <= 80) {
      this.setColor = '#66bd63';
    }
    if (dataSet[infraData] >= 81 && dataSet[infraData] <= 90) {
      this.setColor = '#1a9850';
    }
    if (dataSet[infraData] >= 91 && dataSet[infraData] <= 99) {
      this.setColor = '#00b300';
    }
    if (dataSet[infraData] == 100) {
      this.setColor = '#006600';
    }
  }

  //map tooltip automation
  public getInfoFrom(object, infraName, colorText, level) {
    var popupFood = [];
    var stringLine;
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        stringLine = `<span ${infraName == key ? colorText : ''}>` + "<b>" +
          key.replace(
            /\w\S*/g,
            function (txt) {
              if (txt.includes("Index")) {
                txt = txt.replace('Index', '')
              }
              return txt.replace(/_/g, ' ');
            })
          + "</b>" + ": " + object[key] + `</span>`;
      }
      popupFood.push(stringLine);
    }
    return popupFood;
  }

  popups(markerIcon, markers, options) {
    for (var i = 0; i < this.markers.length; i++) {
      markerIcon.on('mouseover', function (e) {
        this.openPopup();
      });
      markerIcon.on('mouseout', function (e) {
        this.closePopup();
      });

      this.layerMarkers.addLayer(markerIcon);
      if (options.level != 'school') {
        markerIcon.on('click', this.onClick_Marker, this);
      }
      markerIcon.myJsonData = markers;
    }
  }

  //Showing tooltips on markers on mouse hover...
  onMouseOver(m, infowindow) {
    m.lastOpen = infowindow;
    m.lastOpen.open();
  }

  //Hide tooltips on markers on mouse hover...
  hideInfo(m) {
    if (m.lastOpen != null) {
      m.lastOpen.close();
    }
  }

  // drilldown/ click functionality on markers
  onClick_Marker(event) {
    this.infraFilter = [];
    var data = event.target.myJsonData.details;
    if (data.district_id && !data.block_id && !data.cluster_id) {
      this.stateLevel = 1;
      this.onDistrictSelect(data.district_id)
    }
    if (data.district_id && data.block_id && !data.cluster_id) {
      this.stateLevel = 1;
      this.districtHierarchy = {
        distId: data.district_id
      }
      this.onBlockSelect(data.block_id)
    }
    if (data.district_id && data.block_id && data.cluster_id) {
      this.stateLevel = 1;
      this.blockHierarchy = {
        distId: data.district_id,
        blockId: data.block_id
      }
      this.onClusterSelect(data.cluster_id)
    }
  }

  // to download the excel report
  downloadReport() {
    if (this.reportData.length <= 0) {
      this.infraFilter = [];
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

}
