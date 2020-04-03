import { Component, OnInit } from '@angular/core';
import { CoronaApiService } from './services/corona-api.service';
import { Brief, Unit, DataUnit } from './models/api-model';
import { TreeNode, SelectItem } from 'primeng/api';
import { forkJoin } from 'rxjs';

declare var Plotly: any;
declare var moment: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'corona-live';

  brief: Brief;
  lastest: Unit[];

  valueTree: TreeNode[] = [{
    data: {
      countryregion: 'Countres', recovered: '', deaths: '', confirmed: ''
    },
    label: 'root',
    children: [],
    expanded: true
  }];

  selectedChartType = 'confirmed';


  selectedNodes;

  chartTypes = [
    { name: 'Bar', value: 'bar' },
    { name: 'Line', value: 'scatter' }
  ];

  selectedChartT = this.chartTypes[0];

  selectedCountries: SelectItem[] = [];

  countries: SelectItem[] = [];

  world: SelectItem = {
    label: 'World',
    value: {}
  };

  sample: TreeNode[] = [];

  loading = 0;

  barModes = [{ name: 'group' }, { name: 'stack' }];
  barMode = this.barModes[0];

  dateRangeValues = [];
  dateRange = [];
  firstTime = true;

  differential = false;
  scale = false;

  constructor(private coronaApi: CoronaApiService) { }


  public findCountryInTree(tree: TreeNode[], id: string): TreeNode {
    for (const node of tree) {
      if ((node.data as Unit).countryregion === id) {
        return node;
      } else {
        if (node.children && node.children.length > 0) {
          const result = this.findCountryInTree(node.children, id);
          if (result) {
            return result;
          }
        }
      }
    }
    return null;
  }

  refreshData() {

    this.loading++;
    this.coronaApi.brief().subscribe((brief: Brief) => {
      console.log(brief);
      this.brief = brief;
      this.loading--;
    });


    this.loading++;
    // const deaths$ = this.coronaApi.deaths_timeseries();
    // const confirmed = this.coronaApi.confirmed_timeseries();
    // const recovered = this.coronaApi.recovered_timeseries();

    // forkJoin([deaths$, confirmed, recovered]).subscribe(val => {
    //   console.log(val[0]);
    //   const deathsJSON = JSON.parse(val[0]);
    //   const confirmedJSON = JSON.parse(val[1]);
    //   const recoveredSON = JSON.parse(val[2]);
    //   // tslint:disable-next-line: forin
    //   for (const countries of confirmedJSON) {
    //     // tslint:disable-next-line: forin
    //     for (const seriesEl in countries) {
    //       const date1 = moment(seriesEl, 'MM-DD-YY').format('M/D/YY');
    //       if (!isNaN(Date.parse(date1))) {
    //         console.log(date1, countries[date1]);
    //       }
    //     }
    //   }
    // });


    this.coronaApi.timeseries().subscribe((result: any[]) => {

      let countries: SelectItem[] = [];
      for (const cntry of result) {
        const timeseries = [];
        // tslint:disable-next-line: forin
        for (const seriesEl in cntry.timeseries) {
          timeseries.push({ date: seriesEl, data: { ...cntry.timeseries[seriesEl] } });
        }
        let prevTime = timeseries[0];
        const timeseriesDelta = [];
        for (let i = 1; i < timeseries.length; i++) {
          // const deltaConfirmed = (timeseries[i].data.confirmed - prevTime.data.confirmed) / prevTime.data.confirmed;
          // const deltaRecovered = (timeseries[i].data.recovered - prevTime.data.recovered) / prevTime.data.recovered;
          // const deltaDeaths = (timeseries[i].data.deaths - prevTime.data.deaths) / prevTime.data.deaths;


          const deltaConfirmed = (timeseries[i].data.confirmed - prevTime.data.confirmed);
          const deltaRecovered = (timeseries[i].data.recovered - prevTime.data.recovered);
          const deltaDeaths = (timeseries[i].data.deaths - prevTime.data.deaths);

          prevTime = timeseries[i];
          timeseries[i].data = {
            ...timeseries[i].data,
            deltaconfirmed: deltaConfirmed || 0,
            deltarecovered: deltaRecovered || 0,
            deltadeaths: deltaDeaths || 0
          };
        }
        const country: SelectItem = {
          label: cntry.countryregion,
          value: {
            countryregion: cntry.countryregion,
            // countrycode: ct.countrycode,
            latest: timeseries[timeseries.length - 1],
            timeseries: [...timeseries]
          }
        };
        countries.push(country);


      }
      countries = countries.sort((a, b) => {
        if (b.value.latest.data.confirmed && a.value.latest.data.confirmed) {
          return b.value.latest.data.confirmed - a.value.latest.data.confirmed;
        }
      });

      // construct world data
      const dateArray = countries[0].value.timeseries.map(ts => {
        return {
          date: ts.date,
          data: {
            confirmed: 0,
            recovered: 0,
            deaths: 0,
            deltaconfirmed: 0,
            deltarecovered: 0,
            deltadeaths: 0
          }
        };
      });
      this.world.label = 'world';
      this.world.value = {
        countryregion: 'world',
        timeseries: dateArray
      };
      for (let i = 0; i < this.world.value.timeseries.length; i++) {
        for (const ct of countries) {
          this.world.value.timeseries[i].data.confirmed += ct.value.timeseries[i]?.data?.confirmed || 0;
          this.world.value.timeseries[i].data.recovered += ct.value.timeseries[i]?.data?.recovered || 0;
          this.world.value.timeseries[i].data.deaths += ct.value.timeseries[i]?.data?.deaths || 0;
          this.world.value.timeseries[i].data.deltaconfirmed += ct.value.timeseries[i]?.data?.deltaconfirmed || 0;
          this.world.value.timeseries[i].data.deltarecovered += ct.value.timeseries[i]?.data?.deltarecovered || 0;
          this.world.value.timeseries[i].data.deltadeaths += ct.value.timeseries[i]?.data?.deltadeaths || 0;
        }
      }

      this.countries = countries;
      this.dateRange[0] = 0;
      this.dateRange[1] = countries[0].value.timeseries.length;
      if (this.firstTime) {
        this.dateRangeValues = [0, countries[0].value.timeseries.length];

        this.firstTime = false;
      }
      setTimeout(() => {
        this.refreshBar(this.selectedCountries, this.selectedChartType);
      }, 10);

      this.loading--;
    });
  }

  ngOnInit() {
    this.refreshData();

    setInterval(() => {
      this.refreshData();
    }, 2 * 60 * 1000);
  }


  refreshBar(countries, selectedType) {
    if (this.differential) {
      selectedType = 'delta' + selectedType;
    }
    const plotData = [];
    if (countries.length === 0) {
      let xAxis = this.world.value.timeseries.map(s => {
        return s.date;
      });
      xAxis = xAxis.slice(this.dateRangeValues[0], this.dateRangeValues[1]);
      let yAxis = this.world.value.timeseries.map(s => {
        return s.data[selectedType];
      });
      yAxis = yAxis.slice(this.dateRangeValues[0], this.dateRangeValues[1]);
      const cTrace = {
        x: xAxis,
        y: yAxis,
        name: 'World',
        type: this.selectedChartT.value,
        showlegend: true
      };

      plotData.push(cTrace);
    }
    countries.forEach(c => {
      let xAxis = c.timeseries.map(s => {
        return s.date;
      });
      xAxis = xAxis.slice(this.dateRangeValues[0], this.dateRangeValues[1]);

      let yAxis = c.timeseries.map(s => {
        return s.data[selectedType];
      });
      yAxis = yAxis.slice(this.dateRangeValues[0], this.dateRangeValues[1]);

      const country = c.countryregion;
      const cTrace = {
        x: xAxis,
        y: yAxis,
        name: country,
        type: this.selectedChartT.value,
        showlegend: true
      };
      plotData.push(cTrace);
    });

    const layout = {
      //  title: event.node.data.countryregion,
      xaxis: {
        // title: 'Time',
        showgrid: false,
        zeroline: false
      },
      yaxis: {
        // title: '#',
        showline: false,
        type: this.scale ? 'log' : 'linear'
      },
      barmode: this.barMode.name,
      margin: {
        t: 40, b: 80, l: 40, r: 40, pad: 0
      },
      paper_bgcolor: '#eeeeeeff',
      plot_bgcolor: '#eeeeeeff'
    };

    const config = {
      responsive: true,
      displayModeBar: false
    };
    const plotEl = document.getElementById('plotly-element');
    Plotly.newPlot(plotEl, plotData, layout, config);
  }

  listSelect(event) {
    // console.log(event);
    // if (event.value.length === 0) {
    //   const plotEl = document.getElementById('plotly-element');
    //   Plotly.purge(plotEl);
    //   return;
    // }
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  typeChanged(event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  chartTypeChanged(event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  barModeChange(event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  rangeChanged(event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  differentialChange(event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  scaleChange($event) {
    this.refreshBar(this.selectedCountries, this.selectedChartType);
  }

  nodeSelect(event) {
    const country = event.node.data.countrycode.iso2;
    console.log(country);

    const plotData = [];
    this.coronaApi.timeseries(country).subscribe(result => {
      console.log(result);
      const series = result[0].timeseries;
      const confirmed = [];
      const recovered = [];
      const deaths = [];
      const xAxis = [];
      // tslint:disable-next-line: forin
      for (const el in series) {
        console.log(series[el], el);
        confirmed.push(series[el].confirmed);
        recovered.push(series[el].recovered);
        deaths.push(series[el].deaths);
        xAxis.push(el);
        const elDate = Date.parse(el);
      }
      const plotEl = document.getElementById('history-plot');


      plotData.push({
        x: xAxis,
        y: confirmed,
        type: 'scatter',
        name: country + ' Confirmed',
      }, {
        x: xAxis,
        y: recovered,
        type: 'scatter',
        name: country + ' Recovered'
      },
        {
          x: xAxis,
          y: deaths,
          type: 'scatter',
          name: country + ' Deaths',
        });

      const layout = {
        title: event.node.data.countryregion,
        xaxis: {
          // title: 'Time',
          showgrid: false,
          zeroline: false
        },
        yaxis: {
          // title: '#',
          showline: false
        },
        margin: {
          t: 40, b: 80, l: 40, r: 40, pad: 0
        },
        paper_bgcolor: '#eeeeeeff',
        plot_bgcolor: '#eeeeeeff'
      };

      const config = {
        responsive: true,
        displayModeBar: false
      };

      Plotly.newPlot(plotEl, plotData, layout, config);

    });
  }

  nodeUnselect(event) {

  }


}


// countrycode: {iso2: "AO", iso3: "AGO"}
    // countryregion: "Angola"
    // lastupdate: "2020-03-21T20:42:00.005Z"
    // location: {lat: -11.2027, lng: 17.8739}
    // provincestate: ""
    // timeseries:
    // 1/22/20:
    // confirmed: 0
    // deaths: 0
    // recovered: 0

    // TREE CODE
    // let prev = [];
    // this.coronaApi.timeseries().subscribe((result: any[]) => {

    //   this.loading = true;
    //   prev = result.map(country => {
    //     let lastDate = 0;
    //     let prevDate = 0;
    //     let lastDateString;
    //     let prevData;
    //     let lastdata;
    //     // tslint:disable-next-line:forin
    //     for (const seriesEl in country.timeseries) {
    //       const date1 = Date.parse(seriesEl);
    //       if (date1 > lastDate) {
    //         lastDate = date1;
    //         prevDate = lastDate;
    //         prevData = lastdata;
    //         lastDateString = seriesEl;
    //         lastdata = country.timeseries[seriesEl];
    //         // console.log('last', lastDateString, lastdata);
    //       }
    //     }
    //     return {
    //       countryregion: country.countryregion,
    //       data: prevData
    //     };

    //   });
    //   // console.log('prev', prev);
    //   this.coronaApi.latest().subscribe((values: Unit[]) => {

    //     const countries: Unit[] = [];
    //     const valuesRef = JSON.parse(JSON.stringify(values));
    //     this.lastest = values.sort((a, b) => b.confirmed - a.confirmed);

    //     for (let i = 0; i < this.lastest.length - 1; i++) {
    //       const country = this.findCountryInTree(this.valueTree, this.lastest[i].countryregion);
    //       if (country) {
    //         const temp: TreeNode = {
    //           data: {
    //             countryregion: this.lastest[i].provincestate,
    //             recovered: this.lastest[i].recovered,
    //             deaths: this.lastest[i].deaths,
    //             confirmed: this.lastest[i].confirmed
    //           },
    //           expanded: false,
    //           label: this.lastest[i].countryregion,
    //           children: []
    //         };
    //         country.children.push(temp);

    //         // console.log(country.data);
    //         country.data.confirmed += isNaN(this.lastest[i].confirmed) ? 0 : this.lastest[i].confirmed;
    //         country.data.deaths += isNaN(this.lastest[i].deaths) ? 0 : this.lastest[i].deaths;
    //         country.data.recovered += isNaN(this.lastest[i].recovered) ? 0 : this.lastest[i].recovered;
    //       } else {
    //         const element = JSON.parse(JSON.stringify(this.lastest[i]));

    //         const inPrev = prev.find(c => c.countryregion === element.countryregion);

    //         // countryregion: "Thailand"
    //         // data:
    //         // confirmed: 2
    //         // deaths: 0
    //         // recovered: 0

    //         const temp: TreeNode = {
    //           data: {
    //             provincestate: element.provincestate,
    //             countryregion: element.countryregion,
    //             recovered: element.recovered,
    //             deaths: element.deaths,
    //             confirmed: element.confirmed,
    //             countrycode: { ...element.countrycode },
    //             prev: { ...inPrev.data }
    //           },
    //           expanded: false,
    //           label: element.countryregion,
    //           children: []
    //         };
    //         // console.log(temp);
    //         this.valueTree[0].children.push(temp);
    //       }
    //     }
    //     this.valueTree = this.valueTree[0].children;
    //   });

    //   this.loading = false;
    // });