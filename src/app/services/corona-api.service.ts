import { Injectable, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Brief, LatestUnit } from '../models/api-model';
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
    return this.http.get<LatestUnit[]>(`${this.server}${path}`, {
      headers: {
        accept: 'application/json'
      }
    });
  }

  // /jhu-edu/timeseries
  timeseries() {
    const path = '/jhu-edu/timeseries';
    return this.http.get(`${this.server}${path} `, {
      headers: {
        accept: 'application/json'
      }
    });
  }
}
