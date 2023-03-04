import lodash from 'lodash'
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

export interface ILocalDbConfig {
    path: string;
}

export type GooglePlace = {
    id?: number;
    name: string;
    placeId: string;
}

type Data = {
    googlePlaces: GooglePlace[]
}

class LowWithLodash<T> extends Low<T> {
    chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

export class LocalDb {
    private readonly db: any;

    constructor(config: ILocalDbConfig) {
        const adapter = new JSONFile<Data>(config.path)
        this.db = new LowWithLodash(adapter)
    }

    public async init(): Promise<void> {
        await this.db.read()
        this.db.data ||= {googlePlaces: []};
    }

    public getGooglePlaces(): GooglePlace[] {
        return this.db.chain.get("googlePlaces").value();
    }

    public getGooglePlaceByPlaceId(placeId: string): GooglePlace {
        return this.db.chain.get("googlePlaces").find({ placeId }).value();
    }

    public async addGooglePlace(place: GooglePlace): Promise<GooglePlace> {
        const id = this.db.chain.get("googlePlaces").size().value() + 1;
        const newPlace = { id, ...place };
        this.db.chain.get("googlePlaces").value().push(newPlace);
        await this.db.write();
        return newPlace;
    }
}
