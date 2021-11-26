import { FeatureName, generator } from "./feature-name-interface";

import { FeaturesData } from "./features-data";

import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry
} from "geojson";

import lineDistance from "@turf/line-distance";
import area from "@turf/area";

//Class to manage and create the leaderboard
export class Leaderboard implements FeatureName {
  building: string[] = [];
  highway: string[] = [];
  landuse: string[] = [];
  waterway: string[] = [];

  setFeatureCollection(
    featureName: keyof FeatureName,
    featuresCollection: FeatureCollection<Geometry>
  ) {
    this.set(featureName, featuresCollection.features);
  }

  //Function to set the data according to their feature
  setFeaturesData(featuresData: FeaturesData) {
    for (const currentFeature of generator()) {
      this.set(currentFeature, featuresData[currentFeature].features);
    }
  }

  //Function to create and set the leaderboard
  set(
    feature: keyof FeatureName,
    features: Feature<Geometry, GeoJsonProperties>[]
  ) {
    //Create a map<userName,totalCreated> to sort the user and their count
    const mapFeature = new Map<string, number>();
    for (let i = 0; i < features.length; i++) {
      const currentFeatureGeometry = features[i];
      const user = currentFeatureGeometry.properties?.user;
      let currentValue = mapFeature.has(user) ? mapFeature.get(user) ?? 0 : 0;
      switch (feature) {
        case "building":
          currentValue += 1;
          break;
        case "highway":
        case "waterway":
          currentValue += lineDistance(currentFeatureGeometry, "kilometers");
          break;
        case "landuse":
          currentValue += area(currentFeatureGeometry) / 1000000;
          break;
      }
      mapFeature.set(user, currentValue);
    }
    this.createLeaderboard(feature, mapFeature);
  }

  private createLeaderboard(
    feature: keyof FeatureName,
    mapFeature: Map<string, number>
  ) {
    this[feature] = [];
    if (mapFeature.size > 0) {
      let temp = Array.from(mapFeature),
        unity = "";
      temp = temp.sort(this.sort);
      switch (feature) {
        case "highway":
        case "waterway":
          unity = "km";
          break;
        case "landuse":
          unity = "km²";
          break;
      }
      for (let i = 0; i < temp.length; i++) {
        this[feature].push(
          temp[i][0] + " : " + Math.round(temp[i][1] * 100) / 100 + unity
        );
      }
    }
  }

  //Function to sort value from greatest to lowest
  private sort(a: [string, number], b: [string, number]) {
    return a[1] < b[1] ? 1 : -1;
  }
}
