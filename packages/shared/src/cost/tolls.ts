export interface TollRoad {
  name: string;
  road_code: string;
  price_tagged: number;
  price_untagged: number;
}

export const IRISH_TOLLS: TollRoad[] = [
  { name: 'M50 eFlow', road_code: 'M50', price_tagged: 2.60, price_untagged: 3.10 },
  { name: 'M1 Gormanston', road_code: 'M1', price_tagged: 1.90, price_untagged: 2.30 },
  { name: 'M4 Kilcock', road_code: 'M4', price_tagged: 3.00, price_untagged: 3.60 },
  { name: 'M3 Dunboyne', road_code: 'M3', price_tagged: 1.50, price_untagged: 1.90 },
  { name: 'M7/M8 Portlaoise', road_code: 'M7', price_tagged: 1.90, price_untagged: 2.30 },
  { name: 'N6 Galway-Ballinasloe', road_code: 'N6', price_tagged: 1.80, price_untagged: 2.20 },
  { name: 'N8 Fermoy', road_code: 'N8', price_tagged: 1.70, price_untagged: 2.10 },
  { name: 'N18 Limerick Tunnel', road_code: 'N18', price_tagged: 1.90, price_untagged: 2.80 },
  { name: 'N25 Waterford', road_code: 'N25', price_tagged: 1.40, price_untagged: 1.90 },
  { name: 'East Link Dublin', road_code: 'EAST_LINK', price_tagged: 1.54, price_untagged: 2.06 },
];
