import { Component, OnInit } from '@angular/core';
import { CoronaApiService } from './services/corona-api.service';
import { Brief, LatestUnit } from './models/api-model';
import { TreeNode } from 'primeng/api';

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
  lastest: LatestUnit[];

  valueTree: TreeNode[] = [{
    data: {
      countryregion: 'Countres', recovered: '', deaths: '', confirmed: ''
    },
    label: 'root',
    children: [],
    expanded: true
  }];

  valueTree2;

  sample: TreeNode[] = [];

  constructor(private coronaApi: CoronaApiService) { }


  public findCountryInTree(tree: TreeNode[], id: string): TreeNode {
    for (const node of tree) {
      if ((node.data as LatestUnit).countryregion === id) {
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

    this.coronaApi.timeseries().subscribe(val => {
      console.log(val);
    });
    this.coronaApi.latest().subscribe((values: LatestUnit[]) => {
      // console.log(values);
      const countries: LatestUnit[] = [];
      const valuesRef = JSON.parse(JSON.stringify(values));
      this.lastest = values;
      // this.lastest = values.slice(0, 10);

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
            label: this.lastest[i].countryregion,
            children: []
          };
          country.children.push(temp);
          // console.log(country.data);
          country.data.confirmed += this.lastest[i].confirmed;
          country.data.deaths += this.lastest[i].deaths;
          country.data.recovered += this.lastest[i].recovered;
        } else {
          const element = JSON.parse(JSON.stringify(this.lastest[i]));
          const temp: TreeNode = {
            data: {
              provincestate: element.provincestate,
              countryregion: element.countryregion,
              recovered: element.recovered,
              deaths: element.deaths,
              confirmed: element.confirmed
            },
            expanded: true,
            label: element.countryregion,
            children: []
          };
          this.valueTree[0].children.push(temp);
        }
      }
      this.valueTree = this.valueTree[0].children;
      // setTimeout(() => {
      //   this.valueTree = Object.assign({}, this.valueTree);
      // }, 1);
      // console.log(JSON.stringify(this.valueTree));
    });


    // this.coronaApi.sample().subscribe((val: any) => {
    //   console.log(val);
    //   this.sample = val.data;
    //   console.log(JSON.stringify(this.sample));
    // });


  }


}
