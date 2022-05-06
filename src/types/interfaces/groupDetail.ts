export interface IListGroupDetail {
  take: number;
  pageIndex: number;
  start: number;
  skip: number;
  sort: any;
  keyword: string;
  status: number;
  meetingStatus: number;
}

export interface IUpdateStatusGroupDetail {
  status: number;
}
