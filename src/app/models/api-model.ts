export interface Brief {
    confirmed: number;
    deaths: number;
    recovered: number;
}

export interface Unit {
    provincestate: string;
    countryregion: string;
    lastupdate: Date;
    location: { lat: number, lng: number };
    countrycode: { iso2: string, iso3: string };
    confirmed: number;
    deaths: number;
    recovered: number;
    sub?: Unit[];
}

// From John Hopkins data source
export interface DataUnit {
    FIPS: number;
    Admin2: string;
    Province_State: string;
    Country_Region: string;
    Last_Update: Date;
    Lat: number;
    Long_: number;
    Confirmed: number;
    Deaths: number;
    Recovered: number;
    Active: number;
    Combined_Key: string;
}
