export interface Brief {
    confirmed: number;
    deaths: number;
    recovered: number;
}

export interface LatestUnit {
    provincestate: string;
    countryregion: string;
    lastupdate: Date;
    location: { lat: number, lng: number };
    countrycode: { iso2: string, iso3: string };
    confirmed: number;
    deaths: number;
    recovered: number;
    sub?: LatestUnit[];
}
