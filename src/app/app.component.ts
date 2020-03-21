import { Component, OnInit } from '@angular/core';
import { CoronaApiService } from './services/corona-api.service';
import { Brief, Unit } from './models/api-model';
import { TreeNode } from 'primeng/api';


declare var Plotly: any;
// export interface TreeNode {
//   data?: any;
//   children?: TreeNode[];
//   leaf?: boolean;
//   expanded?: boolean;
// }


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

  selectedNode;

  sample: TreeNode[] = [];

  loading = true;

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


  ngOnInit() {
    this.coronaApi.brief().subscribe((brief: Brief) => {
      console.log(brief);
      this.brief = brief;
    });


    let prev = [];
    this.coronaApi.timeseries().subscribe((result: any[]) => {

      this.loading = true;
      prev = result.map(country => {
        let lastDate = 0;
        let prevDate = 0;
        let lastDateString;
        let prevData;
        let lastdata;
        // tslint:disable-next-line:forin
        for (const seriesEl in country.timeseries) {
          const date1 = Date.parse(seriesEl);
          if (date1 > lastDate) {
            lastDate = date1;
            prevDate = lastDate;
            prevData = lastdata;
            lastDateString = seriesEl;
            lastdata = country.timeseries[seriesEl];
            // console.log('last', lastDateString, lastdata);
          }
        }
        return {
          countryregion: country.countryregion,
          data: prevData
        };

      });
      // console.log('prev', prev);
      this.coronaApi.latest().subscribe((values: Unit[]) => {

        const countries: Unit[] = [];
        const valuesRef = JSON.parse(JSON.stringify(values));
        this.lastest = values.sort((a, b) => b.confirmed - a.confirmed);

        for (let i = 0; i < this.lastest.length - 1; i++) {
          const country = this.findCountryInTree(this.valueTree, this.lastest[i].countryregion);
          if (country) {
            const temp: TreeNode = {
              data: {
                countryregion: this.lastest[i].provincestate,
                recovered: this.lastest[i].recovered,
                deaths: this.lastest[i].deaths,
                confirmed: this.lastest[i].confirmed
              },
              expanded: false,
              label: this.lastest[i].countryregion,
              children: []
            };
            country.children.push(temp);

            // console.log(country.data);
            country.data.confirmed += isNaN(this.lastest[i].confirmed) ? 0 : this.lastest[i].confirmed;
            country.data.deaths += isNaN(this.lastest[i].deaths) ? 0 : this.lastest[i].deaths;
            country.data.recovered += isNaN(this.lastest[i].recovered) ? 0 : this.lastest[i].recovered;
          } else {
            const element = JSON.parse(JSON.stringify(this.lastest[i]));

            const inPrev = prev.find(c => c.countryregion === element.countryregion);

            // countryregion: "Thailand"
            // data:
            // confirmed: 2
            // deaths: 0
            // recovered: 0

            const temp: TreeNode = {
              data: {
                provincestate: element.provincestate,
                countryregion: element.countryregion,
                recovered: element.recovered,
                deaths: element.deaths,
                confirmed: element.confirmed,
                countrycode: { ...element.countrycode },
                prev: { ...inPrev.data }
              },
              expanded: false,
              label: element.countryregion,
              children: []
            };
            // console.log(temp);
            this.valueTree[0].children.push(temp);
          }
        }
        this.valueTree = this.valueTree[0].children;
      });

      this.loading = false;
    });

  }

  nodeSelect(event) {

    const country = event.node.data.countrycode.iso2;
    console.log(country);
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


      const plotData = [{
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
      }];

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
