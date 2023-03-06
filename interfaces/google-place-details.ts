interface ILocation {
    lat: number;
    lng: number;
}

interface IViewport {
    northeast: ILocation;
    southwest: ILocation;
}

interface IGeometry {
    location: ILocation;
    viewport: IViewport;
}

export interface IGoogleSearchPlace {
    geometry: IGeometry;
    icon: string;
    icon_background_color: string;
    icon_mask_base_uri: string;
    name: string;
    place_id: string;
    reference: string;
    scope: string;
    types: string[];
    vicinity: string;
}
