import { Injectable, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

    let path = '/jhu-edu/timeseries';
    if (code) {
      path = `/jhu-edu/timeseries?iso2=${code}&onlyCountries=true`;
    }
    return this.http.get(`${this.server}${path} `, {
      headers: {
        accept: 'application/json'
      }
    });
  }
}
