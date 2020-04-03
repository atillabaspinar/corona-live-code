import { Injectable, NgModule } from '@angular/core';
import { HttpClient, HttpHeaderResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Brief, Unit } from '../models/api-model';
@Injectable({
  providedIn: 'root'
})


export class CoronaApiService {

  server = 'https://wuhan-coronavirus-api.laeyoung.endpoint.ainize.ai';

  constructor(private http: HttpClient) { }

  brief() {
    const path = '/jhu-edu/brief';
    return this.http.get<Brief>(`${this.server}${path}`, {
      headers: {
        accept: 'application/json'
      }
    });
  }

  // sample() {
  //   return this.http.get('assets/sample.json');
  // }

  latest(country?) {
    const path = '/jhu-edu/latest';
    const countryCode = `iso2=${country}`;
    return this.http.get<Unit[]>(`${this.server}${path}`, {
      headers: {
        accept: 'application/json'
      }
    });
  }

  // /jhu-edu/timeseries
  timeseries(code?) {

    let path = '/jhu-edu/timeseries?onlyCountries=true`';
    if (code) {
      path = `/jhu-edu/timeseries?iso2=${code}&onlyCountries=true`;
    }

    return this.http.get(`${this.server}${path} `, {
      headers: {
        accept: 'application/json'
      }
    });
  }


  b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  csvJSON(csv) {

    const lines = csv.split('\n');

    const result = [];

    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step 
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {

      const obj = {};
      const currentline = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentline[j];
      }

      result.push(obj);

    }

    // return result; //JavaScript object
    return JSON.stringify(result); // JSON
  }

  timeseries2() {
    const headers = new HttpHeaders();
    headers.append('responseType', 'arraybuffer');
    const options = {
      headers
    };
    const d1 = `https://api.github.com/repos/CSSEGISandData/COVID-19
    /contents/csse_covid_19_data/csse_covid_19_daily_reports/03-25-2020.csv`;
    // let repo = 'https://api.github.com/repos/CSSEGISandData/COVID-19/';
    // let pa = 'csse_covid_19_data/csse_covid_19_daily_reports/01-22-2020.csv';
    // slet pat1 = 'https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/csse_covid_19_daily_reports/03-24-2020.csv';
    return this.http.get(d1, options)
      .pipe(
        map((file: any) => {
          // console.log(file);
          const csv = this.b64DecodeUnicode(file.content as string);
          return this.csvJSON(csv);
        })
      );
  }

  confirmed_timeseries() {
    const headers = new HttpHeaders();
    headers.append('responseType', 'arraybuffer');
    const options = {
      headers
    };
    const root = 'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/';
    const path = `csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv`;
    return this.http.get(root + path, options)
      .pipe(
        map((file: any) => {
          // console.log(file);
          const csv = this.b64DecodeUnicode(file.content as string);
          return this.csvJSON(csv);
        })
      );
  }

  deaths_timeseries() {
    const headers = new HttpHeaders();
    headers.append('responseType', 'arraybuffer');
    const options = {
      headers
    };
    const root = 'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/';
    const path = `csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv
    `;
    return this.http.get(root + path, options)
      .pipe(
        map((file: any) => {
          // console.log(file);
          const csv = this.b64DecodeUnicode(file.content as string);
          return this.csvJSON(csv);
        })
      );
  }

  recovered_timeseries() {
    const headers = new HttpHeaders();
    headers.append('responseType', 'arraybuffer');
    const options = {
      headers
    };
    const root = 'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/';
    const path = `csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv
    `;
    return this.http.get(root + path, options)
      .pipe(
        map((file: any) => {
          // console.log(file);
          const csv = this.b64DecodeUnicode(file.content as string);
          return this.csvJSON(csv);
        })
      );
  }
}
