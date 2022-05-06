export interface ISearchMemberParams {
  distance?: number;
  jobId?: number;
  age?: number;
  lat: number;
  lng: number;
  skip: number;
  take: number;
  jobsFollow: number[];
}

export interface ISearchGroupParams {
  distance?: number;
  lat: number;
  lng: number;
  skip: number;
  take: number;
  timeStart: string;
  timeEnd: string;
}
